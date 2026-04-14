import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Webcam from "react-webcam";
import { login, faceLogin } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Scan, Camera, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"credentials" | "face">("credentials");
  const [scanning, setScanning] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      const { user_id, role, name } = res.data;
      localStorage.setItem("user_id", user_id);
      localStorage.setItem("role", role);
      localStorage.setItem("name", name);
      toast({ title: "Welcome back!", description: `Logged in as ${name}` });
      navigate(role === "admin" ? "/admin" : "/dashboard");
    } catch {
      toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const captureFace = useCallback(async () => {
    if (!webcamRef.current || scanning) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setScanning(true);
    try {
      const blob = await fetch(imageSrc).then((r) => r.blob());
      const res = await faceLogin(blob);
      const { user_id, role, name } = res.data;
      localStorage.setItem("user_id", user_id);
      localStorage.setItem("role", role);
      localStorage.setItem("name", name);
      toast({ title: "Welcome back!", description: `Face recognized — logged in as ${name}` });
      navigate(role === "admin" ? "/admin" : "/dashboard");
    } catch {
      // silently retry on next interval
    } finally {
      setScanning(false);
    }
  }, [scanning, navigate, toast]);

  useEffect(() => {
    if (mode !== "face") return;
    const interval = setInterval(captureFace, 3000);
    return () => clearInterval(interval);
  }, [captureFace, mode]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Scan className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your attendance account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setMode("credentials")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                mode === "credentials"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <KeyRound className="h-4 w-4" />
              Admin Login
            </button>
            <button
              type="button"
              onClick={() => setMode("face")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                mode === "face"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <Camera className="h-4 w-4" />
              Face Login
            </button>
          </div>

          {mode === "credentials" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-foreground/5">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="h-full w-full object-cover"
                  videoConstraints={{ facingMode: "user" }}
                />
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
                  </div>
                )}
                <div className="absolute bottom-3 left-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/90 px-3 py-1 text-xs font-medium text-success-foreground">
                    ● Scanning every 3s
                  </span>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Look at the camera — you'll be logged in automatically when your face is recognized.
              </p>
            </div>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            New user?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Register here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
