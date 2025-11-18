import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-muted/30 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logo} alt="Bill Buddy" className="h-10 w-10 transition-transform group-hover:scale-110" />
            <span className="text-2xl font-bold text-gradient-gold">BILL BUDDY</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/upload" className="text-muted-foreground hover:text-foreground transition-colors">
              Upload
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
