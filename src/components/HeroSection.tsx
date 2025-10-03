import { Button } from "@/components/ui/button";
import { Calendar, Video, Shield, Clock } from "lucide-react";
import heroImage from "@/assets/healthcare-hero.jpg";

const HeroSection = () => {
  return (
    <section className="bg-gradient-trust min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="bg-primary-soft px-4 py-2 rounded-full w-fit mb-4">
                <span className="text-primary font-medium">Mendoza Diagnostic Center</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Your Health,
                <span className="bg-gradient-primary bg-clip-text text-transparent"> Our Priority</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Experience enhanced healthcare accessibility with our comprehensive online patient management system. 
                Schedule appointments, access your medical records, and connect with our healthcare professionals seamlessly.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="medical" size="lg" className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Book Appointment</span>
              </Button>
              <Button variant="trust" size="lg" className="flex items-center space-x-2">
                <Video className="h-5 w-5" />
                <span>Start Consultation</span>
              </Button>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-6 pt-8">
              <div className="flex items-center space-x-3">
                <div className="bg-accent-soft p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">24/7 Available</div>
                  <div className="text-sm text-muted-foreground">Round-the-clock care</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-primary-soft p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">HIPAA Compliant</div>
                  <div className="text-sm text-muted-foreground">Secure & private</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="medical-card overflow-hidden">
              <img 
                src={heroImage} 
                alt="Modern healthcare management system"
                className="w-full h-auto object-cover rounded-xl"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-gradient-healing p-4 rounded-xl shadow-glow">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent-foreground">99.9%</div>
                <div className="text-sm text-accent-foreground/80">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;