import { useState, useEffect } from "react";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import CourseCard, { CourseProps } from "@/components/courses/CourseCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient"; 

const Courses = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const navigate = useNavigate();

  // 1. State for Real Data & Loading
  const [courseList, setCourseList] = useState<CourseProps[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Fetch Data from Supabase
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      // Supabase se data mangaya
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }
      
      if (data) {
        // --- DATA SAFETY FIX ---
        // Ye code ensure karega ki agar image ya grade null bhi ho, to app crash na ho
        const safeData = data.map((item: any) => ({
          ...item,
          // Grade ko hamesha Number banayenge taki filter sahi kaam kare
          grade: Number(item.grade) || 0,
          // Image null ho to placeholder laga denge
          image_url: item.image_url || item.thumbnail_url || "https://placehold.co/600x400/png?text=Course+Image",
          description: item.description || "No description available",
          price: Number(item.price) || 0
        }));

        setCourseList(safeData);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Grade Options
  const gradeOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // 4. Filtering Logic (UPDATED)
  // String() lagaya hai taaki "10" (Text) aur 10 (Number) barabar maane jayein
  const filteredCourses = selectedGrade === "all"
    ? courseList
    : courseList.filter((c) => String(c.grade) === String(selectedGrade));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Page Header */}
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

        {/* Course Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading courses...</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              // Yahan check kar rahe hain ki CourseCard component sahi se render ho
              <CourseCard 
                key={course.id} 
                course={course}
                onClick={() => navigate(`/buy-course?id=${course.id}`)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
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