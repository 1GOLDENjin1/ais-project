import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, Heart, Brain, Eye, Bone, Activity } from "lucide-react";
import PaymentModal from "@/components/PaymentModal";

const Services = () => {
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleBookService = (service: any) => {
    setSelectedService(service);
    setIsPaymentModalOpen(true);
  };

  const services = [
    {
      icon: Activity,
      title: "Complete Laboratory Test",
      description: "Comprehensive blood work and laboratory analysis",
      features: ["Blood Chemistry", "Hematology", "Urinalysis", "Lipid Profile"],
      price: "₱1,200"
    },
    {
      icon: Bone,
      title: "X-ray",
      description: "Digital radiographic imaging services",
      features: ["Chest X-ray", "Bone X-ray", "Abdominal X-ray", "Digital Imaging"],
      price: "₱800"
    },
    {
      icon: Heart,
      title: "ECG",
      description: "Electrocardiogram testing for heart health",
      features: ["12-Lead ECG", "Rhythm Analysis", "Heart Rate Monitoring", "Cardiac Assessment"],
      price: "₱600"
    },
    {
      icon: Eye,
      title: "Ultrasound",
      description: "Non-invasive diagnostic imaging using sound waves",
      features: ["Abdominal Ultrasound", "Pelvic Ultrasound", "Cardiac Echo", "Doppler Studies"],
      price: "₱1,500"
    },
    {
      icon: Stethoscope,
      title: "Drug Test",
      description: "Professional drug screening services",
      features: ["Pre-Employment Testing", "Random Testing", "DOT Compliance", "Chain of Custody"],
      price: "₱500"
    },
    {
      icon: Stethoscope,
      title: "Medical Clinic",
      description: "General medical consultation and treatment",
      features: ["General Consultation", "Minor Procedures", "Health Assessment", "Medical Clearance"],
      price: "₱800"
    },
    {
      icon: Heart,
      title: "Vaccination",
      description: "Immunization services for all ages",
      features: ["Adult Vaccines", "Travel Vaccines", "Flu Shots", "COVID-19 Vaccines"],
      price: "₱300"
    },
    {
      icon: Stethoscope,
      title: "Home Service",
      description: "Convenient medical services at your location",
      features: ["Home Laboratory", "Home X-ray", "Home ECG", "Mobile Clinic"],
      price: "₱2,000"
    },
    {
      icon: Activity,
      title: "Pre-Employment Examination",
      description: "Complete medical screening for employment",
      features: ["Physical Exam", "Lab Tests", "X-ray", "Medical Certificate"],
      price: "₱1,800"
    },
    {
      icon: Stethoscope,
      title: "Onsite Annual Physical Examination",
      description: "Corporate health screening at your workplace",
      features: ["Complete Physical", "Laboratory Tests", "Health Screening", "Medical Reports"],
      price: "₱2,500"
    },
    {
      icon: Activity,
      title: "RT PCR / COVID-19 Antigen Test",
      description: "COVID-19 testing services",
      features: ["RT-PCR Test", "Antigen Test", "Travel Clearance", "Health Certificates"],
      price: "₱1,000"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Our Services</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive diagnostic services with state-of-the-art equipment and experienced healthcare professionals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <Card key={index} className="hover:shadow-elegant transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-gradient-primary p-3 rounded-lg">
                      <IconComponent className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-primary">{service.price}</span>
                  </div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleBookService(service)}
                  >
                    Book Service
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {selectedService && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          serviceName={selectedService.title}
          servicePrice={selectedService.price}
          serviceType="service"
        />
      )}
    </div>
  );
};

export default Services;