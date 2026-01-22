import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient"; // Ensure this path is correct
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { 
  PlayCircle, BookOpen, Flame, Zap, 
  ClipboardCheck, FileText, Users, Calendar, 
  Bell, MessageCircle, ShoppingBag 
} from "lucide-react";

// --- Types for TypeScript Safety ---
interface Profile {
  id: string;
  full_name: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
}

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // --- State Management ---
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. Dynamic Greeting Logic ---
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // --- 2. Data Fetching (Supabase) ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // A. Get Current User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }

        // B. Get Profile Details
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // C. If Student/Parent -> Fetch Enrolled Courses
        if (profileData.role === 'student' || profileData.role === 'parent') {
          const { data: enrollmentData, error: enrollError } = await supabase
            .from('enrollments')
            .select(`
              course_id,
              courses ( * )
            `)
            .eq('user_id', user.id)
            .eq('status', 'active'); // Only active courses

          if (!enrollError && enrollmentData) {
            // Flatten the data structure
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

  // --- Helper: Teacher vs Student Features ---
  const teacherFeatures = [
    { icon: ClipboardCheck, label: "Attendance", color: "text-blue-600 bg-blue-100", path: "/attendance" },
    { icon: FileText, label: "Report Card", color: "text-purple-600 bg-purple-100", path: "/reports" },
    { icon: Users, label: "Students", color: "text-green-600 bg-green-100", path: "/students" },
    { icon: Calendar, label: "Timetable", color: "text-orange-600 bg-orange-100", path: "/timetable" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="mt-2 text-gray-500 font-medium">Loading your academy...</p>
      </div>
    );
  }

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin';
  const userName = profile?.full_name?.split(' ')[0] || "Scholar";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Header linked to Sidebar toggle */}
      <Header 
        onMenuClick={() => setSidebarOpen(true)} 
        userName={profile?.full_name || "User"} 
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* =========================================
            HERO SECTION (Common for All) 
            "PhysicsWallah / Premium Style"
           ========================================= */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-xl">
            <div className="relative z-10 p-6 md:p-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        {/* Streak Badge (Only for Students) */}
                        {!isTeacher && (
                          <div className="flex items-center gap-2 mb-2 bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                              <Flame className="h-3 w-3 text-yellow-300 fill-yellow-300" />
                              <span>Keep learning, you're doing great!</span>
                          </div>
                        )}
                        
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">
                            {getGreeting()}, {userName}! 🚀
                        </h1>
                        <p className="text-white/90 text-lg max-w-xl">
                            {isTeacher 
                              ? "Ready to inspire the next generation today?" 
                              : "Education is the passport to the future."}
                        </p>
                    </div>
                    
                    {/* Stats Box */}
                    <div className="flex gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 min-w-[200px]">
                        <div className="text-center px-2 flex-1">
                            <p className="text-2xl font-bold">{isTeacher ? "5" : myCourses.length}</p>
                            <p className="text-xs text-white/70">{isTeacher ? "Classes" : "Courses"}</p>
                        </div>
                        <div className="w-px bg-white/20"></div>
                        <div className="text-center px-2 flex-1">
                            <p className="text-2xl font-bold">{isTeacher ? "120" : "85%"}</p>
                            <p className="text-xs text-white/70">{isTeacher ? "Students" : "Avg Score"}</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Abstract Background Decoration */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        </div>

        {/* =========================================
            CONDITIONAL RENDERING BASED ON ROLE
           ========================================= */}

        {isTeacher ? (
          /* ---------------- TEACHER / ADMIN VIEW ---------------- */
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {teacherFeatures.map((feature, idx) => (
                <div 
                  key={idx} 
                  onClick={() => navigate(feature.path)}
                  className="bg-white p-6 rounded-xl border hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-center group"
                >
                  <div className={`p-3 rounded-full ${feature.color} group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <span className="font-semibold text-gray-700">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ---------------- STUDENT / PARENT VIEW ---------------- */
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: Learning Content */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* 1. RESUME LEARNING (Netflix Style) */}
                {myCourses.length > 0 ? (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                                <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                Resume Learning
                            </h2>
                        </div>
                        
                        {/* We use the FIRST enrolled course as the 'Resume' target */}
                        <div 
                             className="bg-white border rounded-xl p-4 flex flex-col md:flex-row gap-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                             onClick={() => navigate(`/lesson/${myCourses[0].id}`)} // Link to Lesson Page
                        >
                             <div className="w-full md:w-48 h-32 bg-gray-200 rounded-lg relative overflow-hidden flex-shrink-0">
                                <img 
                                  src={myCourses[0].image_url || "https://via.placeholder.com/300"} 
                                  alt={myCourses[0].title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <PlayCircle className="h-10 w-10 text-white" />
                                </div>
                             </div>

                             <div className="flex-1 flex flex-col justify-center">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                                      Class {myCourses[0].grade || "General"}
                                    </Badge>
                                    <span className="text-xs text-gray-500 font-medium">Continue where you left</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{myCourses[0].title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                                  {myCourses[0].description || "Keep pushing your limits!"}
                                </p>
                                
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-semibold text-gray-600">
                                        <span>Course Progress (Mock)</span>
                                        <span>35%</span>
                                    </div>
                                    <Progress value={35} className="h-2" />
                                </div>
                             </div>
                        </div>
                    </section>
                ) : (
                    // Empty State
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-10 text-center">
                        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="font-bold text-lg text-gray-800">No active courses found</h3>
                        <p className="text-gray-500 mb-4">Enroll in a course to start your journey.</p>
                        <Button onClick={() => navigate('/courses')}>Browse Courses</Button>
                    </div>
                )}

                {/* 2. MY BATCHES GRID */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800">My Batches</h2>
                      <Button variant="link" onClick={() => navigate('/courses')}>View All</Button>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                        {myCourses.map((course) => (
                            <Card key={course.id} className="hover:border-indigo-500/50 transition-all cursor-pointer overflow-hidden" onClick={() => navigate(`/lesson/${course.id}`)}>
                                <div className="h-32 bg-gray-100 relative">
                                  <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-4">
                                  <h3 className="font-bold text-lg mb-1 line-clamp-1">{course.title}</h3>
                                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{course.description}</p>
                                  <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    <PlayCircle className="h-4 w-4 mr-2" /> Start Learning
                                  </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>

            {/* RIGHT COLUMN: Extras (Notice/Ads) */}
            <div className="space-y-6">
               
               {/* Explore More Card */}
               <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none">
                 <div className="p-6">
                   <ShoppingBag className="h-8 w-8 text-yellow-400 mb-4" />
                   <h3 className="text-lg font-bold mb-2">Unlock Premium</h3>
                   <p className="text-sm text-gray-300 mb-4">Get access to live doubts, mock tests, and mentorship.</p>
                   <Button variant="secondary" className="w-full bg-yellow-400 text-black hover:bg-yellow-500">Explore Plans</Button>
                 </div>
               </Card>

               {/* Notice Board */}
               <Card>
                 <div className="p-4 border-b flex items-center gap-2">
                   <Bell className="h-5 w-5 text-indigo-600" />
                   <h3 className="font-bold">Notice Board</h3>
                 </div>
                 <div className="p-4 space-y-4">
                   <div className="flex gap-3 items-start">
                     <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                     <div>
                       <p className="text-sm font-medium">Physics Exam Date Out!</p>
                       <p className="text-xs text-gray-500">Scheduled for next Monday.</p>
                     </div>
                   </div>
                   <div className="flex gap-3 items-start">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                     <div>
                       <p className="text-sm font-medium">New Course Added</p>
                       <p className="text-xs text-gray-500">Introduction to Python is now live.</p>
                     </div>
                   </div>
                 </div>
               </Card>

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;