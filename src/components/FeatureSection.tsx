import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Video, CreditCard, FileText, Shield, Clock, Users, Heart } from "lucide-react";

const FeatureSection = () => {
  const features = [
    {
      icon: Calendar,
      title: "Smart Appointment Scheduling",
      description: "Flexible booking system that allows patients to easily schedule, reschedule, and manage their appointments online.",
      gradient: "bg-gradient-primary",
      action: "Schedule Now"
    },
    {
      icon: Video,
      title: "Online Consultations",
      description: "Secure video consultations that enable remote medical advice and reduce the need for in-person visits.",
      gradient: "bg-gradient-healing",
      action: "Start Consultation"
    },
    {
      icon: CreditCard,
      title: "Secure Payment System",
      description: "HIPAA-compliant payment processing for appointment fees and medical services with multiple payment options.",
      gradient: "bg-gradient-trust",
      action: "View Payments"
    },
    {
      icon: FileText,
      title: "Comprehensive Medical Records",
      description: "Seamless access to your complete medical history, test results, and treatment plans with secure digital record management.",
      gradient: "bg-gradient-primary",
      action: "Access My Records"
    },
    {
      icon: Shield,
      title: "Healthcare Compliance",
      description: "Built-in compliance with healthcare regulations to safeguard patient information and ensure data security.",
      gradient: "bg-gradient-healing",
      action: "Learn More"
    },
    {
      icon: Users,
      title: "Enhanced Patient Communication",
      description: "Direct messaging with healthcare professionals, proactive health reminders, and community engagement features.",
      gradient: "bg-gradient-trust",
      action: "Start Communicating"
    }
  ];

  const stats = [
    { label: "Active Patients", value: "15,000+", icon: Heart },
    { label: "Consultations", value: "50,000+", icon: Video },
    { label: "Uptime", value: "99.9%", icon: Clock },
    { label: "Satisfaction", value: "98%", icon: Users }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            Comprehensive Patient Management at Mendoza Diagnostic Center
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our integrated platform enhances healthcare accessibility and effectiveness through 
            advanced digital solutions designed for patient engagement and convenience.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="medical-card border-0 h-full">
                <CardHeader className="space-y-4">
                  <div className={`${feature.gradient} p-3 rounded-lg w-fit`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                  <Button variant="ghost" className="text-primary hover:text-primary/80 p-0 h-auto font-medium">
                    {feature.action} →
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="medical-card p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center space-y-2">
                  <div className="bg-primary-soft p-3 rounded-lg w-fit mx-auto">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;