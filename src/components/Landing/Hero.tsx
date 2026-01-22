import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

// 1. Data Structure Define kiya
export interface HeroData {
  title: string;
  subtitle: string;
  cta_text: string;
}

interface HeroProps {
  data: HeroData | null; // Data parent se aayega
}

// 2. Props receive kiye
const Hero = ({ data }: HeroProps) => {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>For Grades 1-5</span>
            </div>

            {/* 3. Dynamic Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              {data?.title || "Learning Made Fun & Easy"}
            </h1>

            {/* 4. Dynamic Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0">
              {data?.subtitle || "Join Mahima Academy for world-class education."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground gap-2">
                  {data?.cta_text || "Get Started"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            {/* Stats (Static rakha hai) */}
            <div className="flex items-center justify-center lg:justify-start gap-8 pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">500+</div>
                <div className="text-sm text-muted-foreground">Students</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">50+</div>
                <div className="text-sm text-muted-foreground">Courses</div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img src={heroImage} alt="Learning" className="w-full h-auto" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
