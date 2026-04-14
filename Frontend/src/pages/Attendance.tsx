

// import { useRef, useState, useCallback, useEffect } from "react";
// import Webcam from "react-webcam";
// import { markAttendance } from "@/api/api";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Loader2, Camera, CheckCircle2, XCircle, Clock } from "lucide-react";
// import Navbar from "@/components/Navbar";

// type ResultStatus = "check-in" | "check-out" | "already" | "wait" | "error" | null;

// const statusConfig: Record<NonNullable<ResultStatus>, { label: string; icon: React.ReactNode; color: string }> = {
//   "check-in": { label: "Check-in Successful", icon: <CheckCircle2 className="h-5 w-5" />, color: "bg-success text-success-foreground" },
//   "check-out": { label: "Check-out Successful", icon: <CheckCircle2 className="h-5 w-5" />, color: "bg-primary text-primary-foreground" },
//   already: { label: "Already Completed", icon: <Clock className="h-5 w-5" />, color: "bg-warning text-warning-foreground" },
//   wait: { label: "Please Wait...", icon: <Clock className="h-5 w-5" />, color: "bg-muted text-muted-foreground" },
//   error: { label: "Recognition Failed", icon: <XCircle className="h-5 w-5" />, color: "bg-destructive text-destructive-foreground" },
// };

// const Attendance = () => {
//   const webcamRef = useRef<Webcam>(null);
//   const [status, setStatus] = useState<ResultStatus>(null);
//   const [scanning, setScanning] = useState(false);
//   const [active, setActive] = useState(true);

//   const capture = useCallback(async () => {
//     if (!webcamRef.current || scanning) return;

//     const imageSrc = webcamRef.current.getScreenshot();
//     if (!imageSrc) return;

//     setScanning(true);

//     try {
//       const blob = await fetch(imageSrc).then((r) => r.blob());
//       const res = await markAttendance(blob);

//       const msg: string = res.data?.message || res.data?.status || "";

//       // ✅ ONLY CHANGE → stop scanning after success
//       if (msg.includes("check-in")) {
//         setStatus("check-in");
//         setActive(false);
//       } else if (msg.includes("check-out")) {
//         setStatus("check-out");
//         setActive(false);
//       } else if (msg.includes("already")) {
//         setStatus("already");
//         setActive(false);
//       } else {
//         setStatus("wait");
//       }

//     } catch {
//       setStatus("error");
//     } finally {
//       setScanning(false);
//     }
//   }, [scanning]);

//   useEffect(() => {
//     if (!active) return;

//     const interval = setInterval(capture, 3000);

//     return () => clearInterval(interval);
//   }, [capture, active]);

//   return (
//     <div className="min-h-screen">
//       <Navbar />

//       <div className="container mx-auto max-w-2xl px-4 py-8">
//         <Card className="shadow-lg rounded-2xl overflow-hidden">
//           <CardHeader className="text-center">
//             <CardTitle className="flex items-center justify-center gap-2 text-xl">
//               <Camera className="h-5 w-5 text-primary" />
//               Face Scan Attendance
//             </CardTitle>
//           </CardHeader>

//           <CardContent className="space-y-6">
//             <div className="relative aspect-video overflow-hidden rounded-xl bg-foreground/5">

//               <Webcam
//                 ref={webcamRef}
//                 audio={false}
//                 screenshotFormat="image/jpeg"
//                 screenshotQuality={1}
//                 className="h-full w-full object-cover"
//                 videoConstraints={{
//                   facingMode: "user",
//                   width: 640,
//                   height: 480
//                 }}
//               />

//               {scanning && (
//                 <div className="absolute inset-0 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
//                   <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
//                 </div>
//               )}

//               <div className="absolute bottom-3 left-3">
//                 <Badge
//                   variant="outline"
//                   className={`cursor-pointer select-none ${active ? "bg-success/90 text-success-foreground border-0" : "bg-card"}`}
//                   onClick={() => setActive(!active)}
//                 >
//                   {active ? "● Scanning" : "○ Paused"}
//                 </Badge>
//               </div>
//             </div>

//             {status && (
//               <div className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${statusConfig[status].color}`}>
//                 {statusConfig[status].icon}
//                 {statusConfig[status].label}
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default Attendance;


import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { markAttendance } from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Camera, CheckCircle2, XCircle, Clock } from "lucide-react";

type ResultStatus = "check-in" | "check-out" | "already" | "wait" | "error" | null;

const statusConfig: Record<NonNullable<ResultStatus>, { label: string; icon: React.ReactNode; color: string }> = {
  "check-in": { label: "Check-in Successful", icon: <CheckCircle2 className="h-5 w-5" />, color: "bg-success text-success-foreground" },
  "check-out": { label: "Check-out Successful", icon: <CheckCircle2 className="h-5 w-5" />, color: "bg-primary text-primary-foreground" },
  already: { label: "Already Completed", icon: <Clock className="h-5 w-5" />, color: "bg-warning text-warning-foreground" },
  wait: { label: "Please Wait...", icon: <Clock className="h-5 w-5" />, color: "bg-muted text-muted-foreground" },
  error: { label: "Recognition Failed", icon: <XCircle className="h-5 w-5" />, color: "bg-destructive text-destructive-foreground" },
};

const Attendance = () => {
  const webcamRef = useRef<Webcam>(null);
  const [status, setStatus] = useState<ResultStatus>(null);
  const [scanning, setScanning] = useState(false);
  const [active, setActive] = useState(true);

  const capture = useCallback(async () => {
    if (!webcamRef.current || scanning) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setScanning(true);

    try {
      const blob = await fetch(imageSrc).then((r) => r.blob());
      const res = await markAttendance(blob);

      const msg: string = res.data?.message || res.data?.status || "";

      // ✅ ONLY CHANGE → stop scanning after success
      if (msg.includes("check-in")) {
        setStatus("check-in");
        setActive(false);
      } else if (msg.includes("check-out")) {
        setStatus("check-out");
        setActive(false);
      } else if (msg.includes("already")) {
        setStatus("already");
        setActive(false);
      } else {
        setStatus("wait");
      }

    } catch {
      setStatus("error");
    } finally {
      setScanning(false);
    }
  }, [scanning]);

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(capture, 3000);

    return () => clearInterval(interval);
  }, [capture, active]);

  return (
    <div className="min-h-screen">

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card className="shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Camera className="h-5 w-5 text-primary" />
              Face Scan Attendance
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-foreground/5">

              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={1}
                className="h-full w-full object-cover"
                videoConstraints={{
                  facingMode: "user",
                  width: 640,
                  height: 480
                }}
              />

              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
                </div>
              )}

              <div className="absolute bottom-3 left-3">
                <Badge
                  variant="outline"
                  className={`cursor-pointer select-none ${active ? "bg-success/90 text-success-foreground border-0" : "bg-card"}`}
                  onClick={() => setActive(!active)}
                >
                  {active ? "● Scanning" : "○ Paused"}
                </Badge>
              </div>
            </div>

            {status && (
              <div className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${statusConfig[status].color}`}>
                {statusConfig[status].icon}
                {statusConfig[status].label}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Attendance;