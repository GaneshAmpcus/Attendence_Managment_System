from fastapi import APIRouter, Form
from app.db import get_connection
from app.services.attendance_processor import process_attendance_for_date

router = APIRouter()



@router.get("/users")
def get_all_users():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, name, email FROM users")

    data = cur.fetchall()

    cur.close()
    conn.close()

    return {"users": data}


@router.get("/attendance")
def get_all_attendance():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT u.id, u.name, a.attendance_date, a.check_in, a.check_out
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.attendance_date DESC
    """)

    data = cur.fetchall()

    cur.close()
    conn.close()

    return {"data": data}


@router.get("/attendance/{date}")
def get_attendance_by_date(date: str):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT u.name, a.check_in, a.check_out
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        WHERE a.attendance_date = %s
    """, (date,))

    data = cur.fetchall()

    cur.close()
    conn.close()

    return {"data": data}



@router.post("/process/{date}")
def process(date: str):
    process_attendance_for_date(date)
    return {"message": "Processed"}