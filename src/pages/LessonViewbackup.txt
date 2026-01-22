import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import PlyrPlayer from "@/components/video/PlyrPlayer";
import { courses } from "@/data/mockData";
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Lock, 
  Clock,
  BookOpen,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock lessons data - in production this would come from Supabase
const mockLessons = [
  {
    id: 1,
    title: "Introduction to Numbers",
    duration: "8:30",
    videoId: "dQw4w9WgXcQ", // Replace with actual unlisted video IDs
    isCompleted: true,
    isFree: true,
  },
  {
    id: 2,
    title: "Counting 1 to 10",
    duration: "12:45",
    videoId: "9bZkp7q19f0",
    isCompleted: true,
    isFree: true,
  },
  {
    id: 3,
    title: "Addition Basics",
    duration: "15:20",
    videoId: "kJQP7kiw5Fk",
    isCompleted: false,
    isFree: false,
  },
  {
    id: 4,
    title: "Subtraction Made Easy",
    duration: "14:10",
    videoId: "RgKAFK5djSk",
    isCompleted: false,
    isFree: false,
  },
  {
    id: 5,
    title: "Practice Problems",
    duration: "20:00",
    videoId: "JGwWNGJdvx8",
    isCompleted: false,
    isFree: false,
  },
  {
    id: 6,
    title: "Quiz & Review",
    duration: "10:15",
    videoId: "fJ9rUzIMcZQ",
    isCompleted: false,
    isFree: false,
  },
];

const LessonView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [currentLessonId, setCurrentLessonId] = useState(1);
  const [hasPurchased] = useState(false); // This would come from Supabase purchases table

  const course = useMemo(() => 
    courses.find((c) => c.id === Number(courseId)) || courses[0],
    [courseId]
  );

  const currentLesson = useMemo(() => 
    mockLessons.find((l) => l.id === currentLessonId) || mockLessons[0],
    [currentLessonId]
  );

  const completedCount = mockLessons.filter((l) => l.isCompleted).length;
  const progressPercent = (completedCount / mockLessons.length) * 100;

  const canAccessLesson = (lesson: typeof mockLessons[0]) => {
    return lesson.isFree || hasPurchased;
  };

  const handleLessonClick = (lesson: typeof mockLessons[0]) => {
    if (canAccessLesson(lesson)) {
      setCurrentLessonId(lesson.id);
    } else {
      navigate(`/courses/${courseId}/buy`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/courses")}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{course.title}</h1>
            <p className="text-xs text-primary-foreground/70">
              Lesson {currentLessonId} of {mockLessons.length}
            </p>
          </div>
        </div>
      </header>

      <div className="lg:flex">
        {/* Main Content - Video Player */}
        <main className="flex-1 p-4 lg:p-6">
          {/* Video Player */}
          <div className="mb-6">
            <PlyrPlayer
              videoId={currentLesson.videoId}
              poster={course.thumbnailUrl}
            />
          </div>

          {/* Lesson Info */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {currentLesson.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {currentLesson.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    Grade {course.grade}
                  </span>
                </div>
              </div>
              {currentLesson.isCompleted && (
                <Badge className="bg-success text-success-foreground">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </div>

          {/* Course Progress */}
          <div className="bg-card rounded-xl p-4 border mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Course Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedCount}/{mockLessons.length} lessons
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Mobile Playlist Toggle */}
          <div className="lg:hidden">
            <h3 className="text-lg font-semibold mb-4">All Lessons</h3>
            <LessonList
              lessons={mockLessons}
              currentLessonId={currentLessonId}
              hasPurchased={hasPurchased}
              onLessonClick={handleLessonClick}
            />
          </div>
        </main>

        {/* Sidebar - Desktop Playlist */}
        <aside className="hidden lg:block w-96 border-l bg-card">
          <div className="sticky top-[60px]">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Course Content</h3>
              <p className="text-sm text-muted-foreground">
                {mockLessons.length} lessons • {completedCount} completed
              </p>
            </div>
            <ScrollArea className="h-[calc(100vh-140px)]">
              <LessonList
                lessons={mockLessons}
                currentLessonId={currentLessonId}
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

interface LessonListProps {
  lessons: typeof mockLessons;
  currentLessonId: number;
  hasPurchased: boolean;
  onLessonClick: (lesson: typeof mockLessons[0]) => void;
}

const LessonList = ({ lessons, currentLessonId, hasPurchased, onLessonClick }: LessonListProps) => {
  return (
    <div className="divide-y">
      {lessons.map((lesson) => {
        const isActive = lesson.id === currentLessonId;
        const canAccess = lesson.isFree || hasPurchased;

        return (
          <button
            key={lesson.id}
            onClick={() => onLessonClick(lesson)}
            className={cn(
              "w-full flex items-center gap-3 p-4 text-left transition-colors",
              isActive ? "bg-primary/10" : "hover:bg-muted",
              !canAccess && "opacity-60"
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                lesson.isCompleted
                  ? "bg-success/20 text-success"
                  : isActive
                  ? "bg-primary text-primary-foreground"
                  : !canAccess
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/10 text-primary"
              )}
            >
              {lesson.isCompleted ? (
                <CheckCircle className="h-5 w-5" />
              ) : !canAccess ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-medium truncate",
                  isActive ? "text-primary" : "text-foreground"
                )}
              >
                {lesson.title}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {lesson.duration}
                {lesson.isFree && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    FREE
                  </Badge>
                )}
              </p>
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
        );
      })}
    </div>
  );
};

export default LessonView;
