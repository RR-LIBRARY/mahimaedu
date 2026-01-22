import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, User, Mail, Shield, LogOut, Camera } from "lucide-react";

const Profile = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // In a real app, this would update the user profile
    toast.success("Profile updated successfully!");
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (!user) {
    navigate("/login");
    return null;
  }

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
        <h1 className="text-lg font-semibold text-primary-foreground">Profile</h1>
      </div>

      <main className="flex-1 p-4 space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center py-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <Button
              size="icon"
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="mt-4 text-xl font-bold text-foreground">{user.name}</h2>
          <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
        </div>

        {/* Profile Info */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Full Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Role
              </Label>
              <div className="h-10 px-3 py-2 rounded-md bg-muted border border-border text-sm text-muted-foreground capitalize">
                {user.role}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setName(user.name);
                    setIsEditing(false);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="w-full"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground gap-2"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </main>
    </div>
  );
};

export default Profile;
