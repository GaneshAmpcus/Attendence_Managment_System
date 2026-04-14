import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Attendance from "./pages/Attendance";
import AttendanceCalendar from "./pages/AttendanceCalendar";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import LeaveApplication from "./pages/LeaveApplication";
import Regularization from "./pages/Regularization";
import AdminRequests from "./pages/AdminRequests";
import AdminUpload from "./pages/AdminUpload";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode; allowedRole?: string }) => {
  const role = localStorage.getItem("role");
  if (!role) return <Navigate to="/login" replace />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const RootRedirect = () => {
  const role = localStorage.getItem("role");
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User routes with sidebar layout */}
          <Route element={<ProtectedRoute allowedRole="user"><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/attendance-calendar" element={<AttendanceCalendar />} />
            <Route path="/leave" element={<LeaveApplication />} />
            <Route path="/regularization" element={<Regularization />} />
          </Route>

          {/* Admin routes with sidebar layout */}
          <Route element={<ProtectedRoute allowedRole="admin"><AppLayout /></ProtectedRoute>}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/requests" element={<AdminRequests />} />
            <Route path="/admin/upload" element={<AdminUpload />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
