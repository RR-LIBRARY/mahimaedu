import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea"; 
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Upload, Video, FileText, Users, CreditCard, CheckCircle, XCircle, Clock,
  BarChart3, Trash2, Plus, BookOpen, ExternalLink, ShieldAlert
} from "lucide-react";

const Admin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  
  // -- DATA STATES --
  const [payments, setPayments] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [statsData, setStatsData] = useState({
    totalStudents: 0,
    totalCourses: 0,
    pendingPayments: 0,
    activeEnrollments: 0
  });

  // -- COURSE CREATION STATE --
  const [newCourse, setNewCourse] = useState({
    title: "", description: "", price: "", grade: "",
  });
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);

  // -- UPLOAD STATE --
  const [uploadType, setUploadType] = useState<"video" | "pdf">("video");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [watermarkText, setWatermarkText] = useState("Mahima Academy");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- 1. FETCH DATA ---
  const fetchDashboardData = async () => {
    try {
      // A. Fetch Courses
      const { data: coursesData } = await supabase.from('courses').select('*');
      if (coursesData) setCoursesList(coursesData);

      // B. Fetch Pending Payments (With User Profile & Course Details)
      // Note: Hum profiles table se bhi data le rahe hain taaki email dikhe
      const { data: payData, error: payError } = await supabase
        .from('payment_requests')
        .select(`
          *,
          courses (title),
          profiles (full_name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      if (payData) setPayments(payData);
      if (payError) console.error("Payment Fetch Error:", payError);

      // C. Fetch Lessons
      const { data: lessonData } = await supabase
        .from('lessons')
        .select(`*, courses (title)`).order('created_at', { ascending: false });
      if (lessonData) setLessons(lessonData);

      // D. Stats
      const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
      const { count: enrollCount } = await supabase.from('enrollments').select('*', { count: 'exact', head: true });

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

  // --- 2. PAYMENT APPROVAL LOGIC (MAIN) ---
  const handleApprovePayment = async (paymentRequest: any) => {
    if(!confirm(`Approve payment of ₹${paymentRequest.amount} for ${paymentRequest.sender_name}?`)) return;

    try {
      // Step A: Update Payment Status
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({ status: 'approved' })
        .eq('id', paymentRequest.id);

      if (updateError) throw updateError;

      // Step B: Check if already enrolled (to avoid duplicates)
      const { data: existingEnroll } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', paymentRequest.user_id)
        .eq('course_id', paymentRequest.course_id)
        .single();

      // Step C: Enroll Student if not already enrolled
      if (!existingEnroll) {
        const { error: enrollError } = await supabase
          .from('enrollments')
          .insert({
            user_id: paymentRequest.user_id,
            course_id: paymentRequest.course_id
          });
        if (enrollError) throw enrollError;
      }

      toast.success("Payment Approved & Course Unlocked!");
      fetchDashboardData(); // Refresh list

    } catch (error: any) {
      toast.error("Approval Error: " + error.message);
    }
  };

  // --- 3. PAYMENT REJECTION LOGIC ---
  const handleRejectPayment = async (paymentId: number) => {
    if(!confirm("Are you sure you want to REJECT this payment?")) return;
    
    try {
      const { error } = await supabase
        .from('payment_requests')
        .update({ status: 'rejected' })
        .eq('id', paymentId);

      if (error) throw error;
      toast.error("Payment request rejected.");
      fetchDashboardData();
    } catch (error: any) {
      toast.error("Error rejecting: " + error.message);
    }
  };

  // --- 4. COURSE MANAGEMENT ---
  const handleCreateCourse = async () => {
    if (!newCourse.title || !newCourse.price || !newCourse.grade) return toast.error("Fill all fields");
    try {
      setIsCreatingCourse(true);
      const { error } = await supabase.from('courses').insert({
        title: newCourse.title,
        description: newCourse.description,
        price: parseFloat(newCourse.price),
        grade: newCourse.grade,
        image_url: "https://placehold.co/600x400/png",
      });
      if (error) throw error;
      toast.success("Course Created!");
      setNewCourse({ title: "", description: "", price: "", grade: "" });
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm("Delete course? This will remove all lessons too!")) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success("Course deleted"); fetchDashboardData(); }
  };

  // --- 5. CONTENT UPLOAD ---
  const handleVideoUpload = async () => {
    if (!videoTitle || !selectedCourse) return toast.error("Fill details");
    try {
      const { error } = await supabase.from('lessons').insert({
        course_id: parseInt(selectedCourse),
        title: videoTitle,
        type: uploadType,
        video_url: uploadType === "video" ? videoUrl : null,
        pdf_url: uploadType === "pdf" ? "dummy_pdf_link" : null, // Replace with real logic later
        watermark_text: watermarkText,
        is_locked: true 
      });
      if (error) throw error;
      toast.success("Content Added!");
      setVideoTitle(""); setVideoUrl(""); setSelectedCourse("");
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteLesson = async (id: number) => {
    if(!confirm("Delete lesson?")) return;
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if(!error) { toast.success("Deleted"); fetchDashboardData(); }
  };

  // Stats UI Config
  const stats = [
    { label: "Total Students", value: statsData.totalStudents, icon: Users, color: "text-blue-600 bg-blue-100" },
    { label: "Total Courses", value: statsData.totalCourses, icon: BookOpen, color: "text-green-600 bg-green-100" },
    { label: "Pending Payments", value: statsData.pendingPayments, icon: Clock, color: "text-orange-600 bg-orange-100" },
    { label: "Active Enrollments", value: statsData.activeEnrollments, icon: CheckCircle, color: "text-purple-600 bg-purple-100" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} userName={user?.name || "Admin"} />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Manage your academy operations securely.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* TABS SECTION */}
        <Tabs defaultValue="payments" className="w-full space-y-6">
          <TabsList className="bg-white p-1 border rounded-lg w-full md:w-auto grid grid-cols-4 h-auto">
            <TabsTrigger value="payments" className="py-2">Payments <Badge variant="destructive" className="ml-2">{payments.length}</Badge></TabsTrigger>
            <TabsTrigger value="courses" className="py-2">Courses</TabsTrigger>
            <TabsTrigger value="content" className="py-2">Content</TabsTrigger>
            <TabsTrigger value="upload" className="py-2">Upload</TabsTrigger>
          </TabsList>

          {/* --- TAB 1: PAYMENTS (UPDATED) --- */}
          <TabsContent value="payments">
            <Card className="border shadow-sm">
              <CardHeader className="bg-orange-50/50 border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <ShieldAlert className="h-5 w-5" />
                  Verification Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {payments.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3 opacity-20" />
                      <p className="text-muted-foreground">No pending payment requests.</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {payments.map((req) => (
                        <div key={req.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-6">
                          
                          {/* Left: Info */}
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-lg text-gray-900">{req.courses?.title || "Unknown Course"}</h3>
                                <p className="text-sm text-gray-500">
                                  App User: <span className="font-medium text-gray-700">{req.profiles?.full_name || "N/A"}</span> ({req.profiles?.email})
                                </p>
                              </div>
                              <Badge variant="outline" className="text-lg px-3 py-1 bg-green-50 text-green-700 border-green-200">
                                ₹{req.amount}
                              </Badge>
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm space-y-1">
                              <p className="flex justify-between">
                                <span className="text-blue-600 font-medium">Bank Sender Name:</span>
                                <span className="font-bold text-gray-800">{req.sender_name || "Not Provided"}</span>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-blue-600 font-medium">UTR / Ref No:</span>
                                <span className="font-mono font-bold text-gray-800">{req.transaction_id}</span>
                              </p>
                            </div>
                          </div>

                          {/* Right: Actions & Proof */}
                          <div className="flex flex-col gap-3 min-w-[200px]">
                             {/* Screenshot Button */}
                             {req.screenshot_url ? (
                               <a 
                                 href={req.screenshot_url} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="w-full"
                               >
                                 <Button variant="outline" className="w-full border-dashed border-gray-400 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300">
                                   <ExternalLink className="h-4 w-4 mr-2" /> View Screenshot
                                 </Button>
                               </a>
                             ) : (
                               <div className="text-xs text-red-500 text-center py-2 bg-red-50 rounded">No Screenshot</div>
                             )}

                             <div className="flex gap-2 mt-auto">
                               <Button 
                                 className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
                                 onClick={() => handleApprovePayment(req)}
                               >
                                 Approve
                               </Button>
                               <Button 
                                 variant="destructive" 
                                 className="flex-1" 
                                 onClick={() => handleRejectPayment(req.id)}
                               >
                                 Reject
                               </Button>
                             </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- TAB 2: COURSES --- */}
          <TabsContent value="courses">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Create Course</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={newCourse.title} onChange={(e) => setNewCourse({...newCourse, title: e.target.value})} placeholder="Class 10 Science" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={newCourse.description} onChange={(e) => setNewCourse({...newCourse, description: e.target.value})} placeholder="Details..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price (₹)</Label>
                      <Input type="number" value={newCourse.price} onChange={(e) => setNewCourse({...newCourse, price: e.target.value})} placeholder="499" />
                    </div>
                    <div className="space-y-2">
                      <Label>Grade</Label>
                      <Input value={newCourse.grade} onChange={(e) => setNewCourse({...newCourse, grade: e.target.value})} placeholder="10" />
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleCreateCourse} disabled={isCreatingCourse}>
                    {isCreatingCourse ? <Clock className="animate-spin mr-2"/> : <Plus className="mr-2 h-4 w-4"/>} Create Course
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Course List</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {coursesList.map((c) => (
                        <div key={c.id} className="flex justify-between items-center p-3 border rounded-lg bg-white">
                          <div>
                            <p className="font-semibold">{c.title}</p>
                            <p className="text-xs text-muted-foreground">₹{c.price} • Grade {c.grade}</p>
                          </div>
                          <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteCourse(c.id)}>
                            <Trash2 className="h-4 w-4"/>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* --- TAB 3: CONTENT --- */}
          <TabsContent value="content">
            <Card>
              <CardHeader><CardTitle>Manage Lessons</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {lessons.length === 0 ? <p className="text-center text-gray-400 py-10">No content yet.</p> : (
                    <div className="space-y-2">
                      {lessons.map((l) => (
                        <div key={l.id} className="flex items-center justify-between p-3 border rounded bg-white">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded ${l.type === 'video' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                              {l.type === 'video' ? <Video className="h-4 w-4"/> : <FileText className="h-4 w-4"/>}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{l.title}</p>
                              <p className="text-xs text-gray-500">{l.courses?.title}</p>
                            </div>
                          </div>
                          <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-600" onClick={() => handleDeleteLesson(l.id)}>
                            <Trash2 className="h-4 w-4"/>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- TAB 4: UPLOAD --- */}
          <TabsContent value="upload">
            <Card>
              <CardHeader><CardTitle>Upload New Material</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="flex gap-4">
                  <Button variant={uploadType==="video"?"default":"outline"} onClick={()=>setUploadType("video")} className="flex-1">Video</Button>
                  <Button variant={uploadType==="pdf"?"default":"outline"} onClick={()=>setUploadType("pdf")} className="flex-1">PDF</Button>
                </div>
                
                {uploadType === "video" ? (
                  <>
                    <div className="space-y-2"><Label>Video URL</Label><Input value={videoUrl} onChange={(e)=>setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." /></div>
                    <div className="space-y-2"><Label>Title</Label><Input value={videoTitle} onChange={(e)=>setVideoTitle(e.target.value)} placeholder="Chapter Title" /></div>
                  </>
                ) : (
                  <div className="p-8 border-2 border-dashed rounded text-center text-gray-500">
                    <p>PDF Upload Feature Coming Soon</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Select Course</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger><SelectValue placeholder="Select Course" /></SelectTrigger>
                    <SelectContent>
                      {coursesList.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" onClick={handleVideoUpload}><Upload className="mr-2 h-4 w-4"/> Publish Content</Button>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
};

export default Admin;