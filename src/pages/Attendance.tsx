import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Layout/Header";
import { supabase } from "../supabaseClient";
import Sidebar from "@/components/Layout/Sidebar";
import StudentAttendanceRow from "@/components/attendance/StudentAttendanceRow";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

type AttendanceStatus = "present" | "absent" | "late";

// Interface define karte hain taaki TypeScript khush rahe
interface Student {
  id: number;
  name: string;
  rollNo: number; // Frontend uses camelCase
  grade: number;
  section: string;
}

const Attendance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL se Grade uthao ya default '1' rakho
  const initialGrade = searchParams.get("grade") || "1";
  const [selectedGrade, setSelectedGrade] = useState(initialGrade);
  const [selectedSection, setSelectedSection] = useState("A");
  
  // Real Data States
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Attendance State
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});

  // 1. Fetch Students from Supabase when Grade/Section changes
  useEffect(() => {
    fetchStudents();
  }, [selectedGrade, selectedSection]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setAttendance({}); // Reset attendance when class changes

      // Fetch students matching Grade & Section
      // Note: We rename 'roll_no' to 'rollNo' to match your component
      const { data, error } = await supabase
        .from('students')
        .select('id, name, rollNo:roll_no, grade, section') 
        .eq('grade', Number(selectedGrade))
        .eq('section', selectedSection)
        .order('roll_no', { ascending: true });

      if (error) throw error;

      if (data) {
        setStudentList(data);
        // Optional: Auto-mark everyone as 'present' initially?
        // const initialAttendance: any = {};
        // data.forEach(s => initialAttendance[s.id] = 'present');
        // setAttendance(initialAttendance);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // 2. Save Attendance to Database
  const handleSubmit = async () => {
    // Check if everyone is marked
    if (Object.keys(attendance).length !== studentList.length) {
      toast.error("Please mark attendance for all students");
      return;
    }

    setSubmitting(true);
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    try {
      // Prepare data for Bulk Insert
      const recordsToInsert = studentList.map((student) => ({
        student_id: student.id,
        date: dateStr,
        status: attendance[student.id]
      }));

      // Upsert: Insert new or Update if exists for (student_id + date)
      const { error } = await supabase
        .from('attendance')
        .upsert(recordsToInsert, { onConflict: 'student_id, date' });

      if (error) throw error;

      toast.success("Attendance submitted successfully!");
      navigate("/dashboard");
      
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error("Failed to submit attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = Object.values(attendance).filter((s) => s === "present").length;
  const absentCount = Object.values(attendance).filter((s) => s === "absent").length;
  const lateCount = Object.values(attendance).filter((s) => s === "late").length;

  const gradeOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const sectionOptions = ["A", "B", "C"];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Page Header */}
      <div className="bg-primary px-4 py-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-primary-foreground">Attendance</h1>
      </div>

      <main className="flex-1 flex flex-col">
        {/* Filters */}
        <div className="p-4 bg-card border-b border-border flex gap-3">
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="flex-1 bg-background border-border">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              {gradeOptions.map((grade) => (
                <SelectItem key={grade} value={String(grade)}>
                  Grade {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="w-28 bg-background border-border">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              {sectionOptions.map((section) => (
                <SelectItem key={section} value={section}>
                  Section {section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Display */}
        <div className="px-4 py-3 bg-muted/30 border-b border-border">
          <p className="text-sm text-muted-foreground">{today}</p>
          <div className="flex gap-4 mt-2 text-xs">
            <span className="text-success font-medium">Present: {presentCount}</span>
            <span className="text-destructive font-medium">Absent: {absentCount}</span>
            <span className="text-accent font-medium">Late: {lateCount}</span>
          </div>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
             <div className="flex justify-center py-12">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : studentList.length > 0 ? (
            studentList.map((student) => (
              <StudentAttendanceRow
                key={student.id}
                student={student} // Ensure this matches existing component props
                status={attendance[student.id] || null}
                onStatusChange={(status) => handleStatusChange(student.id, status)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No students found in Grade {selectedGrade}, Section {selectedSection}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                (Add students in Supabase table 'students')
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        {studentList.length > 0 && (
          <div className="p-4 bg-card border-t border-border">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {submitting ? "Submitting..." : "Submit Attendance"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Attendance;
