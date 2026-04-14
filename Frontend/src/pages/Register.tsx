// import { useState } from "react";
// import { Link } from "react-router-dom";
// import { registerUser } from "@/api/api";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
// import { Loader2, UserPlus, CheckCircle2 } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";

// const Register = () => {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [file, setFile] = useState<File | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState(false);
//   const { toast } = useToast();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!file) {
//       toast({ title: "Missing image", description: "Please upload a face image", variant: "destructive" });
//       return;
//     }
//     setLoading(true);
//     try {
//       await registerUser(name, email, file);
//       setSuccess(true);
//       toast({ title: "Registered!", description: "You can now log in" });
//     } catch {
//       toast({ title: "Registration failed", description: "Please try again", variant: "destructive" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (success) {
//     return (
//       <div className="flex min-h-screen items-center justify-center px-4">
//         <Card className="w-full max-w-md shadow-lg rounded-2xl text-center">
//           <CardContent className="pt-8 pb-8 space-y-4">
//             <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
//               <CheckCircle2 className="h-8 w-8 text-success" />
//             </div>
//             <h2 className="text-xl font-semibold">Registration Successful!</h2>
//             <p className="text-muted-foreground">Your face has been registered. You can now log in.</p>
//             <Button asChild className="mt-2">
//               <Link to="/login">Go to Login</Link>
//             </Button>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="flex min-h-screen items-center justify-center px-4">
//       <Card className="w-full max-w-md shadow-lg rounded-2xl">
//         <CardHeader className="text-center space-y-2">
//           <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
//             <UserPlus className="h-6 w-6 text-primary" />
//           </div>
//           <CardTitle className="text-2xl">Create Account</CardTitle>
//           <CardDescription>Register your face for attendance</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="name">Full Name</Label>
//               <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="reg-email">Email</Label>
//               <Input id="reg-email" type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="photo">Face Photo</Label>
//               <Input id="photo" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
//             </div>
//             <Button type="submit" className="w-full" disabled={loading}>
//               {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//               Register
//             </Button>
//           </form>
//           <p className="mt-4 text-center text-sm text-muted-foreground">
//             Already registered?{" "}
//             <Link to="/login" className="text-primary hover:underline font-medium">
//               Sign in
//             </Link>
//           </p>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default Register;
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import Webcam from "react-webcam";
import { registerUser } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, CheckCircle2, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const webcamRef = useRef<Webcam>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { toast } = useToast();

  // ✅ Convert base64 → File
  const base64ToFile = (base64: string) => {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], "capture.jpg", { type: mime });
  };

  // ✅ Capture from webcam
  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    setPreview(imageSrc);

    const file = base64ToFile(imageSrc);
    setFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast({
        title: "Missing image",
        description: "Please capture your face",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await registerUser(name, email, file);
      setSuccess(true);

      toast({
        title: "Registered!",
        description: "You can now log in",
      });
    } catch {
      toast({
        title: "Registration failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-lg rounded-2xl text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold">Registration Successful!</h2>
            <p className="text-muted-foreground">
              Your face has been registered. You can now log in.
            </p>
            <Button asChild className="mt-2">
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Register your face for attendance</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* ✅ Webcam Section */}
            <div className="space-y-2">
              <Label>Capture Face</Label>

              <div className="relative aspect-video rounded-xl overflow-hidden bg-foreground/5">
                {!preview ? (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    screenshotQuality={1}
                    className="h-full w-full object-cover"
                    videoConstraints={{
                      facingMode: "user",
                      width: 640,
                      height: 480,
                    }}
                  />
                ) : (
                  <img src={preview} className="h-full w-full object-cover" />
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => {
                  if (preview) {
                    setPreview(null);
                    setFile(null);
                  } else {
                    capture();
                  }
                }}
              >
                <Camera className="h-4 w-4" />
                {preview ? "Retake" : "Capture"}
              </Button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
