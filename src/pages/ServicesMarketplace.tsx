import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useServicesRealtime } from "@/hooks/useRealtimeData";
import { availabilityService } from "@/services/availability";
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
  Package,
  TestTube,
  Stethoscope,
  UserCheck,
  Heart,
  Camera,
  Eye,
  Syringe,
  Loader2
} from "lucide-react";
import { rlsDataService } from '@/lib/rls-data-service';
import { supabase } from '@/lib/supabase';
import type { AvailableServiceView, ActivePackageView, Service } from '@/types/rls-types';

const ServicesMarketplace = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [services, setServices] = useState<AvailableServiceView[]>([]);
  const [packages, setPackages] = useState<ActivePackageView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load services from database
  useEffect(() => {
    loadServices();
  }, []);

  // Real-time subscription for services changes
  useServicesRealtime(
    (payload) => {
      console.log('Services realtime update:', payload);
      // Reload services when there's a change
      loadServices();
    },
    true // enabled
  );

  const loadServices = async () => {
    setIsLoading(true);
    try {
      // First try to load from database views
      let servicesData, packagesData;
      
      try {
        [servicesData, packagesData] = await Promise.all([
          rlsDataService.getAvailableServices(),
          rlsDataService.getActivePackages()
        ]);
        console.log('✅ Loaded services from database:', servicesData?.length || 0);
      } catch (dbError) {
        console.log('Database view failed, trying direct table access:', dbError);
        
        // Fallback: Direct table access
        const { data: directServicesData, error: directError } = await supabase
          .from('services')
          .select('*')
          .eq('is_available', true)
          .order('display_order', { ascending: true })
          .order('name', { ascending: true });
          
        if (!directError && directServicesData) {
          servicesData = directServicesData.map(service => ({
            service_id: service.id,
            service_name: service.name,
            category: service.category,
            description: service.description,
            duration: service.duration,
            price: service.price,
            is_available: service.is_available,
            home_service_available: service.home_service_available,
            doctor_specialty: service.doctor_specialty,
            status: service.status
          }));
          console.log('✅ Loaded services from direct table:', servicesData?.length || 0);
        } else {
          console.log('Direct table access also failed, using sample data');
          servicesData = getSampleServices();
        }
        
        packagesData = [];
      }
      
      // If no services loaded, use sample data
      if (!servicesData || servicesData.length === 0) {
        console.log('No services found in database, using sample data');
        servicesData = getSampleServices();
      }
      
      setServices(servicesData);
      setPackages(packagesData || []);
      
      console.log('Final services loaded:', servicesData?.length || 0);
      
    } catch (error) {
      console.error('Error loading services:', error);
      
      // Use sample data as ultimate fallback
      const fallbackServices = getSampleServices();
      setServices(fallbackServices);
      setPackages([]);
      
      toast({
        title: "Services Loaded",
        description: `Showing ${fallbackServices.length} available services. Database connection may be limited.`,
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sample services data that matches your database schema
  const getSampleServices = (): AvailableServiceView[] => {
    return [
      {
        service_id: 'lab-complete',
        service_name: 'Complete Laboratory Test',
        category: 'laboratory',
        description: 'Comprehensive blood work and laboratory analysis including CBC, chemistry panel, and urinalysis. Fasting for 8-12 hours required.',
        duration: '2-3 hours',
        price: 1200,
        is_available: true,
        home_service_available: true,
        doctor_specialty: 'Pathology',
        status: 'available'
      },
      {
        service_id: 'xray-digital',
        service_name: 'Digital X-ray',
        category: 'imaging',
        description: 'High-quality digital radiographic imaging for accurate diagnosis. Please remove metal objects and jewelry.',
        duration: '30-45 minutes',
        price: 800,
        is_available: true,
        home_service_available: false,
        doctor_specialty: 'Radiology',
        status: 'available'
      },
      {
        service_id: 'ecg-test',
        service_name: 'ECG/EKG Test',
        category: 'testing',
        description: 'Electrocardiogram to monitor heart rhythm and electrical activity. Avoid caffeine 4 hours before test.',
        duration: '15-30 minutes',
        price: 600,
        is_available: true,
        home_service_available: true,
        doctor_specialty: 'Cardiology',
        status: 'available'
      },
      {
        service_id: 'ultrasound',
        service_name: 'Ultrasound Imaging',
        category: 'imaging',
        description: 'Non-invasive diagnostic imaging using high-frequency sound waves. Specific preparation depends on type of ultrasound.',
        duration: '45-60 minutes',
        price: 1500,
        is_available: true,
        home_service_available: false,
        doctor_specialty: 'Radiology',
        status: 'available'
      },
      {
        service_id: 'drug-test',
        service_name: 'Drug Screening Test',
        category: 'testing',
        description: 'Professional drug screening for employment or compliance purposes. Valid ID required.',
        duration: '30 minutes',
        price: 500,
        is_available: true,
        home_service_available: false,
        doctor_specialty: 'Occupational Medicine',
        status: 'available'
      },
      {
        service_id: 'consultation',
        service_name: 'General Medical Consultation',
        category: 'consultation',
        description: 'Comprehensive medical consultation with experienced physicians. Bring previous medical records if available.',
        duration: '30-45 minutes',
        price: 800,
        is_available: true,
        home_service_available: true,
        doctor_specialty: 'General Medicine',
        status: 'available'
      },
      {
        service_id: 'vaccination',
        service_name: 'Vaccination Services',
        category: 'vaccination',
        description: 'Complete immunization services for all ages including travel vaccines. Bring vaccination records.',
        duration: '15-30 minutes',
        price: 300,
        is_available: true,
        home_service_available: true,
        doctor_specialty: 'Family Medicine',
        status: 'available'
      },
      {
        service_id: 'pre-employment',
        service_name: 'Pre-Employment Medical Exam',
        category: 'examination',
        description: 'Complete medical examination required for employment including physical exam and basic tests. Fasting required, bring valid ID.',
        duration: '2-3 hours',
        price: 1800,
        is_available: true,
        home_service_available: false,
        doctor_specialty: 'Occupational Medicine',
        status: 'available'
      },
      {
        service_id: 'covid-test',
        service_name: 'COVID-19 Testing',
        category: 'testing',
        description: 'RT-PCR and Antigen tests for COVID-19 with quick results. Avoid eating/drinking 30 minutes before test.',
        duration: '15 minutes',
        price: 1000,
        is_available: true,
        home_service_available: true,
        doctor_specialty: 'Infectious Disease',
        status: 'available'
      }
    ];
  };

  // Get service icon based on category
  const getServiceIcon = (category: string) => {
    switch (category) {
      case 'laboratory': return TestTube;
      case 'imaging': return Camera;
      case 'consultation': return Stethoscope;
      case 'examination': return UserCheck;
      case 'vaccination': return Syringe;
      case 'testing': return TestTube;
      default: return Heart;
    }
  };

  // Convert database availability status to display format
  const getDisplayAvailability = (status?: string, isAvailable?: boolean) => {
    // If status and is_available are undefined (not in view), assume available
    if (status === undefined && isAvailable === undefined) {
      return 'available';
    }
    
    // If is_available is explicitly false, show as booked
    if (isAvailable === false) return 'booked';
    
    switch (status) {
      case 'available': return 'available';
      case 'limited': return 'limited';
      case 'unavailable':
      case 'maintenance': return 'booked';
      default: return 'available';
    }
  };

  // Mock availability check based on service characteristics for demo purposes
  const getServiceAvailability = (service: AvailableServiceView) => {
    // If database has explicit status, use it
    if (service.status !== undefined || service.is_available !== undefined) {
      return getDisplayAvailability(service.status, service.is_available);
    }
    
    // Mock logic: Make some services limited availability for demonstration
    const limitedServices = ['MRI Scan', 'CT Scan', 'Ultrasound', 'X-Ray'];
    const bookedServices = ['Emergency Consultation']; // Example of booked service
    
    if (bookedServices.includes(service.service_name)) {
      return 'booked';
    } else if (limitedServices.includes(service.service_name)) {
      return 'limited';
    } else {
      return 'available';
    }
  };

  const categories = [
    { value: 'all', label: 'All Services', count: services.length },
    { value: 'consultation', label: 'Consultations', count: services.filter(s => s.category === 'consultation').length },
    { value: 'laboratory', label: 'Laboratory Tests', count: services.filter(s => s.category === 'laboratory').length },
    { value: 'imaging', label: 'Imaging Services', count: services.filter(s => s.category === 'imaging').length },
    { value: 'examination', label: 'Health Examinations', count: services.filter(s => s.category === 'examination').length },
    { value: 'vaccination', label: 'Vaccinations', count: services.filter(s => s.category === 'vaccination').length },
    { value: 'testing', label: 'Testing Services', count: services.filter(s => s.category === 'testing').length }
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.doctor_specialty && service.doctor_specialty.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    
    const matchesPrice = priceRange === 'all' || 
                        (priceRange === 'under-1000' && service.price < 1000) ||
                        (priceRange === '1000-2500' && service.price >= 1000 && service.price <= 2500) ||
                        (priceRange === 'above-2500' && service.price > 2500);
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const handleBookService = (service: AvailableServiceView) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login as a patient to book this service.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (user.role !== 'patient') {
      toast({
        title: "Patient Account Required",
        description: "Only patients can book healthcare services.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to booking page with service details
    navigate('/book-appointment', { 
      state: { 
        serviceId: service.service_id,
        serviceName: service.service_name,
        servicePrice: service.price,
        serviceDuration: service.duration,
        serviceCategory: service.category,
        preparation: undefined, // Not available in AvailableServiceView
        homeServiceAvailable: service.home_service_available
      } 
    });
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'limited': return 'bg-yellow-100 text-yellow-800';
      case 'booked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">Loading Services</h2>
              <p className="text-muted-foreground">Please wait while we load our healthcare services...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Healthcare Services
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our comprehensive range of medical services. Book appointments with trusted healthcare professionals at Mendoza Diagnostic Center.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label} ({category.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger>
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="under-1000">Under ₱1,000</SelectItem>
              <SelectItem value="1000-2500">₱1,000 - ₱2,500</SelectItem>
              <SelectItem value="above-2500">Above ₱2,500</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredServices.length} of {services.length} services
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const IconComponent = getServiceIcon(service.category);
            const availability = getServiceAvailability(service);
            
            return (
                            <Card key={service.service_id} className="relative hover:shadow-lg transition-shadow">
                {service.popular && (
                  <Badge className="absolute top-4 right-4 bg-blue-500">
                    Popular
                  </Badge>
                )}
                
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                                            <CardTitle className="text-lg">{service.service_name}</CardTitle>
                      <CardDescription>{service.doctor_specialty || 'Healthcare Professional'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {service.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{service.duration}</span>
                      </div>
                      <Badge className={getAvailabilityColor(availability)}>
                        {availability}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-primary">
                      {formatPrice(service.price)}
                    </div>
                    {service.home_service_available && (
                      <Badge variant="outline" className="text-xs">
                        <Home className="h-3 w-3 mr-1" />
                        Home Service
                      </Badge>
                    )}
                  </div>

                  {service.description.includes('required') || service.description.includes('Fasting') || service.description.includes('Avoid') || service.description.includes('Bring') ? (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                      <div className="flex items-start gap-1">
                        <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span className="text-amber-800">
                          {service.description.includes('Fasting') ? 'Fasting required' :
                           service.description.includes('Avoid') ? 'Special preparation needed' :
                           service.description.includes('Bring') ? 'Documents required' :
                           'Preparation required - see description'}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </CardContent>

                <CardFooter>
                  <Button 
                    onClick={() => handleBookService(service)}
                    className="w-full"
                    disabled={availability === 'booked'}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {availability === 'booked' ? 'Fully Booked' : 'Book Now'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {filteredServices.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No services found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or browse all available services.
            </p>
          </div>
        )}

        {/* Service Packages Section */}
        {packages.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">Service Packages</h2>
            <p className="text-center text-muted-foreground mb-8">
              Save money with our carefully curated health packages
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {packages.filter(pkg => pkg.popular).map((packageItem) => (
                <Card key={packageItem.package_id} className="relative hover:shadow-lg transition-shadow">
                  {packageItem.popular && (
                    <Badge className="absolute top-4 right-4 bg-green-500">
                      Popular Package
                    </Badge>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{packageItem.package_name}</CardTitle>
                        <CardDescription>{packageItem.duration}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {packageItem.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Original Price:</span>
                        <span className="line-through">{formatPrice(packageItem.original_price)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Package Price:</span>
                        <span className="text-primary">{formatPrice(packageItem.package_price)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium text-green-600">
                        <span>You Save:</span>
                        <span>{formatPrice(packageItem.savings)}</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button 
                      onClick={() => {
                        // Navigate to package booking
                        if (!user) {
                          toast({
                            title: "Login Required",
                            description: "Please login as a patient to book this package.",
                            variant: "destructive",
                          });
                          navigate('/login');
                          return;
                        }
                        
                        navigate('/book-appointment', { 
                          state: { 
                            serviceId: packageItem.id,
                            serviceName: packageItem.name,
                            servicePrice: packageItem.package_price,
                            serviceDuration: packageItem.duration,
                            serviceCategory: 'package',
                            isPackage: true
                          } 
                        });
                      }}
                      className="w-full"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Book Package
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Why Choose Us Section */}
        <div className="mt-16 bg-muted/30 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose Mendoza Diagnostic Center?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Expert Doctors</h3>
              <p className="text-sm text-muted-foreground">
                Board-certified physicians and specialists with years of experience.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TestTube className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Modern Equipment</h3>
              <p className="text-sm text-muted-foreground">
                State-of-the-art diagnostic and treatment equipment for accurate results.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Quick Service</h3>
              <p className="text-sm text-muted-foreground">
                Efficient booking system and minimal waiting times for better patient experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesMarketplace;