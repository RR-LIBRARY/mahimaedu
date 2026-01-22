import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import ClassCard from "@/components/dashboard/ClassCard";
import FeatureCard from "@/components/dashboard/FeatureCard";
import { currentTeacher, gradeOptions } from "@/data/mockData";
import { 
  Users, 
  Calendar, 
  FileText, 
  ClipboardCheck, 
  BookOpen, 
  MessageCircle,
  GraduationCap,
  Bell
} from "lucide-react";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const features = [
    { icon: ClipboardCheck, label: "Attendance", color: "primary" as const, path: "/attendance" },
    { icon: FileText, label: "Report Card", color: "secondary" as const, path: "/reports" },
    { icon: Users, label: "Students", color: "success" as const, path: "/students" },
    { icon: Calendar, label: "Timetable", color: "accent" as const, path: "/timetable" },
    { icon: Bell, label: "Notice Board", color: "primary" as const, path: "/notices" },
    { icon: MessageCircle, label: "Messages", color: "secondary" as const, path: "/messages" },
    { icon: BookOpen, label: "Syllabus", color: "success" as const, path: "/syllabus" },
    { icon: GraduationCap, label: "Material", color: "accent" as const, path: "/materials" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} userName={currentTeacher.name} />

      <main className="flex-1 overflow-y-auto pb-6">
        {/* Greeting Section */}
        <section className="px-5 py-6">
          <p className="text-muted-foreground text-sm">Good Morning,</p>
          <h1 className="text-2xl font-bold text-foreground mt-1">{currentTeacher.name}</h1>
        </section>

        {/* Class Grid */}
        <section className="px-5">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Select Class</h2>
          <div className="grid grid-cols-2 gap-4">
            {gradeOptions.map((grade, index) => (
              <ClassCard
                key={grade}
                grade={grade}
                onClick={() => navigate(`/attendance?grade=${grade}`)}
                variant={index === gradeOptions.length - 1 ? "featured" : "default"}
              />
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-5 mt-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature) => (
              <FeatureCard
                key={feature.label}
                icon={feature.icon}
                label={feature.label}
                color={feature.color}
                onClick={() => navigate(feature.path)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
