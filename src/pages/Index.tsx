import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload } from "lucide-react";
import Navbar from "@/components/Navbar";
import FloatingRupees from "@/components/FloatingRupees";
import heroIllustration from "@/assets/hero-illustration.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingRupees />
      <Navbar />
      
      <main className="relative z-10">
        <section className="container mx-auto px-6 pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  Split Smarter.{" "}
                  <span className="text-gradient-gold">Pay Fairly.</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-xl">
                  AI-powered bill splitting made effortless — scan, assign, and settle in seconds with precision.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/upload">
                  <Button variant="luxury" size="lg" className="w-full sm:w-auto group">
                    Start Splitting
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/upload">
                  <Button variant="luxury-outline" size="lg" className="w-full sm:w-auto">
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Bill
                  </Button>
                </Link>
              </div>

              <div className="pt-8 border-t border-muted/30">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-success rounded-full animate-pulse"></span>
                  Your data stays private and secure
                </p>
              </div>
            </div>

            {/* Right: Illustration */}
            <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-[0_0_50px_rgba(207,166,112,0.15)]">
                <img 
                  src={heroIllustration} 
                  alt="Bill splitting illustration" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent"></div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-luxury p-8 space-y-4 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gradient-gold">AI Recognition</h3>
              <p className="text-muted-foreground">
                Advanced OCR technology automatically extracts items, prices, and quantities from any bill.
              </p>
            </div>

            <div className="card-luxury p-8 space-y-4 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gradient-gold">Smart Splitting</h3>
              <p className="text-muted-foreground">
                Assign items to multiple people with intelligent tax distribution and payment optimization.
              </p>
            </div>

            <div className="card-luxury p-8 space-y-4 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">💎</span>
              </div>
              <h3 className="text-xl font-semibold text-gradient-gold">Luxury Experience</h3>
              <p className="text-muted-foreground">
                Premium interface with smooth animations and elegant design for a delightful splitting experience.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-muted/30 mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              © 2024 Bill Buddy. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Made with <span className="text-primary">✨</span> for fair splits
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
