from app.db import get_connection
from datetime import datetime, date

# =========================
# HELPERS
# =========================

def is_weekly_off(cur, target_date):
    """Reads weekly off days from shifts table, falls back to Sunday only."""
    day_of_week = target_date.weekday()  # 0=Mon, 6=Sun

    cur.execute("""
        SELECT weekly_off_days FROM policies LIMIT 1
    """)
    row = cur.fetchone()
    if row and row[0]:
        return day_of_week in row[0]  # weekly_off_days is an INT[] column

    return day_of_week == 6  # fallback: Sunday


def is_holiday(cur, target_date):
    cur.execute("SELECT 1 FROM holidays WHERE date = %s", (target_date,))
    return cur.fetchone() is not None


def is_on_leave(cur, user_id, target_date):
    cur.execute("""
        SELECT 1 FROM leaves
        WHERE user_id = %s AND date = %s AND status = 'approved'
    """, (user_id, target_date))
    return cur.fetchone() is not None


def calculate_hours(check_in, check_out):
    if not check_in or not check_out:
        return 0.0
    return round((check_out - check_in).total_seconds() / 3600, 2)


def is_late(check_in, shift_start, grace_minutes):
    if not check_in:
        return False
    shift_start_dt = datetime.combine(check_in.date(), shift_start)
    grace_cutoff = shift_start_dt.timestamp() + (grace_minutes * 60)
    return check_in.timestamp() > grace_cutoff


def get_shift_for_user(cur, user_id):
    """Fetch per-user shift. Falls back to global policy, then hardcoded defaults."""
    cur.execute("""
        SELECT s.start_time, s.end_time, s.grace_minutes, s.half_day_hours, s.full_day_hours
        FROM user_shifts us
        JOIN shifts s ON us.shift_id = s.id
        WHERE us.user_id = %s
        LIMIT 1
    """, (user_id,))
    row = cur.fetchone()

    if row:
        return {
            "start_time":  row[0],
            "end_time":    row[1],
            "grace":       row[2],
            "half_day":    row[3],
            "full_day":    row[4],
        }

    # Fallback → read global policy from DB
    cur.execute("""
        SELECT grace_minutes, half_day_hours, full_day_hours
        FROM policies LIMIT 1
    """)
    policy = cur.fetchone()

    if policy:
        return {
            "start_time":  datetime.strptime("09:00", "%H:%M").time(),
            "end_time":    datetime.strptime("18:00", "%H:%M").time(),
            "grace":       policy[0],
            "half_day":    policy[1],
            "full_day":    policy[2],
        }

    # Last resort hardcoded fallback
    return {
        "start_time":  datetime.strptime("09:00", "%H:%M").time(),
        "end_time":    datetime.strptime("18:00", "%H:%M").time(),
        "grace":       15,
        "half_day":    4.0,
        "full_day":    8.0,
    }


# =========================
# RULE ENGINE
# =========================

def apply_rules(cur, user_id, target_date, check_in, check_out, shift):
    """
    Returns: (status, late_flag, working_hours, overtime_hours, shortfall_hours, remarks)
    """

    # 1. Holiday
    if is_holiday(cur, target_date):
        return "Holiday", False, 0.0, 0.0, 0.0, "Holiday"

    # 2. Weekly off
    if is_weekly_off(cur, target_date):
        return "Weekly Off", False, 0.0, 0.0, 0.0, "Weekend"

    # 3. Approved leave
    if is_on_leave(cur, user_id, target_date):
        return "On Leave", False, 0.0, 0.0, 0.0, "Approved leave"

    # 4. No check-in at all → Absent
    if not check_in:
        return "Absent", False, 0.0, 0.0, 0.0, "No check-in recorded"

    # 5. Check-in exists but no check-out → Missing Punch
    if check_in and not check_out:
        return "Missing Punch", False, 0.0, 0.0, 0.0, "Check-out not recorded"

    # 6. Calculate actual working hours
    hours = calculate_hours(check_in, check_out)

    # 7. Late flag
    late_flag = is_late(check_in, shift["start_time"], shift["grace"])

    # 8. Overtime = hours worked beyond full_day
    overtime_hours = round(max(0.0, hours - shift["full_day"]), 2)

    # 9. Shortfall = how many hours short of full_day (only if not absent/leave)
    shortfall_hours = round(max(0.0, shift["full_day"] - hours), 2)

    # 10. Status based on hours worked
    if hours < shift["half_day"]:
        status = "Short Leave"   # worked but very few hours
        remarks = f"Worked only {hours:.1f}h (shortfall: {shortfall_hours:.1f}h)"
    elif hours < shift["full_day"]:
        status = "Half Day"
        remarks = f"Half day — {hours:.1f}h worked (shortfall: {shortfall_hours:.1f}h)"
    else:
        status = "Present"
        remarks = f"OT: {overtime_hours:.1f}h" if overtime_hours > 0 else ""

    return status, late_flag, hours, overtime_hours, shortfall_hours, remarks


# =========================
# MAIN PROCESSOR
# =========================

def process_attendance_for_date(target_date: date):
    """
    Processes ALL active users for a given date:
    - Marks absent for users with no punch record
    - Computes status, late_flag, working_hours, overtime for punched users
    """
    conn = get_connection()
    cur = conn.cursor()

    # ── Step 1: get all active users ──────────────────────────────────────────
    cur.execute("SELECT id FROM users")
    all_user_ids = [row[0] for row in cur.fetchall()]

    # ── Step 2: get all attendance records for this date ──────────────────────
    cur.execute("""
        SELECT id, user_id, check_in, check_out
        FROM attendance
        WHERE attendance_date = %s
    """, (target_date,))

    records = {row[1]: row for row in cur.fetchall()}  # user_id → record

    # ── Step 3: process every user ────────────────────────────────────────────
    for user_id in all_user_ids:
        shift = get_shift_for_user(cur, user_id)

        if user_id not in records:
            # No punch at all — but check holiday/weekend/leave first
            status, late_flag, hours, ot, shortfall, remarks = apply_rules(
                cur, user_id, target_date, None, None, shift
            )

            # Only insert if it's a real workday absence
            if status == "Absent":
                cur.execute("""
                    INSERT INTO attendance
                        (user_id, attendance_date, check_in, check_out,
                         working_hours, overtime_hours, shortfall_hours,
                         status, late_flag, remarks)
                    VALUES (%s, %s, NULL, NULL, 0, 0, 0, 'Absent', FALSE, 'No check-in recorded')
                    ON CONFLICT (user_id, attendance_date) DO NOTHING
                """, (user_id, target_date))
            # Holiday/Weekly Off/Leave rows are NOT inserted (they're not absences)

        else:
            rec_id, _, check_in, check_out = records[user_id]

            status, late_flag, hours, ot, shortfall, remarks = apply_rules(
                cur, user_id, target_date, check_in, check_out, shift
            )

            cur.execute("""
                UPDATE attendance
                SET status           = %s,
                    late_flag        = %s,
                    working_hours    = %s,
                    overtime_hours   = %s,
                    shortfall_hours  = %s,
                    remarks          = %s
                WHERE id = %s
            """, (status, late_flag, hours, ot, shortfall, remarks, rec_id))

    conn.commit()
    cur.close()
    conn.close()