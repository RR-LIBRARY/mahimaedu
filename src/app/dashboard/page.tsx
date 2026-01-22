"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ Fixed for Next.js
import { supabase } from "@/supabaseClient"; // ✅ Path adjusted
// Ensure these components exist or remove/replace them with simple divs for testing
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  PlayCircle, BookOpen, Flame, Zap, 
  ClipboardCheck, FileText, Users, Calendar, 
  Bell, ShoppingBag, Menu, X 
} from "lucide-react";

// --- Types for TypeScript Safety ---
interface Profile {
  id: string;
  full_name: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
}

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter(); // ✅ Used router instead of navigate

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
        if (!user) { 
            router.push("/login"); // ✅ Redirect using Next.js router
            return; 
        }

        // B. Get Profile Details
        // Note: Agar profile table nahi hai, to hum dummy data use karenge error bachane ke liye
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
            setProfile(profileData);
        } else {
            // Fallback if no profile found (Testing mode)
            setProfile({ id: user.id, full_name: "Student", role: "student" });
        }

        // C. Fetch Lessons (Previously uploaded by Admin)
        // Hum yahan 'lessons' table use karenge jo humne pichle step me banayi thi
        const { data: lessonsData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .limit(5); // Show top 5 lessons

        if (lessonsData) {
            setMyCourses(lessonsData);
        }

      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

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
        <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        <p className="mt-2 text-gray-500 font-medium">Loading Mahima Academy...</p>
      </div>
    );
  }

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin';
  const userName = profile?.full_name?.split(' ')[0] || "Scholar";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Mobile Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-50">
         <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X /> : <Menu />}
            </Button>
            <span className="font-bold text-xl text-indigo-700">Mahima Academy</span>
         </div>
         <div className="flex items-center gap-3">
             <Bell className="h-5 w-5 text-gray-600" />
             <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                 {userName[0]}
             </div>
         </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-xl">
            <div className="relative z-10 p-6 md:p-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
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
                            {isTeacher ? "Ready to inspire?" : "Your future starts here."}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* CONTENT SECTION */}
        <div className="grid lg:grid-cols-3 gap-8">
            
            {/* LEFT: Lessons List */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Resume Learning (Latest Lesson) */}
                {myCourses.length > 0 ? (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                                <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                Latest Class
                            </h2>
                        </div>
                        
                        <div 
                             className="bg-white border rounded-xl p-4 flex flex-col md:flex-row gap-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                             onClick={() => router.push(`/lesson/${myCourses[0].id}`)} 
                        >
                             <div className="w-full md:w-48 h-32 bg-gray-900 rounded-lg relative overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {/* Thumbnail Placeholder since we don't have images yet */}
                                <PlayCircle className="h-12 w-12 text-white group-hover:scale-110 transition-transform" />
                             </div>

                             <div className="flex-1 flex flex-col justify-center">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{myCourses[0].title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                                  {myCourses[0].description || "Click to start watching this class."}
                                </p>
                                <Button size="sm" className="w-fit bg-indigo-600">Resume Class</Button>
                             </div>
                        </div>
                    </section>
                ) : (
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-10 text-center">
                        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="font-bold text-lg text-gray-800">No classes uploaded yet</h3>
                        <p className="text-gray-500 mb-4">Wait for Admin to upload classes.</p>
                    </div>
                )}

                {/* All Classes Grid */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800">Recent Classes</h2>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                        {myCourses.map((course) => (
                            <Card key={course.id} className="hover:border-indigo-500/50 transition-all cursor-pointer overflow-hidden p-0" onClick={() => router.push(`/lesson/${course.id}`)}>
                                <div className="h-32 bg-gray-800 relative flex items-center justify-center text-white">
                                  <PlayCircle className="h-10 w-10 opacity-80" />
                                </div>
                                <div className="p-4">
                                  <h3 className="font-bold text-lg mb-1 line-clamp-1">{course.title}</h3>
                                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{course.description}</p>
                                  <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    Start Learning
                                  </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>

            {/* RIGHT: Extras */}
            <div className="space-y-6">
               <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none">
                 <div className="p-6">
                   <ShoppingBag className="h-8 w-8 text-yellow-400 mb-4" />
                   <h3 className="text-lg font-bold mb-2">Mahima Academy Pro</h3>
                   <p className="text-sm text-gray-300 mb-4">Get access to PDF notes and exclusive content.</p>
                   <Button variant="secondary" className="w-full bg-yellow-400 text-black hover:bg-yellow-500">Upgrade</Button>
                 </div>
               </Card>
            </div>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;