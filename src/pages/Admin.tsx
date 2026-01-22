import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea"; // Added Textarea for description
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Upload,
  Video,
  FileText,
  Users,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Eye,
  Trash2,
  Edit,
  Plus,
  BookOpen, // Added Icon
} from "lucide-react";

const Admin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  
  // -- REAL DATA STATES --
  const [payments, setPayments] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [statsData, setStatsData] = useState({
    totalStudents: 0,
    totalCourses: 0,
    pendingPayments: 0,
    activeEnrollments: 0
  });

  // -- NEW COURSE STATE --
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    price: "",
    grade: "",
  });
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);

  // Upload form state
  const [uploadType, setUploadType] = useState<"video" | "pdf">("video");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [watermarkText, setWatermarkText] = useState("Mahima Academy");

  // --- FETCH DATA FROM SUPABASE ---
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Courses for dropdown & stats
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*');
      if (coursesData) setCoursesList(coursesData);

      // 2. Fetch Pending Payments
      const { data: payData, error: payError } = await supabase
        .from('payment_requests')
        .select(`
          *,
          courses (title)
        `)
        .eq('status', 'pending');
      if (payData) setPayments(payData);

      // 3. Fetch Lessons (Content)
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          courses (title)
        `)
        .order('created_at', { ascending: false });
      if (lessonData) setLessons(lessonData);

      // 4. Fetch Stats Counts
      const { count: studentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      const { count: enrollCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });

      setStatsData({
        totalStudents: studentCount || 0,
        totalCourses: coursesData?.length || 0,
        pendingPayments: payData?.length || 0,
        activeEnrollments: enrollCount || 0
      });

    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load dashboard data");
    }
  };

  // --- LOGIC: CREATE COURSE (NEW FUNCTION) ---
  const handleCreateCourse = async () => {
    if (!newCourse.title || !newCourse.price || !newCourse.grade) {
      toast.error("Please fill Title, Price and Grade");
      return;
    }

    try {
      setIsCreatingCourse(true);
      const { error } = await supabase.from('courses').insert({
        title: newCourse.title,
        description: newCourse.description,
        price: parseFloat(newCourse.price),
        grade: newCourse.grade,
        image_url: "https://placehold.co/600x400/png", // Placeholder image
      });

      if (error) throw error;

      toast.success("Course Created Successfully!");
      setNewCourse({ title: "", description: "", price: "", grade: "" }); // Reset form
      fetchDashboardData(); // Refresh list
    } catch (error: any) {
      toast.error("Error creating course: " + error.message);
    } finally {
      setIsCreatingCourse(false);
    }
  };

  // --- LOGIC: DELETE COURSE ---
  const handleDeleteCourse = async (id: number) => {
    if (!confirm("Delete this course? All related lessons will also be deleted!")) return;
    
    try {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
      toast.success("Course deleted");
      fetchDashboardData();
    } catch (error: any) {
      toast.error("Delete failed: " + error.message);
    }
  };

  // --- LOGIC: APPROVE PAYMENT ---
  const handleApprovePayment = async (paymentRequest: any) => {
    try {
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({ status: 'approved' })
        .eq('id', paymentRequest.id);

      if (updateError) throw updateError;

      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: paymentRequest.user_id,
          course_id: paymentRequest.course_id
        });

      if (enrollError) throw enrollError;

      toast.success("Payment approved & Student enrolled!");
      fetchDashboardData();

    } catch (error: any) {
      toast.error("Error approving payment: " + error.message);
    }
  };

  // --- LOGIC: REJECT PAYMENT ---
  const handleRejectPayment = async (paymentId: number) => {
    try {
      const { error } = await supabase
        .from('payment_requests')
        .update({ status: 'rejected' })
        .eq('id', paymentId);

      if (error) throw error;
      toast.error("Payment rejected.");
      fetchDashboardData();
    } catch (error: any) {
      toast.error("Error rejecting: " + error.message);
    }
  };

  // --- LOGIC: UPLOAD VIDEO/LESSON ---
  const handleVideoUpload = async () => {
    if (!videoTitle || !selectedCourse) {
      toast.error("Please fill title and select a course");
      return;
    }
    if (uploadType === "video" && !videoUrl) {
      toast.error("Video URL is required");
      return;
    }

    try {
      const { error } = await supabase
        .from('lessons')
        .insert({
          course_id: parseInt(selectedCourse),
          title: videoTitle,
          type: uploadType,
          video_url: uploadType === "video" ? videoUrl : null,
          pdf_url: uploadType === "pdf" ? "dummy_pdf_link" : null,
          watermark_text: watermarkText,
          is_locked: true 
        });

      if (error) throw error;
      toast.success(`${uploadType === 'video' ? 'Video' : 'PDF'} added successfully!`);
      
      setVideoUrl("");
      setVideoTitle("");
      setSelectedCourse("");
      fetchDashboardData();

    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    }
  };

  // --- LOGIC: DELETE LESSON ---
  const handleDeleteLesson = async (id: number) => {
    if(!confirm("Are you sure you want to delete this lesson?")) return;
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if(error) toast.error("Failed to delete");
    else {
      toast.success("Lesson deleted");
      fetchDashboardData();
    }
  }

  // Stats Array for UI
  const stats = [
    { label: "Total Students", value: statsData.totalStudents, icon: Users, color: "text-primary" },
    { label: "Total Courses", value: statsData.totalCourses, icon: BarChart3, color: "text-success" },
    { label: "Pending Payments", value: statsData.pendingPayments, icon: Clock, color: "text-accent" },
    { label: "Active Enrollments", value: statsData.activeEnrollments, icon: CreditCard, color: "text-secondary" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} userName={user?.name || "Admin"} />

      <main className="flex-1 overflow-y-auto pb-6">
        {/* Header */}
        <section className="px-5 py-6">
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage courses, payments, and content (Live Database)
          </p>
        </section>

        {/* Stats Grid */}
        <section className="px-5 mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Main Tabs */}
        <section className="px-5">
          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-6">
              <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Pending Payment Verifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {payments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-10">No pending payments.</p>
                    ) : (
                      <div className="space-y-4">
                        {payments.map((payment) => (
                          <div key={payment.id} className="flex flex-col sm:flex-row justify-between gap-4 p-4 border rounded-lg">
                            <div>
                              <p className="font-medium">{payment.user_name || "Unknown User"}</p>
                              <p className="text-sm">Course: <strong>{payment.courses?.title}</strong></p>
                              <p className="text-xs text-muted-foreground">Amount: ₹{payment.amount}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="text-success" onClick={() => handleApprovePayment(payment)}>Approve</Button>
                              <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleRejectPayment(payment.id)}>Reject</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- NEW COURSES TAB --- */}
            <TabsContent value="courses">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Create Course Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Create New Course
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Course Title</Label>
                      <Input 
                        placeholder="e.g. Class 10th Mathematics" 
                        value={newCourse.title}
                        onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        placeholder="Short details about the course..." 
                        value={newCourse.description}
                        onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price (₹)</Label>
                        <Input 
                          type="number" 
                          placeholder="999" 
                          value={newCourse.price}
                          onChange={(e) => setNewCourse({...newCourse, price: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Grade/Class</Label>
                        <Input 
                          placeholder="e.g. 10" 
                          value={newCourse.grade}
                          onChange={(e) => setNewCourse({...newCourse, grade: e.target.value})}
                        />
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleCreateCourse} 
                      disabled={isCreatingCourse}
                    >
                      {isCreatingCourse ? "Creating..." : "Create Course"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Right: Existing Courses List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Existing Courses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[350px]">
                      {coursesList.length === 0 ? (
                        <p className="text-center text-muted-foreground py-10">No courses created yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {coursesList.map((course) => (
                            <div key={course.id} className="flex justify-between items-center p-3 border rounded-lg bg-card/50">
                              <div>
                                <p className="font-semibold">{course.title}</p>
                                <p className="text-xs text-muted-foreground">Class {course.grade} • ₹{course.price}</p>
                              </div>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="text-destructive"
                                onClick={() => handleDeleteCourse(course.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Uploaded Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {lessons.length === 0 ? (
                      <p className="text-center text-muted-foreground py-10">No lessons uploaded yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {lessons.map((content) => (
                          <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${content.type === "video" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                                {content.type === "video" ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                              </div>
                              <div>
                                <p className="font-medium">{content.title}</p>
                                <p className="text-xs text-muted-foreground">{content.courses?.title}</p>
                              </div>
                            </div>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteLesson(content.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Upload Tab */}
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Add New Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* ... Same Upload Form ... */}
                  <div className="flex gap-4">
                    <Button variant={uploadType === "video" ? "default" : "outline"} onClick={() => setUploadType("video")} className="flex-1">
                      <Video className="h-4 w-4 mr-2" /> Video Lesson
                    </Button>
                    <Button variant={uploadType === "pdf" ? "default" : "outline"} onClick={() => setUploadType("pdf")} className="flex-1">
                      <FileText className="h-4 w-4 mr-2" /> PDF Material
                    </Button>
                  </div>

                  {uploadType === "video" && (
                    <>
                      <div className="space-y-2">
                        <Label>YouTube Video URL (Unlisted)</Label>
                        <Input placeholder="https://youtube.com/watch?v=..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Lesson Title</Label>
                        <Input placeholder="e.g., Chapter 1: Introduction" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Select Course</Label>
                        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                          <SelectTrigger><SelectValue placeholder="Choose course" /></SelectTrigger>
                          <SelectContent>
                            {coursesList.map((course) => (
                              <SelectItem key={course.id} value={course.id.toString()}>{course.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Watermark Text</Label>
                        <Input placeholder="Mahima Academy" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} />
                      </div>
                    </>
                  )}

                   {/* PDF Form Part */}
                   {uploadType === "pdf" && (
                    <>
                      <div className="space-y-2">
                        <Label>PDF Title</Label>
                        <Input placeholder="e.g., Math Worksheet" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Select Course</Label>
                        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                          <SelectTrigger><SelectValue placeholder="Choose course" /></SelectTrigger>
                          <SelectContent>
                            {coursesList.map((course) => (
                              <SelectItem key={course.id} value={course.id.toString()}>{course.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                        <p>File Upload Pending Storage Setup.</p>
                      </div>
                    </>
                  )}

                  <Button className="w-full" onClick={handleVideoUpload}>
                    <Plus className="h-4 w-4 mr-2" /> Add Content
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
};

export default Admin;