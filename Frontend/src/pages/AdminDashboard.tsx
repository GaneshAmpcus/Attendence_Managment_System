import { useEffect, useState } from "react";
import { format } from "date-fns";
import { getAllUsers, getAllAttendance, getAttendanceByDate } from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Users, CalendarDays, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";


interface User {
  id: string;
  name: string;
  email: string;
}

interface AttendanceRecord {
  user_name: string;
  date: string;
  check_in: string;
  check_out: string;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [filtered, setFiltered] = useState<AttendanceRecord[] | null>(null);
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [u, a] = await Promise.all([getAllUsers(), getAllAttendance()]);

        // ✅ USERS FIX
        const formattedUsers = (u.data.users || []).map((u: any) => ({
          id: u[0],
          name: u[1],
          email: u[2],
        }));

        setUsers(formattedUsers);
        // ✅ ATTENDANCE FIX (map array → object)
        const formattedAttendance = (a.data.data || []).map((r: any) => ({
          user_name: r.user_name || r[1] || "Unknown",
          date: r.date || r[2] || "",
          check_in: r.check_in || r[3] || "",
          check_out: r.check_out || r[4] || "",
        }));

        setAttendance(formattedAttendance);
      } catch (err) {
        console.error("Error loading admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleFilter = async () => {
    if (!date) return;
    setFilterLoading(true);

    try {
      const res = await getAttendanceByDate(format(date, "yyyy-MM-dd"));

      const formatted = (res.data.data || []).map((r: any) => ({
      user_name: r.user_name || r[0] || "Unknown",
      check_in: r.check_in || r[1] || "",
      check_out: r.check_out || r[2] || "",
      date: format(date, "yyyy-MM-dd"),
    }));

      setFiltered(formatted);
    } catch (err) {
      console.error("Filter error:", err);
      setFiltered([]);
    } finally {
      setFilterLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const AttendanceTable = ({ data }: { data: AttendanceRecord[] }) => (
    <div className="overflow-x-auto">
      {data.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No records found
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r, i) => (
              <TableRow
                key={`${r.user_name || "u"}-${r.date || "d"}-${r.check_in || i}`}
              >
                <TableCell className="font-medium">
                  {r.user_name || "Unknown"}
                </TableCell>
                <TableCell>{r.date || "-"}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="bg-success/10 text-success border-success/20"
                  >
                    {r.check_in || "-"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {r.check_out ? (
                    <Badge
                      variant="outline"
                      className="bg-primary/10 text-primary border-primary/20"
                    >
                      {r.check_out}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="filter">By Date</TabsTrigger>
          </TabsList>

          {/* USERS */}
          <TabsContent value="users">
            <Card className="rounded-2xl shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  All Users ({users.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u, i) => (
                      <TableRow key={`${u.id || i}-${u.email || i}`}>
                        <TableCell>{u.id}</TableCell>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ATTENDANCE */}
          <TabsContent value="attendance">
            <Card className="rounded-2xl shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  All Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AttendanceTable data={attendance} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* FILTER */}
          <TabsContent value="filter">
            <Card className="rounded-2xl shadow">
              <CardHeader>
                <CardTitle>Filter by Date</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                      />
                    </PopoverContent>
                  </Popover>

                  <Button
                    onClick={handleFilter}
                    disabled={!date || filterLoading}
                  >
                    {filterLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Filter
                  </Button>
                </div>

                {filtered !== null && <AttendanceTable data={filtered} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
