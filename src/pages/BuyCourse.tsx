import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom"; 
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // Shadcn Checkbox (ya normal input use karein)
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle, Shield, Copy, Upload, Loader2, 
  Camera, X, User, AlertTriangle
} from "lucide-react";

// --- CONFIGURATION ---
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
  const [senderName, setSenderName] = useState(""); // <-- NEW LAYER
  const [isDeclared, setIsDeclared] = useState(false); // <-- NEW LAYER
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 1. Init Data
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

  // 2. UPI Generator
  const getUPILink = (appMode?: string) => {
    const price = course?.price || '0';
    const base = `pa=${MERCHANT_UPI}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${price}&tn=Course-${courseId}&cu=INR`;
    
    if (appMode === 'gpay') return `tez://upi/pay?${base}`;
    if (appMode === 'phonepe') return `phonepe://upi/pay?${base}`;
    if (appMode === 'paytm') return `paytmmp://upi/pay?${base}`;
    
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

  // --- FINAL SUBMIT LOGIC ---
  const handlePaymentSubmit = async () => {
    // LAYER 1: UTR Check
    if (!transactionId.trim() || transactionId.length !== 12) {
      toast.error("Enter valid 12-digit UTR.");
      return;
    }
    // LAYER 2: Screenshot Check
    if (!screenshot) {
      toast.error("Screenshot proof is mandatory.");
      return;
    }
    // LAYER 3: Sender Name Check
    if (!senderName.trim() || senderName.length < 3) {
      toast.error("Please enter Sender Name (Bank Name).");
      return;
    }
    // LAYER 4: Declaration Check
    if (!isDeclared) {
      toast.error("Please agree to the declaration.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('receipts').upload(fileName, screenshot);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('receipts').getPublicUrl(fileName);

      // Insert with Sender Name
      const { error: dbError } = await supabase.from('payment_requests').insert({
        user_id: currentUser.id,
        course_id: courseId,
        transaction_id: transactionId,
        amount: course.price,
        status: 'pending',
        screenshot_url: publicUrl,
        sender_name: senderName // Saving the name
      });

      if (dbError) {
        if (dbError.code === '23505') throw new Error("This Transaction ID is already used!");
        throw dbError;
      }

      setStep("verify");
      toast.success("Verification Request Sent!");

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
      <header className="sticky top-0 z-50 bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="font-semibold text-lg">Secure Checkout</h1>
      </header>

      <main className="max-w-xl mx-auto p-4 mt-4">
        
        {/* Course Summary */}
        <Card className="mb-6 border-l-4 border-l-primary shadow-sm">
            <CardContent className="p-4 flex gap-4 items-center">
                {course.image_url && <img src={course.image_url} alt="Course" className="w-16 h-16 rounded object-cover"/>}
                <div>
                    <h2 className="font-bold text-lg">{course.title}</h2>
                    <p className="font-bold text-primary text-xl">₹{course.price}</p>
                </div>
            </CardContent>
        </Card>

        {step === "details" && (
            <Card>
                <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Amount to Pay</span>
                        <span className="font-bold text-xl">₹{course.price}</span>
                    </div>
                    <Button className="w-full h-12 text-lg mt-4" onClick={handleProceed}>Pay Now</Button>
                </CardContent>
            </Card>
        )}

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

                    <div className="grid grid-cols-3 gap-2 md:hidden">
                        <Button variant="outline" size="sm" onClick={() => window.location.href = getUPILink('gpay')}>GPay</Button>
                        <Button variant="outline" size="sm" onClick={() => window.location.href = getUPILink('phonepe')}>PhonePe</Button>
                        <Button variant="outline" size="sm" onClick={() => window.location.href = getUPILink('paytm')}>Paytm</Button>
                    </div>

                    <div className="border-t border-dashed"></div>

                    {/* --- 5-LAYER SECURITY FORM --- */}
                    <div className="space-y-4">
                        
                        {/* 1. Sender Name */}
                        <div className="space-y-1">
                            <Label>Sender Name (As per Bank) <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                    placeholder="e.g. Rahul Kumar (Father's Name)" 
                                    className="pl-9"
                                    value={senderName}
                                    onChange={(e) => setSenderName(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 2. UTR Input */}
                        <div className="space-y-1">
                            <Label>12-Digit UTR Number <span className="text-red-500">*</span></Label>
                            <Input 
                                placeholder="3214xxxx5678" 
                                value={transactionId}
                                maxLength={12}
                                className="font-mono tracking-widest"
                                onChange={(e) => setTransactionId(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>

                        {/* 3. Screenshot */}
                        <div className="space-y-1">
                            <Label>Payment Screenshot <span className="text-red-500">*</span></Label>
                            {!previewUrl ? (
                                <div 
                                    className="border-2 border-dashed rounded-lg h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
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

                        {/* 4. Declaration Checkbox */}
                        <div className="flex items-start space-x-2 bg-yellow-50 p-3 rounded border border-yellow-200">
                            <input 
                                type="checkbox" 
                                id="terms" 
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={isDeclared}
                                onChange={(e) => setIsDeclared(e.target.checked)}
                            />
                            <label htmlFor="terms" className="text-xs text-yellow-800 leading-tight cursor-pointer select-none">
                                I verify that the <b>UTR ({transactionId})</b> and screenshot are authentic. I understand that submitting fake details will lead to a <b>permanent account ban</b>.
                            </label>
                        </div>

                        <Button 
                            className="w-full h-12 bg-green-600 hover:bg-green-700 font-bold shadow-md" 
                            onClick={handlePaymentSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <><Shield className="mr-2 h-4 w-4"/> Secure Submit</>}
                        </Button>

                    </div>
                </CardContent>
            </Card>
        )}

        {step === "verify" && (
            <Card className="text-center py-12">
                <CardContent>
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Request Received!</h2>
                    <p className="text-muted-foreground mb-6 text-sm">
                        Admin will verify details for <b>{senderName}</b>.<br/>
                        This usually takes 1-2 hours.
                    </p>
                    <Button onClick={() => navigate("/dashboard")} variant="outline" className="w-full">
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