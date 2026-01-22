import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Mahima Academy" className="h-10 w-10 rounded-xl" />
              <span className="font-bold text-xl text-foreground">Mahima Academy</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Nurturing young minds through joyful learning experiences for grades 1-5.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/courses" className="text-muted-foreground hover:text-primary transition-colors">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>info@mahimaacademy.edu</li>
              <li>+91 98765 43210</li>
              <li>New Delhi, India</li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">School Hours</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Monday - Friday</li>
              <li>8:00 AM - 3:00 PM</li>
              <li>Saturday: 9 AM - 12 PM</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Mahima Academy. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
