import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { students, courses, gradeOptions } from "@/data/mockData";
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
} from "lucide-react";

// Mock pending payments - in production from Supabase
const mockPayments = [
  {
    id: 1,
    userName: "Rajesh Kumar",
    email: "rajesh@gmail.com",
    courseName: "Fun with Numbers",
    amount: 499,
    transactionId: "UPI123456789012",
    status: "pending",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    userName: "Priya Sharma",
    email: "priya@gmail.com",
    courseName: "ABC Adventures",
    amount: 499,
    transactionId: "UPI987654321098",
    status: "pending",
    createdAt: "2024-01-14",
  },
];

// Mock uploaded content
const mockContent = [
  {
    id: 1,
    title: "Introduction to Numbers",
    type: "video",
    courseId: 1,
    duration: "8:30",
    views: 245,
  },
  {
    id: 2,
    title: "Math Worksheet Grade 1",
    type: "pdf",
    courseId: 1,
    downloads: 89,
  },
];

const Admin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Upload form state
  const [uploadType, setUploadType] = useState<"video" | "pdf">("video");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [watermarkText, setWatermarkText] = useState("Mahima Academy");

  const handleApprovePayment = async (paymentId: number) => {
    // In production: Update payment_requests and purchases tables in Supabase
    toast.success("Payment approved! User can now access the course.");
  };

  const handleRejectPayment = async (paymentId: number) => {
    toast.error("Payment rejected.");
  };

  const handleVideoUpload = async () => {
    if (!videoUrl || !videoTitle || !selectedCourse) {
      toast.error("Please fill all fields");
      return;
    }

    // In production: Insert into lessons table in Supabase
    toast.success("Video lesson added successfully!");
    setVideoUrl("");
    setVideoTitle("");
    setSelectedCourse("");
  };

  // Stats
  const stats = [
    { label: "Total Students", value: students.length, icon: Users, color: "text-primary" },
    { label: "Total Courses", value: courses.length, icon: BarChart3, color: "text-success" },
    { label: "Pending Payments", value: mockPayments.length, icon: Clock, color: "text-accent" },
    { label: "Active Purchases", value: 42, icon: CreditCard, color: "text-secondary" },
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
            Manage courses, payments, and content
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
          <Tabs defaultValue="payments" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-6">
              <TabsTrigger value="payments">Payments</TabsTrigger>
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
                    <div className="space-y-4">
                      {mockPayments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <p className="font-medium">{payment.userName}</p>
                            <p className="text-sm text-muted-foreground">
                              {payment.email}
                            </p>
                            <p className="text-sm">
                              Course: <strong>{payment.courseName}</strong>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              TXN ID: {payment.transactionId}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">₹{payment.amount}</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-success hover:bg-success/10"
                              onClick={() => handleApprovePayment(payment.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleRejectPayment(payment.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
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
                    <div className="space-y-3">
                      {mockContent.map((content) => (
                        <div
                          key={content.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                content.type === "video"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {content.type === "video" ? (
                                <Video className="h-5 w-5" />
                              ) : (
                                <FileText className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{content.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {content.type === "video"
                                  ? `${content.duration} • ${content.views} views`
                                  : `${content.downloads} downloads`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
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
                  {/* Content Type */}
                  <div className="flex gap-4">
                    <Button
                      variant={uploadType === "video" ? "default" : "outline"}
                      onClick={() => setUploadType("video")}
                      className="flex-1"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Video Lesson
                    </Button>
                    <Button
                      variant={uploadType === "pdf" ? "default" : "outline"}
                      onClick={() => setUploadType("pdf")}
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      PDF Material
                    </Button>
                  </div>

                  {uploadType === "video" && (
                    <>
                      <div className="space-y-2">
                        <Label>YouTube Video URL (Unlisted)</Label>
                        <Input
                          placeholder="https://youtube.com/watch?v=..."
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Use unlisted YouTube videos for better control
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Lesson Title</Label>
                        <Input
                          placeholder="e.g., Chapter 1: Introduction"
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Select Course</Label>
                        <Select
                          value={selectedCourse}
                          onValueChange={setSelectedCourse}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem
                                key={course.id}
                                value={course.id.toString()}
                              >
                                {course.title} (Grade {course.grade})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Watermark Text</Label>
                        <Input
                          placeholder="Mahima Academy"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          This text will appear as overlay on the video
                        </p>
                      </div>
                    </>
                  )}

                  {uploadType === "pdf" && (
                    <>
                      <div className="space-y-2">
                        <Label>PDF Title</Label>
                        <Input placeholder="e.g., Math Worksheet Grade 1" />
                      </div>

                      <div className="space-y-2">
                        <Label>Select Course</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem
                                key={course.id}
                                value={course.id.toString()}
                              >
                                {course.title} (Grade {course.grade})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Drag & drop PDF here or click to upload
                        </p>
                        <Button variant="outline" className="mt-4">
                          Choose File
                        </Button>
                      </div>
                    </>
                  )}

                  <Button className="w-full" onClick={handleVideoUpload}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add {uploadType === "video" ? "Video Lesson" : "PDF Material"}
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
