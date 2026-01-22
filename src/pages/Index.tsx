import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "../supabaseClient"; // Supabase Connected

// Components
import Hero, { HeroData } from "@/components/Landing/Hero"; // Type import kiya
import Features from "@/components/Landing/Features";
import LeadForm from "@/components/Landing/LeadForm";
import Footer from "@/components/Landing/Footer";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Index = () => {
  const { isAuthenticated } = useAuth();

  // 1. State banaya data store karne ke liye
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Data Fetching Logic (Page load hone par)
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('landing_content')
          .select('section_key, content');

        if (error) throw error;

        if (data) {
          // Hero ka data nikal kar state mein set kiya
          const heroSection = data.find(item => item.section_key === 'hero');
          if (heroSection) {
            setHeroData(heroSection.content as HeroData);
          }
        }
      } catch (error) {
        console.error("Error loading content:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  // Loading Screen (Optional)
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation (Same as backup) */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Mahima Academy" className="h-10 w-10 rounded-xl" />
            <span className="font-bold text-xl text-foreground hidden sm:inline">
              Mahima Academy
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/courses">
              <Button variant="ghost" className="text-foreground hover:bg-muted">
                Courses
              </Button>
            </Link>
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-foreground hover:bg-muted">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="pt-20">
        {/* 3. Hero Component ko data pass kiya */}
        <Hero data={heroData} />
        
        <Features />
        
        {/* LeadForm ab khud database se baat karega */}
        <LeadForm />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
