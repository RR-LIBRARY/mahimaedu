// Mock data for Mahima Academy - No backend required
export interface Course {
  id: number;
  title: string;
  description: string;
  grade: number;
  thumbnailUrl: string;
  videoUrl?: string;
  published: boolean;
}

export interface Student {
  id: number;
  name: string;
  rollNumber: string;
  grade: number;
  section: string;
  avatarUrl?: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  avatarUrl?: string;
}

export interface AttendanceRecord {
  studentId: number;
  status: 'present' | 'absent' | 'late';
  date: string;
}

export const courses: Course[] = [
  {
    id: 1,
    title: "Fun with Numbers",
    description: "Learn counting, addition and subtraction through games",
    grade: 1,
    thumbnailUrl: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=400",
    published: true
  },
  {
    id: 2,
    title: "ABC Adventures",
    description: "Master the alphabet with fun stories and songs",
    grade: 1,
    thumbnailUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400",
    published: true
  },
  {
    id: 3,
    title: "Science Explorers",
    description: "Discover the world around you through simple experiments",
    grade: 2,
    thumbnailUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400",
    published: true
  },
  {
    id: 4,
    title: "Story Time Heroes",
    description: "Improve reading skills with exciting stories",
    grade: 3,
    thumbnailUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400",
    published: true
  },
  {
    id: 5,
    title: "Math Champions",
    description: "Multiplication, division and problem solving",
    grade: 4,
    thumbnailUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400",
    published: true
  },
  {
    id: 6,
    title: "Environmental Studies",
    description: "Learn about nature, conservation and our planet",
    grade: 5,
    thumbnailUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400",
    published: true
  }
];

export const students: Student[] = [
  { id: 1, name: "Aarav Sharma", rollNumber: "001", grade: 1, section: "A" },
  { id: 2, name: "Ananya Patel", rollNumber: "002", grade: 1, section: "A" },
  { id: 3, name: "Arjun Gupta", rollNumber: "003", grade: 1, section: "A" },
  { id: 4, name: "Diya Reddy", rollNumber: "004", grade: 2, section: "A" },
  { id: 5, name: "Ishaan Singh", rollNumber: "005", grade: 2, section: "B" },
  { id: 6, name: "Kavya Nair", rollNumber: "006", grade: 3, section: "A" },
  { id: 7, name: "Lakshmi Iyer", rollNumber: "007", grade: 3, section: "B" },
  { id: 8, name: "Manish Kumar", rollNumber: "008", grade: 4, section: "A" },
  { id: 9, name: "Neha Verma", rollNumber: "009", grade: 4, section: "A" },
  { id: 10, name: "Omkar Joshi", rollNumber: "010", grade: 5, section: "A" },
  { id: 11, name: "Priya Menon", rollNumber: "011", grade: 5, section: "B" },
  { id: 12, name: "Rahul Das", rollNumber: "012", grade: 5, section: "A" },
];

export const currentTeacher: Teacher = {
  id: "T101",
  name: "Shashi Bhan",
  email: "shashi.bhan@mahimaacademy.edu",
  phone: "+91 98765 43210",
  designation: "Class Teacher - Grade 1A"
};

export const gradeOptions = [1, 2, 3, 4, 5];
export const sectionOptions = ['A', 'B', 'C'];
