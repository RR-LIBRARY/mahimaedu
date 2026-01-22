import { useState } from "react";
import Header from "@/components/Layout/Header";
import { supabase } from "../supabaseClient";
import Sidebar from "@/components/Layout/Sidebar";
import { students, gradeOptions, sectionOptions } from "@/data/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

const Students = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredStudents = students.filter((student) => {
    const matchesGrade = selectedGrade === "all" || student.grade === Number(selectedGrade);
    const matchesSection = selectedSection === "all" || student.section === selectedSection;
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.includes(searchQuery);
    return matchesGrade && matchesSection && matchesSearch;
  });

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
        <h1 className="text-lg font-semibold text-primary-foreground">Students</h1>
      </div>

      <main className="flex-1 flex flex-col">
        {/* Search & Filters */}
        <div className="p-4 bg-card border-b border-border space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
          <div className="flex gap-3">
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="flex-1 bg-background border-border">
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
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-28 bg-background border-border">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {sectionOptions.map((section) => (
                  <SelectItem key={section} value={section}>
                    Section {section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Student Count */}
        <div className="px-4 py-2 bg-muted/30 border-b border-border">
          <p className="text-sm text-muted-foreground">
            {filteredStudents.length} students found
          </p>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <User className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{student.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Roll #{student.rollNumber} • Grade {student.grade}{student.section}
                </p>
              </div>
            </div>
          ))}

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No students found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Students;
