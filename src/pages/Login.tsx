import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // useLocation added
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn } from "lucide-react";
import logo from "@/assets/logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation(); // <--- Location Hook Add kiya

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error("Login Error:", error);
        toast.error(error.message);
      } else {
        toast.success("Welcome back!");
        
        // --- SMART REDIRECT LOGIC ---
        // Agar user Course khareedne aaya tha, to wapis wahi bhejo.
        // Nahi to Dashboard par bhejo.
        const destination = location.state?.from || "/dashboard";
        navigate(destination, { replace: true });
      }

    } catch (err: any) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="flex items-center gap-3 mb-8">
            <img src={logo} alt="Mahima Academy" className="h-12 w-12 rounded-xl" />
            <span className="font-bold text-2xl text-foreground">Mahima Academy</span>
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground mb-8">Sign in to access your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-border h-12"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="bg-background border-border h-12 pr-12"
                />
                <Button
                  type="button" variant="ghost" size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground gap-2" disabled={isLoading}>
              {isLoading ? "Signing in..." : <><LogIn className="h-5 w-5" /> Sign In</>}
            </Button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            Don't have an account? <Link to="/signup" className="text-primary font-medium hover:underline">Create account</Link>
          </p>
        </div>
      </div>
      
      {/* Right side decoration (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12">
        <div className="max-w-lg text-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">Empowering Young Minds</h2>
          <p className="text-primary-foreground/80 text-lg">Join Mahima Academy today.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;