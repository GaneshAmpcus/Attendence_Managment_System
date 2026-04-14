from app.db import get_connection
from datetime import date, datetime, timedelta

# MIN_GAP = timedelta(minutes=1)


# def mark_attendance(user_id: int):
#     conn = get_connection()
#     cur = conn.cursor()

#     today = date.today()
#     now = datetime.now()

#     cur.execute("""
#         SELECT id, check_in, check_out
#         FROM attendance
#         WHERE user_id = %s AND attendance_date = %s
#     """, (user_id, today))

#     record = cur.fetchone()

#     # ── CHECK-IN ──────────────────────────────────────────────────────────────
#     if not record:
#         cur.execute("""
#             INSERT INTO attendance (user_id, attendance_date, check_in)
#             VALUES (%s, %s, %s)
#         """, (user_id, today, now))

#         # ✅ Write to punch_logs for audit trail
#         cur.execute("""
#             INSERT INTO punch_logs (user_id, timestamp, type)
#             VALUES (%s, %s, 'IN')
#         """, (user_id, now))

#         conn.commit()
#         cur.close()
#         conn.close()
#         return {"status": "check_in", "time": now}

#     rec_id, check_in, check_out = record

#     # ── ALREADY COMPLETED ─────────────────────────────────────────────────────
#     if check_in and check_out:
#         cur.close()
#         conn.close()
#         return {"status": "completed"}

#     # ── CHECK-OUT ─────────────────────────────────────────────────────────────
#     if check_in and not check_out:

#         if now - check_in < MIN_GAP:
#             cur.close()
#             conn.close()
#             return {"status": "too_fast"}

#         cur.execute("""
#             UPDATE attendance
#             SET check_out = %s
#             WHERE id = %s
#         """, (now, rec_id))

#         # ✅ Write to punch_logs for audit trail
#         cur.execute("""
#             INSERT INTO punch_logs (user_id, timestamp, type)
#             VALUES (%s, %s, 'OUT')
#         """, (user_id, now))

#         # ✅ Immediately compute status after checkout so /today returns live data
#         conn.commit()  # commit checkout first

#         # Re-open cursor to run processor inline for this user only
#         from app.services.attendance_processor import get_shift_for_user, apply_rules
#         cur2 = conn.cursor()
#         shift = get_shift_for_user(cur2, user_id)

#         status, late_flag, hours, ot, shortfall, remarks = apply_rules(
#             cur2, user_id, today, check_in, now, shift
#         )

#         cur2.execute("""
#             UPDATE attendance
#             SET status          = %s,
#                 late_flag       = %s,
#                 working_hours   = %s,
#                 overtime_hours  = %s,
#                 shortfall_hours = %s,
#                 remarks         = %s
#             WHERE id = %s
#         """, (status, late_flag, hours, ot, shortfall, remarks, rec_id))

#         conn.commit()
#         cur2.close()
#         cur.close()
#         conn.close()

#         return {"status": "check_out", "time": now}

#     cur.close()
#     conn.close()
#     return {"status": "completed"}



MIN_GAP = timedelta(seconds=30)  # minimum gap between any two punches


def mark_attendance(user_id: int):
    conn = get_connection()
    cur = conn.cursor()

    today = date.today()
    now = datetime.now()

    # 1. Check the last punch for cooldown — regardless of type
    cur.execute("""
        SELECT timestamp FROM punch_logs
        WHERE user_id = %s AND DATE(timestamp) = %s
        ORDER BY timestamp DESC
        LIMIT 1
    """, (user_id, today))

    last_punch = cur.fetchone()

    if last_punch:
        diff = now - last_punch[0]
        if diff < MIN_GAP:
            cur.close()
            conn.close()
            return {"status": "too_fast"}

    # 2. Get the very first punch of the day
    cur.execute("""
        SELECT timestamp FROM punch_logs
        WHERE user_id = %s AND DATE(timestamp) = %s
        ORDER BY timestamp ASC
        LIMIT 1
    """, (user_id, today))

    first_punch = cur.fetchone()

    # 3. Write this punch to punch_logs
    cur.execute("""
        INSERT INTO punch_logs (user_id, timestamp, type)
        VALUES (%s, %s, %s)
    """, (user_id, now, 'IN' if not first_punch else 'OUT'))

    if not first_punch:
        # First punch of the day — insert attendance row with check_in only
        cur.execute("""
            INSERT INTO attendance (user_id, attendance_date, check_in)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id, attendance_date) DO UPDATE
                SET check_in = LEAST(attendance.check_in, EXCLUDED.check_in)
        """, (user_id, today, now))

        conn.commit()
        cur.close()
        conn.close()
        return {"status": "check_in", "time": now}

    else:
        # Subsequent punch — always update check_out to latest timestamp
        check_in_time = first_punch[0]

        cur.execute("""
            UPDATE attendance
            SET check_out = %s
            WHERE user_id = %s AND attendance_date = %s
        """, (now, user_id, today))

        # Recompute status inline
        from app.services.attendance_processor import get_shift_for_user, apply_rules

        cur2 = conn.cursor()
        shift = get_shift_for_user(cur2, user_id)
        status, late_flag, hours, ot, shortfall, remarks = apply_rules(
            cur2, user_id, today, check_in_time, now, shift
        )

        cur2.execute("""
            UPDATE attendance
            SET status          = %s,
                late_flag       = %s,
                working_hours   = %s,
                overtime_hours  = %s,
                shortfall_hours = %s,
                remarks         = %s
            WHERE user_id = %s AND attendance_date = %s
        """, (status, late_flag, hours, ot, shortfall, remarks, user_id, today))

        conn.commit()
        cur2.close()
        cur.close()
        conn.close()
        return {"status": "check_out", "time": now}