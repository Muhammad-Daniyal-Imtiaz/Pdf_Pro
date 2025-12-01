'use client'

export interface CVField {
  id: string
  label: string
  value: string
  type: 'text' | 'textarea' | 'date' | 'select'
}

export interface CVSection {
  id: string
  type: 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'languages' | 'certifications'
  title: string
  content: string
  fields?: CVField[]
}

export type CVLayoutType = 'classic' | 'modern' | 'creative' | 'minimal' | 'executive' | 'twocolumn' | 'threecolumn' | 'sidebar' | 'gradient'

export interface CVStyles {
  fontFamily: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  layout: CVLayoutType
  spacing: number
  borderRadius: number
  columnGap?: number
  sidebarWidth?: string
}

export interface CVTemplate {
  id: string
  name: string
  category: string
  description: string
  thumbnail: string
  previewImage: string
  structure: CVSection[]
  styles: CVStyles
  rating: number
  downloads: number
  tags: string[]
}

export const cvTemplates: CVTemplate[] = [
  // 1. Modern Gradient Two-Column
  {
    id: 'modern-gradient-2col',
    name: 'Modern Gradient Two-Column',
    category: 'Modern',
    description: 'Contemporary two-column layout with gradient accents',
    thumbnail: '🎯',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Cdefs%3E%3ClinearGradient id="grad1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%233b82f6;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%238b5cf6;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="%23ffffff" width="300" height="400"/%3E%3Crect fill="url(%23grad1)" width="100" height="400"/%3E%3Ctext x="20" y="50" font-size="18" font-weight="bold" fill="white" font-family="Arial"%3EAlex%3C/text%3E%3Ctext x="20" y="75" font-size="14" fill="white" font-family="Arial"%3EDesigner%3C/text%3E%3Crect x="120" y="20" width="160" height="60" fill="%23f3f4f6" rx="8"/%3E%3Ctext x="135" y="45" font-size="12" font-weight="bold" fill="%23111827" font-family="Arial"%3EProduct Designer%3C/text%3E%3Ctext x="135" y="65" font-size="10" fill="%23666666" font-family="Arial"%3E5+ years experience%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal Information',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Alexandra Morgan', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Senior Product Designer', type: 'text' },
          { id: 'email', label: 'Email', value: 'alex@example.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 (555) 123-4567', type: 'text' },
          { id: 'location', label: 'Location', value: 'San Francisco, CA', type: 'text' },
          { id: 'portfolio', label: 'Portfolio', value: 'alexmorgan.design', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Professional Summary',
        content: 'Creative product designer with 8+ years crafting user-centered digital experiences. Specialized in design systems, mobile UX, and cross-platform product design. Track record of increasing user satisfaction by 45% and reducing design-to-dev time by 30%.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Professional Experience',
        content: '• Senior Product Designer - Design Studio (2021-Present)\nLead design strategy for 12 mobile applications, mentoring team of 6 junior designers. Improved conversion rates by 38%.\n\n• Product Designer - Tech Innovations (2018-2021)\nDesigned end-to-end user experiences resulting in 50K+ daily active users.\n\n• UI/UX Designer - Digital Agency (2016-2018)\nCreated visual designs and interactive prototypes for SaaS and e-commerce platforms.'
      },
      {
        id: 'education',
        type: 'education',
        title: 'Education',
        content: '• Bachelor of Fine Arts - Interaction Design, School of Visual Arts (2016)\n• Google UX Design Certificate (2019)\n• Advanced Design Systems Course - Interaction Design Foundation (2021)'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Core Skills',
        content: 'Figma • Adobe XD • Prototyping • User Research • Design Systems • Information Architecture • Wireframing • CSS/HTML • Mobile Design • Accessibility'
      }
    ],
    styles: {
      fontFamily: 'Inter, -apple-system, sans-serif',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      accentColor: '#06b6d4',
      layout: 'twocolumn',
      spacing: 1.6,
      borderRadius: 12,
      sidebarWidth: '35%'
    },
    rating: 4.9,
    downloads: 18500,
    tags: ['Modern', 'Two-Column', 'Gradient', 'Tech', 'Designer']
  },

  // 2. Three-Column Professional
  {
    id: 'professional-3col',
    name: 'Three-Column Professional',
    category: 'Professional',
    description: 'Elegant three-column layout for executives and managers',
    thumbnail: '💼',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23f8fafc" width="300" height="400"/%3E%3Crect fill="%231e293b" width="70" height="400"/%3E%3Ctext x="85" y="40" font-size="16" font-weight="bold" fill="%231e293b" font-family="Arial"%3EJames%3C/text%3E%3Ctext x="85" y="60" font-size="12" fill="%23666666" font-family="Arial"%3EExecutive%3C/text%3E%3Crect x="160" y="20" width="120" height="70" fill="%23e2e8f0" rx="6"/%3E%3Ctext x="175" y="45" font-size="11" font-weight="bold" fill="%231e293b" font-family="Arial"%3EChief Executive%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal Information',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'James Richardson', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Chief Technology Officer', type: 'text' },
          { id: 'email', label: 'Email', value: 'james@example.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 (555) 987-6543', type: 'text' },
          { id: 'location', label: 'Location', value: 'New York, NY', type: 'text' },
          { id: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/jrichardson', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Executive Summary',
        content: 'Results-driven CTO with 15+ years leading technology teams and digital transformation initiatives. Expertise in cloud architecture, agile methodology, and building high-performance engineering cultures. Successfully led 3 companies through successful IPOs and acquisitions.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Professional Experience',
        content: '• Chief Technology Officer - Tech Corporation (2019-Present)\nLead 200+ engineers across 5 global offices. Architected microservices infrastructure handling 10M+ requests/day.\n\n• VP Engineering - Digital Solutions (2016-2019)\nBuilt engineering team from 20 to 100+ people. Reduced deployment time by 60%.\n\n• Senior Engineering Manager - StartUp Inc. (2012-2016)\nManaged 8 teams, delivered 15 major product releases.'
      },
      {
        id: 'education',
        type: 'education',
        title: 'Education',
        content: '• MS Computer Science - MIT (2009)\n• BS Computer Engineering - Stanford University (2007)\n• Executive MBA - Harvard Business School (2018)'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Leadership Skills',
        content: 'Cloud Architecture • Agile Leadership • Team Building • Strategic Planning • Digital Transformation • Budget Management • Vendor Relations • Technical Strategy'
      }
    ],
    styles: {
      fontFamily: 'Segoe UI, -apple-system, sans-serif',
      primaryColor: '#1e293b',
      secondaryColor: '#64748b',
      accentColor: '#0f766e',
      layout: 'threecolumn',
      spacing: 1.7,
      borderRadius: 8,
      columnGap: 20
    },
    rating: 4.8,
    downloads: 16200,
    tags: ['Executive', 'Three-Column', 'Professional', 'CTO']
  },

  // 3. Minimalist Sidebar
  {
    id: 'minimalist-sidebar',
    name: 'Minimalist Sidebar',
    category: 'Minimal',
    description: 'Clean minimal design with elegant sidebar',
    thumbnail: '✨',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23ffffff" width="300" height="400"/%3E%3Crect fill="%23000000" width="90" height="400"/%3E%3Ccircle cx="45" cy="60" r="18" fill="%23ffffff"/%3E%3Ctext x="115" y="50" font-size="14" font-weight="bold" fill="%23000000" font-family="Arial"%3EMinimal CV%3C/text%3E%3Cline x1="115" y1="60" x2="280" y2="60" stroke="%23000000" stroke-width="1"/%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal Information',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Maria Chen', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Data Scientist', type: 'text' },
          { id: 'email', label: 'Email', value: 'maria@example.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 (555) 456-7890', type: 'text' },
          { id: 'github', label: 'GitHub', value: 'github.com/mariachen', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'About',
        content: 'Data scientist passionate about turning complex data into actionable insights. 6+ years building predictive models and leading analytics initiatives for enterprise clients. Experienced in machine learning, statistical analysis, and data visualization.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Experience',
        content: '• Senior Data Scientist - Analytics Co. (2020-Present)\nDeveloped ML models generating $5M+ in annual business value.\n\n• Data Scientist - Tech Insights (2018-2020)\nBuilt recommendation engine serving 100K+ users daily.\n\n• Junior Data Scientist - Data Labs (2017-2018)\nCreated dashboards and statistical analyses for clients.'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Technical Skills',
        content: 'Python • R • SQL • TensorFlow • Scikit-learn • Pandas • Apache Spark • Tableau • AWS • Docker'
      }
    ],
    styles: {
      fontFamily: 'Helvetica Neue, Arial, sans-serif',
      primaryColor: '#000000',
      secondaryColor: '#333333',
      accentColor: '#666666',
      layout: 'sidebar',
      spacing: 1.5,
      borderRadius: 0,
      sidebarWidth: '30%'
    },
    rating: 4.7,
    downloads: 12800,
    tags: ['Minimal', 'Sidebar', 'Clean', 'Data Scientist']
  },

  // 4. Creative Colorful Grid
  {
    id: 'creative-colorful-grid',
    name: 'Creative Colorful Grid',
    category: 'Creative',
    description: 'Vibrant grid-based design with bold colors',
    thumbnail: '🎨',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23fef3c7" width="300" height="400"/%3E%3Crect fill="%23fbbf24" width="300" height="80"/%3E%3Ctext x="20" y="45" font-size="20" font-weight="bold" fill="white" font-family="Arial"%3ECreative%3C/text%3E%3Crect x="20" y="120" width="60" height="60" fill="%23ec4899" rx="8"/%3E%3Crect x="100" y="120" width="60" height="60" fill="%238b5cf6" rx="8"/%3E%3Crect x="180" y="120" width="80" height="60" fill="%2306b6d4" rx="8"/%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal Information',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Sofia Rodriguez', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Creative Director', type: 'text' },
          { id: 'email', label: 'Email', value: 'sofia@example.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 (555) 246-8135', type: 'text' },
          { id: 'instagram', label: 'Instagram', value: '@sofiacreative', type: 'text' },
          { id: 'portfolio', label: 'Portfolio', value: 'sofiacreative.com', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Creative Vision',
        content: 'Award-winning creative director with passion for innovative brand experiences. 10+ years creating visually stunning campaigns that resonate with diverse audiences. Expertise in visual storytelling, brand strategy, and digital innovation.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Notable Projects',
        content: '• Creative Director - Brand Studio (2019-Present)\nLed creative vision for 60+ major brand campaigns. Won 15 design awards.\n\n• Senior Designer - Advertising Agency (2016-2019)\nCreated award-winning campaigns for Fortune 500 companies.\n\n• Creative Designer - Digital Studio (2014-2016)\nDesigned visual identities and marketing materials for startups.'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Creative Skills',
        content: 'Brand Strategy • Art Direction • Visual Design • Motion Graphics • Photography • Adobe Suite • Figma • Copywriting • Digital Marketing'
      }
    ],
    styles: {
      fontFamily: 'Poppins, -apple-system, sans-serif',
      primaryColor: '#f59e0b',
      secondaryColor: '#ec4899',
      accentColor: '#8b5cf6',
      layout: 'creative',
      spacing: 1.8,
      borderRadius: 16
    },
    rating: 4.7,
    downloads: 9200,
    tags: ['Creative', 'Colorful', 'Design', 'Brand']
  },

  // 5. Tech Startup Modern
  {
    id: 'tech-startup-modern',
    name: 'Tech Startup Modern',
    category: 'Technology',
    description: 'Modern tech-focused design with code-like elements',
    thumbnail: '💻',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23f0f4f8" width="300" height="400"/%3E%3Crect fill="%230369a1" width="300" height="60"/%3E%3Ctext x="20" y="35" font-size="16" font-weight="bold" fill="white" font-family="Courier"%3E%3Cdev%3E Alex%3C/dev%3E%3C/text%3E%3Crect x="20" y="100" width="260" height="50" fill="%23e0f2fe" rx="8" stroke="%230369a1" stroke-width="2"/%3E%3Ctext x="30" y="125" font-size="11" fill="%230369a1" font-family="Courier"%3E% Full Stack Developer • React • Node.js%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal Information',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Alexander Hayes', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Full Stack Developer', type: 'text' },
          { id: 'email', label: 'Email', value: 'alex.hayes@example.com', type: 'text' },
          { id: 'github', label: 'GitHub', value: 'github.com/alexhayes', type: 'text' },
          { id: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/alexhayes', type: 'text' },
          { id: 'location', label: 'Location', value: 'Austin, TX', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Developer Profile',
        content: 'Full stack developer with 7+ years building scalable web applications and leading technical teams. Expertise in modern JavaScript, cloud infrastructure, and DevOps. Passionate about clean code, testing, and open-source contributions. 50+ projects delivered successfully.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Professional Experience',
        content: '• Senior Full Stack Developer - StartUp Tech (2021-Present)\nLed development of microservices architecture serving 1M+ users monthly.\n\n• Full Stack Developer - Tech Company (2018-2021)\nBuilt and maintained 10+ production applications using React and Node.js.\n\n• Junior Developer - Web Agency (2016-2018)\nDeveloped custom solutions for e-commerce and SaaS clients.'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Technical Stack',
        content: 'JavaScript • TypeScript • React • Next.js • Node.js • PostgreSQL • MongoDB • Docker • Kubernetes • AWS • CI/CD • Git • Jest • GraphQL'
      },
      {
        id: 'projects',
        type: 'projects',
        title: 'Featured Projects',
        content: '• E-commerce Platform - Full-stack Next.js application with 100K+ monthly users and real-time analytics\n\n• SaaS Analytics Dashboard - React + D3.js with advanced data visualization for enterprise clients\n\n• Mobile App Backend - RESTful API serving iOS and Android apps, processing 10K+ requests daily'
      }
    ],
    styles: {
      fontFamily: 'Fira Code, Courier New, monospace',
      primaryColor: '#0369a1',
      secondaryColor: '#0c4a6e',
      accentColor: '#0ea5e9',
      layout: 'twocolumn',
      spacing: 1.7,
      borderRadius: 8
    },
    rating: 4.9,
    downloads: 15600,
    tags: ['Tech', 'Developer', 'Modern', 'Startup']
  },

  // 6. Business Executive Premium
  {
    id: 'business-executive-premium',
    name: 'Business Executive Premium',
    category: 'Executive',
    description: 'Premium design for top-level executives',
    thumbnail: '👔',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23f5f3ff" width="300" height="400"/%3E%3Crect fill="%233730a3" width="300" height="90"/%3E%3Ctext x="20" y="50" font-size="24" font-weight="bold" fill="white" font-family="Georgia"%3EExecutive%3C/text%3E%3Crect x="20" y="120" width="260" height="2" fill="%233730a3"/%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal Information',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Victoria Thompson', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Chief Executive Officer', type: 'text' },
          { id: 'email', label: 'Email', value: 'victoria@example.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 (555) 789-4321', type: 'text' },
          { id: 'location', label: 'Location', value: 'Boston, MA', type: 'text' },
          { id: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/victoriathompson', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Executive Summary',
        content: 'Visionary CEO with 20+ years driving organizational transformation and exponential growth. Proven expertise in strategic planning, M&A, board relations, and global market expansion. Led company through $2B acquisition and IPO. Champion of innovation and sustainable business practices.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Executive Career',
        content: '• Chief Executive Officer - Global Tech Corp (2018-Present)\nScaled company from $500M to $2B+ valuation. Expanded into 15 new markets. Grew executive team to 200+ leaders.\n\n• President & COO - Digital Solutions (2015-2018)\nOperated $1B+ P&L across 30 global locations with 5,000+ employees.\n\n• Chief Operating Officer - Financial Services (2010-2015)\nStreamlined operations reducing costs by 40% while improving efficiency 35%.'
      },
      {
        id: 'education',
        type: 'education',
        title: 'Education & Credentials',
        content: '• MBA - Harvard Business School (2005)\n• BS - Economics, Yale University (2003)\n• Advanced Leadership Program - Stanford Graduate School of Business (2016)\n• Board Certification - Institute of Corporate Directors (2019)'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Executive Competencies',
        content: 'Strategic Vision • P&L Management • M&A Integration • Board Leadership • Stakeholder Relations • Organizational Development • Market Expansion • Risk Management • Change Management'
      }
    ],
    styles: {
      fontFamily: 'Georgia, Garamond, serif',
      primaryColor: '#3730a3',
      secondaryColor: '#5b21b6',
      accentColor: '#1e40af',
      layout: 'threecolumn',
      spacing: 1.8,
      borderRadius: 6
    },
    rating: 4.9,
    downloads: 14300,
    tags: ['Executive', 'CEO', 'Premium', 'Business']
  },

  // 7. Healthcare Professional Modern
  {
    id: 'healthcare-modern',
    name: 'Healthcare Professional Modern',
    category: 'Healthcare',
    description: 'Modern design for medical and healthcare professionals',
    thumbnail: '⚕️',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23ecfdf5" width="300" height="400"/%3E%3Crect fill="%23059669" width="300" height="75"/%3E%3Ctext x="20" y="45" font-size="20" font-weight="bold" fill="white" font-family="Arial"%3EDr. Sarah Mitchell%3C/text%3E%3Ctext x="20" y="70" font-size="13" fill="%23d1fae5" font-family="Arial"%3EMD • Internal Medicine%3C/text%3E%3Crect x="20" y="110" width="260" height="60" fill="%23d1fae5" rx="10"/%3E%3Ctext x="30" y="135" font-size="11" font-weight="bold" fill="%23065f46" font-family="Arial"%3EMedical Certifications%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal Information',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Dr. Sarah Mitchell', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Physician - Internal Medicine', type: 'text' },
          { id: 'email', label: 'Email', value: 'dr.mitchell@example.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 (555) 555-5555', type: 'text' },
          { id: 'license', label: 'License Number', value: 'MD123456', type: 'text' },
          { id: 'location', label: 'Location', value: 'Boston, MA', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Professional Profile',
        content: 'Board-certified physician with 12+ years clinical excellence and patient care leadership. Specialized in internal medicine with additional expertise in preventive care and chronic disease management. Published 15+ peer-reviewed articles in leading medical journals. Committed to advancing healthcare quality and patient outcomes.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Clinical Experience',
        content: '• Attending Physician - Teaching Hospital (2018-Present)\nLead team of 5 physicians managing 200+ patient cases monthly. Published 8 research papers.\n\n• Fellow Physician - Medical Center (2015-2018)\nCompleted fellowship in clinical medicine with focus on cardiology and preventive care.\n\n• Resident Physician - University Hospital (2012-2015)\nCompleted 3-year residency with honors. Trained 20+ medical students.'
      },
      {
        id: 'certifications',
        type: 'certifications',
        title: 'Medical Credentials',
        content: '• MD - Johns Hopkins University School of Medicine (2012)\n• Board Certification - American Board of Internal Medicine (2018)\n• ACLS/BLS Certification (Current)\n• Advanced Life Support (ALS) Certification\n• Fellow of the American College of Physicians (FACP)'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Medical Expertise',
        content: 'Clinical Diagnosis • Patient Management • Internal Medicine • Preventive Care • Research • Medical Education • Team Leadership • Electronic Health Records'
      }
    ],
    styles: {
      fontFamily: 'Inter, -apple-system, sans-serif',
      primaryColor: '#059669',
      secondaryColor: '#047857',
      accentColor: '#10b981',
      layout: 'twocolumn',
      spacing: 1.6,
      borderRadius: 12
    },
    rating: 4.8,
    downloads: 8900,
    tags: ['Healthcare', 'Medical', 'Doctor', 'Modern']
  },

  // 8. Marketing Manager Dynamic
  {
    id: 'marketing-manager-dynamic',
    name: 'Marketing Manager Dynamic',
    category: 'Marketing',
    description: 'Dynamic design for marketing professionals with performance metrics',
    thumbnail: '📊',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23fffbeb" width="300" height="400"/%3E%3Crect fill="%23f59e0b" width="300" height="75"/%3E%3Ctext x="20" y="45" font-size="20" font-weight="bold" fill="white" font-family="Arial"%3EMarketing Leader%3C/text%3E%3Crect x="20" y="120" width="50" height="50" fill="%23fbbf24" rx="6"/%3E%3Crect x="85" y="120" width="50" height="50" fill="%23f59e0b" rx="6"/%3E%3Crect x="150" y="120" width="50" height="50" fill="%23d97706" rx="6"/%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal Information',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Catherine Lewis', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Senior Marketing Manager', type: 'text' },
          { id: 'email', label: 'Email', value: 'catherine@example.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 (555) 234-5678', type: 'text' },
          { id: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/catherinelewis', type: 'text' },
          { id: 'location', label: 'Location', value: 'Los Angeles, CA', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Marketing Executive',
        content: 'Results-driven marketing professional with 10+ years driving brand growth and customer acquisition. Expertise in digital marketing strategy, multi-channel campaigns, and data analytics. Increased brand awareness by 150% and generated $25M+ in attributed revenue. Strong leadership of cross-functional teams and vendor management.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Marketing Leadership',
        content: '• Senior Marketing Manager - Global Brand Co. (2019-Present)\nLead team of 12 marketing professionals. Managed $3M+ annual budget. Increased customer acquisition by 85%.\n\n• Digital Marketing Specialist - Tech Innovations (2017-2019)\nExecuted 50+ digital campaigns with average 3.5x ROI. Managed $1.5M marketing budget.\n\n• Marketing Coordinator - Digital Agency (2015-2017)\nManaged social media, email campaigns, and content marketing initiatives.'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Marketing Skills',
        content: 'Digital Strategy • Campaign Management • Social Media Marketing • Content Marketing • SEO/SEM • Email Marketing • Analytics & Reporting • Brand Management • Google Analytics • Salesforce • HubSpot'
      }
    ],
    styles: {
      fontFamily: 'Segoe UI, -apple-system, sans-serif',
      primaryColor: '#f59e0b',
      secondaryColor: '#d97706',
      accentColor: '#f97316',
      layout: 'gradient',
      spacing: 1.6,
      borderRadius: 10
    },
    rating: 4.7,
    downloads: 10200,
    tags: ['Marketing', 'Dynamic', 'Digital', 'Manager']
  },

  // 9. Finance Professional Advanced
  {
    id: 'finance-professional-advanced',
    name: 'Finance Professional Advanced',
    category: 'Finance',
    description: 'Advanced design for CFO and financial executives',
    thumbnail: '💰',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23fef2f2" width="300" height="400"/%3E%3Crect fill="%23991b1b" width="300" height="75"/%3E%3Ctext x="20" y="45" font-size="20" font-weight="bold" fill="white" font-family="Arial"%3EFinance Executive%3C/text%3E%3Crect x="20" y="120" width="260" height="50" fill="%23fee2e2" rx="8"/%3E%3Ctext x="30" y="145" font-size="11" font-weight="bold" fill="%23991b1b" font-family="Arial"%3E20+ Years Financial Leadership • CPA • MBA%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal Information',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Jonathan Webb', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Chief Financial Officer', type: 'text' },
          { id: 'email', label: 'Email', value: 'jonathan@example.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 (555) 567-8901', type: 'text' },
          { id: 'location', label: 'Location', value: 'Chicago, IL', type: 'text' },
          { id: 'cpano', label: 'CPA License', value: 'CPA-IL-45678', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Financial Leadership',
        content: 'Strategic CFO with 20+ years transforming financial operations and driving business growth. Managed P&Ls exceeding $1B+ and led successful IPO raising $500M. Expertise in FP&A, corporate finance, and M&A integration. Board-level strategic planner with proven track record of creating shareholder value.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Financial Experience',
        content: '• Chief Financial Officer - Major Corporation (2018-Present)\nDirected $500M+ P&L and led 50-person finance team. Achieved 30% operational cost reduction. Managed successful $300M acquisition.\n\n• VP of Finance - Financial Services (2015-2018)\nManaged $200M budget and controlled finance operations across 15 locations.\n\n• Senior Financial Analyst - Investment Bank (2012-2015)\nAnalyzed complex transactions worth $2B+. Advised C-suite executives.'
      },
      {
        id: 'certifications',
        type: 'certifications',
        title: 'Credentials & Education',
        content: '• CPA - Certified Public Accountant (2008)\n• MBA Finance - Northwestern University Kellogg (2012)\n• BS Accounting - University of Illinois (2006)\n• Chartered Financial Analyst (CFA) Level III Candidate'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Financial Expertise',
        content: 'Corporate Finance • FP&A • P&L Management • Budgeting & Forecasting • M&A Integration • Financial Reporting • Risk Management • Investor Relations • Treasury Management • SAP • Excel'
      }
    ],
    styles: {
      fontFamily: 'Verdana, -apple-system, sans-serif',
      primaryColor: '#991b1b',
      secondaryColor: '#7f1d1d',
      accentColor: '#dc2626',
      layout: 'threecolumn',
      spacing: 1.7,
      borderRadius: 10
    },
    rating: 4.8,
    downloads: 11400,
    tags: ['Finance', 'CFO', 'Executive', 'Professional']
  },

  // 10. Academic Researcher Modern
  {
    id: 'academic-researcher-modern',
    name: 'Academic Researcher Modern',
    category: 'Academia',
    description: 'Modern CV for researchers and academics',
    thumbnail: '🎓',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23ede9fe" width="300" height="400"/%3E%3Crect fill="%237c3aed" width="300" height="75"/%3E%3Ctext x="20" y="45" font-size="20" font-weight="bold" fill="white" font-family="Arial"%3EProf. Research%3C/text%3E%3Ctext x="20" y="70" font-size="13" fill="%23e9d5ff" font-family="Arial"%3EComputer Science%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal Information',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Dr. Michael Stanford', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Associate Professor', type: 'text' },
          { id: 'email', label: 'Email', value: 'mstanford@university.edu', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 (555) 789-2345', type: 'text' },
          { id: 'institution', label: 'Institution', value: 'Stanford University', type: 'text' },
          { id: 'h-index', label: 'H-Index', value: '28', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Research Profile',
        content: 'Distinguished researcher and educator with 15+ years advancing computer science through groundbreaking publications and innovative projects. Published 40+ peer-reviewed articles in top-tier conferences. Secured $5M+ in research funding. Mentor to 25+ PhD students, with multiple research labs spanning AI, machine learning, and computational systems.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Academic Career',
        content: '• Associate Professor - Stanford University (2015-Present)\nTeach 4+ courses annually. Supervise 12 PhD students. Directed $3M+ research initiatives.\n\n• Assistant Professor - MIT (2012-2015)\nFounded AI Research Lab. Published 15 papers in top venues. Mentored 8 PhD candidates.\n\n• Postdoctoral Fellow - UC Berkeley (2010-2012)\nConducted research in machine learning and computational complexity.'
      },
      {
        id: 'education',
        type: 'education',
        title: 'Education',
        content: '• PhD Computer Science - Carnegie Mellon University (2010)\n• Dissertation: Advanced Algorithms for Complex Systems\n\n• MS Computer Science - UC Berkeley (2008)\n• BS Computer Science - University of Washington (2006)'
      }
    ],
    styles: {
      fontFamily: 'Lato, -apple-system, sans-serif',
      primaryColor: '#7c3aed',
      secondaryColor: '#5b21b6',
      accentColor: '#a78bfa',
      layout: 'twocolumn',
      spacing: 1.7,
      borderRadius: 8
    },
    rating: 4.8,
    downloads: 7600,
    tags: ['Academic', 'Research', 'Professor', 'Modern']
  },

  // 11. Sales Executive Performance
  {
    id: 'sales-executive-performance',
    name: 'Sales Executive Performance',
    category: 'Sales',
    description: 'Dynamic sales CV with performance metrics showcase',
    thumbnail: '🚀',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23f0fdf4" width="300" height="400"/%3E%3Crect fill="%2316a34a" width="300" height="75"/%3E%3Ctext x="20" y="45" font-size="20" font-weight="bold" fill="white" font-family="Arial"%3ESales Leader%3C/text%3E%3Crect x="20" y="120" width="60" height="60" fill="%23bbf7d0" rx="8"/%3E%3Crect x="95" y="120" width="60" height="60" fill="%2386efac" rx="8"/%3E%3Crect x="170" y="120" width="80" height="60" fill="%2365a30d" rx="8"/%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal Information',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Jennifer Knight', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Senior Sales Director', type: 'text' },
          { id: 'email', label: 'Email', value: 'jennifer@example.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 (555) 123-9876', type: 'text' },
          { id: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/jenniferknight', type: 'text' },
          { id: 'location', label: 'Location', value: 'San Francisco, CA', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Sales Excellence',
        content: 'Top-performing sales director with 14+ years driving revenue growth and building high-performing teams. Consistently ranked in top 2% of salesforce. Managed enterprise accounts generating $150M+ revenue. Expertise in strategic account management, team leadership, and business development. Track record of 8 consecutive years exceeding quota.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Sales Leadership',
        content: '• Senior Sales Director - Enterprise Solutions (2019-Present)\nLead team of 25 sales professionals. Managed $60M+ annual revenue. Grew territory 200%.\n\n• Regional Sales Manager - Tech Company (2016-2019)\nManaged $25M+ revenue across 8 states. Built sales team from 5 to 20 people.\n\n• Sales Executive - Software Firm (2013-2016)\nClosed 50+ enterprise deals averaging $500K each. Consistently top performer.'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Sales Expertise',
        content: 'Enterprise Sales • Account Management • Strategic Planning • Team Leadership • Pipeline Management • Negotiations • Salesforce • Forecasting • Business Development'
      }
    ],
    styles: {
      fontFamily: 'Inter, -apple-system, sans-serif',
      primaryColor: '#16a34a',
      secondaryColor: '#15803d',
      accentColor: '#22c55e',
      layout: 'threecolumn',
      spacing: 1.6,
      borderRadius: 12
    },
    rating: 4.9,
    downloads: 13500,
    tags: ['Sales', 'Executive', 'Performance', 'Revenue']
  }
]

export default cvTemplates