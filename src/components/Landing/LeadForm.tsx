import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast"; 
import { Send } from "lucide-react";
// FIX: Path change kiya hai
import { supabase } from "@/supabaseClient"; 

const LeadForm = () => {
  const [formData, setFormData] = useState({
    parentName: "",
    email: "",
    grade: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.parentName || !formData.email || !formData.grade) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Database Insert
      const { error } = await supabase
        .from('leads')
        .insert([
          {
            parent_name: formData.parentName, // Matches SQL 'parent_name'
            email: formData.email,            // Matches SQL 'email'
            grade: formData.grade,            // Matches SQL 'grade'
          }
        ]);

      if (error) throw error;

      // Success
      toast({ title: "Success", description: "Request received!" });
      setFormData({ parentName: "", email: "", grade: "" });
      
    } catch (error: any) {
      console.error("Error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4 max-w-xl">
        <div className="bg-card p-8 rounded-3xl shadow-lg border border-border">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Book a Free Demo</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Parent's Name"
              value={formData.parentName}
              onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
            />
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Select
              value={formData.grade}
              onValueChange={(val) => setFormData({ ...formData, grade: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((g) => (
                  <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Request Demo"} 
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default LeadForm;
