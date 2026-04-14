import { useEffect, useState } from "react";
import { getHistory } from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Clock,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface HistoryItem {
  date: string;
  check_in: string;
  check_out: string;
  status?: string;
  late_flag?: boolean;
  working_hours?: number;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const getDay = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });

const getTotalHours = (inTime: string, outTime: string) => {
  if (!inTime || !outTime) return "0:00";
  const diff =
    (new Date(outTime).getTime() - new Date(inTime).getTime()) / 1000;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
};

const getTotalMinutes = (inTime: string, outTime: string): number => {
  if (!inTime || !outTime) return 0;
  return (new Date(outTime).getTime() - new Date(inTime).getTime()) / 60000;
};

const formatMinutes = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
};

const getStatus = (item: HistoryItem) => {
  if (!item.check_in && !item.check_out) return "NP";
  if (item.check_in && !item.check_out) return "PP";
  return "P";
};

const formatTime = (dt: string) => {
  if (!dt) return "-";
  return new Date(dt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─── summary stat card ───────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
  sub?: string;
}

const StatCard = ({ label, value, icon, accent, sub }: StatCardProps) => (
  <div
    className={`relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm`}
  >
    <div className={`absolute inset-0 opacity-5 ${accent}`} />
    <div className="relative flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
      <div className={`rounded-xl p-2.5 ${accent} bg-opacity-15`}>{icon}</div>
    </div>
  </div>
);

// ─── custom pie label ────────────────────────────────────────────────────────

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={13}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ─── status badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    P: {
      label: "Present",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    PP: {
      label: "Partial Punch",
      className: "bg-violet-100  text-violet-700  border-violet-200",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    NP: {
      label: "Not Present",
      className: "bg-slate-800   text-white        border-slate-700",
      icon: <XCircle className="h-3 w-3" />,
    },
  };
  const cfg = map[status] || map.NP;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

// ─── main component ───────────────────────────────────────────────────────────

const UserDashboard = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("user_id") || "";
  // useEffect(() => {
  //   const load = async () => {
  //     const h = await getHistory(userId);

  //     const raw = h.data?.data || [];
  //     setHistory(
  //       raw.map((r: any) => ({
  //         date: r[0],
  //         check_in: r[1],
  //         check_out: r[2],
  //         status: r[3],
  //         late_flag: r[4],
  //         working_hours: r[5],
  //       })),
  //     );
  //   };

  //   load(); // initial fetch

  //   const interval = setInterval(() => {
  //     if (document.visibilityState === "visible") {
  //       load();
  //     }
  //   }, 60000); // every 1 min

  //   return () => clearInterval(interval);
  // }, [userId]);
  useEffect(() => {
    const load = async () => {
      try {
        const h = await getHistory(userId);
        const raw = h.data?.data || [];
        setHistory(
          // correct — uses the actual object keys from the API
          raw.map((r: any) => ({
            date: r.date,
            check_in: r.check_in,
            check_out: r.check_out,
            status: r.status,
            late_flag: r.late_flag,
            working_hours: r.working_hours,
          })),
        );
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  // ── derived summary ──────────────────────────────────────────────────────
  const totalDays = history.length;
  const present = history.filter((i) => getStatus(i) === "P").length;
  const partialPunch = history.filter((i) => getStatus(i) === "PP").length;
  const absent = history.filter((i) => getStatus(i) === "NP").length;
  const lateCount = history.filter((i) => i.late_flag).length;

  const totalWorkingMins = history.reduce(
    (acc, i) => acc + getTotalMinutes(i.check_in, i.check_out),
    0,
  );

  const avgMins = present > 0 ? totalWorkingMins / present : 0;

  const pieData = [
    { name: "Present", value: present, color: "#10b981" },
    { name: "Partial Punch", value: partialPunch, color: "#8b5cf6" },
    { name: "Absent", value: absent, color: "#1e293b" },
  ].filter((d) => d.value > 0);

  // ── loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      

      <div className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* ── page title ── */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Attendance Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your complete attendance overview
          </p>
        </div>

        {/* ── stat cards ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Total Days"
            value={totalDays}
            icon={<Calendar className="h-5 w-5 text-blue-500" />}
            accent="bg-blue-500"
            sub="recorded"
          />
          <StatCard
            label="Present"
            value={present}
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            accent="bg-emerald-500"
            sub={`${totalDays > 0 ? ((present / totalDays) * 100).toFixed(1) : 0}% attendance`}
          />
          <StatCard
            label="Absent"
            value={absent}
            icon={<XCircle className="h-5 w-5 text-slate-500" />}
            accent="bg-slate-500"
            sub="days missed"
          />
          <StatCard
            label="Late Arrivals"
            value={lateCount}
            icon={<AlertCircle className="h-5 w-5 text-amber-500" />}
            accent="bg-amber-500"
            sub="late check-ins"
          />
        </div>

        {/* ── chart + working time ── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Pie chart */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Attendance Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={renderCustomLabel}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.color}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} days`,
                        name,
                      ]}
                      contentStyle={{ borderRadius: "10px", fontSize: "13px" }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={10}
                      formatter={(value) => (
                        <span className="text-sm text-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[260px] items-center justify-center text-muted-foreground text-sm">
                  No attendance data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Working time summary */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Working Hours Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {[
                {
                  label: "Total Working Time",
                  value: formatMinutes(totalWorkingMins),
                  sub: `${Math.floor(totalWorkingMins)} mins total`,
                },
                {
                  label: "Average Daily Hours",
                  value: formatMinutes(avgMins),
                  sub: "per present day",
                },
                {
                  label: "Partial Punch Days",
                  value: partialPunch,
                  sub: "missing check-out",
                },
                {
                  label: "Attendance Rate",
                  value: `${totalDays > 0 ? ((present / totalDays) * 100).toFixed(1) : 0}%`,
                  sub: `${present} of ${totalDays} days`,
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {row.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.sub}</p>
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    {row.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ── history table ── */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Attendance History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Late</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-muted-foreground text-sm"
                      >
                        No attendance records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((item, i) => {
                      const status = getStatus(item);
                      return (
                        <TableRow
                          key={i}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="text-center text-muted-foreground text-sm">
                            {i + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatDate(item.date)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {getDay(item.date)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatTime(item.check_in)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatTime(item.check_out)}
                          </TableCell>
                          <TableCell className="font-mono text-sm font-medium">
                            {getTotalHours(item.check_in, item.check_out)}
                          </TableCell>
                          <TableCell>
                            {item.late_flag ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                                <AlertCircle className="h-3 w-3" /> Late
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={status} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
