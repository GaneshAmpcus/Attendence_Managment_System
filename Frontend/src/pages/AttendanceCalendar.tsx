import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  Clock,
  AlertCircle,
  Grid3X3,
  List,
} from "lucide-react";
import { getAttendanceCalendar } from "@/api/api";
import { mockCalendarData, type CalendarDayData } from "@/data/mockData";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  A: { bg: "bg-red-100", text: "text-red-600", label: "Absent" },
  P: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Present" },
  PP: { bg: "bg-violet-100", text: "text-violet-700", label: "Partial Punch" },
  H: { bg: "bg-blue-100", text: "text-blue-600", label: "Holiday" },
  WO: { bg: "bg-muted", text: "text-muted-foreground", label: "Week Off" },
  L: { bg: "bg-amber-100", text: "text-amber-700", label: "On Leave" },
  O: { bg: "bg-muted", text: "text-muted-foreground", label: "Week Off" },
};

const AttendanceCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1)); // April 2026
  const [selectedDate, setSelectedDate] = useState<string | null>("2026-04-14");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Using mock data — will switch to API
  const calendarData = mockCalendarData;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthName = currentMonth.toLocaleString("en-US", { month: "long", year: "numeric" });

  // Build calendar grid
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: { day: number; month: number; year: number; current: boolean }[] = [];

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ day: daysInPrevMonth - i, month: month - 1, year, current: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month, year, current: true });
    }

    // Next month leading days
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, month: month + 1, year, current: false });
    }

    return cells;
  }, [year, month]);

  const getDateKey = (day: number, m: number, y: number) => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  const selectedDayData = selectedDate ? calendarData[selectedDate] : null;

  const today = new Date();
  const todayKey = getDateKey(today.getDate(), today.getMonth(), today.getFullYear());

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  // Summary stats
  const monthDays = Object.entries(calendarData).filter(([key]) => {
    return key.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`);
  });

  const avgWorkHrs = (() => {
    const working = monthDays.filter(([, d]) => d.actual_work_hrs > 0);
    if (working.length === 0) return "-";
    const avg = working.reduce((a, [, d]) => a + d.actual_work_hrs, 0) / working.length;
    return avg.toFixed(1);
  })();

  const avgActualHrs = (() => {
    const working = monthDays.filter(([, d]) => d.total_work_hrs > 0);
    if (working.length === 0) return "-";
    const avg = working.reduce((a, [, d]) => a + d.total_work_hrs, 0) / working.length;
    return avg.toFixed(1);
  })();

  const penaltyDays = monthDays.filter(([, d]) => d.shortfall_hrs > 0).length;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarRange className="h-6 w-6 text-primary" />
            Attendance Info
          </h1>
          <p className="text-sm text-muted-foreground mt-1">View your monthly attendance with detailed daily breakdown</p>
        </div>
        <Button variant="outline" size="sm" className="text-primary border-primary/30">
          My Regularizations
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 max-w-xl">
        {[
          { label: "AVG. WORK HRS", value: avgWorkHrs },
          { label: "AVG. ACTUAL WORK HRS", value: avgActualHrs },
          { label: "PENALTY DAYS", value: penaltyDays },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-xl shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content: Calendar + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 space-y-4">
          {/* Calendar header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold text-foreground min-w-[160px] text-center">
                {monthName}
              </h2>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1 border rounded-lg p-0.5">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode("list")}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <Card className="rounded-xl shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b bg-muted/30">
                  {DAYS.map((d) => (
                    <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                  {calendarGrid.map((cell, idx) => {
                    const dateKey = getDateKey(cell.day, cell.month, cell.year);
                    const data = calendarData[dateKey];
                    const isToday = dateKey === todayKey;
                    const isSelected = dateKey === selectedDate;
                    const isSunday = idx % 7 === 0;

                    return (
                      <button
                        key={idx}
                        onClick={() => cell.current && setSelectedDate(dateKey)}
                        className={`relative min-h-[80px] border-b border-r p-1.5 text-left transition-colors hover:bg-muted/40 ${
                          !cell.current ? "opacity-40" : ""
                        } ${isSelected ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                              isToday
                                ? "bg-primary text-primary-foreground"
                                : isSunday && cell.current
                                ? "text-muted-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {cell.day}
                          </span>

                          {cell.current && data && (
                            <span className="text-[10px] text-muted-foreground">
                              {data.employee_id}
                            </span>
                          )}
                        </div>

                        {cell.current && data && (
                          <div className="mt-1">
                            <span className={`text-[11px] font-semibold ${STATUS_COLORS[data.status]?.text || "text-muted-foreground"}`}>
                              {data.status}
                            </span>
                          </div>
                        )}

                        {cell.current && isSunday && !data && (
                          <div className="mt-1">
                            <span className="text-[11px] font-semibold text-muted-foreground">O</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* List view */
            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>First In</TableHead>
                      <TableHead>Last Out</TableHead>
                      <TableHead>Work Hrs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(calendarData)
                      .filter(([key]) => key.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`))
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([date, data]) => {
                        const statusCfg = STATUS_COLORS[data.status];
                        return (
                          <TableRow
                            key={date}
                            className={`cursor-pointer transition-colors hover:bg-muted/30 ${
                              selectedDate === date ? "bg-primary/5" : ""
                            }`}
                            onClick={() => setSelectedDate(date)}
                          >
                            <TableCell className="font-medium">{date}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${statusCfg?.bg} ${statusCfg?.text}`}>
                                {statusCfg?.label || data.status}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{data.first_in || "-"}</TableCell>
                            <TableCell className="font-mono text-sm">{data.last_out || "-"}</TableCell>
                            <TableCell className="font-mono text-sm font-medium">
                              {data.total_work_hrs > 0 ? `${data.total_work_hrs.toFixed(1)}h` : "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(STATUS_COLORS).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`inline-block h-3 w-3 rounded-sm ${val.bg}`} />
                <span className="text-muted-foreground">{val.label} ({key})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="lg:col-span-2 space-y-4">
          {selectedDayData ? (
            <>
              {/* Shift Info */}
              <Card className="rounded-xl shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 px-3 py-2">
                      <span className="text-lg font-bold text-primary">
                        {parseInt(selectedDate?.split("-")[2] || "0")}
                      </span>
                      <span className="text-[10px] text-primary/70 uppercase">
                        {new Date(selectedDate || "").toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{selectedDayData.shift}</p>
                      <p className="text-xs text-muted-foreground">Shift: {selectedDayData.shift_time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{selectedDayData.attendance_scheme}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-[10px] text-muted-foreground mb-2">Processed on</p>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-[10px] py-1.5">First In</TableHead>
                          <TableHead className="text-[10px] py-1.5">Last Out</TableHead>
                          <TableHead className="text-[10px] py-1.5">Late In</TableHead>
                          <TableHead className="text-[10px] py-1.5">Early Out</TableHead>
                          <TableHead className="text-[10px] py-1.5">Total Hrs</TableHead>
                          <TableHead className="text-[10px] py-1.5">Break</TableHead>
                          <TableHead className="text-[10px] py-1.5">Actual Hrs</TableHead>
                          <TableHead className="text-[10px] py-1.5">Shortfall</TableHead>
                          <TableHead className="text-[10px] py-1.5">Excess</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-mono text-xs py-1.5">{selectedDayData.first_in || "-"}</TableCell>
                          <TableCell className="font-mono text-xs py-1.5">{selectedDayData.last_out || "-"}</TableCell>
                          <TableCell className="font-mono text-xs py-1.5">{selectedDayData.late_in || "-"}</TableCell>
                          <TableCell className="font-mono text-xs py-1.5">{selectedDayData.early_out || "-"}</TableCell>
                          <TableCell className="font-mono text-xs py-1.5 font-medium">
                            {selectedDayData.total_work_hrs > 0 ? selectedDayData.total_work_hrs.toFixed(1) : "-"}
                          </TableCell>
                          <TableCell className="font-mono text-xs py-1.5">
                            {selectedDayData.break_hrs > 0 ? selectedDayData.break_hrs.toFixed(1) : "-"}
                          </TableCell>
                          <TableCell className="font-mono text-xs py-1.5 font-medium">
                            {selectedDayData.actual_work_hrs > 0 ? selectedDayData.actual_work_hrs.toFixed(1) : "-"}
                          </TableCell>
                          <TableCell className={`font-mono text-xs py-1.5 ${selectedDayData.shortfall_hrs > 0 ? "text-red-600 font-medium" : ""}`}>
                            {selectedDayData.shortfall_hrs > 0 ? selectedDayData.shortfall_hrs.toFixed(1) : "-"}
                          </TableCell>
                          <TableCell className={`font-mono text-xs py-1.5 ${selectedDayData.excess_hrs > 0 ? "text-emerald-600 font-medium" : ""}`}>
                            {selectedDayData.excess_hrs > 0 ? selectedDayData.excess_hrs.toFixed(1) : "-"}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Status Details */}
              <Card className="rounded-xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    Status Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs py-1.5">Status</TableHead>
                        <TableHead className="text-xs py-1.5">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="py-1.5">
                          <span className={`text-xs font-semibold ${STATUS_COLORS[selectedDayData.status]?.text || ""}`}>
                            {STATUS_COLORS[selectedDayData.status]?.label || selectedDayData.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-1.5">
                          {selectedDayData.remarks || "-"}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Session Details */}
              {selectedDayData.sessions && selectedDayData.sessions.length > 0 && (
                <Card className="rounded-xl shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Session Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs py-1.5">Session</TableHead>
                          <TableHead className="text-xs py-1.5">Session Timing</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedDayData.sessions.map((session, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm py-1.5 font-medium">Session {i + 1}</TableCell>
                            <TableCell className="font-mono text-sm py-1.5">{session}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CalendarRange className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">Select a date to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
