// ─── Leave Types ─────────────────────────────────────────────────────────────
export type LeaveType = "casual" | "sick" | "earned" | "short" | "half_day" | "comp_off";
export type RequestStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: string;
  user_id: string;
  user_name: string;
  leave_type: LeaveType;
  from_date: string;
  to_date: string;
  reason: string;
  status: RequestStatus;
  applied_on: string;
  reviewed_by?: string;
  reviewed_on?: string;
  remarks?: string;
}

export interface RegularizationRequest {
  id: string;
  user_id: string;
  user_name: string;
  date: string;
  check_in: string;
  check_out: string;
  reason: string;
  status: RequestStatus;
  applied_on: string;
  reviewed_by?: string;
  reviewed_on?: string;
  remarks?: string;
}

export interface LeaveBalance {
  casual: number;
  sick: number;
  earned: number;
  comp_off: number;
}

export interface UploadTask {
  id: string;
  file_name: string;
  uploaded_at: string;
  status: "processing" | "completed" | "failed";
  total_records: number;
  processed_records: number;
  error_message?: string;
}

// ─── Leave type labels ───────────────────────────────────────────────────────
export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  casual: "Casual Leave",
  sick: "Sick Leave",
  earned: "Earned Leave",
  short: "Short Leave",
  half_day: "Half Day",
  comp_off: "Compensatory Off",
};

// ─── Mock leave balance ──────────────────────────────────────────────────────
export const mockLeaveBalance: LeaveBalance = {
  casual: 8,
  sick: 6,
  earned: 12,
  comp_off: 2,
};

// ─── Mock leave requests ─────────────────────────────────────────────────────
export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: "LR001",
    user_id: "u1",
    user_name: "Ganesh Kumar",
    leave_type: "casual",
    from_date: "2026-04-10",
    to_date: "2026-04-11",
    reason: "Personal work",
    status: "approved",
    applied_on: "2026-04-08",
    reviewed_by: "Admin",
    reviewed_on: "2026-04-09",
  },
  {
    id: "LR002",
    user_id: "u1",
    user_name: "Ganesh Kumar",
    leave_type: "sick",
    from_date: "2026-04-15",
    to_date: "2026-04-15",
    reason: "Fever and cold",
    status: "pending",
    applied_on: "2026-04-14",
  },
  {
    id: "LR003",
    user_id: "u2",
    user_name: "Ravi Sharma",
    leave_type: "short",
    from_date: "2026-04-12",
    to_date: "2026-04-12",
    reason: "Doctor appointment (2 hrs)",
    status: "pending",
    applied_on: "2026-04-11",
  },
  {
    id: "LR004",
    user_id: "u3",
    user_name: "Priya Patel",
    leave_type: "earned",
    from_date: "2026-04-20",
    to_date: "2026-04-25",
    reason: "Family vacation",
    status: "rejected",
    applied_on: "2026-04-05",
    reviewed_by: "Admin",
    reviewed_on: "2026-04-06",
    remarks: "Peak project period, please reschedule",
  },
];

// ─── Mock regularization requests ────────────────────────────────────────────
export const mockRegularizationRequests: RegularizationRequest[] = [
  {
    id: "RG001",
    user_id: "u1",
    user_name: "Ganesh Kumar",
    date: "2026-04-07",
    check_in: "09:15",
    check_out: "18:30",
    reason: "Biometric not working, used manual entry",
    status: "approved",
    applied_on: "2026-04-08",
    reviewed_by: "Admin",
    reviewed_on: "2026-04-08",
  },
  {
    id: "RG002",
    user_id: "u1",
    user_name: "Ganesh Kumar",
    date: "2026-04-13",
    check_in: "09:00",
    check_out: "18:00",
    reason: "Forgot to punch out, was working from desk",
    status: "pending",
    applied_on: "2026-04-14",
  },
  {
    id: "RG003",
    user_id: "u2",
    user_name: "Ravi Sharma",
    date: "2026-04-10",
    check_in: "10:00",
    check_out: "19:00",
    reason: "Network issue during face scan",
    status: "pending",
    applied_on: "2026-04-11",
  },
];

// ─── Mock upload tasks ───────────────────────────────────────────────────────
// ─── Calendar Day Data ───────────────────────────────────────────────────────
export interface CalendarDayData {
  employee_id: string;
  status: string; // P, A, PP, H, WO, L, O
  shift: string;
  shift_time: string;
  attendance_scheme: string;
  first_in: string;
  last_out: string;
  late_in: string;
  early_out: string;
  total_work_hrs: number;
  break_hrs: number;
  actual_work_hrs: number;
  shortfall_hrs: number;
  excess_hrs: number;
  remarks: string;
  sessions: string[];
}

const makeDay = (
  status: string,
  firstIn = "",
  lastOut = "",
  totalHrs = 0,
  sessions: string[] = [],
  overrides: Partial<CalendarDayData> = {}
): CalendarDayData => ({
  employee_id: "1221",
  status,
  shift: "12.00 Pm To 09.00 Pm(1221)",
  shift_time: "12:00 to 21:00",
  attendance_scheme: "12.00 Pm to 09.00 Pm NO WFH",
  first_in: firstIn,
  last_out: lastOut,
  late_in: "",
  early_out: "",
  total_work_hrs: totalHrs,
  break_hrs: totalHrs > 0 ? 1 : 0,
  actual_work_hrs: totalHrs > 0 ? totalHrs - 1 : 0,
  shortfall_hrs: 0,
  excess_hrs: totalHrs > 8 ? totalHrs - 8 : 0,
  remarks: "",
  sessions,
  ...overrides,
});

export const mockCalendarData: Record<string, CalendarDayData> = {
  "2026-04-01": makeDay("A", "12:05", "21:10", 9.1, ["12:05 - 14:00", "14:30 - 21:10"]),
  "2026-04-02": makeDay("A", "12:10", "21:05", 8.9, ["12:10 - 14:00", "14:15 - 21:05"]),
  "2026-04-03": makeDay("A", "12:00", "21:00", 9.0, ["12:00 - 14:00", "14:01 - 21:00"]),
  "2026-04-06": makeDay("A", "12:15", "21:30", 9.25, ["12:15 - 14:10", "14:30 - 21:30"]),
  "2026-04-07": makeDay("A", "12:00", "21:15", 9.25, ["12:00 - 14:00", "14:10 - 21:15"]),
  "2026-04-08": makeDay("A", "12:05", "21:00", 8.9, ["12:05 - 13:50", "14:00 - 21:00"]),
  "2026-04-09": makeDay("A", "12:00", "21:20", 9.3, ["12:00 - 14:00", "14:15 - 21:20"]),
  "2026-04-10": makeDay("A", "12:10", "21:00", 8.8, ["12:10 - 14:00", "14:10 - 21:00"]),
  "2026-04-13": makeDay("A", "12:00", "21:10", 9.2, ["12:00 - 14:00", "14:01 - 21:10"]),
  "2026-04-14": makeDay("P", "12:00", "21:00", 9.0, ["12:00 - 14:00", "14:01 - 21:00"]),
  "2026-04-15": makeDay("P", "", "", 0, []),
  "2026-04-16": makeDay("P", "", "", 0, []),
  "2026-04-17": makeDay("P", "", "", 0, []),
  "2026-04-20": makeDay("P", "", "", 0, []),
  "2026-04-21": makeDay("P", "", "", 0, []),
  "2026-04-22": makeDay("P", "", "", 0, []),
  "2026-04-23": makeDay("P", "", "", 0, []),
  "2026-04-24": makeDay("P", "", "", 0, []),
  "2026-04-27": makeDay("P", "", "", 0, []),
  "2026-04-28": makeDay("P", "", "", 0, []),
  "2026-04-29": makeDay("P", "", "", 0, []),
  "2026-04-30": makeDay("P", "", "", 0, []),
};

// ─── Mock upload tasks ───────────────────────────────────────────────────────
export const mockUploadTasks: UploadTask[] = [
  {
    id: "UT001",
    file_name: "push_logs_april_week1.xlsx",
    uploaded_at: "2026-04-07T10:30:00",
    status: "completed",
    total_records: 250,
    processed_records: 250,
  },
  {
    id: "UT002",
    file_name: "push_logs_april_week2.xlsx",
    uploaded_at: "2026-04-14T09:15:00",
    status: "processing",
    total_records: 180,
    processed_records: 95,
  },
  {
    id: "UT003",
    file_name: "push_logs_march.xlsx",
    uploaded_at: "2026-04-01T11:00:00",
    status: "failed",
    total_records: 500,
    processed_records: 312,
    error_message: "Row 313: Invalid date format in column B",
  },
];
