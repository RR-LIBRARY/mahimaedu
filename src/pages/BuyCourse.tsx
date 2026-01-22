import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom"; 
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle, Shield, Copy, Upload, Loader2, 
  Camera, X, Image as ImageIcon // <-- New Icons added
} from "lucide-react";

// --- YOUR UPI CONFIGURATION ---
const MERCHANT_UPI = "mandharilalyadav101174-2@okaxis"; 
const MERCHANT_NAME = "Mahima Academy"; 

const BuyCourse = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("id");
  const navigate = useNavigate();
  const location = useLocation();
  
  // States
  const [step, setStep] = useState<"details" | "payment" | "verify">("details");
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // --- NEW: Screenshot States ---
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 1. Check Login & Fetch Course
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

  // 2. UPI Logic
  const getUPILink = (appMode?: string) => {
    const price = course?.price || '0';
    const base = `pa=${MERCHANT_UPI}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${price}&tn=Course-${courseId}&cu=INR`;
    
    if (appMode === 'gpay') return `tez://upi/pay?${base}`;
    if (appMode === 'phonepe') return `phonepe://upi/pay?${base}`;
    if (appMode === 'paytm') return `paytmmp://upi/pay?${base}`;
    if (appMode === 'bhim') return `bhim://upi/pay?${base}`;
    
    return `upi://pay?${base}`;
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getUPILink())}`;

  // 3. Handlers
  const handleProceed = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please login first");
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }
    setStep("payment");
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(MERCHANT_UPI);
    toast.success("UPI ID Copied!");
  };

  const openApp = (app: string) => {
    window.location.href = getUPILink(app);
  };

  // --- NEW: Handle Screenshot Selection ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size too large (Max 5MB)");
        return;
      }
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // --- UPDATED: Secure Submit Logic ---
  const handlePaymentSubmit = async () => {
    // A. Strict Validation
    if (!transactionId.trim() || transactionId.length !== 12) {
      toast.error("Please enter a valid 12-digit UTR Number.");
      return;
    }
    if (!screenshot) {
      toast.error("Please upload the payment screenshot.");
      return;
    }

    setIsSubmitting(true);
    try {
      // B. Upload Screenshot
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, screenshot);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      // C. Insert Data
      const { error: dbError } = await supabase.from('payment_requests').insert({
        user_id: currentUser.id,
        course_id: courseId,
        transaction_id: transactionId,
        amount: course.price,
        status: 'pending',
        screenshot_url: publicUrl // Save proof link
      });

      if (dbError) {
        if (dbError.code === '23505') throw new Error("This Transaction ID is already used!");
        throw dbError;
      }

      setStep("verify");
      toast.success("Payment submitted securely!");

    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!course) return <div className="p-10 text-center">Course not found <Button onClick={() => navigate(-1)}>Back</Button></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="sticky top-0 z-50 bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-lg">Secure Checkout</h1>
      </header>

      <main className="max-w-xl mx-auto p-4 mt-4">
        
        {/* Course Info */}
        <Card className="mb-6 border-l-4 border-l-primary shadow-sm">
            <CardContent className="p-4 flex gap-4 items-center">
                {course.image_url && <img src={course.image_url} alt="Course" className="w-16 h-16 rounded object-cover"/>}
                <div>
                    <h2 className="font-bold text-lg">{course.title}</h2>
                    <p className="font-bold text-primary text-xl">₹{course.price}</p>
                </div>
            </CardContent>
        </Card>

        {/* STEP 1: DETAILS */}
        {step === "details" && (
            <Card>
                <CardHeader><CardTitle>Payment Summary</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Total Amount</span>
                        <span className="font-bold">₹{course.price}</span>
                    </div>
                    <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 flex gap-2">
                        <Shield className="w-4 h-4 mt-1"/>
                        <p>Secure payment via UPI. Access granted after manual verification.</p>
                    </div>
                    <Button className="w-full h-12 text-lg mt-4" onClick={handleProceed}>
                        Proceed to Pay ₹{course.price}
                    </Button>
                </CardContent>
            </Card>
        )}

        {/* STEP 2: PAYMENT & UPLOAD */}
        {step === "payment" && (
            <Card>
                <CardHeader className="text-center pb-2">
                    <CardTitle>Scan & Upload Proof</CardTitle>
                    <p className="text-sm text-muted-foreground">Pay to: {MERCHANT_NAME}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    
                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center p-4 bg-white border rounded-xl shadow-sm w-fit mx-auto">
                         <img src={qrCodeUrl} alt="UPI QR" className="w-48 h-48 mix-blend-multiply" />
                         <p className="text-xs text-gray-400 mt-2">Scan with any App</p>
                    </div>

                    {/* App Buttons (Mobile) */}
                    <div className="grid grid-cols-2 gap-3 md:hidden">
                        <Button variant="outline" onClick={() => openApp('gpay')}>GPay</Button>
                        <Button variant="outline" onClick={() => openApp('phonepe')}>PhonePe</Button>
                        <Button variant="outline" onClick={() => openApp('paytm')}>Paytm</Button>
                        <Button variant="outline" onClick={() => openApp('bhim')}>UPI</Button>
                    </div>

                    {/* Manual UPI ID */}
                    <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg border">
                        <p className="text-sm font-mono flex-1 truncate">{MERCHANT_UPI}</p>
                        <Button size="sm" variant="ghost" onClick={handleCopyUPI}><Copy className="h-4 w-4" /></Button>
                    </div>

                    <div className="border-t border-dashed my-2"></div>

                    {/* --- FRAUD PREVENTION FORM --- */}
                    <div className="space-y-4">
                        <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-200">
                           <Shield className="w-3 h-3 inline mr-1"/>
                           <b>Important:</b> Incorrect UTR or Screenshot will lead to permanent ban.
                        </div>

                        {/* 1. Strict UTR Input */}
                        <div className="space-y-2">
                            <Label>12-Digit Transaction ID (UTR) <span className="text-red-500">*</span></Label>
                            <Input 
                                placeholder="Enter 12 digit UTR (e.g. 3214...)" 
                                value={transactionId}
                                maxLength={12}
                                className="text-lg tracking-widest font-mono"
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, ''); // Only Numbers
                                    setTransactionId(val);
                                }}
                            />
                        </div>

                        {/* 2. Screenshot Upload Area */}
                        <div className="space-y-2">
                            <Label>Upload Screenshot <span className="text-red-500">*</span></Label>
                            
                            {!previewUrl ? (
                                <div 
                                    className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition"
                                    onClick={() => document.getElementById('screenshot-input')?.click()}
                                >
                                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Tap to upload proof</p>
                                    <input 
                                        type="file" id="screenshot-input" className="hidden" 
                                        accept="image/*" onChange={handleFileChange}
                                    />
                                </div>
                            ) : (
                                <div className="relative border rounded-lg overflow-hidden h-48 bg-black/5">
                                    <img src={previewUrl} className="w-full h-full object-contain" alt="Preview" />
                                    <Button 
                                        variant="destructive" size="icon"
                                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                                        onClick={() => { setScreenshot(null); setPreviewUrl(null); }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <Button 
                            className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 shadow-md" 
                            onClick={handlePaymentSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <><Loader2 className="animate-spin mr-2"/> Uploading...</> : <><Upload className="mr-2 h-5 w-5"/> Verify & Submit</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}

        {/* STEP 3: SUCCESS */}
        {step === "verify" && (
            <Card className="text-center py-10">
                <CardContent>
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Proof Uploaded!</h2>
                    <p className="text-muted-foreground mb-6">
                        We have received your payment proof.<br/>
                        Admin will verify and unlock the course shortly.
                    </p>
                    <Button onClick={() => navigate("/dashboard")} className="w-full">
                        Go to Dashboard
                    </Button>
                </CardContent>
            </Card>
        )}

      </main>
    </div>
  );
};

export default BuyCourse;