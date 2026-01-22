import { Menu, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

interface HeaderProps {
  onMenuClick: () => void;
  userName?: string;
}

const Header = ({ onMenuClick, userName }: HeaderProps) => {
  const { user, isAuthenticated } = useAuth();
  const displayName = user?.name || userName;

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="text-foreground hover:bg-muted"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <img src={logo} alt="Mahima Academy" className="h-9 w-9 rounded-lg" />
          <span className="font-semibold text-lg text-foreground hidden sm:inline">
            Mahima Academy
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-accent border-2 border-card" />
        </Button>
        {isAuthenticated ? (
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted relative">
              {user?.name ? (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <User className="h-5 w-5" />
              )}
            </Button>
          </Link>
        ) : (
          <Link to="/login">
            <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
