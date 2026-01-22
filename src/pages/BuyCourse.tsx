import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom"; 
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle, Shield, Copy, Upload, Loader2, 
  Camera, X, User
} from "lucide-react";

// --- CONFIGURATION ---
const MERCHANT_UPI = "mandharilalyadav101174-2@okaxis"; 
const MERCHANT_NAME = "Mahima Academy"; 
// Reliable Success Sound URL (Short 'Ping')
const SUCCESS_SOUND_URL = "https://cdn.pixabay.com/audio/2021/08/04/audio_aad70ee296.mp3";

const BuyCourse = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("id");
  const navigate = useNavigate();
  const location = useLocation();
  
  // States
  const [step, setStep] = useState<"details" | "payment" | "verify">("details");
  const [transactionId, setTransactionId] = useState("");
  const [senderName, setSenderName] = useState(""); 
  const [isDeclared, setIsDeclared] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // New State for Auto-Redirect Countdown
  const [countdown, setCountdown] = useState(5);

  // 1. Init Data (Load User & Course)
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);

      if (courseId) {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();
        if (!error) setCourse(data);
      }
      setLoading(false);
    };
    initData();
  }, [courseId]);

  // 2. Auto Redirect Logic (Jab step 'verify' ho jaye)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "verify") {
      // 5 second countdown logic
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/dashboard"); // Redirect to Dashboard
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, navigate]);

  // 3. Play Sound Helper (Safe Mode)
  const playSuccessSound = () => {
    try {
      const audio = new Audio(SUCCESS_SOUND_URL);
      audio.volume = 0.5; // Thoda soft rakhein
      audio.play().catch((err) => console.log("Audio autoplay blocked:", err));
    } catch (e) {
      console.error("Audio error", e); // Crash nahi hone dega
    }
  };

  // 4. UPI Link Generators
  const getUPILink = (appMode?: string) => {
    const price = course?.price || '0';
    const base = `pa=${MERCHANT_UPI}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${price}&tn=Course-${courseId}&cu=INR`;
    if (appMode === 'gpay') return `tez://upi/pay?${base}`;
    if (appMode === 'phonepe') return `phonepe://upi/pay?${base}`;
    if (appMode === 'paytm') return `paytmmp://upi/pay?${base}`;
    return `upi://pay?${base}`;
  };
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getUPILink())}`;

  // 5. Handlers
  const handleProceed = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please login first");
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }
    setStep("payment");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) return toast.error("Max size 5MB");
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(MERCHANT_UPI);
    toast.success("UPI ID Copied!");
  };

  // --- MAIN SUBMIT LOGIC ---
  const handlePaymentSubmit = async () => {
    // Validations (Layers 1-4)
    if (!transactionId.trim() || transactionId.length !== 12) return toast.error("Enter valid 12-digit UTR.");
    if (!screenshot) return toast.error("Screenshot proof is mandatory.");
    if (!senderName.trim() || senderName.length < 3) return toast.error("Enter Sender Name.");
    if (!isDeclared) return toast.error("Please agree to the declaration.");

    setIsSubmitting(true);
    try {
      // A. Upload Screenshot
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, screenshot);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(fileName);

      // B. Save to Database
      const { error: dbError } = await supabase.from('payment_requests').insert({
        user_id: currentUser.id,
        course_id: courseId,
        transaction_id: transactionId,
        amount: course.price,
        status: 'pending',
        screenshot_url: publicUrl,
        sender_name: senderName
      });

      if (dbError) {
        if (dbError.code === '23505') throw new Error("This Transaction ID is already used!");
        throw dbError;
      }

      // C. SUCCESS SEQUENCE
      playSuccessSound(); // 🔊 Sound play
      setStep("verify");  // ✅ Switch UI (Animations start here)
      toast.success("Payment Received Successfully!");

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!course) return <div className="p-10 text-center">Course not found <Button onClick={() => navigate(-1)}>Back</Button></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        {step !== 'verify' && (
           <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        )}
        <h1 className="font-semibold text-lg">Secure Checkout</h1>
      </header>

      <main className="max-w-xl mx-auto p-4 mt-4">
        
        {/* Step 1: Details */}
        {step === "details" && (
            <Card>
                <CardHeader><CardTitle>Payment Summary</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg border">
                        {course.image_url && <img src={course.image_url} alt="Course" className="w-16 h-16 rounded object-cover"/>}
                        <div>
                            <h2 className="font-bold text-sm">{course.title}</h2>
                            <p className="font-bold text-primary">₹{course.price}</p>
                        </div>
                    </div>
                    <Button className="w-full h-12 text-lg mt-4" onClick={handleProceed}>Proceed to Pay</Button>
                </CardContent>
            </Card>
        )}

        {/* Step 2: Payment Form */}
        {step === "payment" && (
            <Card>
                <CardHeader className="text-center pb-2">
                    <CardTitle>Scan & Verify</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center p-4 bg-white border rounded-xl shadow-sm w-fit mx-auto">
                         <img src={qrCodeUrl} alt="UPI QR" className="w-40 h-40 mix-blend-multiply" />
                         <div className="flex items-center gap-2 mt-2 bg-gray-100 px-3 py-1 rounded text-xs">
                            <span className="font-mono">{MERCHANT_UPI}</span>
                            <Copy className="h-3 w-3 cursor-pointer" onClick={handleCopyUPI}/>
                         </div>
                    </div>

                    {/* App Buttons */}
                    <div className="grid grid-cols-3 gap-2 md:hidden">
                        <Button variant="outline" size="sm" onClick={() => window.location.href = getUPILink('gpay')}>GPay</Button>
                        <Button variant="outline" size="sm" onClick={() => window.location.href = getUPILink('phonepe')}>PhonePe</Button>
                        <Button variant="outline" size="sm" onClick={() => window.location.href = getUPILink('paytm')}>Paytm</Button>
                    </div>

                    <div className="border-t border-dashed"></div>

                    {/* Security Form */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label>Sender Name (As per Bank) <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input placeholder="e.g. Rahul Kumar" className="pl-9" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label>12-Digit UTR Number <span className="text-red-500">*</span></Label>
                            <Input placeholder="3214xxxx5678" value={transactionId} maxLength={12} className="font-mono tracking-widest"
                                onChange={(e) => setTransactionId(e.target.value.replace(/\D/g, ''))} />
                        </div>

                        <div className="space-y-1">
                            <Label>Payment Screenshot <span className="text-red-500">*</span></Label>
                            {!previewUrl ? (
                                <div className="border-2 border-dashed rounded-lg h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                                    onClick={() => document.getElementById('file-upload')?.click()}>
                                    <Camera className="h-6 w-6 text-gray-400" />
                                    <span className="text-xs text-gray-500">Tap to upload</span>
                                    <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>
                            ) : (
                                <div className="relative h-32 bg-black/5 rounded-lg border overflow-hidden">
                                    <img src={previewUrl} className="w-full h-full object-contain" />
                                    <X className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 h-5 w-5 cursor-pointer" onClick={() => {setPreviewUrl(null); setScreenshot(null)}}/>
                                </div>
                            )}
                        </div>

                        <div className="flex items-start space-x-2 bg-yellow-50 p-3 rounded border border-yellow-200">
                            <input type="checkbox" id="terms" className="mt-1 h-4 w-4" checked={isDeclared} onChange={(e) => setIsDeclared(e.target.checked)}/>
                            <label htmlFor="terms" className="text-xs text-yellow-800 cursor-pointer select-none">
                                I verify that UTR and Screenshot are authentic. Fake details will ban my account.
                            </label>
                        </div>

                        <Button className="w-full h-12 bg-green-600 hover:bg-green-700 font-bold shadow-md" 
                            onClick={handlePaymentSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <><Shield className="mr-2 h-4 w-4"/> Secure Submit</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}

        {/* Step 3: SUCCESS ANIMATION & REDIRECT */}
        {step === "verify" && (
            <Card className="text-center py-16 animate-in fade-in duration-500">
                <CardContent>
                    {/* Animated Green Tick */}
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-[bounce_1s_ease-in-out_1]">
                        <CheckCircle className="w-16 h-16" />
                    </div>
                    
                    <h2 className="text-3xl font-bold mb-2 text-green-700">Request Received!</h2>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border max-w-xs mx-auto my-6">
                        <p className="text-gray-600 text-sm">Amount</p>
                        <p className="text-2xl font-bold">₹{course.price}</p>
                        <p className="text-xs text-gray-400 mt-1">Transaction ID: {transactionId}</p>
                    </div>

                    <p className="text-muted-foreground mb-8">
                        Redirecting you to dashboard in <span className="font-bold text-primary text-xl">{countdown}</span> seconds...
                    </p>
                    
                    <Button onClick={() => navigate("/dashboard")} className="w-full max-w-xs">
                        Go to Dashboard Now
                    </Button>
                </CardContent>
            </Card>
        )}

      </main>
    </div>
  );
};

export default BuyCourse;