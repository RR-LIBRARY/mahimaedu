import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import PlyrPlayer from "@/components/video/PlyrPlayer"; // Ensure this path is correct
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Play, Lock, Clock, BookOpen, 
  Loader2, FileText, MessageCircle, Share2, Star, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Type definitions
interface Lesson {
  id: number;
  title: string;
  duration: string;
  video_url: string;
  is_free: boolean;
  sequence_no: number;
  description?: string; // Added for Overview tab
}

const LessonView = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId"); 
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  
  // Access Control
  const [hasPurchased, setHasPurchased] = useState(false);
  
  // Tabs State (Student Experience)
  const [activeTab, setActiveTab] = useState("overview");

  // --- 1. DATA FETCHING (Keep exact logic to maintain connection) ---
  useEffect(() => {
    const initPage = async () => {
      if (!courseId) return;

      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        // Check Purchase
        if (user) {
          const { data: enrollment } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .eq('status', 'active')
            .single();

          if (enrollment) setHasPurchased(true);
        }

        // Fetch Course
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();
        if (courseError) throw courseError;
        setCourse(courseData);

        // Fetch Lessons
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('sequence_no', { ascending: true });
        if (lessonError) throw lessonError;
        
        setLessons(lessonData || []);
        
        if (lessonData && lessonData.length > 0) {
          setCurrentLesson(lessonData[0]);
        }

      } catch (error) {
        console.error("Error loading lessons:", error);
        toast.error("Could not load course content");
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [courseId]);

  // --- Logic ---
  const canAccessLesson = (lesson: Lesson) => {
    return lesson.is_free || hasPurchased;
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (canAccessLesson(lesson)) {
      setCurrentLesson(lesson);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error("Course locked! Please buy to watch.");
      navigate(`/buy-course?id=${courseId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!course) return <div className="p-10 text-center">Course not found</div>;

  // Calculate Progress Logic
  const completedLessons = 1; // Backend se aana chahiye, abhi dummy hai
  const progressPercentage = Math.round((completedLessons / lessons.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* --- HEADER (Clean & Minimal) --- */}
      <header className="bg-white border-b h-16 flex items-center px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="mr-2">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Button>
        <div className="flex-1">
            <h1 className="text-sm lg:text-base font-bold text-gray-800 line-clamp-1">
                {course.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Class {course.grade}</span>
                <span>• {lessons.length} Lessons</span>
            </div>
        </div>
        {!hasPurchased && (
            <Button size="sm" className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-md"
            onClick={() => navigate(`/buy-course?id=${courseId}`)}>
                Buy Now
            </Button>
        )}
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        
        {/* --- LEFT: VIDEO PLAYER & TABS (Cinema Area) --- */}
        <main className="flex-1 overflow-y-auto bg-white lg:bg-gray-100 p-0 lg:p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* VIDEO CONTAINER */}
                <div className="bg-black lg:rounded-2xl overflow-hidden shadow-2xl aspect-video relative group">
                    {currentLesson ? (
                        <PlyrPlayer
                            videoId={currentLesson.video_url}
                            poster={course.image_url}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/50">Select a lesson</div>
                    )}

                    {/* Locked Overlay */}
                    {currentLesson && !canAccessLesson(currentLesson) && (
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 text-center p-6">
                            <div className="bg-white/10 p-4 rounded-full mb-4">
                                <Lock className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Content Locked</h2>
                            <p className="text-gray-300 mb-6 max-w-md">
                                This premium lesson is part of the full course. Unlock instant access to all {lessons.length} lessons.
                            </p>
                            <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-bold px-8"
                                onClick={() => navigate(`/buy-course?id=${courseId}`)}>
                                Unlock Full Course
                            </Button>
                        </div>
                    )}
                </div>

                {/* INFO & TABS (PW Style) */}
                <div className="px-4 lg:px-0 pb-10">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                                {currentLesson?.title || "Course Introduction"}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {currentLesson?.duration || "25m"}</span>
                                <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> 4.8 Rating</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Share2 className="h-4 w-4" /> Share
                            </Button>
                        </div>
                    </div>

                    {/* TABS COMPONENT */}
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] mb-6">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="notes">Notes & PDF</TabsTrigger>
                            <TabsTrigger value="doubts">Q&A</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="overview" className="bg-white p-6 rounded-xl border shadow-sm">
                            <h3 className="font-semibold text-lg mb-3">About this lesson</h3>
                            <p className="text-gray-600 leading-relaxed">
                                {currentLesson?.description || "In this lesson, we will cover the fundamental concepts needed to master this topic. Make sure to watch the full video and take notes."}
                            </p>
                            <div className="mt-6 flex items-center gap-3 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-100">
                                <CheckCircle className="h-5 w-5" />
                                <div className="text-sm font-medium">You will learn: Basic definitions, Real-world examples, and Problem solving.</div>
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="notes" className="bg-white p-10 rounded-xl border shadow-sm text-center">
                            <div className="flex flex-col items-center gap-3">
                                <FileText className="h-12 w-12 text-gray-300" />
                                <h3 className="font-medium text-gray-900">No Notes Available</h3>
                                <p className="text-sm text-gray-500">The instructor hasn't uploaded notes for this lesson yet.</p>
                            </div>
                        </TabsContent>

                        <TabsContent value="doubts" className="bg-white p-10 rounded-xl border shadow-sm text-center">
                            <div className="flex flex-col items-center gap-3">
                                <MessageCircle className="h-12 w-12 text-gray-300" />
                                <h3 className="font-medium text-gray-900">Have a doubt?</h3>
                                <p className="text-sm text-gray-500 mb-4">Post your question and get answers from instructors and peers.</p>
                                <Button variant="outline">Ask a Question</Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </main>

        {/* --- RIGHT: SIDEBAR PLAYLIST (Udemy Style) --- */}
        <aside className="w-full lg:w-96 bg-white border-l flex flex-col h-[50vh] lg:h-auto">
            <div className="p-4 border-b bg-gray-50/50">
                <h3 className="font-bold text-gray-800 mb-2">Course Content</h3>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>{progressPercentage}% Completed</span>
                    <span>{completedLessons}/{lessons.length}</span>
                </div>
                <Progress value={progressPercentage} className="h-2 bg-gray-200" />
            </div>

            <ScrollArea className="flex-1">
                <div className="divide-y divide-gray-100">
                    {lessons.map((lesson, index) => {
                        const isActive = currentLesson?.id === lesson.id;
                        const isLocked = !canAccessLesson(lesson);
                        
                        return (
                            <div 
                                key={lesson.id}
                                onClick={() => handleLessonClick(lesson)}
                                className={cn(
                                    "flex gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-all border-l-4",
                                    isActive ? "bg-indigo-50 border-indigo-600" : "border-transparent",
                                    isLocked && "opacity-60 bg-gray-50/50"
                                )}
                            >
                                <div className="mt-1">
                                    {isActive ? (
                                        <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center animate-pulse">
                                            <Play className="h-3 w-3 text-white fill-white" />
                                        </div>
                                    ) : isLocked ? (
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <div className="h-6 w-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-medium text-gray-500">
                                            {index + 1}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1">
                                    <h4 className={cn("text-sm font-medium mb-1", isActive ? "text-indigo-700" : "text-gray-700")}>
                                        {lesson.title}
                                    </h4>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {lesson.duration || "15m"}
                                        </span>
                                        {lesson.is_free && !hasPurchased && (
                                            <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-green-100 text-green-700 border-green-200">
                                                FREE
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </aside>

      </div>
    </div>
  );
};

export default LessonView;