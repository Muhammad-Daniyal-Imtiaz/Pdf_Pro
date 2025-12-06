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

export type CVLayoutType = 'classic' | 'modern' | 'creative' | 'minimal' | 'executive' | 'twocolumn' | 'threecolumn' | 'sidebar' | 'gradient' | 'iconbased'

export interface CVStyles {
  fontFamily: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor?: string
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

/* ------------------------------------------------------------------ */
/* 2025 WORLD-CLASS TEMPLATES                                          */
/* ------------------------------------------------------------------ */

export const cvTemplates: CVTemplate[] = [
  /* ============================================================
     1.  AURORA GRADIENT  (2025 Trend – Dark mode friendly)
  ============================================================ */
  {
    id: 'aurora-gradient-2025',
    name: 'Aurora Gradient 2025',
    category: 'Modern',
    description: 'Trending 2025 gradient skin with glass-morphism sidebar & dark-mode headers.',
    thumbnail: '🌌',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Cdefs%3E%3ClinearGradient id="aur" x1="0" y1="0" x2="300" y2="400"%3E%3Cstop offset="0%25" stop-color="%230b0e1a"/%3E%3Cstop offset="100%25" stop-color="%231c1040"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23aur)" width="300" height="400"/%3E%3Crect x="0" y="0" width="90" height="400" fill="%23ffffff" opacity="0.08"/%3E%3Ctext x="20" y="60" font-size="18" font-weight="bold" fill="%23ffffff" font-family="Arial"%3EMia Torres%3C/text%3E%3Ctext x="20" y="80" font-size="12" fill="%23a78bfa" font-family="Arial"%3EUX Engineer%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Mia Torres', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Senior UX Engineer', type: 'text' },
          { id: 'email', label: 'Email', value: 'mia@uxcraft.io', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 415 555 0199', type: 'text' },
          { id: 'location', label: 'Location', value: 'San Francisco, CA', type: 'text' },
          { id: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/miatorres', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Profile',
        content: 'Product-minded UX Engineer with 9+ years shipping consumer & B2B SaaS. Passionate about design-systems, accessibility, and turning complex data into delightful interfaces. Speaker at UXCon 2024.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Experience',
        content: '• Senior UX Engineer – Nova Design (2021-now)\nLed 5-person squad, shipped dark-mode design-system, reduced dev-handoff time 40%.\n\n• UX Engineer – Stripe (2018-2021)\nBuilt interactive docs components, improved onboarding completion 18%.\n\n• UI Developer – Zebra Tech (2016-2018)\nCreated React component library used by 30+ internal teams.'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Core Skills',
        content: 'Figma • React • TypeScript • Storybook • A11y • Styled-Components • Jest • Cypress • GraphQL • Tailwind • Vercel • GitHub Actions'
      }
    ],
    styles: {
      fontFamily: 'Inter, -apple-system, sans-serif',
      primaryColor: '#ffffff',
      secondaryColor: '#a78bfa',
      accentColor: '#c084fc',
      backgroundColor: '#0b0e1a',
      layout: 'sidebar',
      spacing: 1.65,
      borderRadius: 10,
      sidebarWidth: '32%'
    },
    rating: 4.9,
    downloads: 22400,
    tags: ['2025', 'Gradient', 'Dark', 'Sidebar', 'UX Engineer']
  },

  /* ============================================================
     2.  PACIFIC BLUE  (HR-approved classic + ocean accent)
  ============================================================ */
  {
    id: 'pacific-blue-2025',
    name: 'Pacific Blue 2025',
    category: 'Professional',
    description: 'HR-favourite single-column layout with ocean-blue accents and generous white-space.',
    thumbnail: '🌊',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23f7fafc" width="300" height="400"/%3E%3Crect fill="%23006699" width="300" height="70"/%3E%3Ctext x="20" y="45" font-size="20" font-weight="bold" fill="%23ffffff" font-family="Arial"%3EDaniel Kim%3C/text%3E%3Ctext x="20" y="65" font-size="13" fill="%23bae6ff" font-family="Arial"%3EProduct Manager%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Daniel Kim', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Senior Product Manager', type: 'text' },
          { id: 'email', label: 'Email', value: 'daniel.kim@pm.me', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 206 555 0188', type: 'text' },
          { id: 'location', label: 'Location', value: 'Seattle, WA', type: 'text' },
          { id: 'portfolio', label: 'Portfolio', value: 'danielkim.work', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Executive Summary',
        content: 'Data-driven Product Manager with 11 years leading cross-functional teams to deliver market-winning B2B SaaS. Proven record: +$180 MRR, 3 successful exits, NPS +32. Expert in product-led growth & OKRs.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Professional Experience',
        content: '• Director of Product – CloudSync (2019-now)\nOwn roadmap for 3 products ($50 MRR), scaled team from 5 → 25, achieved 98% retention.\n\n• Senior PM – Microsoft (2015-2019)\nShipped Azure cost-analytics tool, saved customers $12 M first year.\n\n• PM – Adobe (2012-2015)\nLed Creative Cloud SDK, adopted by 1 200+ partners.'
      },
      {
        id: 'education',
        type: 'education',
        title: 'Education',
        content: '• MBA – Kellogg School of Management (2012)\n• BS Computer Science – University of Washington (2008)\n• Pragmatic Marketing Certified (2016)'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Core Skills',
        content: 'Strategy • Road-mapping • OKRs • Agile • Scrum • SQL • Tableau • PowerBI • A/B Testing • Pricing • Go-to-Market • SaaS Metrics'
      }
    ],
    styles: {
      fontFamily: 'Segoe UI, -apple-system, sans-serif',
      primaryColor: '#006699',
      secondaryColor: '#004d73',
      accentColor: '#38b2ac',
      backgroundColor: '#f7fafc',
      layout: 'classic',
      spacing: 1.8,
      borderRadius: 6
    },
    rating: 4.8,
    downloads: 19600,
    tags: ['Professional', 'Classic', 'Ocean', 'Manager']
  },

  /* ============================================================
     3.  NOBLE GREY  (Timeless executive; muted palette)
  ============================================================ */
  {
    id: 'noble-grey-2025',
    name: 'Noble Grey 2025',
    category: 'Executive',
    description: 'Board-room ready template with charcoal headers and dove-grey accents.',
    thumbnail: '🤵',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23f5f7fa" width="300" height="400"/%3E%3Crect fill="%23222831" width="300" height="80"/%3E%3Ctext x="20" y="50" font-size="22" font-weight="bold" fill="%23ffffff" font-family="Georgia"%3EVictoria Lee%3C/text%3E%3Ctext x="20" y="75" font-size="13" fill="%23c7d2fe" font-family="Georgia"%3ECFO %26 Finance Director%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Victoria Lee', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Chief Financial Officer', type: 'text' },
          { id: 'email', label: 'Email', value: 'victoria.lee@cfo.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 212 555 0177', type: 'text' },
          { id: 'location', label: 'Location', value: 'New York, NY', type: 'text' },
          { id: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/victorialee', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Executive Profile',
        content: 'Strategic CFO with 18 years steering global finance, M&A, and IPO readiness. Managed $1.2 B P&L, raised $400 M Series E, achieved 30% cost reduction while scaling 3× revenue.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Career Highlights',
        content: '• CFO – FinTech Global (2018-now)\nBuilt finance org from 15 → 120, led successful IPO, market cap $2.8 B.\n\n• VP Finance – MegaCorp (2013-2018)\nExecuted 5 acquisitions, integrated $300 M revenue, streamlined FP&A.\n\n• Controller – StartUp Inc. (2009-2013)\nEstablished SOX compliance, passed Big-4 audits with zero material weaknesses.'
      },
      {
        id: 'education',
        type: 'education',
        title: 'Education & Credentials',
        content: '• MBA Finance – Wharton School (2009)\n• BS Accounting – NYU Stern (2007)\n• CPA – State of New York (2010)\n• Harvard Executive Leadership (2019)'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Executive Competencies',
        content: 'P&L Ownership • M&A Integration • IPO Readiness • SOX • FP&A • Treasury • Investor Relations • Board Reporting • Risk Management • GAAP • IFRS'
      }
    ],
    styles: {
      fontFamily: 'Georgia, serif',
      primaryColor: '#222831',
      secondaryColor: '#393e46',
      accentColor: '#c7d2fe',
      backgroundColor: '#f5f7fa',
      layout: 'threecolumn',
      spacing: 1.85,
      borderRadius: 4
    },
    rating: 4.9,
    downloads: 17300,
    tags: ['Executive', 'CFO', 'Board', 'Grey', '2025']
  },

  /* ============================================================
     4.  MINIMO  (Ultra-clean, Apple-like white space)
  ============================================================ */
  {
    id: 'minimo-white-2025',
    name: 'Minimo White 2025',
    category: 'Minimal',
    description: 'Apple-inspired minimalism: pure white, subtle grey lines, Helvetica Neue.',
    thumbnail: '🤍',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23ffffff" width="300" height="400"/%3E%3Crect x="20" y="30" width="260" height="1" fill="%23e5e7eb"/%3E%3Ctext x="20" y="60" font-size="20" font-weight="300" fill="%23111827" font-family="Helvetica Neue"%3EElisa Rossi%3C/text%3E%3Ctext x="20" y="80" font-size="13" fill="%236b7280" font-family="Helvetica Neue"%3EIndustrial Designer%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Elisa Rossi', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Industrial Designer', type: 'text' },
          { id: 'email', label: 'Email', value: 'elisa@designsimple.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+39 335 555 0144', type: 'text' },
          { id: 'location', label: 'Location', value: 'Milan, Italy', type: 'text' },
          { id: 'portfolio', label: 'Portfolio', value: 'elisarossi.com', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'About',
        content: 'Minimalist industrial designer obsessed with function-first beauty. 7 years creating consumer electronics, furniture, and eco-packaging. 3 Red-Dot awards.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Experience',
        content: '• Senior Designer – Apple Supplier (2020-now)\nLed design of 4 accessories for iPhone 15 line, sold 8 M units.\n\n• Designer – IKEA Future Lab (2017-2020)\nCo-created sustainable flat-pack lamp, 2 M pieces sold.\n\n• Junior Designer – Studio Boeri (2015-2017)\nDeveloped urban furniture for Milan Expo area.'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Skills',
        content: 'Rhino • SolidWorks • KeyShot • Adobe CC • Figma • Sustainable Materials • CMF • DFM • 3-D Printing • Laser Cutting'
      }
    ],
    styles: {
      fontFamily: 'Helvetica Neue, Arial, sans-serif',
      primaryColor: '#111827',
      secondaryColor: '#6b7280',
      accentColor: '#d1d5db',
      backgroundColor: '#ffffff',
      layout: 'classic',
      spacing: 1.9,
      borderRadius: 0
    },
    rating: 4.7,
    downloads: 14100,
    tags: ['Minimal', 'Apple', 'White', 'Designer', '2025']
  },

  /* ============================================================
     5.  PASTEL DREAM  (Soft pastel blocks – creative & human)
  ============================================================ */
  {
    id: 'pastel-dream-2025',
    name: 'Pastel Dream 2025',
    category: 'Creative',
    description: 'Soft pastel blocks with rounded tags and friendly icons. Perfect for creatives, marketers, educators.',
    thumbnail: '🌸',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23fef7ff" width="300" height="400"/%3E%3Crect x="20" y="20" width="260" height="70" fill="%23fce7f3" rx="12"/%3E%3Ctext x="30" y="50" font-size="18" font-weight="600" fill="%238b5cf6" font-family="Arial"%3ESofia Martinez%3C/text%3E%3Ctext x="30" y="70" font-size="12" fill="%23a855f7" font-family="Arial"%3ECreative Strategist%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Sofia Martinez', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Creative Strategist', type: 'text' },
          { id: 'email', label: 'Email', value: 'sofa@creative.io', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 305 555 0166', type: 'text' },
          { id: 'location', label: 'Location', value: 'Miami, FL', type: 'text' },
          { id: 'behance', label: 'Behance', value: 'behance.net/sofiamartinez', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Hello!',
        content: 'I craft colourful brand stories that convert. 8 years in ad agencies, 150+ campaigns, 2 Cannes Lions. I mix data with intuition to make audiences feel.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Selected Work',
        content: '• Creative Strategist – Wunderman Thompson (2020-now)\nLed integrated campaigns for Nike & Spotify, +42% engagement.\n\n• Senior Copywriter – Ogilvy (2016-2020)\nCreated viral "Real Beauty" spin-off, 20 M views.\n\n• Content Creator – Freelance (2014-2016)\nBuilt personal brand 100 K followers, worked with Coca-Cola.'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Creative Toolkit',
        content: 'Brand Strategy • Storytelling • Adobe CC • Figma • Instagram • TikTok • Google Trends • Social Listening • KPIs • A/B Testing'
      }
    ],
    styles: {
      fontFamily: 'Poppins, -apple-system, sans-serif',
      primaryColor: '#8b5cf6',
      secondaryColor: '#a855f7',
      accentColor: '#fce7f3',
      backgroundColor: '#fef7ff',
      layout: 'twocolumn',
      spacing: 1.7,
      borderRadius: 12
    },
    rating: 4.8,
    downloads: 15800,
    tags: ['Pastel', 'Creative', 'Friendly', '2025', 'Cannes']
  },

  /* ============================================================
     6.  TECH NEON  (Cyberpunk vibe for devs & hackers)
  ============================================================ */
  {
    id: 'tech-neon-2025',
    name: 'Tech Neon 2025',
    category: 'Technology',
    description: 'Cyberpunk neon greens on deep charcoal – perfect for hackers, dev-ops, AI engineers.',
    thumbnail: '💚',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23120e14" width="300" height="400"/%3E%3Crect fill="%2300ff41" width="300" height="60" opacity="0.9"/%3E%3Ctext x="20" y="40" font-size="20" font-weight="bold" fill="%23120e14" font-family="monospace"%3Ealex%5Fneon%3C/text%3E%3Ctext x="20" y="65" font-size="12" fill="%2300ff41" font-family="monospace"%3EAI Engineer %7C CTF Winner%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Alex "Neon" Rivera', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'AI Security Engineer', type: 'text' },
          { id: 'email', label: 'Email', value: 'alex@hackai.io', type: 'text' },
          { id: 'github', label: 'GitHub', value: 'github.com/alexneon', type: 'text' },
          { id: 'location', label: 'Location', value: 'Remote', type: 'text' },
          { id: 'ctf', label: 'CTF Rank', value: 'Top 1% OverTheWire', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Bio',
        content: 'Ethical hacker turned AI engineer. I break models before bad guys do. 6 years pen-testing, 3 years ML-security, 50+ CVEs, speaker at DEF-CON 31.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Hack-log',
        content: '• AI Security Lead – SecureAI (2021-now)\nBuilt adversarial-attack detection platform, blocked 1 M+ threats/month.\n\n• Pen-Tester – RedTeam Labs (2017-2021)\nExploited 200+ apps, helped clients achieve SOC-2 Type-2.\n\n• Security Researcher – Freelance (2015-2017)\nFound 0-days in OpenSSL & WordPress, published on HackerOne.'
      },
      {
        id: 'skills',
        type: 'skills',
        title: ' Arsenal',
        content: 'Python • PyTorch • Adversarial ML • GANs • Burp Suite • Metasploit • Docker • Kubernetes • AWS • Terraform • GitHub Actions • CVE Writing'
      }
    ],
    styles: {
      fontFamily: 'Fira Code, monospace',
      primaryColor: '#00ff41',
      secondaryColor: '#00d132',
      accentColor: '#08a045',
      backgroundColor: '#120e14',
      layout: 'twocolumn',
      spacing: 1.6,
      borderRadius: 4
    },
    rating: 4.9,
    downloads: 19200,
    tags: ['Neon', 'Cyber', 'Hacker', 'AI', 'DEF-CON', '2025']
  },

  /* ============================================================
     7.  ICONIC  (Icon-based headers – modern but readable)
  ============================================================ */
  {
    id: 'iconic-headers-2025',
    name: 'Iconic Headers 2025',
    category: 'Modern',
    description: 'Each section has its own emoji-icon header – great for international recruiters & ATS.',
    thumbnail: '🔹',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23ffffff" width="300" height="400"/%3E%3Crect x="20" y="25" width="260" height="8" fill="%233b82f6" rx="4"/%3E%3Ctext x="20" y="55" font-size="19" font-weight="600" fill="%23111827" font-family="Arial"%3ERyan Patel%3C/text%3E%3Ctext x="20" y="75" font-size="12" fill="%236b7280" font-family="Arial"%3EMechanical Engineer%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: '👤 Personal',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Ryan Patel', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Mechanical Engineer', type: 'text' },
          { id: 'email', label: 'Email', value: 'ryan.patel@engpro.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 416 555 0133', type: 'text' },
          { id: 'location', label: 'Location', value: 'Toronto, ON', type: 'text' },
          { id: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/ryanpatel', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: '🎯 Summary',
        content: 'Licensed P.Eng. with 9 years designing HVAC systems for mega-skyscrapers. Led $50 M project, saved 12% energy via CFD optimisation. Passionate about green buildings.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: '💼 Experience',
        content: '• Senior Mechanical Engineer – WSP (2018-now)\nDesign HVAC for 3 supertalls (60+ floors), achieved LEED Gold.\n\n• Mechanical Engineer – SNC-Lavalin (2014-2018)\nPerformed load calculations, selected equipment, wrote specs.\n\n• EIT – AECOM (2012-2014)\nAssisted senior engineers, prepared 2-D drawings.'
      },
      {
        id: 'education',
        type: 'education',
        title: '🎓 Education',
        content: '• BASc Mechanical Engineering – University of Toronto (2012)\n• LEED AP BD+C – GBCI (2017)\n• P.Eng. – Professional Engineers Ontario (2018)'
      },
      {
        id: 'skills',
        type: 'skills',
        title: '🔧 Skills',
        content: 'AutoCAD MEP • Revit • CFD • EnergyPlus • LEED • ASHRAE • Python • MATLAB • Project Management • Canadian Codes'
      }
    ],
    styles: {
      fontFamily: 'Inter, -apple-system, sans-serif',
      primaryColor: '#3b82f6',
      secondaryColor: '#1d4ed8',
      accentColor: '#60a5fa',
      backgroundColor: '#ffffff',
      layout: 'iconbased',
      spacing: 1.7,
      borderRadius: 8
    },
    rating: 4.7,
    downloads: 14900,
    tags: ['Icon', 'ATS', 'Engineer', 'Modern', '2025']
  },

  /* ============================================================
     8.  HALLEY VIBRANT  (Bright header blocks – resume nerd)
  ============================================================ */
  {
    id: 'halley-vibrant-2025',
    name: 'Halley Vibrant 2025',
    category: 'Bold',
    description: 'Vibrant coral header blocks that scream confidence – great for sales, marketing, founders.',
    thumbnail: '🔥',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23fff2f0" width="300" height="400"/%3E%3Crect fill="%23ff4d2d" width="300" height="70"/%3E%3Ctext x="20" y="45" font-size="20" font-weight="bold" fill="%23ffffff" font-family="Arial"%3EJessica Moore%3C/text%3E%3Ctext x="20" y="65" font-size="12" fill="%23ffe8e5" font-family="Arial"%3EVP Sales %7C Revenue Driver%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Jessica Moore', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'VP Sales & Revenue', type: 'text' },
          { id: 'email', label: 'Email', value: 'jessica.moore@salespro.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 646 555 0111', type: 'text' },
          { id: 'location', label: 'Location', value: 'New York, NY', type: 'text' },
          { id: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/jessicamoore', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Revenue Leader',
        content: 'Energetic sales executive who loves quotas. 12 years building high-performance teams, $200 M+ revenue closed, 7 President Club awards. Expert in SaaS, outbound, channel sales.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Sales Leadership',
        content: '• VP Sales – RocketSaaS (2019-now)\nGrew ARR from $10 M → $80 M, team 20 → 80, opened EMEA office.\n\n• Director Sales – ScaleUp Inc. (2015-2019)\nCrushed quota 8 quarters straight, closed Facebook & Adobe deals.\n\n• Account Executive – Oracle (2012-2015)\nTop rep Americas, $4 M closed first year.'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Sales Arsenal',
        content: 'Outbound • Channel • SaaS Metrics • MEDDIC • SPIN • Salesforce • Outreach • ZoomInfo • Gong • Forecasting • Negotiations'
      }
    ],
    styles: {
      fontFamily: 'Barlow, -apple-system, sans-serif',
      primaryColor: '#ffffff',
      secondaryColor: '#ffe8e5',
      accentColor: '#ff4d2d',
      backgroundColor: '#fff2f0',
      layout: 'twocolumn',
      spacing: 1.65,
      borderRadius: 10
    },
    rating: 4.8,
    downloads: 16000,
    tags: ['Vibrant', 'Sales', 'Leader', 'Coral', 'Bold', '2025']
  },

  /* ============================================================
     9.  LEGACY SERIF  (Traditional serif for law, finance, gov)
  ============================================================ */
  {
    id: 'legacy-serif-2025',
    name: 'Legacy Serif 2025',
    category: 'Traditional',
    description: 'Classic serif typography, double-rule header, perfect for legal, accounting, public sector.',
    thumbnail: '📜',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23ffffff" width="300" height="400"/%3E%3Crect x="20" y="25" width="260" height="2" fill="%233f3f3f"/%3E%3Crect x="20" y="35" width="260" height="1" fill="%233f3f3f"/%3E%3Ctext x="20" y="60" font-size="20" font-weight="bold" fill="%233f3f3f" font-family="Times New Roman"%3EWilliam Harrington%3C/text%3E%3Ctext x="20" y="80" font-size="12" fill="%23555" font-family="Times New Roman"%3EAttorney-at-Law%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Personal',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'William Harrington', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Attorney-at-Law', type: 'text' },
          { id: 'email', label: 'Email', value: 'wh@harringtonlaw.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 202 555 0155', type: 'text' },
          { id: 'location', label: 'Location', value: 'Washington, DC', type: 'text' },
          { id: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/williamharrington', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Bar Admission',
        content: 'Licensed to practise in NY, DC & CA. 14 years litigation experience, focused on IP & antitrust. Argued 3 cases before Federal Circuit, 85% win rate.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Legal Experience',
        content: '• Senior Associate – Hogan Lovells (2014-now)\nRepresented tech giants in SEP disputes, secured $100 M settlement.\n\n• Associate – Jones Day (2010-2014)\nDrafted 50+ patent applications, successfully defended 15 re-exams.\n\n• Law Clerk – Hon. Judge Pauline Newman (2009-2010)\nFederal Circuit, researched claim construction precedents.'
      },
      {
        id: 'education',
        type: 'education',
        title: 'Education',
        content: '• JD – Harvard Law School (2009)\n• BS Electrical Engineering – MIT (2006)\n• USPTO Patent Bar (2010)'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Bar & Skills',
        content: 'Patent Litigation • Antitrust • SEP/FRAND • Federal Circuit • Claim Construction • USPTO • Drafting • Markman Hearings'
      }
    ],
    styles: {
      fontFamily: 'Times New Roman, serif',
      primaryColor: '#3f3f3f',
      secondaryColor: '#555555',
      accentColor: '#888888',
      backgroundColor: '#ffffff',
      layout: 'classic',
      spacing: 1.8,
      borderRadius: 0
    },
    rating: 4.9,
    downloads: 13200,
    tags: ['Legal', 'Serif', 'Traditional', 'Attorney', '2025']
  },

  /* ============================================================
     10.  QUICK FULL-COLOR  (Full-bleed background – 2025 pop)
  ============================================================ */
  {
    id: 'quick-fullcolor-2025',
    name: 'Quick Full-Color 2025',
    category: 'Pop',
    description: 'Full-bleed coral background, white text – Instagram-style punch for designers, photographers, DJs.',
    thumbnail: '🟠',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23ff6037" width="300" height="400"/%3E%3Ccircle cx="150" cy="80" r="35" fill="%23ffffff" opacity="0.9"/%3E%3Ctext x="150" y="85" font-size="16" font-weight="bold" fill="%23ff6037" text-anchor="middle" font-family="Arial"%3EAlex%3C/text%3E%3Ctext x="150" y="105" font-size="11" fill="%23ffffff" text-anchor="middle" font-family="Arial"%3EDigital Artist%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Profile',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Alex Johnson', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Digital Artist & DJ', type: 'text' },
          { id: 'email', label: 'Email', value: 'alex@neonbeats.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 416 555 0199', type: 'text' },
          { id: 'location', label: 'Location', value: 'Toronto, ON', type: 'text' },
          { id: 'instagram', label: 'Instagram', value: '@neonbeats', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'About Me',
        content: 'I paint sound and pixels. 10 years VJ-ing for festivals, 250+ shows, 3 M Spotify streams on my remixes. I bring colour to every stage and screen.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Gigs & Shows',
        content: '• Headline VJ – Digital Dreams Festival (2023-now)\nCreated 360° visuals for 40 K crowd, featured on Rolling Stone.\n\n• Resident DJ – Coda Toronto (2018-2023)\nMonthly sold-out shows, mixed 52 episodes.\n\n• Freelance Motion Design (2015-2018)\nAnimated adverts for Nike, Adidas, Red-Bull.'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Tools & Mediums',
        content: 'After Effects • Blender • Resolume • TouchDesigner • Ableton • Serum • C4D • Octane • Photoshop • MIDI Mapping'
      }
    ],
    styles: {
      fontFamily: 'Signika Negative, sans-serif',
      primaryColor: '#ffffff',
      secondaryColor: '#ffe8d6',
      accentColor: '#ff6037',
      backgroundColor: '#ff6037',
      layout: 'classic',
      spacing: 1.9,
      borderRadius: 0
    },
    rating: 4.7,
    downloads: 12600,
    tags: ['Full-Color', 'Pop', 'Artist', 'DJ', '2025', 'Instagram']
  },

  /* ============================================================
     11.  MAGNATE EXEC  (Executive sidebar + gold accents)
  ============================================================ */
  {
    id: 'magnate-gold-2025',
    name: 'Magnate Gold 2025',
    category: 'Executive',
    description: 'Left-sidebar highlights, gold accent bars, Raleway headers – CEO, COO, Board-level.',
    thumbnail: '👑',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23fcfaf6" width="300" height="400"/%3E%3Crect fill="%231e293b" width="100" height="400"/%3E%3Crect x="0" y="180" width="100" height="3" fill="%23d4af37"/%3E%3Ctext x="20" y="60" font-size="18" font-weight="600" fill="%23ffffff" font-family="Raleway"%3EDavid Chen%3C/text%3E%3Ctext x="20" y="80" font-size="11" fill="%23d4af37" font-family="Raleway"%3ECEO %26 Board Member%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Executive',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'David Chen', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Chief Executive Officer', type: 'text' },
          { id: 'email', label: 'Email', value: 'david.chen@magnate.com', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 212 555 0144', type: 'text' },
          { id: 'location', label: 'Location', value: 'New York, NY', type: 'text' },
          { id: 'board', label: 'Board Seat', value: 'Acme Corp (NASDAQ: ACM)', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Leadership',
        content: 'Visionary CEO with 20 years scaling global businesses. Took revenue from $50 M → $1.2 B, led 2 successful IPOs, chaired 3 boards. Expert in M&A, turnarounds, and culture transformation.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Career Milestones',
        content: '• CEO – Magnate Global (2016-now)\nTurned around manufacturing conglomerate, achieved 28% EBITDA margin.\n\n• President – Alpha Industries (2010-2016)\nLed IPO in 2014, market cap $2 B, 4 000 employees.\n\n• VP Strategy – Beta Corp (2005-2010)\nExecuted 5 acquisitions, integrated $300 M revenue.'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Board Skills',
        content: 'M&A • Turnaround • IPO • Corporate Governance • Strategy • P&L • Culture • ESG • Investor Relations • Crisis Management'
      }
    ],
    styles: {
      fontFamily: 'Raleway, -apple-system, sans-serif',
      primaryColor: '#ffffff',
      secondaryColor: '#d4af37',
      accentColor: '#d4af37',
      backgroundColor: '#fcfaf6',
      layout: 'sidebar',
      spacing: 1.8,
      borderRadius: 6,
      sidebarWidth: '30%'
    },
    rating: 4.9,
    downloads: 18500,
    tags: ['CEO', 'Board', 'Gold', 'Executive', 'Sidebar', '2025']
  },

  /* ============================================================
     12.  TECH GRID  (Compact grid for tech specialists)
  ============================================================ */
  {
    id: 'tech-grid-2025',
    name: 'Tech Grid 2025',
    category: 'Technical',
    description: 'Compact grid layout, mono font, skill-bars – dev-ops, data engineers, security.',
    thumbnail: '⚙️',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%230a0e1a" width="300" height="400"/%3E%3Crect x="20" y="20" width="260" height="60" fill="%23111a2c" stroke="%2300ff41" stroke-width="1"/%3E%3Ctext x="30" y="50" font-size="16" font-weight="bold" fill="%2300ff41" font-family="monospace"%3Esys.admin()%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Identity',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Sam "Kernel" Taylor', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Senior DevOps Engineer', type: 'text' },
          { id: 'email', label: 'Email', value: 'sam@devops.pro', type: 'text' },
          { id: 'github', label: 'GitHub', value: 'github.com/kerneltaylor', type: 'text' },
          { id: 'location', label: 'Location', value: 'Austin, TX', type: 'text' },
          { id: 'cert', label: 'Cert', value: 'CKA, AWS SAP', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Mission',
        content: 'I turn coffee into 99.99% uptime. 8 years automating infra for fintech & crypto. 500+ microservices, 10k+ nodes, zero major incidents.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Stack Trace',
        content: '• Senior DevOps – CryptoExchange (2020-now)\nBuilt multi-region K8s clusters, 40k TPS, latency <50ms.\n\n• DevOps – FinTech Labs (2016-2020)\nMigrated 200 VMs to AWS, cut cost 35%, achieved SOC-2.\n\n• Sysadmin – StartUp (2014-2016)\nWrote 100+ Ansible playbooks, deployed Docker Swarm.'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Config',
        content: 'Kubernetes • Terraform • Ansible • Helm • ArgoCD • Prometheus • Grafana • Istio • Envoy • Vault • Consul • AWS • GCP • CI/CD'
      }
    ],
    styles: {
      fontFamily: 'Space Mono, monospace',
      primaryColor: '#00ff41',
      secondaryColor: '#00d132',
      accentColor: '#111a2c',
      backgroundColor: '#0a0e1a',
      layout: 'threecolumn',
      spacing: 1.55,
      borderRadius: 2
    },
    rating: 4.9,
    downloads: 20100,
    tags: ['DevOps', 'Grid', 'Mono', 'Crypto', 'K8s', '2025']
  },

  /* ============================================================
     13.  MODERN INDIGO  (Deep indigo + lavender – 2025 trend)
  ============================================================ */
  {
    id: 'modern-indigo-2025',
    name: 'Modern Indigo 2025',
    category: 'Modern',
    description: 'Deep indigo background with lavender accents, sleek cards – perfect for tech & designers.',
    thumbnail: '💜',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Cdefs%3E%3ClinearGradient id="ind" x1="0" y1="0" x2="0" y2="400"%3E%3Cstop offset="0%25" stop-color="%234c1d95"/%3E%3Cstop offset="100%25" stop-color="%232e1065"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23ind)" width="300" height="400"/%3E%3Crect x="20" y="20" width="260" height="70" fill="%23e9d5ff" rx="8" opacity="0.15"/%3E%3Ctext x="30" y="50" font-size="18" font-weight="600" fill="%23f3e8ff" font-family="Inter"%3EEmily Zhang%3C/text%3E%3Ctext x="30" y="70" font-size="12" fill="%23d8b4fe" font-family="Inter"%3EProduct Designer%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Identity',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Emily Zhang', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Senior Product Designer', type: 'text' },
          { id: 'email', label: 'Email', value: 'emily@design.studio', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+86 138 1234 5678', type: 'text' },
          { id: 'location', label: 'Location', value: 'Shanghai, China', type: 'text' },
          { id: 'portfolio', label: 'Portfolio', value: 'emilyzhang.design', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'About',
        content: 'Design systems specialist with 7 years creating delightful user experiences across web & mobile. Passionate about accessibility, microinteractions, and scalable design. Figma community contributor.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Work',
        content: '• Senior Product Designer – TechCorp Asia (2021-now)\nLed design system overhaul for 40+ products, reduced design time 35%.\n\n• Product Designer – Alibaba (2018-2021)\nDesigned marketplace interface used by 2 M+ sellers daily.\n\n• UI Designer – Design Studio (2015-2018)\nCreated brand identities and digital products for startups & corporations.'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Toolkit',
        content: 'Figma • Prototyping • Design Systems • Interaction Design • A11y • User Research • CSS • React • Adobe CC • Framer'
      }
    ],
    styles: {
      fontFamily: 'Inter, -apple-system, sans-serif',
      primaryColor: '#f3e8ff',
      secondaryColor: '#d8b4fe',
      accentColor: '#a78bfa',
      backgroundColor: '#4c1d95',
      layout: 'sidebar',
      spacing: 1.75,
      borderRadius: 12,
      sidebarWidth: '35%'
    },
    rating: 4.85,
    downloads: 17200,
    tags: ['Indigo', 'Designer', 'Modern', 'Lavender', 'SaaS', '2025']
  },

  /* ============================================================
     14.  EMERALD PROFESSIONAL  (Rich emerald + cream)
  ============================================================ */
  {
    id: 'emerald-pro-2025',
    name: 'Emerald Professional 2025',
    category: 'Premium',
    description: 'Luxe emerald green background with cream text – finance, legal, premium roles.',
    thumbnail: '💎',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23065f46" width="300" height="400"/%3E%3Crect x="0" y="0" width="300" height="80" fill="%23047857"/%3E%3Ctext x="20" y="45" font-size="20" font-weight="bold" fill="%23f0fdf4" font-family="Georgia"%3EJames Sullivan%3C/text%3E%3Ctext x="20" y="65" font-size="12" fill="%23bbf7d0" font-family="Georgia"%3EManaging Director%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Contact',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'James Sullivan', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Managing Director', type: 'text' },
          { id: 'email', label: 'Email', value: 'j.sullivan@finance.co.uk', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+44 207 555 0123', type: 'text' },
          { id: 'location', label: 'Location', value: 'London, UK', type: 'text' },
          { id: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/jsullivan', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Executive Summary',
        content: 'Accomplished investment banker with 22 years in M&A and corporate finance. Managed $15 B+ in transactions, led 50+ deals, built and scaled two advisory firms.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Career',
        content: '• Managing Director – Sullivan & Partners (2015-now)\nFounder, grown to 25 professionals, £50 M+ annual revenue.\n\n• Head of M&A – Goldman Sachs (2008-2015)\nManaged 200+ transactions across UK & Europe, VP rank.\n\n• Senior Analyst – Morgan Stanley (2001-2008)\nStructured complex cross-border deals, promoted to Associate.'
      },
      {
        id: 'education',
        type: 'education',
        title: 'Education',
        content: '• MBA – London Business School (2008)\n• BSc Economics – University of Oxford (2001)\n• CFA Charterholder (2010)'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Expertise',
        content: 'M&A • Corporate Finance • Valuations • Due Diligence • Negotiations • Treasury • Private Equity • IPO • Board Advisory'
      }
    ],
    styles: {
      fontFamily: 'Georgia, serif',
      primaryColor: '#f0fdf4',
      secondaryColor: '#bbf7d0',
      accentColor: '#6ee7b7',
      backgroundColor: '#065f46',
      layout: 'classic',
      spacing: 1.85,
      borderRadius: 4
    },
    rating: 4.88,
    downloads: 15500,
    tags: ['Emerald', 'Finance', 'Luxury', 'Premium', 'Banking', '2025']
  },

  /* ============================================================
     15.  SLATE MINIMALIST  (Ultra-minimal charcoal + white)
  ============================================================ */
  {
    id: 'slate-minimalist-2025',
    name: 'Slate Minimalist 2025',
    category: 'Minimal',
    description: 'Charcoal slate background, white content cards – zen aesthetic for consultants.',
    thumbnail: '⬛',
    previewImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%231e293b" width="300" height="400"/%3E%3Crect x="20" y="30" width="260" height="100" fill="%23f1f5f9" rx="6"/%3E%3Ctext x="30" y="60" font-size="18" font-weight="500" fill="%231e293b" font-family="Inter"%3EMarcus Johnson%3C/text%3E%3Ctext x="30" y="80" font-size="12" fill="%23475569" font-family="Inter"%3EManagement Consultant%3C/text%3E%3C/svg%3E',
    structure: [
      {
        id: 'personal',
        type: 'personal',
        title: 'Overview',
        content: '',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Marcus Johnson', type: 'text' },
          { id: 'title', label: 'Professional Title', value: 'Senior Management Consultant', type: 'text' },
          { id: 'email', label: 'Email', value: 'marcus@consulting.io', type: 'text' },
          { id: 'phone', label: 'Phone', value: '+1 312 555 0167', type: 'text' },
          { id: 'location', label: 'Location', value: 'Chicago, IL', type: 'text' },
          { id: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/marcusjohnson', type: 'text' }
        ]
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Mission',
        content: 'Strategic consultant driving transformation for Fortune 500 companies. 12 years optimizing operations, 90% client retention rate, $500 M+ value created.'
      },
      {
        id: 'experience',
        type: 'experience',
        title: 'Consulting Experience',
        content: '• Senior Consultant – Deloitte (2018-now)\nLeading digital transformation projects, $10 M+ value delivered.\n\n• Consultant – PwC (2015-2018)\nAdvised on operational efficiency, cost reduction strategies.\n\n• Analyst – KPMG (2012-2015)\nSupported audit and advisory teams, developed data analytics tools.'
      },
      {
        id: 'education',
        type: 'education',
        title: 'Education',
        content: '• MBA – University of Chicago Booth (2012)\n• BA Economics – University of Illinois Urbana-Champaign (2009)'
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Core Competencies',
        content: 'Management Consulting • Digital Transformation • Data Analytics • Financial Modeling • Strategic Planning • Change Management • Process Improvement • Stakeholder Engagement'
      }
    ],
    styles: {
      fontFamily: 'Inter, -apple-system, sans-serif',
      primaryColor: '#1e293b',
      secondaryColor: '#475569',
      accentColor: '#94a3b8',
      backgroundColor: '#f1f5f9',
      layout: 'classic',
      spacing: 1.75,
      borderRadius: 6
    },
    rating: 4.8,
    downloads: 14500,
    tags: ['Minimal', 'Consulting', 'Zen', 'Charcoal', '2025']
  }
]

export default cvTemplates