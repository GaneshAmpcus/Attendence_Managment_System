import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { applyRegularization, getMyRegularizations } from "@/api/api";
import {
  mockRegularizationRequests,
  type RegularizationRequest,
  type RequestStatus,
} from "@/data/mockData";

const STATUS_CONFIG: Record<RequestStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3" /> },
};

const Regularization = () => {
  const { toast } = useToast();
  const userId = localStorage.getItem("user_id") || "";
  const userName = localStorage.getItem("name") || "";

  const [date, setDate] = useState<Date>();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [requests, setRequests] = useState<RegularizationRequest[]>(
    mockRegularizationRequests.filter((r) => r.user_id === userId || true)
  );

  const handleSubmit = async () => {
    if (!date || !checkIn || !checkOut || !reason) {
      toast({ title: "Missing fields", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await applyRegularization({
        user_id: userId,
        date: format(date, "yyyy-MM-dd"),
        check_in: checkIn,
        check_out: checkOut,
        reason,
      });

      toast({ title: "Request submitted", description: "Your regularization request has been sent for approval." });

      const newReq: RegularizationRequest = {
        id: `RG${Date.now()}`,
        user_id: userId,
        user_name: userName,
        date: format(date, "yyyy-MM-dd"),
        check_in: checkIn,
        check_out: checkOut,
        reason,
        status: "pending",
        applied_on: format(new Date(), "yyyy-MM-dd"),
      };
      setRequests((prev) => [newReq, ...prev]);

      setDate(undefined);
      setCheckIn("");
      setCheckOut("");
      setReason("");
    } catch {
      toast({ title: "Error", description: "Failed to submit request. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance Regularization</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Request corrections for missed or incorrect punch entries
          </p>
        </div>

        <Tabs defaultValue="apply" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-sm">
            <TabsTrigger value="apply">New Request</TabsTrigger>
            <TabsTrigger value="history">My Requests</TabsTrigger>
          </TabsList>

          {/* Apply Form */}
          <TabsContent value="apply">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  Regularization Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Date */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Date *</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d > new Date()} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Check In */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Check-in Time *</label>
                    <Input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                  </div>

                  {/* Check Out */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Check-out Time *</label>
                    <Input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Reason *</label>
                  <Textarea
                    placeholder="Explain why regularization is needed (e.g., biometric failure, forgot to punch)..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Submit Request
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Regularization History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {requests.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">No requests found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead>Date</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead>Check-out</TableHead>
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
                              <TableCell className="font-medium">{r.date}</TableCell>
                              <TableCell className="font-mono text-sm">{r.check_in}</TableCell>
                              <TableCell className="font-mono text-sm">{r.check_out}</TableCell>
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

export default Regularization;
