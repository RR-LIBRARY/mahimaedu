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
      // Fetch data matching your SQL columns
      // Console log lagaya hai taaki hum check kar sakein ki data aa raha hai ya error
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }
      
      if (data) {
        console.log("Fetched Data:", data); // Console me data dikhega
        setCourseList(data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Generate Grade Options (1 to 12)
  const gradeOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // 4. Filtering Logic on Real Data
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
        
        {/* --- DEBUG BOX (Testing ke liye) --- */}
        {/* Ye box sirf ye dikhane ke liye hai ki database se kya aa raha hai */}
        <div className="p-4 bg-yellow-100 border border-yellow-500 rounded-md text-sm text-black mb-4">
            <p className="font-bold border-b border-yellow-600 mb-2 pb-1">🔍 Debugging Panel (Only for Testing)</p>
            <p><strong>Loading Status:</strong> {loading ? "Loading..." : "Finished"}</p>
            <p><strong>Total Courses Found:</strong> {courseList.length}</p>
            <p><strong>Raw Data from DB:</strong></p>
            <pre className="bg-white p-2 mt-1 rounded border overflow-auto max-h-32 text-xs">
                {JSON.stringify(courseList, null, 2)}
            </pre>
            <p className="mt-2 text-xs text-gray-600">
                * Agar yahan "[]" (khali bracket) dikh raha hai, to iska matlab Supabase RLS Policy data ko rok rahi hai.
            </p>
        </div>
        {/* --- END DEBUG BOX --- */}

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
          <div className="text-center py-12 text-muted-foreground">Loading courses from database...</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
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