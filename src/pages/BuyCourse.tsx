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
  ArrowLeft, CheckCircle, Shield, Copy, Upload, Loader2, Smartphone
} from "lucide-react";

// --- YOUR UPI CONFIGURATION ---
const MERCHANT_UPI = "mandharilalyadav101174-2@okaxis"; 
const MERCHANT_NAME = "Mahima Academy"; // Ya apna naam likhen

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
  const [currentUser, setCurrentUser] = useState<any>(null); // Direct user state

  // 1. Check Login & Fetch Course (MOUNT PAR HI CHECK KARENGE)
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      
      // A. Check Auth Directly from Supabase (Loop Fix)
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);

      // B. Fetch Course Details
      if (courseId) {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();
        
        if (!error) setCourse(data);
        else toast.error("Course load failed");
      }
      setLoading(false);
    };

    initData();
  }, [courseId]);

  // 2. UPI Logic from your HTML file
  const getUPILink = (appMode?: string) => {
    const price = course?.price || '0';
    // Base UPI String
    const base = `pa=${MERCHANT_UPI}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${price}&tn=Course-${courseId}&cu=INR`;
    
    // App Specific Prefixes (Logic from your HTML)
    if (appMode === 'gpay') return `tez://upi/pay?${base}`;
    if (appMode === 'phonepe') return `phonepe://upi/pay?${base}`;
    if (appMode === 'paytm') return `paytmmp://upi/pay?${base}`;
    if (appMode === 'bhim') return `bhim://upi/pay?${base}`;
    
    return `upi://pay?${base}`; // Universal Link
  };

  // QR Code URL Generator
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getUPILink())}`;

  // 3. Button Handlers
  const handleProceed = async () => {
    // Dobara check karo ki session hai ya nahi
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast.error("Please login to purchase");
      // Login par bhejo aur wapis yahi aane ka rasta batao
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }
    
    // Agar login hai, to Payment Step dikhao
    setStep("payment");
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(MERCHANT_UPI);
    toast.success("UPI ID Copied!");
  };

  const openApp = (app: string) => {
    window.location.href = getUPILink(app);
  };

  const handlePaymentSubmit = async () => {
    if (!transactionId.trim() || transactionId.length < 10) {
      toast.error("Please enter a valid Transaction ID / UTR");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('payment_requests').insert({
        user_id: currentUser.id,
        course_id: courseId,
        transaction_id: transactionId,
        amount: course.price,
        status: 'pending'
      });

      if (error) throw error;

      setStep("verify");
      toast.success("Payment submitted!");
    } catch (error: any) {
      toast.error("Error: " + error.message);
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
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-lg">Checkout</h1>
      </header>

      <main className="max-w-xl mx-auto p-4 mt-4">
        
        {/* Course Info Card */}
        <Card className="mb-6 border-l-4 border-l-primary shadow-sm">
            <CardContent className="p-4 flex gap-4 items-center">
                {course.image_url && <img src={course.image_url} alt="Course" className="w-16 h-16 rounded object-cover"/>}
                <div>
                    <h2 className="font-bold text-lg">{course.title}</h2>
                    <p className="font-bold text-primary text-xl">₹{course.price}</p>
                </div>
            </CardContent>
        </Card>

        {/* --- STEP 1: DETAILS --- */}
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
                        <p>Login karke payment karein taaki hum apka course activate kar sakein.</p>
                    </div>

                    <Button className="w-full h-12 text-lg mt-4" onClick={handleProceed}>
                        Proceed to Pay ₹{course.price}
                    </Button>
                </CardContent>
            </Card>
        )}

        {/* --- STEP 2: UPI PAYMENT (QR & BUTTONS) --- */}
        {step === "payment" && (
            <Card>
                <CardHeader className="text-center pb-2">
                    <CardTitle>Scan or Pay</CardTitle>
                    <p className="text-sm text-muted-foreground">Paying to: {MERCHANT_NAME}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    
                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center p-4 bg-white border rounded-xl shadow-sm w-fit mx-auto">
                         <img src={qrCodeUrl} alt="UPI QR" className="w-48 h-48 mix-blend-multiply" />
                         <p className="text-xs text-gray-400 mt-2">Scan with any App</p>
                    </div>

                    {/* App Buttons (Visible mostly on Mobile) */}
                    <div className="grid grid-cols-2 gap-3 md:hidden">
                        <Button variant="outline" className="h-10 border-blue-200 text-blue-700" onClick={() => openApp('gpay')}>
                            Google Pay
                        </Button>
                        <Button variant="outline" className="h-10 border-purple-200 text-purple-700" onClick={() => openApp('phonepe')}>
                            PhonePe
                        </Button>
                        <Button variant="outline" className="h-10 border-sky-200 text-sky-700" onClick={() => openApp('paytm')}>
                            Paytm
                        </Button>
                        <Button variant="outline" className="h-10 border-orange-200 text-orange-700" onClick={() => openApp('bhim')}>
                            BHIM UPI
                        </Button>
                    </div>

                    {/* Manual UPI ID */}
                    <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg border">
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs text-gray-500">UPI ID</p>
                            <p className="text-sm font-mono font-medium truncate">{MERCHANT_UPI}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={handleCopyUPI}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>

                    <hr />

                    {/* Transaction ID Input */}
                    <div className="space-y-3">
                        <Label>Transaction ID (UTR) <span className="text-red-500">*</span></Label>
                        <Input 
                            placeholder="Example: 3214xxxx5678" 
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Payment hone ke baad UTR number yahan likhen.</p>
                        
                        <Button 
                            className="w-full h-12 text-lg" 
                            onClick={handlePaymentSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <Upload className="mr-2 h-5 w-5"/>}
                            Submit Payment
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}

        {/* --- STEP 3: SUCCESS --- */}
        {step === "verify" && (
            <Card className="text-center py-10">
                <CardContent>
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Request Submitted!</h2>
                    <p className="text-muted-foreground mb-6">
                        Admin verification pending.<br/>
                        Check status in dashboard.
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