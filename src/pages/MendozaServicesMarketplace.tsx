import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Clock, 
  PhilippinePeso, 
  MapPin, 
  CheckCircle, 
  Star,
  Calendar,
  Home,
  AlertCircle,
  Package
} from "lucide-react";

// Import the service data - if this fails, we'll create inline data
let diagnosticServices: any[] = [];
let serviceCategories: any[] = [];
let servicePackages: any[] = [];

try {
  const serviceData = require('@/data/services');
  diagnosticServices = serviceData.diagnosticServices || [];
  serviceCategories = serviceData.serviceCategories || [];
  servicePackages = serviceData.servicePackages || [];
} catch (error) {
  console.log('Using fallback service data');
  
  // Fallback service data
  diagnosticServices = [
    {
      id: 'complete-lab-test',
      name: 'Complete Laboratory Test',
      category: 'laboratory',
      description: 'Comprehensive blood work including CBC, chemistry panel, lipid profile, and urinalysis',
      duration: '2-4 hours for results',
      price: 2500,
      preparation: '8-12 hours fasting required',
      requirements: ['Valid ID', 'Doctor\'s request (if applicable)'],
      isAvailable: true,
      homeServiceAvailable: true
    },
    {
      id: 'chest-xray',
      name: 'Chest X-ray',
      category: 'imaging',
      description: 'Digital chest radiography for lung and heart assessment',
      duration: '15-30 minutes',
      price: 800,
      preparation: 'Remove metallic objects and jewelry',
      requirements: ['Valid ID', 'Pregnancy disclosure (for women)'],
      isAvailable: true,
      homeServiceAvailable: false
    },
    {
      id: 'general-consultation',
      name: 'General Medical Consultation',
      category: 'consultation',
      description: 'General health assessment and medical advice',
      duration: '30-45 minutes',
      price: 1000,
      preparation: 'Prepare list of symptoms and medical history',
      requirements: ['Valid ID', 'Previous medical records (if available)'],
      isAvailable: true,
      homeServiceAvailable: true
    },
    {
      id: 'pre-employment-exam',
      name: 'Pre-Employment Medical Examination',
      category: 'examination',
      description: 'Comprehensive health assessment for employment requirements',
      duration: '2-3 hours',
      price: 2800,
      preparation: '8 hours fasting for laboratory tests',
      requirements: ['Valid ID', 'Employment letter', 'Medical history'],
      isAvailable: true,
      homeServiceAvailable: false
    }
  ];

  serviceCategories = [
    { id: 'all', name: 'All Services', icon: '🏥' },
    { id: 'laboratory', name: 'Laboratory Tests', icon: '🧪' },
    { id: 'imaging', name: 'Imaging Services', icon: '📷' },
    { id: 'consultation', name: 'Medical Consultations', icon: '👨‍⚕️' },
    { id: 'examination', name: 'Health Examinations', icon: '🏥' }
  ];

  servicePackages = [
    {
      id: 'basic-health-package',
      name: 'Basic Health Package',
      description: 'Essential health screening for general wellness',
      services: ['complete-lab-test', 'chest-xray'],
      originalPrice: 3300,
      packagePrice: 2800,
      savings: 500,
      duration: '2-3 hours'
    }
  ];
}

const ServicesMarketplace = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showHomeServiceOnly, setShowHomeServiceOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<'all' | 'under-1000' | '1000-3000' | 'over-3000'>('all');

  // Filter and sort services
  const filteredServices = useMemo(() => {
    let filtered = diagnosticServices.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           service.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
      const matchesHomeService = !showHomeServiceOnly || service.homeServiceAvailable;
      const matchesPriceRange = 
        priceRange === 'all' ||
        (priceRange === 'under-1000' && service.price < 1000) ||
        (priceRange === '1000-3000' && service.price >= 1000 && service.price <= 3000) ||
        (priceRange === 'over-3000' && service.price > 3000);

      return matchesSearch && matchesCategory && matchesHomeService && matchesPriceRange && service.isAvailable;
    });

    // Sort services
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedCategory, sortBy, showHomeServiceOnly, priceRange]);

  const handleBookService = (service: any) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book appointments.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (user.role !== 'patient') {
      toast({
        title: "Access Restricted",
        description: "Only patients can book appointments.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to booking page with service details
    navigate('/book-appointment', {
      state: {
        serviceId: service.id,
        serviceName: service.name,
        serviceCategory: service.category,
        servicePrice: service.price,
        serviceDuration: service.duration,
        serviceDescription: service.description,
        preparation: service.preparation,
        requirements: service.requirements,
        homeServiceAvailable: service.homeServiceAvailable
      }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = serviceCategories.find(cat => cat.id === category);
    return categoryData?.icon || '🏥';
  };

  const ServiceCard: React.FC<{ service: any }> = ({ service }) => (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 line-clamp-2">{service.name}</CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {getCategoryIcon(service.category)} {service.category.replace('-', ' ').toUpperCase()}
              </Badge>
              {service.homeServiceAvailable && (
                <Badge variant="outline" className="text-xs">
                  <Home className="h-3 w-3 mr-1" />
                  Home Service
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{formatPrice(service.price)}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <CardDescription className="text-sm mb-4 line-clamp-3 flex-1">
          {service.description}
        </CardDescription>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            {service.duration}
          </div>
          
          {service.preparation && (
            <div className="flex items-start text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{service.preparation}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-auto">
          <Button 
            onClick={() => handleBookService(service)}
            className="flex-1"
            size="sm"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Book Now
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              toast({
                title: service.name,
                description: service.description,
              });
            }}
          >
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const PackageCard: React.FC<{ pkg: any }> = ({ pkg }) => (
    <Card className="h-full flex flex-col border-2 border-primary/20 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-5 w-5 text-primary" />
          <Badge variant="default">Package Deal</Badge>
        </div>
        <CardTitle className="text-xl">{pkg.name}</CardTitle>
        <CardDescription>{pkg.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(pkg.originalPrice)}
            </span>
            <span className="text-2xl font-bold text-primary">
              {formatPrice(pkg.packagePrice)}
            </span>
          </div>
          <div className="flex items-center text-sm text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            Save {formatPrice(pkg.savings)}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            {pkg.duration}
          </div>
        </div>

        <Button 
          onClick={() => {
            if (!user) {
              toast({
                title: "Login Required",
                description: "Please login to book packages.",
                variant: "destructive",
              });
              navigate('/login');
              return;
            }

            navigate('/book-appointment', {
              state: {
                serviceId: pkg.id,
                serviceName: pkg.name,
                serviceCategory: 'package',
                servicePrice: pkg.packagePrice,
                serviceDuration: pkg.duration,
                serviceDescription: pkg.description,
                isPackage: true,
                packageServices: pkg.services
              }
            });
          }}
          className="mt-auto"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Book Package
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Mendoza Diagnostic Center</h1>
          <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
            Comprehensive healthcare services with accurate diagnostics, quality care, and convenient scheduling.
            Serving Pulilan, Bulacan and surrounding areas.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              DOH Accredited
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Home Service Available
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Online Consultations
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Secure Payments
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search services, tests, or examinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={(value: any) => setPriceRange(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="under-1000">Under ₱1,000</SelectItem>
                  <SelectItem value="1000-3000">₱1,000 - ₱3,000</SelectItem>
                  <SelectItem value="over-3000">Over ₱3,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant={showHomeServiceOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowHomeServiceOnly(!showHomeServiceOnly)}
            >
              <Home className="h-4 w-4 mr-2" />
              Home Service Only
            </Button>
          </div>
        </div>

        {/* Service Packages and Individual Services Tabs */}
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="services">Individual Services ({filteredServices.length})</TabsTrigger>
            <TabsTrigger value="packages">Health Packages ({servicePackages.length})</TabsTrigger>
          </TabsList>

          {/* Individual Services */}
          <TabsContent value="services" className="space-y-6">
            {filteredServices.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No services found matching your criteria</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredServices.map(service => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Health Packages */}
          <TabsContent value="packages" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicePackages.map(pkg => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Contact Information */}
        <div className="mt-16 bg-muted/30 rounded-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <MapPin className="h-8 w-8 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Visit Our Center</h3>
              <p className="text-sm text-muted-foreground">
                Mendoza Diagnostic Center<br />
                Pulilan, Bulacan
              </p>
            </div>
            <div>
              <Clock className="h-8 w-8 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Operating Hours</h3>
              <p className="text-sm text-muted-foreground">
                Monday - Saturday: 8:00 AM - 6:00 PM<br />
                Sunday: 9:00 AM - 4:00 PM
              </p>
            </div>
            <div>
              <Home className="h-8 w-8 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Home Service</h3>
              <p className="text-sm text-muted-foreground">
                Available for selected services<br />
                Schedule online or call us
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesMarketplace;