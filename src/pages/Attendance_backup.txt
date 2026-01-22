import { useState, useMemo } from "react";
import Header from "@/components/Layout/Header";
import { supabase } from "../supabaseClient";
import Sidebar from "@/components/Layout/Sidebar";
import StudentAttendanceRow from "@/components/attendance/StudentAttendanceRow";
import { students, gradeOptions, sectionOptions } from "@/data/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

type AttendanceStatus = "present" | "absent" | "late";

const Attendance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialGrade = searchParams.get("grade") || "1";
  const [selectedGrade, setSelectedGrade] = useState(initialGrade);
  const [selectedSection, setSelectedSection] = useState("A");
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});

  const filteredStudents = useMemo(() => 
    students.filter(
      (s) => s.grade === Number(selectedGrade) && s.section === selectedSection
    ),
    [selectedGrade, selectedSection]
  );

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

  const handleSubmit = () => {
    if (Object.keys(attendance).length !== filteredStudents.length) {
      toast.error("Please mark attendance for all students");
      return;
    }
    toast.success("Attendance submitted successfully!");
  };

  const presentCount = Object.values(attendance).filter((s) => s === "present").length;
  const absentCount = Object.values(attendance).filter((s) => s === "absent").length;
  const lateCount = Object.values(attendance).filter((s) => s === "late").length;

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
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <StudentAttendanceRow
                key={student.id}
                student={student}
                status={attendance[student.id] || null}
                onStatusChange={(status) => handleStatusChange(student.id, status)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No students found in Grade {selectedGrade}, Section {selectedSection}
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        {filteredStudents.length > 0 && (
          <div className="p-4 bg-card border-t border-border">
            <Button
              onClick={handleSubmit}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Check className="h-4 w-4" />
              Submit Attendance
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Attendance;
