import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom"; 
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle, Clock, BookOpen, Shield, Copy, Upload, Loader2, Smartphone
} from "lucide-react";

// --- CONFIGURATION FROM YOUR HTML ---
const MERCHANT_UPI = "mandharilalyadav101174-2@okaxis"; 
const MERCHANT_NAME = "Mahima Academy";

const BuyCourse = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("id");
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  const [step, setStep] = useState<"details" | "payment" | "verify">("details");
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Course
  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (error) throw error;
        setCourse(data);
      } catch (error) {
        console.error("Error fetching course:", error);
        toast.error("Could not load course details.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourseDetails();
  }, [courseId]);

  // 2. Dynamic UPI Links (Logic from HTML)
  const getUPILink = (appMode?: string) => {
    const base = `pa=${MERCHANT_UPI}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${course?.price || '0'}&tn=Course-${courseId}&cu=INR`;
    
    if (appMode === 'gpay') return `tez://upi/pay?${base}`;
    if (appMode === 'phonepe') return `phonepe://upi/pay?${base}`;
    if (appMode === 'paytm') return `paytmmp://upi/pay?${base}`;
    if (appMode === 'bhim') return `bhim://upi/pay?${base}`;
    
    return `upi://pay?${base}`; // Default generic
  };

  // QR Code URL (API based on HTML logic)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getUPILink())}`;

  // 3. Handlers
  const handleCopyUPI = () => {
    navigator.clipboard.writeText(MERCHANT_UPI);
    toast.success("UPI ID copied to clipboard!");
  };

  const openApp = (app: string) => {
    window.location.href = getUPILink(app);
  };

  const handleProceed = () => {
    if (!isAuthenticated) {
      toast.error("Please login first to continue purchase");
      // Redirect to Login, keeping current location in state
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }
    setStep("payment");
  };

  const handlePaymentSubmit = async () => {
    if (!transactionId.trim() || transactionId.length < 10) {
      toast.error("Please enter a valid 12-digit Transaction ID (UTR)");
      return;
    }

    setIsSubmitting(true);
    try {
      // Supabase Entry
      const { error } = await supabase.from('payment_requests').insert({
        user_id: user.id,
        course_id: courseId,
        transaction_id: transactionId,
        amount: course.price,
        status: 'pending'
      });

      if (error) throw error;

      setStep("verify");
      toast.success("Payment submitted successfully!");
    } catch (error: any) {
      console.error("Payment Error:", error);
      toast.error("Failed: " + error.message);
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
        
        {/* Course Summary */}
        <Card className="mb-6 shadow-sm border-primary/20">
            <CardContent className="p-4 flex gap-4">
                <img src={course.image_url} alt="Course" className="w-20 h-20 rounded-md object-cover bg-gray-200"/>
                <div>
                    <h2 className="font-bold text-lg leading-tight">{course.title}</h2>
                    <Badge variant="secondary" className="mt-1">Grade {course.grade}</Badge>
                    <p className="text-xl font-bold text-primary mt-1">₹{course.price}</p>
                </div>
            </CardContent>
        </Card>

        {step === "details" && (
            <Card>
                <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Course Fee</span>
                        <span>₹{course.price}</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold text-lg">
                        <span>Total Payable</span>
                        <span>₹{course.price}</span>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg flex gap-3 text-sm text-blue-800">
                        <Shield className="w-5 h-5 flex-shrink-0"/>
                        <p>Secure payment via UPI. Access granted after admin verification.</p>
                    </div>
                    <Button className="w-full text-lg h-12" onClick={handleProceed}>
                        Pay Now
                    </Button>
                </CardContent>
            </Card>
        )}

        {step === "payment" && (
            <Card>
                <CardHeader className="text-center pb-2">
                    <CardTitle>Scan or Pay via App</CardTitle>
                    <p className="text-sm text-muted-foreground">Paying to: {MERCHANT_NAME}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    
                    {/* QR Code Section */}
                    <div className="flex flex-col items-center justify-center p-4 bg-white border rounded-xl shadow-sm">
                         <img src={qrCodeUrl} alt="UPI QR" className="w-48 h-48 mix-blend-multiply" />
                         <p className="text-xs text-gray-400 mt-2">Scan with any UPI App</p>
                    </div>

                    {/* Direct App Buttons (Mobile Optimized) */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-12 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => openApp('gpay')}>
                            Google Pay
                        </Button>
                        <Button variant="outline" className="h-12 border-purple-200 text-purple-700 hover:bg-purple-50" onClick={() => openApp('phonepe')}>
                            PhonePe
                        </Button>
                        <Button variant="outline" className="h-12 border-sky-200 text-sky-700 hover:bg-sky-50" onClick={() => openApp('paytm')}>
                            Paytm
                        </Button>
                        <Button variant="outline" className="h-12 border-orange-200 text-orange-700 hover:bg-orange-50" onClick={() => openApp('bhim')}>
                            BHIM / Other
                        </Button>
                    </div>

                    {/* Manual Copy Section */}
                    <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg">
                        <span className="text-xs text-gray-500 font-mono flex-1 break-all">{MERCHANT_UPI}</span>
                        <Button size="sm" variant="ghost" onClick={handleCopyUPI}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>

                    <hr />

                    {/* Transaction ID Input */}
                    <div className="space-y-3">
                        <Label>Enter Transaction ID (UTR)</Label>
                        <Input 
                            placeholder="e.g. 3214xxxx5678" 
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                        />
                        <p className="text-xs text-red-500">* Payment ke baad UTR number dalna zaruri hai.</p>
                        
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

        {step === "verify" && (
            <Card className="text-center py-10">
                <CardContent>
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Request Submitted!</h2>
                    <p className="text-muted-foreground mb-6">
                        Admin will verify Transaction ID: <span className="font-mono text-black">{transactionId}</span>.
                        <br/>Course will be unlocked shortly.
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