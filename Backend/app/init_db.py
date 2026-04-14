import psycopg
from app.config import DB_CONFIG


def create_tables():
    conn = psycopg.connect(**DB_CONFIG)
    cur = conn.cursor()

    # ── users ─────────────────────────────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id         SERIAL PRIMARY KEY,
            name       TEXT NOT NULL,
            email      TEXT UNIQUE NOT NULL,
            is_active  BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # ── face embeddings ───────────────────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS face_embeddings (
            id         SERIAL PRIMARY KEY,
            user_id    INT REFERENCES users(id) ON DELETE CASCADE,
            embedding  FLOAT8[] NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # ── shifts ────────────────────────────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS shifts (
            id              SERIAL PRIMARY KEY,
            name            TEXT,
            start_time      TIME,
            end_time        TIME,
            grace_minutes   INT     DEFAULT 15,
            half_day_hours  FLOAT   DEFAULT 4,
            full_day_hours  FLOAT   DEFAULT 8
        );
    """)

    # ── user shift mapping ────────────────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_shifts (
            id       SERIAL PRIMARY KEY,
            user_id  INT REFERENCES users(id) ON DELETE CASCADE,
            shift_id INT REFERENCES shifts(id) ON DELETE CASCADE,
            UNIQUE(user_id)
        );
    """)

    # ── leaves ────────────────────────────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS leaves (
            id         SERIAL PRIMARY KEY,
            user_id    INT REFERENCES users(id) ON DELETE CASCADE,
            date       DATE NOT NULL,
            type       TEXT,
            reason     TEXT,
            status     TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # ── holidays ──────────────────────────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS holidays (
            id   SERIAL PRIMARY KEY,
            date DATE UNIQUE NOT NULL,
            name TEXT
        );
    """)

    # ── global policies ───────────────────────────────────────────────────────
    # weekly_off_days: array of weekday ints, 0=Mon, 6=Sun
    # e.g. {5, 6} = Saturday + Sunday off
    cur.execute("""
        CREATE TABLE IF NOT EXISTS policies (
            id               SERIAL PRIMARY KEY,
            grace_minutes    INT   DEFAULT 15,
            half_day_hours   FLOAT DEFAULT 4,
            full_day_hours   FLOAT DEFAULT 8,
            weekly_off_days  INT[] DEFAULT '{6}'
        );
    """)

    cur.execute("""
        INSERT INTO policies (grace_minutes, half_day_hours, full_day_hours, weekly_off_days)
        SELECT 15, 4, 8, '{6}'
        WHERE NOT EXISTS (SELECT 1 FROM policies);
    """)

    # ── attendance ────────────────────────────────────────────────────────────
    # Added overtime_hours, shortfall_hours columns
    # Added UNIQUE constraint on (user_id, attendance_date) to prevent duplicates
    cur.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            id               SERIAL PRIMARY KEY,
            user_id          INT REFERENCES users(id) ON DELETE CASCADE,
            attendance_date  DATE NOT NULL,
            check_in         TIMESTAMP,
            check_out        TIMESTAMP,
            working_hours    FLOAT   DEFAULT 0,
            overtime_hours   FLOAT   DEFAULT 0,
            shortfall_hours  FLOAT   DEFAULT 0,
            status           TEXT,
            late_flag        BOOLEAN DEFAULT FALSE,
            remarks          TEXT,
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, attendance_date)
        );
    """)

    # ── punch logs (audit trail for every punch) ──────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS punch_logs (
            id         SERIAL PRIMARY KEY,
            user_id    INT REFERENCES users(id) ON DELETE CASCADE,
            timestamp  TIMESTAMP NOT NULL,
            type       TEXT CHECK (type IN ('IN', 'OUT')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # ── cooldown table (replaces in-memory LAST_SEEN dict) ────────────────────
    # Ensures cooldown works correctly across multiple server workers
    cur.execute("""
        CREATE TABLE IF NOT EXISTS attendance_cooldown (
            user_id   INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            last_seen TIMESTAMP NOT NULL
        );
    """)

    # ── indexes for performance ───────────────────────────────────────────────
    cur.execute("CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, attendance_date);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_punch_logs_user ON punch_logs(user_id, timestamp);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_leaves_user_date ON leaves(user_id, date);")

    conn.commit()
    cur.close()
    conn.close()

    print("✅ All tables created successfully!")


if __name__ == "__main__":
    create_tables()