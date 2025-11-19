export interface CVTemplate {
  id: string
  name: string
  category: string
  description: string
  thumbnail: string
  structure: CVSection[]
  styles: CVStyles
}

export interface CVSection {
  id: string
  type: 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'languages' | 'certifications'
  title: string
  content: string
  fields?: CVField[]
}

export interface CVField {
  id: string
  label: string
  value: string
  type: 'text' | 'textarea' | 'date' | 'select'
}

export interface CVStyles {
  fontFamily: string
  primaryColor: string
  secondaryColor: string
  layout: 'classic' | 'modern' | 'creative' | 'minimal'
  spacing: number
}

export const cvTemplates: CVTemplate[] = [
  {
    id: 'executive-classic',
    name: 'Executive Classic',
    category: 'Professional',
    description: 'Traditional and authoritative design for senior roles',
    thumbnail: '👔',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal Information',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'John Doe', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Senior Executive Manager', type: 'text' },
          { id: 'email', label: 'Email', value: 'john.doe@email.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 (555) 123-4567', type: 'text' },
          { id: 'location', label: 'Location', value: 'New York, NY', type: 'text' },
          { id: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/johndoe', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Professional Summary',
        content: 'Seasoned executive with 15+ years of experience in strategic leadership and business development. Proven track record of driving revenue growth and operational excellence in competitive markets. Strong background in team leadership, process optimization, and stakeholder management.',
        fields: []
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Work Experience',
        content: `Senior Executive Manager - ABC Corporation (2018-Present)
• Led a team of 50+ professionals to achieve 30% revenue growth
• Implemented strategic initiatives that improved operational efficiency by 25%
• Managed annual budget of $10M while maintaining 95% cost efficiency

Business Development Manager - XYZ Inc. (2012-2018)
• Developed and executed market expansion strategies across 3 continents
• Built and maintained key client relationships resulting in 40% revenue increase
• Led cross-functional teams to deliver complex projects on time and under budget`,
        fields: []
      },
      {
        id: 'education',
        type: 'education',
        title: 'Education',
        content: `MBA in Business Administration - Harvard Business School (2010-2012)
• Graduated Magna Cum Laude
• President of Business Strategy Club

BSc in Business Management - Stanford University (2006-2010)
• GPA: 3.8/4.0
• Dean's List for 4 consecutive semesters`,
        fields: []
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Skills',
        content: 'Strategic Planning, Team Leadership, Financial Management, Business Development, Process Optimization, Stakeholder Relations, Market Analysis, Project Management, Change Management, Performance Metrics',
        fields: []
      }
    ],
    styles: {
      fontFamily: 'Times New Roman',
      primaryColor: '#2c3e50',
      secondaryColor: '#34495e',
      layout: 'classic',
      spacing: 1.2
    }
  },
  {
    id: 'modern-tech',
    name: 'Modern Tech',
    category: 'Technology',
    description: 'Clean and contemporary design for tech professionals',
    thumbnail: '💻',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Contact',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Sarah Johnson', type: 'text' },
          { id: 'title', label: 'Role', value: 'Senior Full Stack Developer', type: 'text' },
          { id: 'email', label: 'Email', value: 'sarah.j@tech.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 (555) 987-6543', type: 'text' },
          { id: 'github', label: 'GitHub', value: 'github.com/sarahdev', type: 'text' },
          { id: 'portfolio', label: 'Portfolio', value: 'sarahjohnson.dev', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'About',
        content: 'Passionate full-stack developer with 8+ years of experience building scalable web applications. Expertise in modern JavaScript frameworks, cloud technologies, and agile development practices. Strong focus on code quality, performance optimization, and user experience.',
        fields: []
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Technical Skills',
        content: 'JavaScript, TypeScript, React, Node.js, Python, AWS, Docker, Kubernetes, PostgreSQL, MongoDB, GraphQL, REST APIs, CI/CD, Git, Agile Methodologies, Test-Driven Development',
        fields: []
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Experience',
        content: `Senior Full Stack Developer - Tech Innovations Inc. (2020-Present)
• Developed and maintained microservices architecture serving 1M+ users
• Led migration from monolithic to microservices, improving performance by 60%
• Implemented CI/CD pipelines reducing deployment time by 70%

Full Stack Developer - Digital Solutions Co. (2016-2020)
• Built responsive web applications using React and Node.js
• Collaborated with UX team to improve user engagement by 45%
• Mentored 3 junior developers and conducted code reviews`,
        fields: []
      },
      {
        id: 'projects',
        type: 'projects',
        title: 'Key Projects',
        content: `E-commerce Platform (2023)
• Led development of scalable e-commerce platform handling 10k+ daily transactions
• Implemented real-time inventory management and payment processing
• Technologies: React, Node.js, MongoDB, Redis, AWS

AI-Powered Analytics Dashboard (2022)
• Developed dashboard for real-time data visualization and predictive analytics
• Integrated machine learning models for business insights
• Technologies: Python, React, FastAPI, PostgreSQL, Docker`,
        fields: []
      },
      {
        id: 'education',
        type: 'education',
        title: 'Education',
        content: `BSc in Computer Science - MIT (2012-2016)
• Specialized in Software Engineering and Data Structures
• Graduated with Honors
• Relevant Coursework: Algorithms, Database Systems, Web Development`,
        fields: []
      }
    ],
    styles: {
      fontFamily: 'Arial',
      primaryColor: '#1a365d',
      secondaryColor: '#2d3748',
      layout: 'modern',
      spacing: 1.4
    }
  },
  {
    id: 'creative-portfolio',
    name: 'Creative Portfolio',
    category: 'Creative',
    description: 'Visually appealing design for creative professionals',
    thumbnail: '🎨',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: '',
        content: '',
        fields: [
          { id: 'name', label: 'Name', value: 'Emma Rodriguez', type: 'text' },
          { id: 'title', label: 'Creative Title', value: 'Senior UI/UX Designer & Art Director', type: 'text' },
          { id: 'email', label: 'Email', value: 'emma@creativedesign.com', type: 'text' },
          { id: 'portfolio', label: 'Portfolio', value: 'emmarodriguez.design', type: 'text' },
          { id: 'behance', label: 'Behance', value: 'behance.net/emmar', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Creative Vision',
        content: 'Award-winning creative director with 10+ years of experience in digital design and brand development. Passionate about creating meaningful user experiences that blend aesthetics with functionality. Strong background in leading cross-functional teams and delivering innovative design solutions for global brands.',
        fields: []
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Professional Journey',
        content: `Creative Director - Design Studio Pro (2019-Present)
• Lead creative direction for 20+ international brands across various industries
• Manage team of 15 designers, writers, and developers
• Increased client satisfaction scores by 35% through innovative design solutions

Senior UI/UX Designer - Digital Creative Agency (2015-2019)
• Designed user interfaces for mobile and web applications with 5M+ users
• Conducted user research and testing to inform design decisions
• Collaborated with development teams to ensure design implementation quality`,
        fields: []
      },
      {
        id: 'projects',
        type: 'projects',
        title: 'Featured Work',
        content: `Brand Identity - Global Tech Startup (2023)
• Developed complete brand identity including logo, typography, and visual language
• Created design system used across all digital and print materials
• Resulted in 50% increase in brand recognition

E-commerce Platform Redesign (2022)
• Led UX redesign for major retail platform serving 2M+ customers
• Improved conversion rates by 28% through user-centered design
• Implemented accessible design principles meeting WCAG 2.1 standards`,
        fields: []
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Creative Tools & Expertise',
        content: 'UI/UX Design, Brand Identity, Design Systems, User Research, Prototyping, Adobe Creative Suite, Figma, Sketch, InVision, Webflow, HTML/CSS, Design Thinking, Agile Methodology',
        fields: []
      },
      {
        id: 'education',
        type: 'education',
        title: 'Education & Awards',
        content: `MFA in Graphic Design - Rhode Island School of Design (2011-2013)
• Thesis focused on digital interaction design
• Received Dean's Award for Excellence

BFA in Visual Arts - Parsons School of Design (2007-2011)
• Graduated with High Honors
• Adobe Design Achievement Award Finalist`,
        fields: []
      }
    ],
    styles: {
      fontFamily: 'Georgia',
      primaryColor: '#6b46c1',
      secondaryColor: '#805ad5',
      layout: 'creative',
      spacing: 1.6
    }
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    category: 'Minimal',
    description: 'Ultra-clean design focusing on content',
    thumbnail: '⚪',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: '',
        content: '',
        fields: [
          { id: 'name', label: 'Name', value: 'Alex Chen', type: 'text' },
          { id: 'title', label: 'Title', value: 'Product Manager', type: 'text' },
          { id: 'email', label: 'Email', value: 'alex.chen@product.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 (555) 234-5678', type: 'text' },
          { id: 'location', label: 'Location', value: 'San Francisco, CA', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Profile',
        content: 'Strategic product manager with 7 years of experience driving product vision and execution in fast-paced tech environments. Strong background in user research, data analysis, and cross-functional leadership.',
        fields: []
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Experience',
        content: `Senior Product Manager - TechScale Inc. (2020-Present)
• Led product strategy for B2B SaaS platform with 500+ enterprise clients
• Increased user engagement by 45% through data-driven feature development
• Managed product roadmap and prioritized features based on market research

Product Manager - Startup Ventures (2017-2020)
• Owned product lifecycle from concept to launch for mobile applications
• Conducted user interviews and A/B testing to validate product decisions
• Collaborated with engineering and design teams in agile environment`,
        fields: []
      },
      {
        id: 'education',
        type: 'education',
        title: 'Education',
        content: `MBA - UC Berkeley (2015-2017)
• Focus on Technology Management and Entrepreneurship

BSc in Computer Science - Stanford University (2011-2015)
• Minor in Business Administration`,
        fields: []
      }
    ],
    styles: {
      fontFamily: 'Helvetica',
      primaryColor: '#000000',
      secondaryColor: '#666666',
      layout: 'minimal',
      spacing: 1.8
    }
  },
  {
    id: 'corporate-executive',
    name: 'Corporate Executive',
    category: 'Executive',
    description: 'Professional design for C-level executives',
    thumbnail: '🏢',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: '',
        content: '',
        fields: [
          { id: 'name', label: 'Name', value: 'Michael Thompson', type: 'text' },
          { id: 'title', label: 'Title', value: 'Chief Executive Officer', type: 'text' },
          { id: 'email', label: 'Email', value: 'm.thompson@corporation.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 (555) 345-6789', type: 'text' },
          { id: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/michaelthompson', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Executive Profile',
        content: 'Visionary CEO with 20+ years of experience transforming organizations and driving sustainable growth. Proven track record in strategic planning, mergers and acquisitions, and building high-performance teams across global markets.',
        fields: []
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Executive Experience',
        content: `Chief Executive Officer - Global Enterprises Inc. (2018-Present)
• Led company through successful IPO, achieving $2B market capitalization
• Expanded operations to 15 new countries, increasing revenue by 300%
• Implemented ESG initiatives improving corporate sustainability ratings

Chief Operating Officer - Multinational Corp (2012-2018)
• Oversaw global operations across 3 continents with 5,000+ employees
• Optimized supply chain reducing costs by $50M annually
• Led digital transformation initiatives improving operational efficiency`,
        fields: []
      }
    ],
    styles: {
      fontFamily: 'Arial',
      primaryColor: '#1e3a8a',
      secondaryColor: '#3b82f6',
      layout: 'classic',
      spacing: 1.3
    }
  },
  // Additional templates can be added here following the same pattern
  {
    id: 'academic-research',
    name: 'Academic Research',
    category: 'Academic',
    description: 'Structured design for academic and research positions',
    thumbnail: '📚',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: '',
        content: '',
        fields: [
          { id: 'name', label: 'Name', value: 'Dr. Lisa Wang', type: 'text' },
          { id: 'title', label: 'Title', value: 'Research Scientist & Professor', type: 'text' },
          { id: 'email', label: 'Email', value: 'l.wang@university.edu', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 (555) 456-7890', type: 'text' },
          { id: 'orcid', label: 'ORCID', value: '0000-0002-1825-0097', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Research Focus',
        content: 'Dedicated research scientist specializing in computational biology and machine learning applications in healthcare. Published 30+ peer-reviewed papers in high-impact journals. Passionate about mentoring students and advancing scientific knowledge.',
        fields: []
      },
      {
        id: 'education',
        type: 'education',
        title: 'Education',
        content: `PhD in Computational Biology - MIT (2010-2014)
• Dissertation: "Machine Learning Approaches to Protein Structure Prediction"
• Advisor: Dr. James Wilson

MSc in Bioinformatics - Stanford University (2008-2010)
• Thesis on Genomic Data Analysis

BSc in Molecular Biology - UC Berkeley (2004-2008)
• Summa Cum Laude`,
        fields: []
      },
      {
        id: 'publications',
        type: 'projects',
        title: 'Selected Publications',
        content: `"Deep Learning for Drug Discovery" - Nature (2023)
"AI in Precision Medicine" - Science (2022)
"Computational Genomics Review" - Cell (2021)`,
        fields: []
      }
    ],
    styles: {
      fontFamily: 'Georgia',
      primaryColor: '#1e40af',
      secondaryColor: '#3730a3',
      layout: 'classic',
      spacing: 1.4
    }
  }
  // You can continue adding the remaining 10 templates following the same structure
]

// Export default for easier imports
export default cvTemplates