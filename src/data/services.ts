// Mendoza Diagnostic Center - Complete Service Catalog
// Based on the comprehensive requirements document

export interface DiagnosticService {
  id: string;
  name: string;
  category: 'laboratory' | 'imaging' | 'consultation' | 'examination' | 'vaccination' | 'testing';
  description: string;
  duration: string;
  price: number;
  preparation?: string;
  requirements?: string[];
  isAvailable: boolean;
  homeServiceAvailable?: boolean;
  equipmentRequired?: string[];
}

export const diagnosticServices: DiagnosticService[] = [
  // Laboratory Tests
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
    homeServiceAvailable: true,
    equipmentRequired: ['Blood collection supplies', 'Laboratory equipment']
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
    isAvailable: true,
    homeServiceAvailable: true
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
    isAvailable: true,
    homeServiceAvailable: true
  },
  {
    id: 'lipid-profile',
    name: 'Lipid Profile',
    category: 'laboratory',
    description: 'Cholesterol and triglyceride levels assessment',
    duration: '2 hours for results',
    price: 800,
    preparation: '9-12 hours fasting required',
    requirements: ['Valid ID'],
    isAvailable: true,
    homeServiceAvailable: true
  },
  {
    id: 'liver-function',
    name: 'Liver Function Test',
    category: 'laboratory',
    description: 'Assessment of liver enzymes and function',
    duration: '2-3 hours for results',
    price: 1200,
    preparation: '8 hours fasting recommended',
    requirements: ['Valid ID', 'Medical history'],
    isAvailable: true,
    homeServiceAvailable: true
  },
  {
    id: 'kidney-function',
    name: 'Kidney Function Test',
    category: 'laboratory',
    description: 'Creatinine, BUN, and electrolyte assessment',
    duration: '2-3 hours for results',
    price: 1000,
    preparation: 'No special preparation required',
    requirements: ['Valid ID'],
    isAvailable: true,
    homeServiceAvailable: true
  },
  {
    id: 'thyroid-function',
    name: 'Thyroid Function Test',
    category: 'laboratory',
    description: 'TSH, T3, T4 hormone level assessment',
    duration: '4-6 hours for results',
    price: 1800,
    preparation: 'No special preparation required',
    requirements: ['Valid ID'],
    isAvailable: true,
    homeServiceAvailable: true
  },
  {
    id: 'hba1c-test',
    name: 'HbA1c (Diabetes Monitoring)',
    category: 'laboratory',
    description: '3-month average blood sugar level assessment',
    duration: '2 hours for results',
    price: 600,
    preparation: 'No fasting required',
    requirements: ['Valid ID'],
    isAvailable: true,
    homeServiceAvailable: true
  },

  // Imaging Services
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
    homeServiceAvailable: false,
    equipmentRequired: ['Digital X-ray machine']
  },
  {
    id: 'spine-xray',
    name: 'Spine X-ray',
    category: 'imaging',
    description: 'Spinal column imaging for bone and joint assessment',
    duration: '20-30 minutes',
    price: 1200,
    preparation: 'Comfortable clothing without metal fasteners',
    requirements: ['Valid ID', 'Pregnancy disclosure (for women)'],
    isAvailable: true,
    homeServiceAvailable: false
  },
  {
    id: 'extremity-xray',
    name: 'Extremity X-ray',
    category: 'imaging',
    description: 'Arms, legs, hands, or feet imaging',
    duration: '15-20 minutes',
    price: 600,
    preparation: 'Remove jewelry and metal objects from area',
    requirements: ['Valid ID'],
    isAvailable: true,
    homeServiceAvailable: false
  },

  // Ultrasound Services
  {
    id: 'abdominal-ultrasound',
    name: 'Abdominal Ultrasound',
    category: 'imaging',
    description: 'Liver, gallbladder, kidneys, and other abdominal organs imaging',
    duration: '30-45 minutes',
    price: 1500,
    preparation: '6-8 hours fasting required',
    requirements: ['Valid ID', 'Full bladder for pelvic area'],
    isAvailable: true,
    homeServiceAvailable: false,
    equipmentRequired: ['Ultrasound machine', 'Ultrasound gel']
  },
  {
    id: 'pelvic-ultrasound',
    name: 'Pelvic Ultrasound',
    category: 'imaging',
    description: 'Reproductive organs and bladder imaging',
    duration: '30-40 minutes',
    price: 1800,
    preparation: 'Full bladder required',
    requirements: ['Valid ID'],
    isAvailable: true,
    homeServiceAvailable: false
  },
  {
    id: 'pregnancy-ultrasound',
    name: 'Pregnancy Ultrasound',
    category: 'imaging',
    description: 'Fetal development and maternal health monitoring',
    duration: '30-45 minutes',
    price: 2000,
    preparation: 'Full bladder for early pregnancy',
    requirements: ['Valid ID', 'LMP date'],
    isAvailable: true,
    homeServiceAvailable: false
  },
  {
    id: 'breast-ultrasound',
    name: 'Breast Ultrasound',
    category: 'imaging',
    description: 'Breast tissue imaging for abnormality detection',
    duration: '20-30 minutes',
    price: 1600,
    preparation: 'No special preparation required',
    requirements: ['Valid ID'],
    isAvailable: true,
    homeServiceAvailable: false
  },

  // ECG Services
  {
    id: 'resting-ecg',
    name: 'Resting ECG',
    category: 'examination',
    description: 'Heart rhythm and electrical activity assessment at rest',
    duration: '15-20 minutes',
    price: 500,
    preparation: 'Comfortable clothing, avoid caffeine 2 hours before',
    requirements: ['Valid ID'],
    isAvailable: true,
    homeServiceAvailable: true,
    equipmentRequired: ['ECG machine', 'Electrodes']
  },
  {
    id: 'stress-ecg',
    name: 'Stress ECG (Exercise ECG)',
    category: 'examination',
    description: 'Heart monitoring during physical exercise',
    duration: '45-60 minutes',
    price: 2500,
    preparation: 'Comfortable exercise clothing, no heavy meals 3 hours before',
    requirements: ['Valid ID', 'Doctor clearance for exercise'],
    isAvailable: true,
    homeServiceAvailable: false
  },

  // Drug Testing
  {
    id: 'standard-drug-test',
    name: 'Standard Drug Test',
    category: 'testing',
    description: '5-panel urine drug screening',
    duration: '30 minutes for collection, 24 hours for results',
    price: 1200,
    preparation: 'Bring valid ID and avoid excessive fluid intake',
    requirements: ['Valid government ID', 'Chain of custody form'],
    isAvailable: true,
    homeServiceAvailable: false
  },
  {
    id: 'comprehensive-drug-test',
    name: 'Comprehensive Drug Test',
    category: 'testing',
    description: '10-panel urine drug screening',
    duration: '30 minutes for collection, 24-48 hours for results',
    price: 2000,
    preparation: 'Bring valid ID and medication list',
    requirements: ['Valid government ID', 'Chain of custody form'],
    isAvailable: true,
    homeServiceAvailable: false
  },

  // Medical Consultations
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
    id: 'pediatric-consultation',
    name: 'Pediatric Consultation',
    category: 'consultation',
    description: 'Specialized medical care for children',
    duration: '30-45 minutes',
    price: 1500,
    preparation: 'Bring child\'s vaccination records and growth chart',
    requirements: ['Valid ID', 'Child\'s birth certificate'],
    isAvailable: true,
    homeServiceAvailable: true
  },
  {
    id: 'cardiology-consultation',
    name: 'Cardiology Consultation',
    category: 'consultation',
    description: 'Heart and cardiovascular system specialist consultation',
    duration: '45-60 minutes',
    price: 2500,
    preparation: 'Bring previous ECG, echo results if available',
    requirements: ['Valid ID', 'Referral letter', 'Previous cardiac tests'],
    isAvailable: true,
    homeServiceAvailable: false
  },

  // Vaccinations
  {
    id: 'covid-vaccination',
    name: 'COVID-19 Vaccination',
    category: 'vaccination',
    description: 'COVID-19 vaccine administration with health screening',
    duration: '30 minutes (including observation)',
    price: 1500,
    preparation: 'Eat before vaccination, bring vaccination card',
    requirements: ['Valid ID', 'Vaccination card', 'Health screening'],
    isAvailable: true,
    homeServiceAvailable: true
  },
  {
    id: 'flu-vaccination',
    name: 'Influenza Vaccination',
    category: 'vaccination',
    description: 'Annual flu vaccine administration',
    duration: '15-20 minutes',
    price: 800,
    preparation: 'No special preparation required',
    requirements: ['Valid ID'],
    isAvailable: true,
    homeServiceAvailable: true
  },
  {
    id: 'hepatitis-b-vaccination',
    name: 'Hepatitis B Vaccination',
    category: 'vaccination',
    description: 'Hepatitis B vaccine series (3 doses)',
    duration: '15-20 minutes per dose',
    price: 1200,
    preparation: 'Health screening questionnaire',
    requirements: ['Valid ID', 'Vaccination schedule adherence'],
    isAvailable: true,
    homeServiceAvailable: true
  },

  // Pre-Employment and Annual Examinations
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
  },
  {
    id: 'annual-physical-exam',
    name: 'Annual Physical Examination',
    category: 'examination',
    description: 'Comprehensive yearly health checkup',
    duration: '2-4 hours',
    price: 3500,
    preparation: '8-12 hours fasting for complete lab work',
    requirements: ['Valid ID', 'Previous medical records'],
    isAvailable: true,
    homeServiceAvailable: true
  },
  {
    id: 'executive-checkup',
    name: 'Executive Health Package',
    category: 'examination',
    description: 'Premium comprehensive health assessment package',
    duration: '4-6 hours',
    price: 8500,
    preparation: '12 hours fasting, comfortable clothing',
    requirements: ['Valid ID', 'Health questionnaire'],
    isAvailable: true,
    homeServiceAvailable: false
  },

  // COVID-19 Testing
  {
    id: 'rt-pcr-covid',
    name: 'RT-PCR COVID-19 Test',
    category: 'testing',
    description: 'Molecular diagnostic test for COVID-19 detection',
    duration: '24-48 hours for results',
    price: 3500,
    preparation: 'No eating, drinking, smoking 30 minutes before',
    requirements: ['Valid ID', 'Travel/medical clearance form'],
    isAvailable: true,
    homeServiceAvailable: true
  },
  {
    id: 'antigen-covid',
    name: 'COVID-19 Antigen Test',
    category: 'testing',
    description: 'Rapid antigen test for COVID-19 screening',
    duration: '15-30 minutes for results',
    price: 1500,
    preparation: 'No eating, drinking 30 minutes before',
    requirements: ['Valid ID'],
    isAvailable: true,
    homeServiceAvailable: true
  },

  // Home Services
  {
    id: 'home-laboratory',
    name: 'Home Laboratory Collection',
    category: 'laboratory',
    description: 'Blood and specimen collection at patient\'s home',
    duration: '30-45 minutes collection',
    price: 500, // Additional fee on top of test costs
    preparation: 'Ensure accessible location and parking',
    requirements: ['Valid ID', 'Home address verification'],
    isAvailable: true,
    homeServiceAvailable: true
  },
  {
    id: 'home-ecg',
    name: 'Home ECG Service',
    category: 'examination',
    description: 'ECG test performed at patient\'s home',
    duration: '30-45 minutes',
    price: 1200,
    preparation: 'Quiet, private room with bed/couch',
    requirements: ['Valid ID', 'Accessible location'],
    isAvailable: true,
    homeServiceAvailable: true
  }
];

// Service Categories for filtering and organization
export const serviceCategories = [
  { id: 'all', name: 'All Services', icon: '🏥' },
  { id: 'laboratory', name: 'Laboratory Tests', icon: '🧪' },
  { id: 'imaging', name: 'Imaging Services', icon: '📷' },
  { id: 'consultation', name: 'Medical Consultations', icon: '👨‍⚕️' },
  { id: 'examination', name: 'Health Examinations', icon: '🏥' },
  { id: 'vaccination', name: 'Vaccinations', icon: '💉' },
  { id: 'testing', name: 'Diagnostic Testing', icon: '🔬' }
];

// Popular service packages
export const servicePackages = [
  {
    id: 'basic-health-package',
    name: 'Basic Health Package',
    description: 'Essential health screening for general wellness',
    services: ['cbc-test', 'fbs-test', 'chest-xray', 'resting-ecg'],
    originalPrice: 1450,
    packagePrice: 1200,
    savings: 250,
    duration: '2-3 hours'
  },
  {
    id: 'comprehensive-health-package',
    name: 'Comprehensive Health Package',
    description: 'Complete health assessment with detailed analysis',
    services: ['complete-lab-test', 'chest-xray', 'abdominal-ultrasound', 'resting-ecg', 'general-consultation'],
    originalPrice: 6300,
    packagePrice: 5200,
    savings: 1100,
    duration: '4-6 hours'
  },
  {
    id: 'cardiac-screening-package',
    name: 'Cardiac Screening Package',
    description: 'Comprehensive heart health assessment',
    services: ['lipid-profile', 'resting-ecg', 'stress-ecg', 'chest-xray', 'cardiology-consultation'],
    originalPrice: 6200,
    packagePrice: 5000,
    savings: 1200,
    duration: '3-4 hours'
  },
  {
    id: 'diabetes-monitoring-package',
    name: 'Diabetes Monitoring Package',
    description: 'Complete diabetes assessment and management',
    services: ['fbs-test', 'hba1c-test', 'lipid-profile', 'kidney-function', 'general-consultation'],
    originalPrice: 3550,
    packagePrice: 2800,
    savings: 750,
    duration: '2-3 hours'
  }
];

export default diagnosticServices;