import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

// ─── Auth ────────────────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  API.post("/auth/login", { email, password });

export const registerUser = (name: string, email: string, file: File) => {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("email", email);
  formData.append("file", file);
  return API.post("/auth/register", formData);
};

export const faceLogin = (file: Blob) => {
  const formData = new FormData();
  formData.append("file", file, "capture.jpg");
  return API.post("/auth/face-login", formData);
};

// ─── Attendance ──────────────────────────────────────────────────────────────
export const markAttendance = (file: Blob) => {
  const formData = new FormData();
  formData.append("file", file, "capture.jpg");
  return API.post("/attendance/mark-attendance", formData);
};

export const getToday = (userId: string) =>
  API.get(`/attendance/today/${userId}`);

export const getHistory = (userId: string) =>
  API.get(`/attendance/history/${userId}`);

export const processToday = () =>
  API.post("/attendance/process-today");

export const getUsers = () =>
  API.get("/attendance/users");

// ─── Admin ───────────────────────────────────────────────────────────────────
export const getAllUsers = () => API.get("/admin/users");

export const getAllAttendance = () => API.get("/admin/attendance");

export const getAttendanceByDate = (date: string) =>
  API.get(`/admin/attendance/${date}`);

// ─── Leave Management ────────────────────────────────────────────────────────
export const getLeaveBalance = (userId: string) =>
  API.get(`/leave/balance/${userId}`);

export const applyLeave = (data: {
  user_id: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  reason: string;
}) => API.post("/leave/apply", data);

export const getMyLeaves = (userId: string) =>
  API.get(`/leave/my-requests/${userId}`);

export const getAllLeaveRequests = () =>
  API.get("/admin/leave-requests");

export const updateLeaveStatus = (
  requestId: string,
  status: "approved" | "rejected",
  remarks?: string
) => API.put(`/admin/leave-requests/${requestId}`, { status, remarks });

// ─── Regularization ──────────────────────────────────────────────────────────
export const applyRegularization = (data: {
  user_id: string;
  date: string;
  check_in: string;
  check_out: string;
  reason: string;
}) => API.post("/regularization/apply", data);

export const getMyRegularizations = (userId: string) =>
  API.get(`/regularization/my-requests/${userId}`);

export const getAllRegularizations = () =>
  API.get("/admin/regularization-requests");

export const updateRegularizationStatus = (
  requestId: string,
  status: "approved" | "rejected",
  remarks?: string
) => API.put(`/admin/regularization-requests/${requestId}`, { status, remarks });

// ─── Excel Upload (Push Logs) ────────────────────────────────────────────────
export const uploadPushLogs = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/admin/upload-push-logs", formData);
};

export const getUploadTasks = () =>
  API.get("/admin/upload-tasks");

export const getUploadTaskStatus = (taskId: string) =>
  API.get(`/admin/upload-tasks/${taskId}`);

// ─── Attendance Calendar ─────────────────────────────────────────────────────
export const getAttendanceCalendar = (userId: string, month: string) =>
  API.get(`/attendance/calendar/${userId}`, { params: { month } });
