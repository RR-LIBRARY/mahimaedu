import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient"; // Direct Connection
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus, Loader2 } from "lucide-react"; // Added Loader2
import logo from "@/assets/logo.png";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"teacher" | "parent">("parent");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Basic Validations
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setIsLoading(true);

      // 2. Supabase Signup Call
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          // Ye data SQL Trigger pakad lega aur Profiles table me daal dega
          data: {
            full_name: name,
            role: role,
          },
        },
      });

      if (error) throw error;

      // 3. Success Handling
      if (data.user) {
        toast.success("Account created successfully!");
        
        // Agar aapne Supabase me 'Confirm Email' on rakha hai:
        if (data.session === null) {
           toast.info("Please check your email to confirm your account.");
           navigate("/login");
        } else {
           // Agar 'Confirm Email' off hai (Direct login):
           navigate("/dashboard");
        }
      }
      
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Image/Decoration */}
      <div className="hidden lg:flex flex-1 bg-secondary items-center justify-center p-12">
        <div className="max-w-lg text-center text-secondary-foreground">
          <div className="w-24 h-24 mx-auto mb-8 bg-secondary-foreground/20 rounded-3xl flex items-center justify-center">
            <img src={logo} alt="Mahima Academy" className="h-16 w-16 rounded-xl" />
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Start Your Journey
          </h2>
          <p className="text-secondary-foreground/80 text-lg">
            Create an account to access personalized learning experiences, track progress, and connect with our educational community.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={logo} alt="Mahima Academy" className="h-12 w-12 rounded-xl" />
            <span className="font-bold text-2xl text-foreground">Mahima Academy</span>
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground mb-8">
            Join Mahima Academy today
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background border-border h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-border h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background border-border h-12 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background border-border h-12"
              />
            </div>

            <div className="space-y-3">
              <Label>I am a</Label>
              <RadioGroup
                value={role}
                onValueChange={(value) => setRole(value as "teacher" | "parent")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="parent" id="parent" />
                  <Label htmlFor="parent" className="cursor-pointer font-normal">Parent</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="teacher" id="teacher" />
                  <Label htmlFor="teacher" className="cursor-pointer font-normal">Teacher</Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
