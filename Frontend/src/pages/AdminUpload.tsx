import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { uploadPushLogs, getUploadTasks } from "@/api/api";
import { mockUploadTasks, type UploadTask } from "@/data/mockData";

const STATUS_MAP: Record<UploadTask["status"], { label: string; className: string; icon: React.ReactNode }> = {
  processing: { label: "Processing", className: "bg-blue-100 text-blue-700 border-blue-200", icon: <Clock className="h-3 w-3" /> },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  failed: { label: "Failed", className: "bg-red-100 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3" /> },
};

const AdminUpload = () => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [tasks, setTasks] = useState<UploadTask[]>(mockUploadTasks);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
        toast({ title: "Invalid file", description: "Please upload an Excel (.xlsx, .xls) or CSV file.", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      await uploadPushLogs(selectedFile);

      const newTask: UploadTask = {
        id: `UT${Date.now()}`,
        file_name: selectedFile.name,
        uploaded_at: new Date().toISOString(),
        status: "processing",
        total_records: 0,
        processed_records: 0,
      };
      setTasks((prev) => [newTask, ...prev]);

      toast({ title: "Upload started", description: `${selectedFile.name} has been uploaded and is being processed.` });
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      toast({ title: "Upload failed", description: "Failed to upload file. Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Will call actual API when ready; for now uses mock
      await getUploadTasks();
      toast({ title: "Refreshed", description: "Task statuses updated." });
    } catch {
      // silent fail for mock
    } finally {
      setRefreshing(false);
    }
  };

  const formatDateTime = (dt: string) => {
    return new Date(dt).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Push Log Upload</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload Excel files with attendance push logs for bulk processing
          </p>
        </div>

        {/* Upload Card */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Upload Push Log File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
              <div className="flex-1 w-full">
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Select Excel File (.xlsx, .xls, .csv)
                </label>
                <div className="relative">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 border border-input rounded-lg p-1 cursor-pointer"
                  />
                </div>
              </div>
              <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="w-full sm:w-auto">
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
                Upload & Process
              </Button>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="font-medium">{selectedFile.name}</span>
                <span className="text-muted-foreground">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Status Table */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Upload Tasks
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {tasks.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No upload tasks yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>File Name</TableHead>
                      <TableHead>Uploaded At</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((t) => {
                      const cfg = STATUS_MAP[t.status];
                      const pct = t.total_records > 0 ? Math.round((t.processed_records / t.total_records) * 100) : 0;
                      return (
                        <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                              <span className="font-medium">{t.file_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{formatDateTime(t.uploaded_at)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Progress value={pct} className="h-2 flex-1" />
                              <span className="text-xs text-muted-foreground w-8">{pct}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {t.processed_records}/{t.total_records} records
                            </p>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
                              {cfg.icon} {cfg.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {t.error_message ? (
                              <span className="text-red-600 text-xs">{t.error_message}</span>
                            ) : t.status === "completed" ? (
                              <span className="text-emerald-600 text-xs">All records processed successfully</span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUpload;
