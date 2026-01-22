import { useState, useEffect } from "react";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
// Card Component ko import kiya
import CourseCard, { CourseProps } from "@/components/courses/CourseCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ✅ CORRECT IMPORT PATH: '@' ka matlab 'src' folder hota hai. Ye kabhi fail nahi hoga.
import { supabase } from "@/supabaseClient"; 

const Courses = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const navigate = useNavigate();

  const [courseList, setCourseList] = useState<CourseProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }
      
      if (data) {
        // Safe Data Logic (Bina SQL badle app crash hone se bachayega)
        const safeData = data.map((item: any) => ({
          ...item,
          grade: Number(item.grade) || 0,
          image_url: item.image_url || item.thumbnail_url || "https://placehold.co/600x400/png?text=Course+Image",
          description: item.description || "No description available",
          price: Number(item.price) || 0,
          // Dummy data for UI design
          rating: 4.8,
          duration: "12h 00m",
          lessons_count: 15
        }));
        setCourseList(safeData);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const gradeOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Logic to handle string vs number grade
  const filteredCourses = selectedGrade === "all"
    ? courseList
    : courseList.filter((c) => String(c.grade) === String(selectedGrade));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <div className="bg-primary px-4 py-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-primary-foreground">Courses</h1>
      </div>

      <main className="flex-1 p-4 space-y-4">
        {/* Filter Section */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${filteredCourses.length} courses available`}
          </p>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-32 bg-card border-border">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {gradeOptions.map((grade) => (
                <SelectItem key={grade} value={String(grade)}>
                  Grade {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grid Section */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading courses...</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCard 
                key={course.id} 
                course={course}
                onClick={() => navigate(`/buy-course?id=${course.id}`)}
              />
            ))}
          </div>
        )}

        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No courses found for this grade.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Courses;