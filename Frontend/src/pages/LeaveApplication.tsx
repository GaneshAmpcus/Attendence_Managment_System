import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarIcon,
  Send,
  Loader2,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { applyLeave, getMyLeaves, getLeaveBalance } from "@/api/api";
import {
  mockLeaveRequests,
  mockLeaveBalance,
  LEAVE_TYPE_LABELS,
  type LeaveType,
  type LeaveRequest,
  type LeaveBalance,
  type RequestStatus,
} from "@/data/mockData";

const STATUS_CONFIG: Record<RequestStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <Clock className="h-3 w-3" />,
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const LeaveApplication = () => {
  const { toast } = useToast();
  const userId = localStorage.getItem("user_id") || "";
  const userName = localStorage.getItem("name") || "";

  const [leaveType, setLeaveType] = useState<LeaveType | "">("");
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Using mock data — will switch to API when backend is ready
  const [requests, setRequests] = useState<LeaveRequest[]>(
    mockLeaveRequests.filter((r) => r.user_id === userId || true)
  );
  const [balance] = useState<LeaveBalance>(mockLeaveBalance);

  const handleSubmit = async () => {
    if (!leaveType || !fromDate || !reason) {
      toast({ title: "Missing fields", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await applyLeave({
        user_id: userId,
        leave_type: leaveType,
        from_date: format(fromDate, "yyyy-MM-dd"),
        to_date: toDate ? format(toDate, "yyyy-MM-dd") : format(fromDate, "yyyy-MM-dd"),
        reason,
      });

      toast({ title: "Leave applied", description: "Your request has been submitted for approval." });

      // Add to local list as pending
      const newReq: LeaveRequest = {
        id: `LR${Date.now()}`,
        user_id: userId,
        user_name: userName,
        leave_type: leaveType,
        from_date: format(fromDate, "yyyy-MM-dd"),
        to_date: toDate ? format(toDate, "yyyy-MM-dd") : format(fromDate, "yyyy-MM-dd"),
        reason,
        status: "pending",
        applied_on: format(new Date(), "yyyy-MM-dd"),
      };
      setRequests((prev) => [newReq, ...prev]);

      // Reset form
      setLeaveType("");
      setFromDate(undefined);
      setToDate(undefined);
      setReason("");
    } catch {
      toast({ title: "Error", description: "Failed to submit leave request. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leave Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Apply for leave and track your requests</p>
        </div>

        {/* Leave Balance Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.entries(balance) as [string, number][]).map(([key, val]) => (
            <Card key={key} className="rounded-2xl shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {key.replace("_", " ")}
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">{val}</p>
                <p className="text-xs text-muted-foreground">days available</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="apply" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-sm">
            <TabsTrigger value="apply">Apply Leave</TabsTrigger>
            <TabsTrigger value="history">My Requests</TabsTrigger>
          </TabsList>

          {/* Apply Leave Form */}
          <TabsContent value="apply">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  New Leave Application
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Leave Type */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Leave Type *</label>
                    <Select value={leaveType} onValueChange={(v) => setLeaveType(v as LeaveType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LEAVE_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Spacer on desktop */}
                  <div className="hidden sm:block" />

                  {/* From Date */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">From Date *</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !fromDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {fromDate ? format(fromDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={fromDate} onSelect={setFromDate} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* To Date */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">To Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !toDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {toDate ? format(toDate, "PPP") : "Same as from date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={toDate} onSelect={setToDate} disabled={(d) => fromDate ? d < fromDate : false} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Reason *</label>
                  <Textarea
                    placeholder="Provide a reason for your leave..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Submit Application
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Request History */}
          <TabsContent value="history">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Leave Request History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {requests.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">No leave requests found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead>Type</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Applied On</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((r) => {
                          const cfg = STATUS_CONFIG[r.status];
                          return (
                            <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="font-medium">{LEAVE_TYPE_LABELS[r.leave_type]}</TableCell>
                              <TableCell>{r.from_date}</TableCell>
                              <TableCell>{r.to_date}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{r.reason}</TableCell>
                              <TableCell>{r.applied_on}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
                                  {cfg.icon} {cfg.label}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">{r.remarks || "—"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LeaveApplication;
