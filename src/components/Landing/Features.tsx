import { BookOpen, Video, Users, Award, Calendar, MessageCircle } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Interactive Courses",
    description: "Engaging curriculum designed for young minds with games and activities",
    color: "primary" as const,
  },
  {
    icon: Video,
    title: "Video Lessons",
    description: "High-quality recorded lessons students can watch anytime, anywhere",
    color: "secondary" as const,
  },
  {
    icon: Users,
    title: "Expert Teachers",
    description: "Experienced educators who make learning fun and memorable",
    color: "accent" as const,
  },
  {
    icon: Calendar,
    title: "Attendance Tracking",
    description: "Keep track of your child's attendance and participation",
    color: "success" as const,
  },
  {
    icon: Award,
    title: "Progress Reports",
    description: "Detailed monthly reports to track your child's growth",
    color: "primary" as const,
  },
  {
    icon: MessageCircle,
    title: "Parent Communication",
    description: "Stay connected with teachers through our messaging system",
    color: "secondary" as const,
  },
];

const colorClasses = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
};

const Features = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything Your Child Needs
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete learning platform designed to nurture curiosity and build strong foundations
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card p-6 rounded-2xl border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-xl ${colorClasses[feature.color]} flex items-center justify-center mb-4`}>
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
