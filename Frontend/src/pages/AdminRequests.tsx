import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { updateLeaveStatus, updateRegularizationStatus } from "@/api/api";
import {
  mockLeaveRequests,
  mockRegularizationRequests,
  LEAVE_TYPE_LABELS,
  type LeaveRequest,
  type RegularizationRequest,
  type RequestStatus,
} from "@/data/mockData";

const STATUS_CONFIG: Record<RequestStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3" /> },
};

const StatusBadge = ({ status }: { status: RequestStatus }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

const AdminRequests = () => {
  const { toast } = useToast();

  const [leaves, setLeaves] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [regularizations, setRegularizations] = useState<RegularizationRequest[]>(mockRegularizationRequests);

  const [actionDialog, setActionDialog] = useState<{
    type: "leave" | "regularization";
    id: string;
    action: "approved" | "rejected";
    userName: string;
  } | null>(null);
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);

  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
  const pendingRegs = regularizations.filter((r) => r.status === "pending").length;

  const handleAction = async () => {
    if (!actionDialog) return;
    setProcessing(true);

    try {
      if (actionDialog.type === "leave") {
        await updateLeaveStatus(actionDialog.id, actionDialog.action, remarks);
        setLeaves((prev) =>
          prev.map((l) =>
            l.id === actionDialog.id
              ? { ...l, status: actionDialog.action, remarks, reviewed_by: "Admin", reviewed_on: new Date().toISOString().slice(0, 10) }
              : l
          )
        );
      } else {
        await updateRegularizationStatus(actionDialog.id, actionDialog.action, remarks);
        setRegularizations((prev) =>
          prev.map((r) =>
            r.id === actionDialog.id
              ? { ...r, status: actionDialog.action, remarks, reviewed_by: "Admin", reviewed_on: new Date().toISOString().slice(0, 10) }
              : r
          )
        );
      }

      toast({
        title: `Request ${actionDialog.action}`,
        description: `${actionDialog.userName}'s request has been ${actionDialog.action}.`,
      });
    } catch {
      toast({ title: "Error", description: "Failed to update request.", variant: "destructive" });
    } finally {
      setProcessing(false);
      setActionDialog(null);
      setRemarks("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Approval Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and manage employee leave & regularization requests</p>
        </div>

        <Tabs defaultValue="leaves" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="leaves" className="gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Leave Requests {pendingLeaves > 0 && <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{pendingLeaves}</span>}
            </TabsTrigger>
            <TabsTrigger value="regularizations" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Regularizations {pendingRegs > 0 && <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{pendingRegs}</span>}
            </TabsTrigger>
          </TabsList>

          {/* Leave Requests */}
          <TabsContent value="leaves">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">All Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Employee</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaves.map((l) => (
                        <TableRow key={l.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">{l.user_name}</TableCell>
                          <TableCell>{LEAVE_TYPE_LABELS[l.leave_type]}</TableCell>
                          <TableCell>{l.from_date}</TableCell>
                          <TableCell>{l.to_date}</TableCell>
                          <TableCell className="max-w-[180px] truncate">{l.reason}</TableCell>
                          <TableCell>{l.applied_on}</TableCell>
                          <TableCell><StatusBadge status={l.status} /></TableCell>
                          <TableCell>
                            {l.status === "pending" ? (
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                  onClick={() => setActionDialog({ type: "leave", id: l.id, action: "approved", userName: l.user_name })}
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => setActionDialog({ type: "leave", id: l.id, action: "rejected", userName: l.user_name })}
                                >
                                  <XCircle className="h-3 w-3 mr-1" /> Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">{l.remarks || "—"}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Regularization Requests */}
          <TabsContent value="regularizations">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">All Regularization Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {regularizations.map((r) => (
                        <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">{r.user_name}</TableCell>
                          <TableCell>{r.date}</TableCell>
                          <TableCell className="font-mono text-sm">{r.check_in}</TableCell>
                          <TableCell className="font-mono text-sm">{r.check_out}</TableCell>
                          <TableCell className="max-w-[180px] truncate">{r.reason}</TableCell>
                          <TableCell>{r.applied_on}</TableCell>
                          <TableCell><StatusBadge status={r.status} /></TableCell>
                          <TableCell>
                            {r.status === "pending" ? (
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                  onClick={() => setActionDialog({ type: "regularization", id: r.id, action: "approved", userName: r.user_name })}
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => setActionDialog({ type: "regularization", id: r.id, action: "rejected", userName: r.user_name })}
                                >
                                  <XCircle className="h-3 w-3 mr-1" /> Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">{r.remarks || "—"}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Approve/Reject Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setRemarks(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "approved" ? "Approve" : "Reject"} Request
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.action === "approved"
                ? `Approve ${actionDialog?.userName}'s request?`
                : `Reject ${actionDialog?.userName}'s request? Please provide a reason.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Remarks (optional)</label>
            <Textarea
              placeholder="Add remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionDialog(null); setRemarks(""); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              className={actionDialog?.action === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionDialog?.action === "approved" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRequests;
