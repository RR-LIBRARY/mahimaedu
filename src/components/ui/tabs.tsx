import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

// UI Components (aapke existing components)
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Aapka Tabs Component
import PlyrPlayer from "@/components/video/PlyrPlayer"; 

// Icons
import { 
  ArrowLeft, Play, Lock, Clock, BookOpen, 
  Loader2, FileText, MessageCircle, Share2, Star, CheckCircle, AlertCircle
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
  description?: string; 
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
  
  // Access Control State
  const [hasPurchased, setHasPurchased] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // --- 1. DATA FETCHING LOGIC (Bilkul Same - Connection nahi tutega) ---
  useEffect(() => {
    const initPage = async () => {
      if (!courseId) return;

      try {
        setLoading(true);

        // A. Get User
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);

        // B. Check Purchase Status
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

        // C. Fetch Course Details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();
        if (courseError) throw courseError;
        setCourse(courseData);

        // D. Fetch Lessons
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('sequence_no', { ascending: true });
        if (lessonError) throw lessonError;
        
        setLessons(lessonData || []);
        
        // Default to first lesson
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

  // Logic: Can user watch?
  const canAccessLesson = (lesson: Lesson) => {
    return lesson.is_free || hasPurchased;
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (canAccessLesson(lesson)) {
      setCurrentLesson(lesson);
      // Mobile me click karne par upar scroll karein
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error("This is a premium lesson. Please buy the course.");
      navigate(`/buy-course?id=${courseId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) return <div className="p-10 text-center">Course not found</div>;

  // Dummy Progress Calculation (Backend ready)
  const progressPercentage = lessons.length > 0 ? Math.round((1 / lessons.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      
      {/* --- HEADER --- */}
      <header className="bg-white border-b h-16 flex items-center px-4 lg:px-6 sticky top-0 z-40 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="mr-2">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Button>
        <div className="flex-1 overflow-hidden">
            <h1 className="text-sm lg:text-base font-bold text-gray-900 truncate">
                {course.title}
            </h1>
            <p className="text-xs text-muted-foreground hidden md:block">
               {lessons.length} Lessons • Grade {course.grade}
            </p>
        </div>
        
        {/* Buy Button (Agar nahi kharida) */}
        {!hasPurchased && (
            <Button size="sm" className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0"
            onClick={() => navigate(`/buy-course?id=${courseId}`)}>
                Buy Full Course
            </Button>
        )}
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        
        {/* --- LEFT: VIDEO PLAYER & TABS --- */}
        <main className="flex-1 overflow-y-auto bg-white lg:bg-gray-50/30 p-0 lg:p-6 no-scrollbar">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* 1. VIDEO PLAYER CONTAINER */}
                <div className="bg-black lg:rounded-xl overflow-hidden shadow-lg aspect-video relative group border-b lg:border-0">
                    {currentLesson ? (
                        <PlyrPlayer
                            videoId={currentLesson.video_url}
                            poster={course.image_url}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/50">Select a lesson</div>
                    )}

                    {/* LOCK OVERLAY (Jab user ne kharida na ho aur lesson free na ho) */}
                    {currentLesson && !canAccessLesson(currentLesson) && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 text-center p-6">
                            <div className="bg-white/10 p-3 rounded-full mb-3 ring-1 ring-white/20">
                                <Lock className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1">Premium Content</h2>
                            <p className="text-gray-300 text-sm mb-4 max-w-sm">
                                Unlock this lesson and {lessons.length - 1} more by enrolling in the course.
                            </p>
                            <Button className="font-semibold px-8"
                                onClick={() => navigate(`/buy-course?id=${courseId}`)}>
                                Unlock Now
                            </Button>
                        </div>
                    )}
                </div>

                {/* 2. LESSON INFO & TABS */}
                <div className="px-4 lg:px-0 pb-10">
                    <div className="flex flex-col gap-2 mb-6">
                        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                            {currentLesson?.title || "Introduction"}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" /> {currentLesson?.duration || "20m"}
                            </span>
                            <span className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> 4.9 (200 reviews)
                            </span>
                            <Button variant="ghost" size="sm" className="h-auto p-0 text-primary hover:bg-transparent">
                                <Share2 className="h-4 w-4 mr-1" /> Share
                            </Button>
                        </div>
                    </div>

                    {/* --- TABS IMPLEMENTATION (Using your component) --- */}
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] mb-6">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="notes">Notes</TabsTrigger>
                            <TabsTrigger value="doubts">Q&A</TabsTrigger>
                        </TabsList>
                        
                        {/* Tab 1: Overview */}
                        <TabsContent value="overview" className="space-y-4 animate-in fade-in-50">
                            <div className="bg-white p-6 rounded-xl border shadow-sm">
                                <h3 className="font-semibold text-lg mb-2">Description</h3>
                                <p className="text-muted-foreground leading-relaxed text-sm lg:text-base">
                                    {currentLesson?.description || "In this detailed lecture, we cover the core concepts required to master this topic. Ensure you have your notebook ready."}
                                </p>
                                
                                <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                        <CheckCircle className="h-4 w-4 text-primary" /> Learning Outcomes
                                    </h4>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-1">
                                        <li>Understand core definitions</li>
                                        <li>Solve real-world problems</li>
                                        <li>Master the basics of {course.title}</li>
                                    </ul>
                                </div>
                            </div>
                        </TabsContent>
                        
                        {/* Tab 2: Notes */}
                        <TabsContent value="notes" className="animate-in fade-in-50">
                            <div className="bg-white p-12 rounded-xl border shadow-sm flex flex-col items-center justify-center text-center">
                                <div className="bg-gray-100 p-4 rounded-full mb-3">
                                    <FileText className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="font-medium text-gray-900">Lecture Notes</h3>
                                <p className="text-sm text-gray-500 mt-1 max-w-xs">
                                    PDF notes for this chapter will be uploaded soon by the admin.
                                </p>
                            </div>
                        </TabsContent>

                        {/* Tab 3: Q&A */}
                        <TabsContent value="doubts" className="animate-in fade-in-50">
                             <div className="bg-white p-12 rounded-xl border shadow-sm flex flex-col items-center justify-center text-center">
                                <div className="bg-blue-50 p-4 rounded-full mb-3">
                                    <MessageCircle className="h-8 w-8 text-blue-500" />
                                </div>
                                <h3 className="font-medium text-gray-900">Discussion Forum</h3>
                                <p className="text-sm text-gray-500 mt-1 mb-4 max-w-xs">
                                    Stuck on a concept? Ask your doubt here.
                                </p>
                                <Button variant="outline">Ask a Doubt</Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </main>

        {/* --- RIGHT: SIDEBAR PLAYLIST --- */}
        <aside className="w-full lg:w-96 bg-white border-l flex flex-col h-[40vh] lg:h-auto z-30 shadow-inner lg:shadow-none">
            
            {/* Sidebar Header */}
            <div className="p-4 border-b bg-gray-50">
                <h3 className="font-bold text-gray-800 text-sm mb-3">Course Content</h3>
                <div className="space-y-1">
                     <div className="flex justify-between text-xs font-medium text-gray-500">
                        <span>{progressPercentage}% Completed</span>
                        <span>1/{lessons.length}</span>
                     </div>
                     <Progress value={progressPercentage} className="h-1.5" />
                </div>
            </div>

            {/* Lesson List */}
            <ScrollArea className="flex-1 bg-white">
                <div className="divide-y divide-gray-100 pb-20 lg:pb-0">
                    {lessons.map((lesson, index) => {
                        const isActive = currentLesson?.id === lesson.id;
                        const isLocked = !canAccessLesson(lesson);
                        
                        return (
                            <div 
                                key={lesson.id}
                                onClick={() => handleLessonClick(lesson)}
                                className={cn(
                                    "flex gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-all border-l-4",
                                    isActive ? "bg-blue-50/50 border-primary" : "border-transparent",
                                    isLocked ? "opacity-75" : ""
                                )}
                            >
                                {/* Icon Status */}
                                <div className="mt-1 flex-shrink-0">
                                    {isActive ? (
                                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-sm">
                                            <Play className="h-3 w-3 text-white ml-0.5 fill-current" />
                                        </div>
                                    ) : isLocked ? (
                                        <div className="h-6 w-6 flex items-center justify-center">
                                             <Lock className="h-4 w-4 text-gray-400" />
                                        </div>
                                    ) : (
                                        <div className="h-6 w-6 rounded-full border border-gray-300 flex items-center justify-center text-xs font-medium text-gray-500">
                                            {index + 1}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Text Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className={cn(
                                        "text-sm font-medium mb-1 truncate", 
                                        isActive ? "text-primary" : "text-gray-700"
                                    )}>
                                        {lesson.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {lesson.duration || "15m"}
                                        </span>
                                        {lesson.is_free && !hasPurchased && (
                                            <Badge variant="secondary" className="text-[10px] h-4 px-1 rounded-sm bg-green-100 text-green-700 hover:bg-green-100">
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