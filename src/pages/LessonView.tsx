import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import PlyrPlayer from "@/components/video/PlyrPlayer";
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Lock, 
  Clock,
  BookOpen,
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Type definitions matching Supabase
interface Lesson {
  id: number;
  title: string;
  duration: string;
  video_url: string; // Supabase uses video_url
  is_free: boolean;  // Supabase uses is_free
  sequence_no: number;
}

const LessonView = () => {
  // Retrieve URL params: /lessons?courseId=XYZ
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
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Fetch Data & Check Access
  useEffect(() => {
    const initPage = async () => {
      if (!courseId) return;

      try {
        setLoading(true);

        // A. Get User
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);

        // B. Check Purchase Status (If user is logged in)
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
        
        // Set First Lesson
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

  // Logic: Can user watch this video?
  const canAccessLesson = (lesson: Lesson) => {
    return lesson.is_free || hasPurchased; // Admin is free logic can be added
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (canAccessLesson(lesson)) {
      setCurrentLesson(lesson);
    } else {
      toast.error("Please purchase the course to unlock this lesson");
      // Optional: Redirect to buy page
      navigate(`/buy-course?id=${courseId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return <div className="p-10 text-center">Course not found</div>;
  }

  // Calculate Progress (Dummy logic for now, real implementation needs 'completed_lessons' table)
  const completedCount = 0; 
  const progressPercent = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{course.title}</h1>
            <p className="text-xs text-primary-foreground/70">
              {lessons.length} Lessons
            </p>
          </div>
          
          {/* Buy Button if not purchased */}
          {!hasPurchased && (
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => navigate(`/buy-course?id=${courseId}`)}
            >
              Buy Now
            </Button>
          )}
        </div>
      </header>

      <div className="lg:flex">
        {/* Main Content - Video Player */}
        <main className="flex-1 p-4 lg:p-6">
          {/* Video Player */}
          <div className="mb-6 aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative">
            {currentLesson ? (
               <PlyrPlayer
                 videoId={currentLesson.video_url}
                 poster={course.image_url}
               />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-white">
                 Select a lesson to start
               </div>
            )}
            
            {/* Overlay if locked (Safety Check) */}
            {currentLesson && !canAccessLesson(currentLesson) && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 p-4 text-center">
                <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Lesson Locked</h3>
                <p className="text-gray-300 mb-4">Purchase this course to access all lessons.</p>
                <Button onClick={() => navigate(`/buy-course?id=${courseId}`)}>
                  Unlock Course
                </Button>
              </div>
            )}
          </div>

          {/* Lesson Info */}
          {currentLesson && (
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    {currentLesson.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {currentLesson.duration || "10 mins"}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      Grade {course.grade}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Course Progress */}
          {hasPurchased && (
            <div className="bg-card rounded-xl p-4 border mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Your Progress</span>
                <span className="text-sm text-muted-foreground">
                  0% Completed
                </span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
          )}

          {/* Mobile Playlist Toggle */}
          <div className="lg:hidden">
            <h3 className="text-lg font-semibold mb-4">All Lessons</h3>
            <LessonList
              lessons={lessons}
              currentLesson={currentLesson}
              hasPurchased={hasPurchased}
              onLessonClick={handleLessonClick}
            />
          </div>
        </main>

        {/* Sidebar - Desktop Playlist */}
        <aside className="hidden lg:block w-96 border-l bg-card h-[calc(100vh-60px)] sticky top-[60px]">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Course Content</h3>
              <p className="text-sm text-muted-foreground">
                {lessons.length} lessons
              </p>
            </div>
            <ScrollArea className="flex-1">
              <LessonList
                lessons={lessons}
                currentLesson={currentLesson}
                hasPurchased={hasPurchased}
                onLessonClick={handleLessonClick}
              />
            </ScrollArea>
          </div>
        </aside>
      </div>
    </div>
  );
};

// Sub-component for List
interface LessonListProps {
  lessons: Lesson[];
  currentLesson: Lesson | null;
  hasPurchased: boolean;
  onLessonClick: (lesson: Lesson) => void;
}

const LessonList = ({ lessons, currentLesson, hasPurchased, onLessonClick }: LessonListProps) => {
  return (
    <div className="divide-y">
      {lessons.length === 0 && (
         <div className="p-4 text-center text-sm text-muted-foreground">
           No lessons added yet.
         </div>
      )}
      
      {lessons.map((lesson) => {
        const isActive = currentLesson?.id === lesson.id;
        const canAccess = lesson.is_free || hasPurchased;

        return (
          <button
            key={lesson.id}
            onClick={() => onLessonClick(lesson)}
            className={cn(
              "w-full flex items-center gap-3 p-4 text-left transition-colors",
              isActive ? "bg-primary/10" : "hover:bg-muted",
              !canAccess && "opacity-70"
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : !canAccess
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/10 text-primary"
              )}
            >
              {!canAccess ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-medium truncate text-sm",
                  isActive ? "text-primary" : "text-foreground"
                )}
              >
                {lesson.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lesson.duration || "10m"}
                </span>
                {lesson.is_free && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                    FREE
                  </Badge>
                )}
              </div>
            </div>

            {isActive && <div className="w-1 h-8 bg-primary rounded-full absolute left-0" />}
          </button>
        );
      })}
    </div>
  );
};

export default LessonView;
