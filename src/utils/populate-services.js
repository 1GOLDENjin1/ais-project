// Quick services populator - run this in browser console
// Copy paste this entire code in browser console to add services

console.log('🏥 Services Populator Loading...');

async function populateServices() {
  console.log('📋 Starting services population...');
  
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    
    // Your Supabase config
    const supabaseUrl = 'https://okwsgaseenyhlupnqewo.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rd3NnYXNlZW55aGx1cG5xZXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcxODUxNjAsImV4cCI6MjA0Mjc2MTE2MH0.z06wkRaLRVKjKZcIC-ObZBOhHGyNgVT5nqe5F2W0B2M';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if services exist
    const { data: existingServices } = await supabase
      .from('services')
      .select('id')
      .limit(1);
    
    if (existingServices && existingServices.length > 0) {
      console.log('✅ Services already exist!');
      return;
    }

    console.log('📝 Creating services...');

    // Create services data
    const services = [
      {
        id: 'complete-lab-test',
        name: 'Complete Laboratory Test',
        category: 'laboratory',
        description: 'Comprehensive blood work including CBC, chemistry panel, lipid profile, and urinalysis',
        duration: '2-4 hours for results',
        price: 2500,
        preparation: '8-12 hours fasting required',
        requirements: ['Valid ID', 'Doctor\'s request (if applicable)'],
        is_available: true,
        home_service_available: true,
        equipment_required: ['Blood collection supplies', 'Laboratory equipment'],
        status: 'available',
        popular: true,
        doctor_specialty: 'Laboratory Medicine'
      },
      {
        id: 'cbc-test',
        name: 'Complete Blood Count (CBC)',
        category: 'laboratory',
        description: 'Analysis of blood cells including red blood cells, white blood cells, and platelets',
        duration: '1-2 hours for results',
        price: 350,
        preparation: 'No special preparation required',
        requirements: ['Valid ID'],
        is_available: true,
        home_service_available: true,
        equipment_required: null,
        status: 'available',
        popular: true,
        doctor_specialty: 'Laboratory Medicine'
      },
      {
        id: 'fbs-test',
        name: 'Fasting Blood Sugar (FBS)',
        category: 'laboratory',
        description: 'Blood glucose level measurement after fasting',
        duration: '30 minutes for results',
        price: 150,
        preparation: '8-12 hours fasting required',
        requirements: ['Valid ID'],
        is_available: true,
        home_service_available: true,
        equipment_required: null,
        status: 'available',
        popular: true,
        doctor_specialty: 'Laboratory Medicine'
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
        is_available: true,
        home_service_available: false,
        equipment_required: ['Digital X-ray machine'],
        status: 'available',
        popular: true,
        doctor_specialty: 'Radiology'
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
        is_available: true,
        home_service_available: true,
        equipment_required: null,
        status: 'available',
        popular: true,
        doctor_specialty: 'General Medicine'
      },
      {
        id: 'covid-vaccination',
        name: 'COVID-19 Vaccination',
        category: 'vaccination',
        description: 'COVID-19 vaccine administration with health screening',
        duration: '30 minutes (including observation)',
        price: 1500,
        preparation: 'Eat before vaccination, bring vaccination card',
        requirements: ['Valid ID', 'Vaccination card', 'Health screening'],
        is_available: true,
        home_service_available: true,
        equipment_required: ['Vaccine storage', 'Emergency kit'],
        status: 'available',
        popular: true,
        doctor_specialty: 'General Medicine'
      }
    ];

    // Insert services
    const { error: servicesError } = await supabase
      .from('services')
      .insert(services);

    if (servicesError) {
      console.error('❌ Error inserting services:', servicesError);
      return;
    }

    console.log('✅ Services created successfully!');

    // Create service packages
    const packages = [
      {
        id: 'basic-health-package',
        name: 'Basic Health Package',
        description: 'Essential health screening for general wellness',
        original_price: 1450,
        package_price: 1200,
        savings: 250,
        duration: '2-3 hours',
        is_active: true,
        popular: true
      },
      {
        id: 'comprehensive-health-package',
        name: 'Comprehensive Health Package',
        description: 'Complete health assessment with detailed analysis',
        original_price: 6300,
        package_price: 5200,
        savings: 1100,
        duration: '4-6 hours',
        is_active: true,
        popular: true
      }
    ];

    // Insert packages
    const { error: packagesError } = await supabase
      .from('service_packages')
      .insert(packages);

    if (packagesError) {
      console.error('❌ Error inserting packages:', packagesError);
    } else {
      console.log('✅ Service packages created successfully!');
    }

    // Create package-service relationships
    const packageServices = [
      { package_id: 'basic-health-package', service_id: 'cbc-test' },
      { package_id: 'basic-health-package', service_id: 'fbs-test' },
      { package_id: 'basic-health-package', service_id: 'chest-xray' },
      { package_id: 'comprehensive-health-package', service_id: 'complete-lab-test' },
      { package_id: 'comprehensive-health-package', service_id: 'chest-xray' },
      { package_id: 'comprehensive-health-package', service_id: 'general-consultation' }
    ];

    const { error: relationError } = await supabase
      .from('package_services')
      .insert(packageServices);

    if (relationError) {
      console.error('❌ Error inserting package relationships:', relationError);
    } else {
      console.log('✅ Package relationships created successfully!');
    }

    console.log('🎉 All services populated successfully!');
    console.log('🔄 Refresh your page to see the services');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Make it available globally
window.populateServices = populateServices;

console.log('💡 To add services, run: populateServices()');