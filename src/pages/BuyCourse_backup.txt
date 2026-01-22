import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { courses } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  BookOpen,
  Shield,
  Copy,
  Upload,
  Loader2,
} from "lucide-react";

// UPI Payment details - in production these would come from backend
const UPI_ID = "mahimaacademy@upi";
const COURSE_PRICE = 499;

const BuyCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [step, setStep] = useState<"details" | "payment" | "verify">("details");
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const course = useMemo(
    () => courses.find((c) => c.id === Number(courseId)) || courses[0],
    [courseId]
  );

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    toast.success("UPI ID copied!");
  };

  const handlePaymentSubmit = async () => {
    if (!transactionId.trim()) {
      toast.error("Please enter your UPI Transaction ID");
      return;
    }

    if (!isAuthenticated) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    
    // In production: Insert into payment_requests table in Supabase
    // await supabase.from('payment_requests').insert({
    //   user_id: user.id,
    //   course_id: courseId,
    //   transaction_id: transactionId,
    //   amount: COURSE_PRICE,
    //   status: 'pending'
    // });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast.success("Payment submitted for verification! You'll get access within 24 hours.");
    setStep("verify");
    setIsSubmitting(false);
  };

  const benefits = [
    "Lifetime access to all lessons",
    "Downloadable study materials",
    "Practice worksheets & quizzes",
    "Certificate of completion",
    "Doubt clearing support",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Buy Course</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 pb-8">
        {/* Course Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="relative h-40">
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <Badge className="mb-2">Grade {course.grade}</Badge>
              <h2 className="text-xl font-bold text-white">{course.title}</h2>
            </div>
          </div>
          <CardContent className="p-4">
            <p className="text-muted-foreground mb-4">{course.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />6 Lessons
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />2 Hours
              </span>
            </div>
          </CardContent>
        </Card>

        {step === "details" && (
          <>
            {/* Benefits */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">What you'll get</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Price & CTA */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Course Price</p>
                    <p className="text-3xl font-bold text-primary">₹{COURSE_PRICE}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Secure Payment
                  </Badge>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error("Please login first");
                      navigate("/login");
                      return;
                    }
                    setStep("payment");
                  }}
                >
                  Proceed to Payment
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {step === "payment" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Complete Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* UPI Details */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Pay ₹{COURSE_PRICE} to this UPI ID:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background px-3 py-2 rounded border font-mono text-lg">
                    {UPI_ID}
                  </code>
                  <Button size="icon" variant="outline" onClick={handleCopyUPI}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* QR Code Placeholder */}
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                  <p className="text-sm text-muted-foreground text-center px-4">
                    QR Code will appear here
                  </p>
                </div>
              </div>

              {/* Transaction ID */}
              <div className="space-y-2">
                <Label htmlFor="txnId">UPI Transaction ID / Reference Number</Label>
                <Input
                  id="txnId"
                  placeholder="Enter 12-digit transaction ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  After payment, enter the UPI reference number from your payment app
                </p>
              </div>

              {/* Submit */}
              <Button
                className="w-full"
                size="lg"
                onClick={handlePaymentSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Payment Details
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setStep("details")}
              >
                Back
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "verify" && (
          <Card className="text-center">
            <CardContent className="py-8">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-bold mb-2">Payment Submitted!</h3>
              <p className="text-muted-foreground mb-6">
                Your payment is being verified. You'll get course access within 24 hours.
                We'll notify you via email.
              </p>
              <Button onClick={() => navigate("/dashboard")}>
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
