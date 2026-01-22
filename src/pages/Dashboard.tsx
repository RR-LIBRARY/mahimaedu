import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import ClassCard from "@/components/dashboard/ClassCard";
import FeatureCard from "@/components/dashboard/FeatureCard";
// Import CourseCard to show purchased courses
import CourseCard from "@/components/courses/CourseCard"; 
import { Button } from "@/components/ui/button"; // For "Browse Courses" button
import { 
  Users, 
  Calendar, 
  FileText, 
  ClipboardCheck, 
  BookOpen, 
  MessageCircle,
  GraduationCap,
  Bell,
  Loader2,
  ShoppingBag
} from "lucide-react";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // 1. State for Real Data
  const [profile, setProfile] = useState<any>(null);
  const [myCourses, setMyCourses] = useState<any[]>([]); // New State for Students
  const [loading, setLoading] = useState(true);

  // 2. Fetch Data (Profile + Courses if Parent)
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // A. Get User
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          navigate("/login");
          return;
        }

        // B. Get Profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // C. SMART LOGIC: If Parent/Student, fetch Enrolled Courses
        if (profileData.role === 'parent' || profileData.role === 'student') {
          
          // Enrollments table se data lao aur saath me Course ki details bhi (Join)
          const { data: enrollmentData, error: enrollError } = await supabase
            .from('enrollments')
            .select(`
              course_id,
              courses ( * ) 
            `)
            .eq('user_id', user.id)
            .eq('status', 'active'); // Sirf active courses dikhao

          if (enrollError) {
            console.error("Error fetching enrollments:", enrollError);
          } else if (enrollmentData) {
            // Data ko clean karo (Flatten structure)
            const formattedCourses = enrollmentData.map((item: any) => item.courses);
            setMyCourses(formattedCourses);
          }
        }

      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // Static Data for Teachers
  const teacherFeatures = [
    { icon: ClipboardCheck, label: "Attendance", color: "primary" as const, path: "/attendance" },
    { icon: FileText, label: "Report Card", color: "secondary" as const, path: "/reports" },
    { icon: Users, label: "Students", color: "success" as const, path: "/students" },
    { icon: Calendar, label: "Timetable", color: "accent" as const, path: "/timetable" },
  ];

  // Static Data for Parents (Different Actions)
  const parentFeatures = [
    { icon: Bell, label: "Notices", color: "primary" as const, path: "/notices" },
    { icon: MessageCircle, label: "Chat with Teacher", color: "secondary" as const, path: "/messages" },
    { icon: FileText, label: "Results", color: "success" as const, path: "/reports" },
    { icon: ShoppingBag, label: "Buy New Course", color: "accent" as const, path: "/courses" },
  ];

  const gradeOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Determine if user is Teacher
  const isTeacher = profile?.role === 'teacher';
  const displayFeatures = isTeacher ? teacherFeatures : parentFeatures;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <Header 
        onMenuClick={() => setSidebarOpen(true)} 
        userName={profile?.full_name || "User"} 
      />

      <main className="flex-1 overflow-y-auto pb-6">
        {/* Greeting Section */}
        <section className="px-5 py-6">
          <p className="text-muted-foreground text-sm">Good Morning,</p>
          <h1 className="text-2xl font-bold text-foreground mt-1">
            {profile?.full_name || "User"}
          </h1>
          <p className="text-xs text-primary font-medium mt-1 uppercase tracking-wide">
            {profile?.role || "Member"} Dashboard
          </p>
        </section>

        {/* --- SMART LOGIC RENDERING --- */}
        
        {isTeacher ? (
          /* === TEACHER VIEW: Select Class === */
          <section className="px-5">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Select Class (Attendance)</h2>
            <div className="grid grid-cols-2 gap-4">
              {gradeOptions.map((grade, index) => (
                <ClassCard
                  key={grade}
                  grade={grade}
                  onClick={() => navigate(`/attendance?grade=${grade}`)}
                  variant={index === gradeOptions.length - 1 ? "featured" : "default"}
                />
              ))}
            </div>
          </section>
        ) : (
          /* === PARENT VIEW: My Courses === */
          <section className="px-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-medium text-muted-foreground">My Enrolled Courses</h2>
              <Button variant="link" className="text-primary text-xs p-0" onClick={() => navigate('/courses')}>
                Browse All
              </Button>
            </div>

            {myCourses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myCourses.map((course) => (
                  <CourseCard 
                    key={course.id} 
                    course={course}
                    // Click karne par Lesson View par bhejein (Future Step)
                    onClick={() => navigate(`/lessons?courseId=${course.id}`)} 
                  />
                ))}
              </div>
            ) : (
              // Empty State for Parent
              <div className="text-center py-8 border-2 border-dashed rounded-xl bg-muted/30">
                <p className="text-muted-foreground mb-3">You haven't enrolled in any courses yet.</p>
                <Button onClick={() => navigate('/courses')}>Explore Courses</Button>
              </div>
            )}
          </section>
        )}

        {/* Features Grid (Different for Teacher vs Parent) */}
        <section className="px-5 mt-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {displayFeatures.map((feature) => (
              <FeatureCard
                key={feature.label}
                icon={feature.icon}
                label={feature.label}
                color={feature.color}
                onClick={() => navigate(feature.path)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
