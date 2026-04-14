import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  Scan,
  LayoutDashboard,
  Shield,
  CalendarDays,
  RefreshCw,
  ClipboardCheck,
  Upload,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const name = localStorage.getItem("name");
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (!role) return null;

  const isActive = (path: string) => location.pathname === path;

  const userLinks = [
    { to: "/attendance", label: "Attendance", icon: Scan },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/leave", label: "Leave", icon: CalendarDays },
    { to: "/regularization", label: "Regularization", icon: RefreshCw },
  ];

  const adminLinks = [
    { to: "/admin", label: "Dashboard", icon: Shield },
    { to: "/admin/requests", label: "Approvals", icon: ClipboardCheck },
    { to: "/admin/upload", label: "Upload", icon: Upload },
  ];

  const links = role === "admin" ? adminLinks : userLinks;

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <>
      {links.map((link) => (
        <Button
          key={link.to}
          variant={isActive(link.to) ? "secondary" : "ghost"}
          size="sm"
          asChild
          onClick={onClick}
        >
          <Link to={link.to}>
            <link.icon className="mr-1.5 h-4 w-4" />
            {link.label}
          </Link>
        </Button>
      ))}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-lg font-bold text-primary">
          FaceAttend
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <NavItems />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {name}
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-10">
              <div className="flex flex-col gap-2">
                <NavItems onClick={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
