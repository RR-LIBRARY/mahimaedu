"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient"; 
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  
  // State for Text Data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_url: "",
    course_id: "", // NEW: Add course_id
  });

  // State for File
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  // Input change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // File change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Check if course_id is selected
    if (!formData.course_id) {
      alert("❌ Please select a course!");
      return;
    }
    
    setLoading(true);

    try {
      // 1. Lesson Insert karein (Table: lessons)
      const { data: lessonData, error: lessonError } = await supabase
        .from("lessons")
        .insert([
          {
            title: formData.title,
            description: formData.description,
            video_url: formData.video_url,
            course_id: formData.course_id, // ADD THIS LINE
          },
        ])
        .select()
        .single();

      if (lessonError) throw lessonError;

      const newLessonId = lessonData.id;
      console.log("Lesson Created ID:", newLessonId);

      // 2. Agar PDF file select ki gayi hai, to use upload karein
      if (pdfFile) {
        const fileName = `${Date.now()}_${pdfFile.name.replace(/\s/g, "_")}`; 
        
        // A. Storage Bucket me Upload karein
        const { error: uploadError } = await supabase.storage
          .from("course_materials")
          .upload(fileName, pdfFile);

        if (uploadError) throw uploadError;

        // B. Public URL generate karein
        const { data: urlData } = supabase.storage
          .from("course_materials")
          .getPublicUrl(fileName);

        const publicPdfUrl = urlData.publicUrl;

        // C. Database ke 'notes' table me link save karein
        const { error: noteError } = await supabase
          .from("notes")
          .insert([
            {
              lesson_id: newLessonId,
              title: pdfFile.name,
              pdf_url: publicPdfUrl,
            },
          ]);

        if (noteError) throw noteError;
      }

      alert("✅ Class and Notes Uploaded Successfully!");
      
      // Form Reset
      setFormData({ 
        title: "", 
        description: "", 
        video_url: "", 
        course_id: "" 
      });
      setPdfFile(null);

    } catch (error: any) {
      console.error("Upload Error:", error);
      alert("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10 bg-white border rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin: Upload Class & Notes</h1>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* NEW: Course Selection Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Course *
          </label>
          <select
            name="course_id"
            value={formData.course_id}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            required
          >
            <option value="">-- Select a Course --</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Ex: Physics Chapter 1"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        {/* Video URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Embed URL</label>
          <input
            type="text"
            name="video_url"
            value={formData.video_url}
            onChange={handleChange}
            placeholder="Ex: https://www.youtube.com/embed/..."
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Make sure to use the Embed link, not the watch link.</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Class details..."
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* PDF Upload Section */}
        <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload PDF Notes (Optional)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {pdfFile && <p className="text-xs text-green-600 mt-2">Selected: {pdfFile.name}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition disabled:opacity-50"
        >
          {loading ? "Uploading Data & File..." : "Publish Everything"}
        </button>
      </form>
    </div>
  );
}