import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Attendance from "./pages/Attendance";
import Students from "./pages/Students";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import LessonView from "./pages/LessonView";
import BuyCourse from "./pages/BuyCourse";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:courseId/learn" element={<LessonView />} />
            
            {/* FIXED: Ye dono routes add kar diye taaki 404 error na aaye */}
            <Route path="/courses/:courseId/buy" element={<BuyCourse />} />
            <Route path="/buy-course" element={<BuyCourse />} />

            <Route path="/attendance" element={<Attendance />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/students" element={<Students />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Placeholder routes */}
            <Route path="/reports" element={<Dashboard />} />
            <Route path="/messages" element={<Dashboard />} />
            <Route path="/settings" element={<Dashboard />} />
            <Route path="/timetable" element={<Dashboard />} />
            <Route path="/notices" element={<Dashboard />} />
            <Route path="/syllabus" element={<Dashboard />} />
            <Route path="/materials" element={<Dashboard />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;