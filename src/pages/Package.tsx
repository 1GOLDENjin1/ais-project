import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Shield, Heart } from "lucide-react";
import PaymentModal from "@/components/PaymentModal";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const Package = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleBookPackage = (pkg: any) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book a health package.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    setSelectedPackage(pkg);
    setIsPaymentModalOpen(true);
  };



  const packages = [
    {
      name: "Basic Health Package",
      price: "₱2,500",
      duration: "2-3 hours",
      description: "Essential health screening for general wellness",
      features: [
        "Complete Blood Count (CBC)",
        "Urinalysis",
        "Chest X-Ray",
        "Blood Pressure Check",
        "BMI Assessment",
        "Basic Physical Examination"
      ],
      popular: false,
      icon: Shield
    },
    {
      name: "Comprehensive Health Package",
      price: "₱5,500",
      duration: "Half day",
      description: "Thorough health assessment with advanced diagnostics",
      features: [
        "All Basic Package services",
        "ECG (Electrocardiogram)",
        "Lipid Profile",
        "Blood Sugar Test",
        "Liver Function Test",
        "Kidney Function Test",
        "Thyroid Function Test",
        "Consultation with physician"
      ],
      popular: true,
      icon: Heart
    },
    {
      name: "Executive Health Package",
      price: "₱12,000",
      duration: "Full day",
      description: "Premium health screening with specialized tests",
      features: [
        "All Comprehensive Package services",
        "CT Scan (Chest/Abdomen)",
        "Echocardiogram",
        "Stress Test",
        "Tumor Markers",
        "Bone Density Test",
        "Eye Examination",
        "Specialist consultations",
        "Detailed health report"
      ],
      popular: false,
      icon: Star
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Health Packages</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose from our comprehensive health packages designed to meet your specific needs and budget
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {packages.map((pkg, index) => {
            const IconComponent = pkg.icon;
            return (
              <Card 
                key={index} 
                className={`relative hover:shadow-elegant transition-all duration-300 ${
                  pkg.popular ? 'ring-2 ring-primary shadow-lg scale-105' : ''
                }`}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gradient-primary p-4 rounded-full">
                      <IconComponent className="h-8 w-8 text-primary-foreground" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl mb-2">{pkg.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary mb-1">{pkg.price}</div>
                  <div className="text-sm text-muted-foreground mb-2">{pkg.duration}</div>
                  <CardDescription className="text-base">
                    {pkg.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-success mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full" 
                    variant={pkg.popular ? "default" : "outline"}
                    size="lg"
                    onClick={() => handleBookPackage(pkg)}
                  >
                    Book This Package
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 bg-muted rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Need a Custom Package?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            We can create a personalized health package tailored to your specific needs and medical history. 
            Contact our team to discuss your requirements.
          </p>
          <Button variant="medical" size="lg" onClick={() => {
            if (!user) {
              toast({
                title: "Login Required",
                description: "Please login to contact us for custom packages.",
                variant: "destructive",
              });
              navigate('/login');
              return;
            }
            // Handle custom package contact logic here
          }}>
            Contact Us for Custom Package
          </Button>
        </div>
      </main>

      {selectedPackage && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          serviceName={selectedPackage.name}
          servicePrice={selectedPackage.price}
          serviceType="package"
        />
      )}
    </div>
  );
};

export default Package;