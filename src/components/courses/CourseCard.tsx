import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Star } from "lucide-react";

// ✅ Type Definitions (Safety ke liye)
export interface CourseProps {
  id: number;
  title: string;
  description: string;
  price: number;
  grade: string | number;
  image_url: string;
  rating?: number;
  duration?: string;
  lessons_count?: number;
}

interface CourseCardProps {
  course: CourseProps;
  onClick?: () => void; // Click handle karne ke liye
}

// ✅ Ye Sirf UI Component hai (Isme Page ka code nahi hona chahiye)
const CourseCard = ({ course, onClick }: CourseCardProps) => {
  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300 border-border/50">
      
      {/* Course Image */}
      <div className="relative h-48 w-full overflow-hidden bg-muted">
        <img
          src={course.image_url || "https://placehold.co/600x400/png?text=No+Image"}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="backdrop-blur-md bg-background/80">
            Grade {course.grade}
          </Badge>
        </div>
      </div>

      {/* Card Content */}
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg line-clamp-1">{course.title}</h3>
          <div className="flex items-center text-yellow-500 text-xs font-medium">
            <Star className="h-3 w-3 fill-current mr-1" />
            <span>{course.rating || "4.5"}</span>
          </div>
        </div>
        <p className="text-muted-foreground text-sm line-clamp-2 h-10">
          {course.description || "No description provided."}
        </p>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-1">
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4">
          <div className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            <span>{course.lessons_count || 12} Lessons</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{course.duration || "10h 30m"}</span>
          </div>
        </div>
      </CardContent>

      {/* Footer / Button */}
      <CardFooter className="p-4 border-t bg-muted/20 flex items-center justify-between">
        <div className="text-lg font-bold text-primary">
          {course.price === 0 ? "Free" : `₹${course.price}`}
        </div>
        <Button size="sm" onClick={onClick}>
          Enroll Now
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;