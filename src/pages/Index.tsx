import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeatureSection from "@/components/FeatureSection";
import AppointmentBooking from "@/components/AppointmentBooking";
import PatientDashboard from "@/components/PatientDashboard";
import { Button } from "@/components/ui/button";
import { Calendar, Video, CreditCard, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { seedTestUsers } from "@/utils/seedUsers";
import React, { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();

  // Auto-seed database on first load (for development)
  useEffect(() => {
    const shouldSeed = localStorage.getItem('db_seeded') !== 'true';
    if (shouldSeed) {
      console.log('🌱 Auto-seeding database with test users...');
      seedTestUsers().then(() => {
        localStorage.setItem('db_seeded', 'true');
      }).catch(error => {
        console.error('Failed to seed database:', error);
      });
    }
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
        
        {/* Quick Actions Section */}
        <section className="py-16 bg-secondary/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Our Healthcare Services</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Browse and book from our comprehensive range of medical services
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <Button 
                  variant="medical" 
                  size="lg" 
                  className="w-full h-20 text-lg flex-col space-y-2"
                  onClick={() => navigate('/services')}
                >
                  <ShoppingCart className="h-6 w-6" />
                  <span>Browse Services</span>
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  View all available healthcare services with pricing
                </p>
              </div>
              <div className="text-center">
                <Button 
                  variant="healing" 
                  size="lg" 
                  className="w-full h-20 text-lg flex-col space-y-2"
                  onClick={() => navigate('/services')}
                >
                  <Calendar className="h-6 w-6" />
                  <span>Book Appointment</span>
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Schedule consultations and medical procedures
                </p>
              </div>
              <div className="text-center">
                <Button 
                  variant="trust" 
                  size="lg" 
                  className="w-full h-20 text-lg flex-col space-y-2"
                  onClick={() => navigate('/services')}
                >
                  <Video className="h-6 w-6" />
                  <span>Health Packages</span>
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Comprehensive health screening packages
                </p>
              </div>
            </div>
            
            {/* Featured Services Preview */}
            <div className="mt-16">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">Popular Services</h3>
                <p className="text-muted-foreground">Most frequently booked healthcare services</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-card rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-semibold mb-1">General Consultation</h4>
                  <p className="text-sm text-muted-foreground mb-2">30 mins</p>
                  <p className="text-lg font-bold text-primary">₱1,500</p>
                </div>
                <div className="bg-card rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-semibold mb-1">Complete Blood Count</h4>
                  <p className="text-sm text-muted-foreground mb-2">15 mins</p>
                  <p className="text-lg font-bold text-primary">₱800</p>
                </div>
                <div className="bg-card rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-semibold mb-1">Chest X-Ray</h4>
                  <p className="text-sm text-muted-foreground mb-2">20 mins</p>
                  <p className="text-lg font-bold text-primary">₱1,500</p>
                </div>
                <div className="bg-card rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-semibold mb-1">Executive Package</h4>
                  <p className="text-sm text-muted-foreground mb-2">3 hours</p>
                  <p className="text-lg font-bold text-primary">₱8,500</p>
                </div>
              </div>
              <div className="text-center mt-8">
                <Button 
                  size="lg"
                  onClick={() => navigate('/services')}
                >
                  View All Services
                </Button>
              </div>
            </div>
          </div>
        </section>

        <FeatureSection />
        <PatientDashboard />
        <AppointmentBooking />
      </main>
    </div>
  );
};

export default Index;
