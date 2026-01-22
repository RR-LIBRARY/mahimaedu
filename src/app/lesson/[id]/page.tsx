"use client";
import { useEffect, useState } from "react";
// 👇 Yahan humne aapka path use kiya hai
import { supabase } from "@/supabaseClient"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageCircle, Info } from "lucide-react"; 

// Types define kar lete hain taaki errors na aaye
interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
}

interface Note {
  id: string;
  title: string;
  pdf_url: string;
}

interface Comment {
  id: string;
  user_name: string;
  message: string;
}

export default function LessonPage({ params }: { params: { id: string } }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // Data Fetching Logic
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Lesson Details (Overview)
        // Note: Humne dummy data insert kiya tha, lekin ID match nahi karegi.
        // Testing ke liye hum pehla lesson utha rahe hain agar ID match na ho.
        
        let { data: lessonData, error } = await supabase
          .from("lessons")
          .select("*")
          .eq("id", params.id) 
          .single();

        // FAILSAFE: Agar URL wali ID nahi mili, to database se pehla lesson dikha do (Testing ke liye)
        if (!lessonData) {
            const { data: firstLesson } = await supabase.from("lessons").select("*").limit(1).single();
            lessonData = firstLesson;
        }

        if (lessonData) {
          setLesson(lessonData);
          
          // 2. Fetch Notes related to this lesson
          const { data: notesData } = await supabase
            .from("notes")
            .eq("lesson_id", lessonData.id);
          setNotes(notesData || []);

          // 3. Fetch Q&A related to this lesson
          const { data: commentsData } = await supabase
            .from("comments")
            .eq("lesson_id", lessonData.id);
          setComments(commentsData || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) return <div className="p-10 text-center">Loading Class...</div>;
  if (!lesson) return <div className="p-10 text-center text-red-500">Lesson not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Video Player */}
      <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 shadow-lg">
        <iframe 
          src={lesson.video_url} 
          className="w-full h-full" 
          allowFullScreen 
          title={lesson.title}
        />
      </div>

      <h1 className="text-2xl font-bold mb-4">{lesson.title}</h1>

      {/* TABS SECTION */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview"><Info className="w-4 h-4 mr-2"/> Overview</TabsTrigger>
          <TabsTrigger value="notes"><FileText className="w-4 h-4 mr-2"/> Notes</TabsTrigger>
          <TabsTrigger value="qa"><MessageCircle className="w-4 h-4 mr-2"/> Q&A</TabsTrigger>
        </TabsList>

        {/* 1. Overview Tab */}
        <TabsContent value="overview" className="p-6 bg-white border rounded-md mt-2 shadow-sm min-h-[150px]">
          <h3 className="font-semibold text-lg mb-2 text-gray-800">Class Description</h3>
          <p className="text-gray-600 leading-relaxed">{lesson.description}</p>
        </TabsContent>

        {/* 2. Notes Tab */}
        <TabsContent value="notes" className="p-6 bg-white border rounded-md mt-2 shadow-sm min-h-[150px]">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">Study Material</h3>
          {notes.length === 0 ? <p className="text-gray-500 italic">No notes uploaded yet.</p> : (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li key={note.id} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg hover:bg-gray-100 transition">
                  <span className="font-medium text-gray-700">{note.title}</span>
                  <a 
                    href={note.pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-blue-600 hover:underline flex items-center"
                  >
                    Download PDF
                  </a>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* 3. Q&A Tab */}
        <TabsContent value="qa" className="p-6 bg-white border rounded-md mt-2 shadow-sm min-h-[150px]">
           <h3 className="font-semibold text-lg mb-4 text-gray-800">Discussion</h3>
           <div className="space-y-4">
             {comments.length === 0 ? <p className="text-gray-500 italic">No questions yet. Be the first to ask!</p> : (
                comments.map((comment) => (
                  <div key={comment.id} className="border-b pb-3 last:border-0">
                    <p className="font-bold text-sm text-gray-900">{comment.user_name}</p>
                    <p className="text-gray-700 mt-1">{comment.message}</p>
                  </div>
                ))
             )}
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}