import type {
  User, Category, Course, Lesson, LearningPath, BlogPost, Testimonial, FAQ, Plan
} from './types'
import { uid } from './utils'

const t = (text: string, color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="${color}"/><text x="320" y="185" font-family="system-ui" font-size="26" fill="#ffffff" text-anchor="middle" opacity="0.9">${text}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
const sec = (title: string, lessons: Lesson[]) => ({ id: uid('sec'), title, lessons })
const L = (title: string, type: Lesson['type'], duration: number): Lesson => ({ id: uid('les'), title, type, duration, content: '' })
const faq = (q: string, a: string) => ({ id: uid('faq'), q, a })

export const CATEGORIES: Category[] = [
  { id: 'c1', name: 'Cybersecurity', slug: 'cybersecurity', description: 'Defensive and offensive security skills for the modern enterprise.', icon: 'Shield', courseCount: 6, color: '#1B4E9B' },
  { id: 'c2', name: 'Programming', slug: 'programming', description: 'Languages, frameworks, and software craftsmanship.', icon: 'Code2', courseCount: 5, color: '#123564' },
  { id: 'c3', name: 'Data Science', slug: 'data-science', description: 'Analytics, machine learning, and data storytelling.', icon: 'BarChart3', courseCount: 4, color: '#4F7FBE' },
  { id: 'c4', name: 'Cloud Engineering', slug: 'cloud-engineering', description: 'Architecture, DevOps, and infrastructure at scale.', icon: 'Cloud', courseCount: 3, color: '#16417F' },
  { id: 'c5', name: 'Business', slug: 'business', description: 'Strategy, operations, and leadership fundamentals.', icon: 'Briefcase', courseCount: 2, color: '#0E294E' },
  { id: 'c6', name: 'Design', slug: 'design', description: 'Product, UX, and visual communication.', icon: 'Palette', courseCount: 2, color: '#8AADD9' },
  { id: 'c7', name: 'Finance', slug: 'finance', description: 'Markets, investing, and financial modeling.', icon: 'TrendingUp', courseCount: 2, color: '#5B6472' },
  { id: 'c8', name: 'Personal Development', slug: 'personal-development', description: 'Productivity, communication, and career growth.', icon: 'Sparkles', courseCount: 2, color: '#B7791F' }
]

export const INSTRUCTORS: User[] = [
  { id: 'u_in_1', name: 'Dr. Amara Okafor', email: 'amara.okafor@defendhub.io', role: 'instructor', avatar: '', title: 'Cybersecurity Researcher & CISSP', headline: 'Former SOC director with 15 years in threat detection and incident response.', bio: 'Amara has led blue teams for two Fortune 100 firms and currently advises security startups. She teaches with real-world war stories, not just slides.', skills: ['Threat Intelligence', 'Incident Response', 'Network Defense'], joinedAt: '2023-01-12', studentCount: 12840, courseCount: 3, rating: 4.9, isActive: true },
  { id: 'u_in_2', name: 'Marcus Bennett', email: 'marcus.bennett@defendhub.io', role: 'instructor', avatar: '', title: 'Penetration Tester & OSCP Trainer', headline: 'Ethical hacker focused on web and cloud exploitation.', bio: 'Marcus has found critical vulnerabilities in banking and healthcare systems. His labs feel like a real red-team engagement.', skills: ['Penetration Testing', 'Web Exploitation', 'Cloud Security'], joinedAt: '2023-02-03', studentCount: 9530, courseCount: 2, rating: 4.8, isActive: true },
  { id: 'u_in_3', name: 'Sofia Reyes', email: 'sofia.reyes@defendhub.io', role: 'instructor', avatar: '', title: 'Machine Learning Engineer', headline: 'Building ML systems that are accurate, explainable, and production-ready.', bio: 'Sofia has shipped recommendation and fraud systems used by millions. She teaches statistics with intuition first, math second.', skills: ['Machine Learning', 'Python', 'MLOps'], joinedAt: '2023-03-20', studentCount: 14300, courseCount: 2, rating: 4.9, isActive: true },
  { id: 'u_in_4', name: 'David Chen', email: 'david.chen@defendhub.io', role: 'instructor', avatar: '', title: 'Senior Cloud Architect', headline: 'AWS and GCP certified architect specializing in serverless.', bio: 'David has migrated enterprises of 10k+ employees to the cloud without a single weekend outage.', skills: ['AWS', 'Serverless', 'Terraform'], joinedAt: '2023-04-01', studentCount: 8120, courseCount: 2, rating: 4.7, isActive: true },
  { id: 'u_in_5', name: 'Priya Sharma', email: 'priya.sharma@defendhub.io', role: 'instructor', avatar: '', title: 'Full-Stack Engineer & Educator', headline: '12 years building web products; loves turning beginners into builders.', bio: 'Priya runs a 40k-subscriber YouTube channel and has mentored over 300 junior developers into their first roles.', skills: ['React', 'Node.js', 'TypeScript'], joinedAt: '2023-05-15', studentCount: 22100, courseCount: 3, rating: 4.8, isActive: true },
  { id: 'u_in_6', name: 'James Oyelaran', email: 'james.oyelaran@defendhub.io', role: 'instructor', avatar: '', title: 'DevOps Engineer', headline: 'Automation obsessed. CI/CD pipelines and Kubernetes at scale.', bio: 'James has built release pipelines for fintech and government platforms where a failed deploy means real money.', skills: ['Kubernetes', 'CI/CD', 'Docker'], joinedAt: '2023-06-10', studentCount: 6890, courseCount: 1, rating: 4.6, isActive: true },
  { id: 'u_in_7', name: 'Elena Petrova', email: 'elena.petrova@defendhub.io', role: 'instructor', avatar: '', title: 'UX Designer & Design Lead', headline: 'Human-centered design that ships. Ex-Google, now independent.', bio: 'Elena has led design for fintech and health products. Her courses focus on process, not just portfolios.', skills: ['UX Design', 'Design Systems', 'Prototyping'], joinedAt: '2023-07-22', studentCount: 7450, courseCount: 2, rating: 4.8, isActive: true },
  { id: 'u_in_8', name: 'Kwame Mensah', email: 'kwame.mensah@defendhub.io', role: 'instructor', avatar: '', title: 'Finance Strategist', headline: 'Chartered accountant and ex-investment banker, now an educator.', bio: 'Kwame demystifies finance for non-finance professionals with clear frameworks and real statements.', skills: ['Financial Modeling', 'Investing', 'Corporate Finance'], joinedAt: '2023-08-08', studentCount: 11200, courseCount: 2, rating: 4.9, isActive: true },
  { id: 'u_in_9', name: 'Laura Kim', email: 'laura.kim@defendhub.io', role: 'instructor', avatar: '', title: 'Digital Marketing Director', headline: 'Growth marketing for SaaS and education brands.', bio: 'Laura has scaled three startups from zero to six-figure MRR through content and lifecycle marketing.', skills: ['Growth', 'SEO', 'Email Marketing'], joinedAt: '2023-09-14', studentCount: 9600, courseCount: 1, rating: 4.7, isActive: true },
  { id: 'u_in_10', name: 'Tomás Ferreira', email: 'tomas.ferreira@defendhub.io', role: 'instructor', avatar: '', title: 'Data Engineer & Analytics Lead', headline: 'Turning raw data into decisions. Python, SQL, and dbt.', bio: 'Tomás has built analytics platforms for retail and logistics companies processing billions of events a day.', skills: ['SQL', 'Python', 'Data Pipelines'], joinedAt: '2023-10-02', studentCount: 5300, courseCount: 1, rating: 4.8, isActive: true }
]

export const COURSES: Course[] = [
  {
    id: 'cr_1', slug: 'cybersecurity-fundamentals', title: 'Cybersecurity Fundamentals', subtitle: 'Foundational defense concepts every professional needs.',
    description: 'Learn the core principles of protecting systems, networks, and data.',
    longDescription: 'This course gives you a complete mental model of modern cybersecurity: how attackers operate, how defenders think, and how you can secure real environments. Through hands-on labs and realistic scenarios, you will leave able to speak the language of security and contribute from day one.',
    categoryId: 'c1', instructorId: 'u_in_1', thumbnail: t('Cybersecurity Fundamentals', '#1B4E9B'),
    price: 89, discountPrice: 49, rating: 4.9, reviewCount: 1240, studentCount: 8640, duration: 18,
    level: 'Beginner', language: 'English', lastUpdated: '2025-11-02', hasCertificate: true,
    isFeatured: true, isTrending: true, isNew: false, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Identify the CIA triad and how it shapes security decisions' },
      { id: uid('o'), text: 'Understand common attack vectors and defense strategies' },
      { id: uid('o'), text: 'Harden a basic network with firewalls and segmentation' },
      { id: uid('o'), text: 'Respond to a simulated security incident' },
      { id: uid('o'), text: 'Prepare for entry-level security roles' }
    ],
    requirements: [
      { id: uid('r'), text: 'A computer with internet access' },
      { id: uid('r'), text: 'No prior security experience required' },
      { id: uid('r'), text: 'Curiosity and willingness to do the labs' }
    ],
    sections: [
      sec('Welcome & Orientation', [
        L('Course Overview & How to Succeed', 'video', 8),
        L('The Threat Landscape in 2026', 'video', 12),
        L('Setting Up Your Lab Environment', 'article', 10)
      ]),
      sec('Core Security Concepts', [
        L('The CIA Triad Deep Dive', 'video', 15),
        L('Authentication vs Authorization', 'video', 11),
        L('Defense in Depth', 'article', 9),
        L('Section 1 Quiz', 'quiz', 15)
      ]),
      sec('Network Security', [
        L('How Networks Are Attacked', 'video', 18),
        L('Firewalls, IDS and Segmentation', 'video', 21),
        L('Hands-On: Securing a Home Lab', 'project', 40),
        L('Section 2 Quiz', 'quiz', 12)
      ]),
      sec('Incident Response & Final Assessment', [
        L('The Incident Response Lifecycle', 'video', 16),
        L('Final Assessment: Cybersecurity Fundamentals', 'exam', 30)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_1', userName: 'John Adedeji', rating: 5, text: 'The labs made everything click. I landed my first SOC internship because of this course.', date: '2025-12-10' },
      { id: uid('rv'), userId: 'u_st_2', userName: 'Grace Okonkwo', rating: 5, text: 'Dr. Okafor explains complex topics with clarity. Best investment in my career this year.', date: '2025-11-28' }
    ],
    faqs: [faq('Do I need prior experience?', 'No. This course starts from zero and builds up step by step.')]
  },
  {
    id: 'cr_2', slug: 'penetration-testing-essentials', title: 'Penetration Testing Essentials', subtitle: 'Think like an attacker to secure like a defender.',
    description: 'Master reconnaissance, exploitation, and reporting on authorized targets.',
    longDescription: 'Learn the ethical hacker methodology end to end: reconnaissance, scanning, exploitation, and reporting. You will practice in a fully legal, contained lab environment and finish with the confidence to pursue OSCP-style certification paths.',
    categoryId: 'c1', instructorId: 'u_in_2', thumbnail: t('Penetration Testing', '#123564'),
    price: 129, discountPrice: 79, rating: 4.8, reviewCount: 870, studentCount: 6120, duration: 24,
    level: 'Intermediate', language: 'English', lastUpdated: '2026-01-15', hasCertificate: true,
    isFeatured: true, isTrending: true, isNew: false, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Perform reconnaissance with Nmap and OSINT' },
      { id: uid('o'), text: 'Exploit common web vulnerabilities safely' },
      { id: uid('o'), text: 'Write professional penetration test reports' },
      { id: uid('o'), text: 'Understand legal and ethical boundaries' }
    ],
    requirements: [
      { id: uid('r'), text: 'Cybersecurity Fundamentals or equivalent' },
      { id: uid('r'), text: 'Basic Linux command-line comfort' }
    ],
    sections: [
      sec('Ethical Foundations', [
        L('What Ethical Hacking Really Means', 'video', 10),
        L('Rules of Engagement & Legal Boundaries', 'video', 14),
        L('Building a Legal Lab with Virtual Machines', 'article', 12)
      ]),
      sec('Reconnaissance', [
        L('Passive Reconnaissance & OSINT', 'video', 20),
        L('Active Reconnaissance with Nmap', 'video', 26),
        L('Lab: Mapping a Target Network', 'project', 45)
      ]),
      sec('Exploitation & Reporting', [
        L('Exploiting Common Web Flaws', 'video', 32),
        L('Writing a Professional Report', 'article', 15),
        L('Mid-Course Quiz', 'quiz', 15),
        L('Final Assessment: Pentest Essentials', 'exam', 45)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_3', userName: 'Liam Anderson', rating: 5, text: 'The labs are phenomenal. I finally understand the pentest lifecycle.', date: '2026-01-20' },
      { id: uid('rv'), userId: 'u_st_4', userName: 'Aisha Bello', rating: 4, text: 'Very practical. The report-writing module is worth the price alone.', date: '2025-12-30' }
    ],
    faqs: [faq('Is the lab environment included?', 'Yes, every student gets step-by-step setup for a free, legal lab.')]
  },
  {
    id: 'cr_3', slug: 'machine-learning-with-python', title: 'Machine Learning with Python', subtitle: 'From first model to production-grade ML systems.',
    description: 'Build, evaluate, and deploy machine learning models with scikit-learn and PyTorch.',
    longDescription: 'A complete, project-driven introduction to machine learning. You will learn the statistics behind the models, build them with Python, and deploy them responsibly. By the end you will have three portfolio projects.',
    categoryId: 'c3', instructorId: 'u_in_3', thumbnail: t('Machine Learning', '#4F7FBE'),
    price: 99, rating: 4.9, reviewCount: 1560, studentCount: 12400, duration: 30,
    level: 'Intermediate', language: 'English', lastUpdated: '2025-12-05', hasCertificate: true,
    isFeatured: true, isTrending: false, isNew: false, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Understand regression, classification, and clustering' },
      { id: uid('o'), text: 'Build pipelines with scikit-learn' },
      { id: uid('o'), text: 'Train neural networks with PyTorch' },
      { id: uid('o'), text: 'Evaluate models and avoid common pitfalls' },
      { id: uid('o'), text: 'Deploy a model behind an API' }
    ],
    requirements: [
      { id: uid('r'), text: 'Basic Python syntax' },
      { id: uid('r'), text: 'High-school level math' }
    ],
    sections: [
      sec('Foundations', [
        L('Why Machine Learning Works', 'video', 12),
        L('Python Data Stack Overview', 'article', 10),
        L('Your First Model in 20 Minutes', 'video', 22)
      ]),
      sec('Core Algorithms', [
        L('Linear & Logistic Regression', 'video', 24),
        L('Decision Trees & Random Forests', 'video', 26),
        L('Lab: Predicting Customer Churn', 'project', 50),
        L('Section 2 Quiz', 'quiz', 15)
      ]),
      sec('Neural Networks & Deployment', [
        L('Neural Networks from Scratch', 'video', 30),
        L('Intro to PyTorch', 'video', 28),
        L('Deploying with FastAPI', 'video', 25),
        L('Final Project: ML in Production', 'project', 90),
        L('Final Assessment: ML with Python', 'exam', 40)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_5', userName: 'Ethan Moore', rating: 5, text: 'Finally understand what sklearn is really doing under the hood.', date: '2026-01-05' },
      { id: uid('rv'), userId: 'u_st_6', userName: 'Chloe Davis', rating: 5, text: 'The deployment module alone saved me months of trial and error.', date: '2025-12-18' }
    ],
    faqs: [faq('Do I need a GPU?', 'No. All exercises run on any laptop.')]
  },
  {
    id: 'cr_4', slug: 'aws-cloud-architecture', title: 'AWS Cloud Architecture', subtitle: 'Design secure, scalable, cost-effective cloud systems.',
    description: 'Architect production workloads on AWS with practical, exam-aligned content.',
    longDescription: 'From VPC design to serverless, this course teaches you how to architect AWS solutions that are secure, resilient, and cost-aware. Includes hands-on labs and a practice architectural review.',
    categoryId: 'c4', instructorId: 'u_in_4', thumbnail: t('AWS Architecture', '#16417F'),
    price: 119, discountPrice: 89, rating: 4.7, reviewCount: 640, studentCount: 4580, duration: 26,
    level: 'Intermediate', language: 'English', lastUpdated: '2025-11-20', hasCertificate: true,
    isFeatured: false, isTrending: true, isNew: false, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Design secure VPC and network topologies' },
      { id: uid('o'), text: 'Architect for high availability and fault tolerance' },
      { id: uid('o'), text: 'Implement IAM least privilege' },
      { id: uid('o'), text: 'Optimize cost with serverless and managed services' }
    ],
    requirements: [
      { id: uid('r'), text: 'Basic IT concepts' },
      { id: uid('r'), text: 'A free AWS account (optional)' }
    ],
    sections: [
      sec('Cloud Foundations', [
        L('AWS Global Infrastructure', 'video', 14),
        L('Well-Architected Framework', 'video', 18),
        L('Building Your First VPC', 'project', 35)
      ]),
      sec('Core Services', [
        L('Compute: EC2 & Lambda', 'video', 22),
        L('Storage: S3 & EBS', 'video', 20),
        L('Networking: ELB & Route 53', 'video', 18),
        L('Section 2 Quiz', 'quiz', 15)
      ]),
      sec('Security & Architecture', [
        L('IAM Done Right', 'video', 24),
        L('Architecture Review Case Study', 'article', 20),
        L('Final Assessment: Cloud Architecture', 'exam', 35)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_7', userName: 'Hannah Wilson', rating: 5, text: 'Clear, current, and exam-aligned without being a brain dump.', date: '2025-12-22' },
      { id: uid('rv'), userId: 'u_st_8', userName: 'Benjamin Taylor', rating: 4, text: 'Great labs. Would love a second architecture case study.', date: '2025-11-30' }
    ],
    faqs: [faq('Does this prepare for the SAA-C03 exam?', 'Yes, it covers the core domains with practice scenarios.')]
  },
  {
    id: 'cr_5', slug: 'full-stack-javascript', title: 'The Complete Full-Stack JavaScript Course', subtitle: 'React, Node.js, and TypeScript — ship real products.',
    description: 'Build and deploy full-stack applications with the modern JavaScript stack.',
    longDescription: 'A project-based journey from HTML/CSS foundations to deploying a full-stack app. You will build a real product across the course using React, Node.js, PostgreSQL, and TypeScript — and deploy it to the cloud.',
    categoryId: 'c2', instructorId: 'u_in_5', thumbnail: t('Full-Stack JS', '#123564'),
    price: 109, discountPrice: 69, rating: 4.8, reviewCount: 2100, studentCount: 18900, duration: 42,
    level: 'Beginner', language: 'English', lastUpdated: '2026-01-10', hasCertificate: true,
    isFeatured: true, isTrending: true, isNew: false, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Master modern JavaScript and TypeScript' },
      { id: uid('o'), text: 'Build reactive UIs with React' },
      { id: uid('o'), text: 'Create REST APIs with Node.js and Express' },
      { id: uid('o'), text: 'Model data with PostgreSQL' },
      { id: uid('o'), text: 'Deploy a complete application' }
    ],
    requirements: [
      { id: uid('r'), text: 'No experience required — we start from zero' },
      { id: uid('r'), text: 'A computer with Node.js installed' }
    ],
    sections: [
      sec('JavaScript & TypeScript', [
        L('Modern JavaScript Essentials', 'video', 24),
        L('TypeScript for Everyday Development', 'video', 26),
        L('Async Patterns & Promises', 'video', 20),
        L('Section 1 Quiz', 'quiz', 15)
      ]),
      sec('Frontend with React', [
        L('React Components & State', 'video', 28),
        L('Routing & Data Fetching', 'video', 24),
        L('Styling Modern UIs with Tailwind', 'video', 22),
        L('Project: Build a Dashboard', 'project', 60)
      ]),
      sec('Backend & Deployment', [
        L('APIs with Node & Express', 'video', 26),
        L('PostgreSQL & Prisma', 'video', 24),
        L('Deploying to Production', 'video', 20),
        L('Final Assessment: Full-Stack JS', 'exam', 45)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_9', userName: 'Zoe Harris', rating: 5, text: 'Went from zero to deployed app. The pacing is perfect.', date: '2026-01-12' },
      { id: uid('rv'), userId: 'u_st_10', userName: 'Daniel Clark', rating: 5, text: 'Best full-stack course I have taken, and I have taken several.', date: '2025-12-25' }
    ],
    faqs: [faq('What will I be able to build?', 'You will ship a real dashboard app with auth, database, and deployment.')]
  },
  {
    id: 'cr_6', slug: 'linux-security-hardening', title: 'Linux Security Hardening', subtitle: 'Lock down Linux servers like a professional.',
    description: 'Secure Linux systems from first boot to production lockdown.',
    longDescription: 'Hands-on hardening of Linux servers: identity, access controls, hardening kernel and services, auditing, and monitoring. Includes live config walkthroughs and hardening checklists.',
    categoryId: 'c1', instructorId: 'u_in_1', thumbnail: t('Linux Hardening', '#1B4E9B'),
    price: 79, rating: 4.8, reviewCount: 490, studentCount: 3820, duration: 16,
    level: 'Intermediate', language: 'English', lastUpdated: '2025-10-28', hasCertificate: true,
    isFeatured: false, isTrending: false, isNew: false, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Harden SSH and authentication' },
      { id: uid('o'), text: 'Apply least privilege with sudo and SELinux' },
      { id: uid('o'), text: 'Configure auditing with auditd' },
      { id: uid('o'), text: 'Automate hardening with Ansible' }
    ],
    requirements: [
      { id: uid('r'), text: 'Comfort with the Linux command line' },
      { id: uid('r'), text: 'A VM or cloud server to practice on' }
    ],
    sections: [
      sec('Access Control', [
        L('Identity, Authentication & SSH', 'video', 20),
        L('Sudo, PAM & Password Policy', 'video', 18),
        L('Hands-On: Harden SSH', 'project', 30)
      ]),
      sec('Defense & Auditing', [
        L('SELinux & AppArmor in Practice', 'video', 22),
        L('Auditing with auditd & Logs', 'video', 16),
        L('Automating Hardening with Ansible', 'video', 25),
        L('Final Assessment: Linux Hardening', 'exam', 30)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_11', userName: 'Samuel Walker', rating: 5, text: 'Instantly usable in my day job as a sysadmin.', date: '2025-12-01' },
      { id: uid('rv'), userId: 'u_st_12', userName: 'Olivia Hall', rating: 4, text: 'Solid and practical. The Ansible module is a bonus.', date: '2025-11-10' }
    ],
    faqs: [faq('Do I need a Linux box?', 'A free VM is fine. Setup guide included.')]
  },
  {
    id: 'cr_7', slug: 'data-analysis-python', title: 'Data Analysis with Python', subtitle: 'Clean, explore, and visualize data with confidence.',
    description: 'A practical introduction to pandas, NumPy, and data visualization.',
    longDescription: 'Turn messy data into clear decisions. This course teaches the full analysis workflow: loading, cleaning, exploring, and visualizing data with pandas and matplotlib, plus a capstone on a real dataset.',
    categoryId: 'c3', instructorId: 'u_in_10', thumbnail: t('Data Analysis', '#5B6472'),
    price: 79, discountPrice: 49, rating: 4.8, reviewCount: 780, studentCount: 6850, duration: 22,
    level: 'Beginner', language: 'English', lastUpdated: '2025-12-15', hasCertificate: true,
    isFeatured: false, isTrending: true, isNew: false, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Load and clean datasets with pandas' },
      { id: uid('o'), text: 'Aggregate and join data like a pro' },
      { id: uid('o'), text: 'Build clear visualizations with matplotlib' },
      { id: uid('o'), text: 'Present findings with a capstone project' }
    ],
    requirements: [
      { id: uid('r'), text: 'Basic Python familiarity' },
      { id: uid('r'), text: 'Jupyter or VS Code' }
    ],
    sections: [
      sec('The Analysis Workflow', [
        L('Setting Up Your Notebook Environment', 'video', 12),
        L('pandas Series & DataFrames', 'video', 24),
        L('Cleaning Messy Data', 'video', 22),
        L('Section 1 Quiz', 'quiz', 12)
      ]),
      sec('Exploration & Communication', [
        L('Grouping & Aggregation', 'video', 20),
        L('Visualization Fundamentals', 'video', 22),
        L('Capstone: Analyzing a Real Dataset', 'project', 60),
        L('Final Assessment: Data Analysis', 'exam', 30)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_13', userName: 'Emily Lewis', rating: 5, text: 'Perfect for someone like me moving from Excel to Python.', date: '2026-01-02' },
      { id: uid('rv'), userId: 'u_st_14', userName: 'Gabriel Young', rating: 5, text: 'The capstone made everything stick.', date: '2025-12-20' }
    ],
    faqs: [faq('Do I need statistics knowledge?', 'No, everything is taught with intuition and examples.')]
  },
  {
    id: 'cr_8', slug: 'kubernetes-for-ops', title: 'Kubernetes for Ops', subtitle: 'Run production Kubernetes you actually understand.',
    description: 'Deploy, scale, and troubleshoot Kubernetes clusters with confidence.',
    longDescription: 'Operational Kubernetes from the ground up: pods, deployments, services, storage, security, and debugging real incidents. Includes a local kind cluster throughout so you practice every concept.',
    categoryId: 'c4', instructorId: 'u_in_6', thumbnail: t('Kubernetes for Ops', '#0E294E'),
    price: 99, rating: 4.6, reviewCount: 320, studentCount: 2900, duration: 20,
    level: 'Intermediate', language: 'English', lastUpdated: '2025-11-08', hasCertificate: true,
    isFeatured: false, isTrending: false, isNew: false, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Understand the Kubernetes control plane' },
      { id: uid('o'), text: 'Deploy and scale workloads' },
      { id: uid('o'), text: 'Secure clusters with RBAC and network policies' },
      { id: uid('o'), text: 'Debug common cluster failures' }
    ],
    requirements: [
      { id: uid('r'), text: 'Docker basics' },
      { id: uid('r'), text: 'Comfort with the command line' }
    ],
    sections: [
      sec('Core Concepts', [
        L('How Kubernetes Thinks', 'video', 18),
        L('Pods, Deployments & Services', 'video', 26),
        L('Storage & Persistent Volumes', 'video', 20)
      ]),
      sec('Operations', [
        L('RBAC & Network Policies', 'video', 22),
        L('Troubleshooting Common Failures', 'video', 24),
        L('Incident Lab: Fix a Broken Cluster', 'project', 50),
        L('Final Assessment: K8s for Ops', 'exam', 30)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_15', userName: 'Ryan King', rating: 5, text: 'Finally Kubernetes makes sense beyond YAML copy-paste.', date: '2025-12-12' },
      { id: uid('rv'), userId: 'u_st_16', userName: 'Isabella Wright', rating: 4, text: 'Great incident lab. Very realistic.', date: '2025-11-25' }
    ],
    faqs: [faq('Do I need a paid cluster?', 'No — everything runs on a free local kind cluster.')]
  },
  {
    id: 'cr_9', slug: 'ui-ux-design-fundamentals', title: 'UI/UX Design Fundamentals', subtitle: 'Design products people love to use.',
    description: 'The complete design process from research to polished interface.',
    longDescription: 'Learn the end-to-end product design process: user research, wireframes, visual design, prototyping, and handing off to engineers. Build a portfolio case study as you go.',
    categoryId: 'c6', instructorId: 'u_in_7', thumbnail: t('UI/UX Design', '#8AADD9'),
    price: 69, discountPrice: 39, rating: 4.8, reviewCount: 430, studentCount: 3950, duration: 20,
    level: 'Beginner', language: 'English', lastUpdated: '2025-12-20', hasCertificate: true,
    isFeatured: false, isTrending: false, isNew: true, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Conduct lightweight user research' },
      { id: uid('o'), text: 'Create wireframes and prototypes' },
      { id: uid('o'), text: 'Apply typography, color, and spacing systems' },
      { id: uid('o'), text: 'Build a portfolio case study' }
    ],
    requirements: [
      { id: uid('r'), text: 'No design experience needed' },
      { id: uid('r'), text: 'Figma (free tier is fine)' }
    ],
    sections: [
      sec('Design Process', [
        L('What Great UX Really Is', 'video', 14),
        L('Research & Problem Framing', 'video', 18),
        L('Wireframing & Information Architecture', 'video', 20)
      ]),
      sec('Visual & Handoff', [
        L('Typography, Color & Spacing Systems', 'video', 22),
        L('Prototyping in Figma', 'video', 20),
        L('Designing a Mobile App Case Study', 'project', 60),
        L('Final Assessment: Design Fundamentals', 'exam', 30)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_17', userName: 'Matthew Scott', rating: 5, text: 'Took me from clueless to a case study I am proud to show.', date: '2026-01-08' },
      { id: uid('rv'), userId: 'u_st_18', userName: 'Ella Green', rating: 4, text: 'Loved the process focus. Very actionable.', date: '2025-12-27' }
    ],
    faqs: [faq('What will my portfolio include?', 'You will finish with a complete mobile app case study ready to present.')]
  },
  {
    id: 'cr_10', slug: 'financial-modeling', title: 'Financial Modeling for Decision Makers', subtitle: 'Build models that actually inform business decisions.',
    description: 'Model revenue, costs, and cash flow in Excel from scratch.',
    longDescription: 'For analysts and founders: build a complete three-statement financial model, project scenarios, and present results confidently. Real company templates included.',
    categoryId: 'c7', instructorId: 'u_in_8', thumbnail: t('Financial Modeling', '#8AADD9'),
    price: 89, discountPrice: 59, rating: 4.9, reviewCount: 520, studentCount: 4100, duration: 18,
    level: 'Intermediate', language: 'English', lastUpdated: '2025-11-30', hasCertificate: true,
    isFeatured: false, isTrending: false, isNew: false, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Structure a three-statement model' },
      { id: uid('o'), text: 'Forecast revenue with clear drivers' },
      { id: uid('o'), text: 'Build scenario and sensitivity analyses' },
      { id: uid('o'), text: 'Present financials to stakeholders' }
    ],
    requirements: [
      { id: uid('r'), text: 'Excel basics' },
      { id: uid('r'), text: 'A curious mind for business' }
    ],
    sections: [
      sec('Model Foundations', [
        L('The Three-Statement Model Explained', 'video', 20),
        L('Building the Income Statement', 'video', 24),
        L('Balance Sheet & Cash Flow', 'video', 26)
      ]),
      sec('Analysis & Communication', [
        L('Scenario & Sensitivity Analysis', 'video', 22),
        L('Presenting to Decision Makers', 'article', 14),
        L('Project: Model a Real Company', 'project', 60),
        L('Final Assessment: Financial Modeling', 'exam', 30)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_19', userName: 'Jack Baker', rating: 5, text: 'The scenarios module changed how I present numbers.', date: '2025-12-15' },
      { id: uid('rv'), userId: 'u_st_20', userName: 'Amelia Adams', rating: 5, text: 'Clear, patient, and deeply practical.', date: '2025-11-22' }
    ],
    faqs: [faq('Is this Excel-only?', 'Yes, everything is done in Excel. No coding required.')]
  },
  {
    id: 'cr_11', slug: 'siem-threat-hunting', title: 'SIEM & Threat Hunting', subtitle: 'Find the threats your tools are missing.',
    description: 'Master SIEM analytics and proactive threat hunting in Splunk and Elastic.',
    longDescription: 'Go beyond alerts. Learn how to query, correlate, and hunt across logs to detect the attacks that slip past signature-based defenses. Hands-on with realistic security telemetry.',
    categoryId: 'c1', instructorId: 'u_in_1', thumbnail: t('SIEM & Threat Hunting', '#1B4E9B'),
    price: 109, rating: 4.9, reviewCount: 380, studentCount: 2980, duration: 22,
    level: 'Advanced', language: 'English', lastUpdated: '2026-01-05', hasCertificate: true,
    isFeatured: false, isTrending: true, isNew: true, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Query SIEMs with confidence (SPL & KQL)' },
      { id: uid('o'), text: 'Build detection rules that produce few false positives' },
      { id: uid('o'), text: 'Run a structured threat hunting loop' },
      { id: uid('o'), text: 'Investigate a multi-stage intrusion' }
    ],
    requirements: [
      { id: uid('r'), text: 'Cybersecurity Fundamentals' },
      { id: uid('r'), text: 'Basic log concepts' }
    ],
    sections: [
      sec('SIEM Foundations', [
        L('How SIEMs Work Under the Hood', 'video', 18),
        L('Searching Logs with SPL & KQL', 'video', 26),
        L('Parsing & Normalizing Events', 'article', 16)
      ]),
      sec('Hunting & Detection', [
        L('Building High-Fidelity Detections', 'video', 24),
        L('The Threat Hunting Hypothesis Loop', 'video', 22),
        L('Hands-On: Hunt a Simulated Intrusion', 'project', 60),
        L('Final Assessment: SIEM & Threat Hunting', 'exam', 40)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_21', userName: 'Henry Nelson', rating: 5, text: 'The hunting lab is genuinely challenging and rewarding.', date: '2026-01-18' },
      { id: uid('rv'), userId: 'u_st_22', userName: 'Charlotte Hill', rating: 5, text: 'Elevated my SOC skills instantly.', date: '2026-01-09' }
    ],
    faqs: [faq('Which SIEM do we use?', 'Splunk-style SPL and Elastic KQL are both covered.')]
  },
  {
    id: 'cr_12', slug: 'growth-marketing', title: 'Growth Marketing Playbook', subtitle: 'Compounding, repeatable customer acquisition.',
    description: 'Build a full-funnel growth engine for your product.',
    longDescription: 'A playbook for sustainable growth: positioning, SEO, content, lifecycle email, and experimentation. Work through a real growth plan for your own product by the end.',
    categoryId: 'c5', instructorId: 'u_in_9', thumbnail: t('Growth Marketing', '#B7791F'),
    price: 69, discountPrice: 39, rating: 4.7, reviewCount: 290, studentCount: 2600, duration: 16,
    level: 'Beginner', language: 'English', lastUpdated: '2025-12-10', hasCertificate: true,
    isFeatured: false, isTrending: false, isNew: false, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Define positioning and ICP' },
      { id: uid('o'), text: 'Build an SEO and content engine' },
      { id: uid('o'), text: 'Design lifecycle email flows' },
      { id: uid('o'), text: 'Run experiments with a clear framework' }
    ],
    requirements: [
      { id: uid('r'), text: 'No marketing background needed' }
    ],
    sections: [
      sec('Strategy', [
        L('Positioning & Your Ideal Customer', 'video', 18),
        L('Channel Selection & Budgeting', 'video', 16),
        L('Section 1 Quiz', 'quiz', 10)
      ]),
      sec('Execution', [
        L('SEO & Content That Compounds', 'video', 20),
        L('Lifecycle Email & Retention', 'video', 18),
        L('Experimentation Framework', 'article', 14),
        L('Project: Build Your Growth Plan', 'project', 45),
        L('Final Assessment: Growth Marketing', 'exam', 30)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_23', userName: 'Leo Carter', rating: 5, text: 'Walked away with a real plan, not just theory.', date: '2025-12-28' },
      { id: uid('rv'), userId: 'u_st_24', userName: 'Mia Mitchell', rating: 4, text: 'Excellent frameworks. Very practical.', date: '2025-12-05' }
    ],
    faqs: [faq('Is this for B2B or B2C?', 'Both. The frameworks apply across models.')]
  },
  {
    id: 'cr_13', slug: 'python-for-security', title: 'Python for Security Professionals', subtitle: 'Automate boring security work with Python.',
    description: 'Script your way to faster investigations and stronger defenses.',
    longDescription: 'Learn Python through a security lens: log parsing, port scanning, API automation, and simple detections. Perfect for SOC analysts and pentesters who want to automate.',
    categoryId: 'c2', instructorId: 'u_in_2', thumbnail: t('Python for Security', '#123564'),
    price: 89, rating: 4.8, reviewCount: 340, studentCount: 3100, duration: 18,
    level: 'Beginner', language: 'English', lastUpdated: '2025-11-25', hasCertificate: true,
    isFeatured: false, isTrending: false, isNew: false, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Write Python scripts to automate security tasks' },
      { id: uid('o'), text: 'Parse and enrich security logs' },
      { id: uid('o'), text: 'Interact with APIs like VirusTotal and Shodan' },
      { id: uid('o'), text: 'Build a simple detection script' }
    ],
    requirements: [
      { id: uid('r'), text: 'No Python experience required' },
      { id: uid('r'), text: 'Security fundamentals or interest in security' }
    ],
    sections: [
      sec('Python Basics for Security', [
        L('Setting Up Your Python Workbench', 'video', 12),
        L('Working with Files & Logs', 'video', 22),
        L('Scripting Control Flow', 'video', 18)
      ]),
      sec('Security Automation', [
        L('APIs & OSINT Automation', 'video', 24),
        L('Building a Detection Script', 'video', 22),
        L('Project: Log Enrichment Tool', 'project', 40),
        L('Final Assessment: Python for Security', 'exam', 30)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_25', userName: 'Alexander Perez', rating: 5, text: 'I automated a task the same week I finished the course.', date: '2026-01-03' },
      { id: uid('rv'), userId: 'u_st_26', userName: 'Harper Roberts', rating: 4, text: 'Great intro for analysts who hate scripting.', date: '2025-12-14' }
    ],
    faqs: [faq('Will this help with certs like CompTIA?', 'It complements them with practical automation skills.')]
  },
  {
    id: 'cr_14', slug: 'product-management-essentials', title: 'Product Management Essentials', subtitle: 'From idea to shipped product people use.',
    description: 'Learn discovery, roadmapping, and delivery as a PM.',
    longDescription: 'The modern PM toolkit: customer discovery, prioritization frameworks, roadmaps, and working with engineers and designers. Build a product one-pager and roadmap for your own idea.',
    categoryId: 'c5', instructorId: 'u_in_7', thumbnail: t('Product Management', '#16417F'),
    price: 79, discountPrice: 49, rating: 4.6, reviewCount: 220, studentCount: 2100, duration: 14,
    level: 'Beginner', language: 'English', lastUpdated: '2025-12-01', hasCertificate: true,
    isFeatured: false, isTrending: false, isNew: false, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Run customer discovery interviews' },
      { id: uid('o'), text: 'Prioritize with RICE and Kano' },
      { id: uid('o'), text: 'Build and communicate a roadmap' },
      { id: uid('o'), text: 'Define success metrics for features' }
    ],
    requirements: [
      { id: uid('r'), text: 'No PM experience required' }
    ],
    sections: [
      sec('Discovery', [
        L('What Great PMs Actually Do', 'video', 14),
        L('Customer Discovery & Problem Framing', 'video', 20),
        L('Section 1 Quiz', 'quiz', 10)
      ]),
      sec('Delivery', [
        L('Prioritization Frameworks', 'video', 18),
        L('Roadmaps & Stakeholder Communication', 'video', 16),
        L('Metrics That Matter', 'article', 12),
        L('Project: Product One-Pager & Roadmap', 'project', 40)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_27', userName: 'James Turner', rating: 5, text: 'Exactly what I needed moving from IC to PM.', date: '2025-12-20' },
      { id: uid('rv'), userId: 'u_st_28', userName: 'Evelyn Phillips', rating: 4, text: 'Concise and immediately useful.', date: '2025-11-30' }
    ],
    faqs: [faq('Is there a capstone?', 'Yes — you build a complete one-pager and roadmap.')]
  },
  {
    id: 'cr_15', slug: 'cloud-security-fundamentals', title: 'Cloud Security Fundamentals', subtitle: 'Secure AWS, Azure, and GCP workloads.',
    description: 'Identity, data, and network security across the big three clouds.',
    longDescription: 'Cloud-specific security for practitioners: shared responsibility, identity (IAM), data protection, network segmentation, and continuous compliance. Hands-on with AWS while covering patterns across clouds.',
    categoryId: 'c1', instructorId: 'u_in_4', thumbnail: t('Cloud Security', '#4F7FBE'),
    price: 99, discountPrice: 69, rating: 4.8, reviewCount: 410, studentCount: 3650, duration: 20,
    level: 'Intermediate', language: 'English', lastUpdated: '2025-12-18', hasCertificate: true,
    isFeatured: true, isTrending: false, isNew: false, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Explain the shared responsibility model' },
      { id: uid('o'), text: 'Secure identities with IAM best practices' },
      { id: uid('o'), text: 'Protect data at rest and in transit' },
      { id: uid('o'), text: 'Audit cloud environments for compliance' }
    ],
    requirements: [
      { id: uid('r'), text: 'Basic cloud concepts' },
      { id: uid('r'), text: 'Some security fundamentals helpful' }
    ],
    sections: [
      sec('Cloud Security Model', [
        L('Shared Responsibility & Cloud Threats', 'video', 18),
        L('Identity: IAM, SSO & MFA', 'video', 26),
        L('Section 1 Quiz', 'quiz', 12)
      ]),
      sec('Data & Compliance', [
        L('Data Protection: Encryption & Key Management', 'video', 22),
        L('Network Security in the Cloud', 'video', 20),
        L('Continuous Compliance & CSPM', 'article', 16),
        L('Project: Secure a Sample Environment', 'project', 50),
        L('Final Assessment: Cloud Security', 'exam', 35)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_29', userName: 'Logan Campbell', rating: 5, text: 'Bridging the gap between cloud certs and real security.', date: '2026-01-06' },
      { id: uid('rv'), userId: 'u_st_30', userName: 'Abigail Parker', rating: 5, text: 'Hands-down the clearest IAM explanation I have seen.', date: '2025-12-19' }
    ],
    faqs: [faq('Do I need all three clouds?', 'No — AWS is used for labs; patterns apply to all.')]
  },
  {
    id: 'cr_16', slug: 'typescript-pro', title: 'TypeScript for Professionals', subtitle: 'Type your way to fewer bugs and better systems.',
    description: 'Advanced TypeScript patterns for real applications.',
    longDescription: 'Go beyond basics: generics, type guards, utility types, and architecture patterns that make large codebases maintainable. Build a fully-typed application as the course project.',
    categoryId: 'c2', instructorId: 'u_in_5', thumbnail: t('TypeScript Pro', '#123564'),
    price: 69, discountPrice: 45, rating: 4.8, reviewCount: 380, studentCount: 4200, duration: 16,
    level: 'Advanced', language: 'English', lastUpdated: '2025-12-22', hasCertificate: true,
    isFeatured: false, isTrending: false, isNew: false, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Master generics and advanced utility types' },
      { id: uid('o'), text: 'Model complex domains with types' },
      { id: uid('o'), text: 'Use discriminated unions effectively' },
      { id: uid('o'), text: 'Design type-safe APIs' }
    ],
    requirements: [
      { id: uid('r'), text: 'Working TypeScript or strong JS knowledge' }
    ],
    sections: [
      sec('Type-Level Programming', [
        L('Generics Without the Headache', 'video', 24),
        L('Utility Types & Mapped Types', 'video', 22),
        L('Discriminated Unions in Practice', 'video', 18)
      ]),
      sec('Application Architecture', [
        L('Designing Type-Safe APIs', 'video', 20),
        L('Error Handling with Types', 'video', 16),
        L('Project: A Fully Typed App', 'project', 55),
        L('Final Assessment: TypeScript Pro', 'exam', 30)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_31', userName: 'Mason Evans', rating: 5, text: 'My codebase thanked me after week one.', date: '2026-01-14' },
      { id: uid('rv'), userId: 'u_st_32', userName: 'Victoria Collins', rating: 5, text: 'Advanced but extremely well explained.', date: '2025-12-30' }
    ],
    faqs: [faq('Is this too advanced for me?', 'It assumes comfort with basic TypeScript. If you write TS at work, this is for you.')]
  },
  {
    id: 'cr_17', slug: 'ethical-hacking-web', title: 'Ethical Hacking: Web Applications', subtitle: 'Find and exploit real web vulnerabilities safely.',
    description: 'OWASP Top 10, hands-on, in a legal lab.',
    longDescription: 'Walk through the OWASP Top 10 with real labs: SQLi, XSS, IDOR, SSRF, and more. Learn how they work, how to find them, and how to write remediation guidance for developers.',
    categoryId: 'c1', instructorId: 'u_in_2', thumbnail: t('Web Hacking', '#0A1E38'),
    price: 129, discountPrice: 89, rating: 4.8, reviewCount: 520, studentCount: 4700, duration: 26,
    level: 'Intermediate', language: 'English', lastUpdated: '2026-01-20', hasCertificate: true,
    isFeatured: true, isTrending: true, isNew: true, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Exploit OWASP Top 10 vulnerabilities in a lab' },
      { id: uid('o'), text: 'Use Burp Suite like a professional' },
      { id: uid('o'), text: 'Write clear remediation reports' },
      { id: uid('o'), text: 'Hunt bugs in a target web app' }
    ],
    requirements: [
      { id: uid('r'), text: 'Penetration Testing Essentials or equivalent' },
      { id: uid('r'), text: 'HTTP basics' }
    ],
    sections: [
      sec('Web Fundamentals & Recon', [
        L('How Web Apps Work & Where They Fail', 'video', 20),
        L('Burp Suite Masterclass', 'video', 28),
        L('Recon for Web Bugs', 'article', 16)
      ]),
      sec('Exploitation & Remediation', [
        L('SQL Injection Deep Dive', 'video', 30),
        L('XSS & Client-Side Attacks', 'video', 26),
        L('IDOR, SSRF & Access Control', 'video', 24),
        L('Hunt Lab: Find the Bugs', 'project', 70),
        L('Final Assessment: Web Hacking', 'exam', 45)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_33', userName: 'Owen Stewart', rating: 5, text: 'The hunt lab is addictive and educational at the same time.', date: '2026-01-22' },
      { id: uid('rv'), userId: 'u_st_34', userName: 'Lily Sanchez', rating: 5, text: 'Burp Suite module alone is worth the course.', date: '2026-01-11' }
    ],
    faqs: [faq('Is a VM required?', 'Yes, but setup is fully automated and free.')]
  },
  {
    id: 'cr_18', slug: 'excel-for-analytics', title: 'Excel for Data Analytics', subtitle: 'Power Pivot, Power Query, and dashboarding.',
    description: 'Level up from formulas to modern Excel analytics.',
    longDescription: 'Modern Excel analytics: Power Query for data transformation, Power Pivot for data modeling, and interactive dashboards. Ideal for analysts and ops professionals.',
    categoryId: 'c3', instructorId: 'u_in_8', thumbnail: t('Excel Analytics', '#5B6472'),
    price: 49, discountPrice: 29, rating: 4.7, reviewCount: 310, studentCount: 2900, duration: 12,
    level: 'Beginner', language: 'English', lastUpdated: '2025-11-15', hasCertificate: true,
    isFeatured: false, isTrending: false, isNew: false, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Clean data with Power Query' },
      { id: uid('o'), text: 'Build relationships in Power Pivot' },
      { id: uid('o'), text: 'Create interactive dashboards' },
      { id: uid('o'), text: 'Write DAX formulas with confidence' }
    ],
    requirements: [
      { id: uid('r'), text: 'Microsoft Excel 2016 or later (or 365)' }
    ],
    sections: [
      sec('Data Transformation', [
        L('Power Query Fundamentals', 'video', 20),
        L('Shaping & Cleaning Data', 'video', 18),
        L('Section 1 Quiz', 'quiz', 10)
      ]),
      sec('Modeling & Dashboards', [
        L('Power Pivot & Data Modeling', 'video', 22),
        L('DAX Essentials', 'video', 20),
        L('Building an Interactive Dashboard', 'project', 45),
        L('Final Assessment: Excel Analytics', 'exam', 25)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_35', userName: 'Elijah Morris', rating: 5, text: 'Doubled my efficiency in two weeks.', date: '2025-12-08' },
      { id: uid('rv'), userId: 'u_st_36', userName: 'Zoe Rivera', rating: 4, text: 'Power Query finally makes sense.', date: '2025-11-28' }
    ],
    faqs: [faq('Which Excel version do I need?', 'Excel 2016+ or Microsoft 365 works best.')]
  },
  {
    id: 'cr_19', slug: 'digital-forensics', title: 'Digital Forensics & Incident Response', subtitle: 'Investigate intrusions methodically and defensibly.',
    description: 'Forensics, evidence handling, and DFIR workflows.',
    longDescription: 'Learn DFIR end to end: evidence acquisition, disk and memory forensics, log correlation, and writing investigation reports that stand up to scrutiny.',
    categoryId: 'c1', instructorId: 'u_in_1', thumbnail: t('Digital Forensics', '#1B4E9B'),
    price: 119, rating: 4.9, reviewCount: 260, studentCount: 2350, duration: 24,
    level: 'Advanced', language: 'English', lastUpdated: '2026-01-25', hasCertificate: true,
    isFeatured: false, isTrending: false, isNew: true, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Acquire evidence without contamination' },
      { id: uid('o'), text: 'Analyze disk and memory images' },
      { id: uid('o'), text: 'Correlate logs to reconstruct an attack' },
      { id: uid('o'), text: 'Write defensible investigation reports' }
    ],
    requirements: [
      { id: uid('r'), text: 'Security fundamentals' },
      { id: uid('r'), text: 'Comfort with command line' }
    ],
    sections: [
      sec('Forensics Foundations', [
        L('The DFIR Mindset & Process', 'video', 16),
        L('Evidence Acquisition & Handling', 'video', 22),
        L('Forensics Workstation Setup', 'article', 14)
      ]),
      sec('Analysis', [
        L('Disk Forensics with Autopsy', 'video', 28),
        L('Memory Forensics with Volatility', 'video', 26),
        L('Log Correlation & Timeline Analysis', 'video', 24),
        L('Project: Reconstruct an Intrusion', 'project', 80),
        L('Final Assessment: Digital Forensics', 'exam', 45)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_37', userName: 'Carter Cooper', rating: 5, text: 'The memory forensics section is world-class.', date: '2026-01-19' },
      { id: uid('rv'), userId: 'u_st_38', userName: 'Aria Richardson', rating: 5, text: 'Finally feel ready to support real investigations.', date: '2026-01-12' }
    ],
    faqs: [faq('What tools will I learn?', 'Autopsy, Volatility, and a range of log analysis tools.')]
  },
  {
    id: 'cr_20', slug: 'sql-for-data', title: 'SQL for Data Analytics', subtitle: 'Query your way to insights.',
    description: 'The complete SQL skill set for analysts and engineers.',
    longDescription: 'From basic SELECT to window functions and query optimization. Master the SQL every data role needs, with real-world datasets and practice problems throughout.',
    categoryId: 'c3', instructorId: 'u_in_10', thumbnail: t('SQL for Data', '#4F7FBE'),
    price: 59, discountPrice: 35, rating: 4.8, reviewCount: 450, studentCount: 5100, duration: 14,
    level: 'Beginner', language: 'English', lastUpdated: '2025-12-25', hasCertificate: true,
    isFeatured: false, isTrending: true, isNew: false, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Write joins, subqueries, and CTEs fluently' },
      { id: uid('o'), text: 'Use window functions for analytics' },
      { id: uid('o'), text: 'Optimize slow queries' },
      { id: uid('o'), text: 'Clean and transform data in SQL' }
    ],
    requirements: [
      { id: uid('r'), text: 'No SQL experience required' }
    ],
    sections: [
      sec('SQL Fundamentals', [
        L('SELECT, WHERE & ORDER BY', 'video', 20),
        L('Joins That Make Sense', 'video', 24),
        L('Grouping & Aggregates', 'video', 18),
        L('Section 1 Quiz', 'quiz', 12)
      ]),
      sec('Advanced Analytics', [
        L('Window Functions & Ranking', 'video', 22),
        L('CTEs & Subqueries', 'video', 18),
        L('Query Tuning Basics', 'article', 14),
        L('Project: Analyze a Business Dataset', 'project', 50),
        L('Final Assessment: SQL for Data', 'exam', 30)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_39', userName: 'Nathan Cox', rating: 5, text: 'Best SQL course. Window functions finally clicked.', date: '2026-01-15' },
      { id: uid('rv'), userId: 'u_st_40', userName: 'Hazel Howard', rating: 5, text: 'From zero to writing analytical queries confidently.', date: '2025-12-28' }
    ],
    faqs: [faq('Which database do we use?', 'PostgreSQL. The skills transfer to any SQL database.')]
  },
  {
    id: 'cr_21', slug: 'communication-for-engineers', title: 'Communication for Engineers', subtitle: 'Write, present, and influence as a technical professional.',
    description: 'Technical writing, talks, and stakeholder communication.',
    longDescription: 'Soft skills with hard ROI: clear technical writing, effective presentations, and communicating up the org. Practice with feedback on every assignment.',
    categoryId: 'c8', instructorId: 'u_in_9', thumbnail: t('Communication', '#B7791F'),
    price: 39, discountPrice: 19, rating: 4.6, reviewCount: 180, studentCount: 1900, duration: 10,
    level: 'Beginner', language: 'English', lastUpdated: '2025-12-05', hasCertificate: true,
    isFeatured: false, isTrending: false, isNew: false, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Write clear technical documents' },
      { id: uid('o'), text: 'Deliver effective technical presentations' },
      { id: uid('o'), text: 'Communicate status to non-technical stakeholders' },
      { id: uid('o'), text: 'Give and receive useful feedback' }
    ],
    requirements: [
      { id: uid('r'), text: 'Any technical role — no experience needed' }
    ],
    sections: [
      sec('Writing', [
        L('Clear Technical Writing', 'video', 16),
        L('Documentation That Helps People', 'article', 14),
        L('Assignment: Rewrite a Bad Doc', 'assignment', 30)
      ]),
      sec('Speaking & Influencing', [
        L('Presentations Without the Snooze', 'video', 18),
        L('Communicating Up & Across', 'video', 16),
        L('Final Assessment: Communication', 'exam', 25)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_41', userName: 'Dylan Ward', rating: 5, text: 'My PRs and emails are noticeably better.', date: '2025-12-16' },
      { id: uid('rv'), userId: 'u_st_42', userName: 'Layla Brooks', rating: 4, text: 'Practical and fun. The assignment feedback is gold.', date: '2025-12-02' }
    ],
    faqs: [faq('Is there feedback on assignments?', 'Yes, instructors review and return feedback on the writing assignment.')]
  },
  {
    id: 'cr_22', slug: 'serverless-architecture', title: 'Serverless Architecture Patterns', subtitle: 'Design event-driven systems without servers.',
    description: 'Lambda, event bridges, and durable workflows — done right.',
    longDescription: 'Architect event-driven, serverless systems: Lambda best practices, event-driven design, async patterns, and pitfalls. Build a real event-driven pipeline.',
    categoryId: 'c4', instructorId: 'u_in_4', thumbnail: t('Serverless', '#0E294E'),
    price: 89, discountPrice: 59, rating: 4.7, reviewCount: 240, studentCount: 2200, duration: 16,
    level: 'Intermediate', language: 'English', lastUpdated: '2025-12-12', hasCertificate: true,
    isFeatured: false, isTrending: false, isNew: false, status: 'published',
    objectives: [
      { id: uid('o'), text: 'Design event-driven architectures' },
      { id: uid('o'), text: 'Optimize Lambda performance and cost' },
      { id: uid('o'), text: 'Use step functions for workflows' },
      { id: uid('o'), text: 'Handle failures gracefully' }
    ],
    requirements: [
      { id: uid('r'), text: 'AWS basics' },
      { id: uid('r'), text: 'Some server experience helpful' }
    ],
    sections: [
      sec('Serverless Foundations', [
        L('The Serverless Mindset', 'video', 16),
        L('Event-Driven Design', 'video', 20),
        L('Lambda in Practice', 'video', 22)
      ]),
      sec('Architecture Patterns', [
        L('Step Functions & Durable Workflows', 'video', 20),
        L('Handling Failure & Retries', 'video', 16),
        L('Project: Build an Event Pipeline', 'project', 50),
        L('Final Assessment: Serverless', 'exam', 30)
      ])
    ],
    reviews: [
      { id: uid('rv'), userId: 'u_st_43', userName: 'Sebastian Gray', rating: 5, text: 'The failure-handling section saved my production system.', date: '2025-12-24' },
      { id: uid('rv'), userId: 'u_st_44', userName: 'Nora James', rating: 4, text: 'Clear patterns I use daily now.', date: '2025-12-11' }
    ],
    faqs: [faq('Do I need the paid AWS tier?', 'A free-tier account covers all labs.')]
  }
]

export const LEARNING_PATHS: LearningPath[] = [
  { id: 'lp_1', title: 'Cybersecurity Professional', description: 'From fundamentals to SIEM and forensics — a complete path into security operations.', courses: ['cr_1', 'cr_6', 'cr_13', 'cr_17', 'cr_11', 'cr_19'], career: 'SOC Analyst · Security Engineer · DFIR', icon: 'Shield', level: 'Beginner → Advanced' },
  { id: 'lp_2', title: 'Full-Stack Developer', description: 'Ship modern web applications from frontend to database to deployment.', courses: ['cr_5', 'cr_16', 'cr_20', 'cr_8', 'cr_22'], career: 'Full-Stack Dev · Frontend · Backend', icon: 'Code2', level: 'Beginner → Advanced' },
  { id: 'lp_3', title: 'Data Analyst', description: 'Turn raw data into decisions with Excel, SQL, Python, and visualization.', courses: ['cr_18', 'cr_20', 'cr_7', 'cr_3'], career: 'Data Analyst · BI Analyst', icon: 'BarChart3', level: 'Beginner → Intermediate' },
  { id: 'lp_4', title: 'Cloud Engineer', description: 'Architect, secure, and operate cloud infrastructure at scale.', courses: ['cr_4', 'cr_15', 'cr_8', 'cr_22'], career: 'Cloud Architect · DevOps · SRE', icon: 'Cloud', level: 'Intermediate' },
  { id: 'lp_5', title: 'Digital Marketer', description: 'Grow products with positioning, content, and lifecycle marketing.', courses: ['cr_12', 'cr_9', 'cr_14'], career: 'Growth Marketer · Product Marketer', icon: 'TrendingUp', level: 'Beginner' }
]

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'bp_1', slug: 'how-to-start-cybersecurity-career-2026', title: 'How to Start a Cybersecurity Career in 2026', excerpt: 'The security industry is hiring, but the entry path is confusing. Here is a clear, honest roadmap.', category: 'Career', author: 'Dr. Amara Okafor', authorTitle: 'Cybersecurity Researcher', date: '2026-02-01', readTime: 8, thumbnail: t('Career Roadmap', '#1B4E9B'),
    content: [
      'Every week I get asked some version of "how do I get into cybersecurity?" The honest answer is that the door is open but the path is not a straight line. Let me give you a path that works.',
      'Start with fundamentals — networking, Linux, and security basics — but do not stay in theory too long. The people who get hired are the ones who can demonstrate skill, not recite definitions.',
      'Build a lab, run real tools, document everything. A simple blog showing your own hunt notes and lab results is worth more than most certifications to hiring managers.',
      'Finally, pick one specialization to go deep on: detection, cloud security, or DFIR are all in demand. Generalists are useful, but specialists get hired.'
    ]
  },
  {
    id: 'bp_2', slug: 'land-your-first-technical-job-with-portfolio', title: 'Land Your First Technical Job With a Portfolio', excerpt: 'Certificates alone will not get you hired. Here is how to build proof of work that stands out.', category: 'Career', author: 'Priya Sharma', authorTitle: 'Full-Stack Engineer & Educator', date: '2026-01-20', readTime: 6, thumbnail: t('Portfolio', '#123564'),
    content: [
      'When I review resumes, I am looking for evidence. A certificate proves you finished; a portfolio proves you can do the work.',
      'Three projects, done well, beat ten projects done shallowly. Each project should have a clear problem, a documented build process, and a working demo someone can try.',
      'Write the README like a case study. Screenshots, architecture decisions, and mistakes you fixed — this is the material interviewers actually read.',
      'Update it every quarter. Your portfolio is a living document that compounds in value.'
    ]
  },
  {
    id: 'bp_3', slug: 'building-security-mindset-before-skillset', title: 'The Security Mindset: Thinking Like an Attacker', excerpt: 'Tools change, but the way attackers think stays remarkably consistent.', category: 'Security', author: 'Marcus Bennett', authorTitle: 'Penetration Tester', date: '2026-01-08', readTime: 5, thumbnail: t('Security Mindset', '#0A1E38'),
    content: [
      'I have seen beginners burn out chasing the latest tool. Tools are just verbs; the attacker mindset is the grammar.',
      'An attacker asks: what is the crown jewel? How do I reach it? What am I allowed to touch without being noticed?',
      'Practice this on your own systems. Red-team your own lab, then look for the gap between what you assumed and what was actually exposed.',
      'That gap — between assumption and reality — is where most security careers are made.'
    ]
  },
  {
    id: 'bp_4', slug: 'learning-any-language-fast', title: 'How to Learn Any Programming Language Fast', excerpt: 'Stop re-reading tutorials. A practical loop for going from zero to shipping.', category: 'Learning', author: 'Priya Sharma', authorTitle: 'Full-Stack Engineer & Educator', date: '2025-12-20', readTime: 5, thumbnail: t('Learning Loop', '#4F7FBE'),
    content: [
      'Most tutorial death happens because people read passively. The fix is a tight loop: read a little, build a lot, break things on purpose.',
      'For a new language, build the same small project in each one — a to-do API, a weather app, a file parser. The repetition isolates the language differences.',
      'Read other people\'s code daily, but only in the language you are actively building with.',
      'You will not feel ready before you start shipping. Start shipping anyway; readiness is a myth.'
    ]
  }
]

export const TESTIMONIALS: Testimonial[] = [
  { id: 'ts_1', name: 'Sarah Mitchell', role: 'Security Analyst', company: 'Apex Insurance', text: 'I transitioned from IT support to a SOC analyst role in seven months. The cybersecurity path gave me exactly the sequence of skills the job needed.', rating: 5 },
  { id: 'ts_2', name: 'David Osei', role: 'Frontend Developer', company: 'Freelance', text: 'The full-stack course is the best money I have spent on education. I landed my first freelance client the month I finished.', rating: 5 },
  { id: 'ts_3', name: 'Maria Santos', role: 'Data Analyst', company: 'FinHealth', text: 'The instructors answer questions quickly and the labs feel like real work. My promotion came three months after finishing the data path.', rating: 5 },
  { id: 'ts_4', name: 'Tom Bakker', role: 'Cloud Engineer', company: 'Nordic Retail', text: 'Practical, current, and honest about complexity. The serverless course paid for itself in my first architecture review.', rating: 4 }
]

export const FAQS: FAQ[] = [
  { q: 'How do certificates work?', a: 'Every course with the certificate badge issues a verifiable certificate when you complete all lessons and pass the final assessment. You can share and verify it publicly.' },
  { q: 'Can I learn at my own pace?', a: 'Yes. All courses are fully self-paced. Your progress is saved automatically, so you can switch devices and continue where you left off.' },
  { q: 'Do courses include hands-on practice?', a: 'Most do. Cybersecurity and programming courses include guided labs and projects so you build real skills, not just watch videos.' },
  { q: 'What happens if I get stuck?', a: 'Every course has an active discussion area where instructors respond, plus a support team and community ready to help.' },
  { q: 'Can instructors earn from courses?', a: 'Yes. Published instructors earn revenue shares from enrollments, with transparent analytics and payouts.' },
  { q: 'Is there a money-back guarantee?', a: 'Paid courses are covered by a 7-day money-back guarantee. No questions asked.' }
]

export const PLANS: Plan[] = [
  {
    id: 'pl_free', name: 'Free', price: 0, period: 'forever', description: 'Start learning with our free catalog.',
    features: ['Access to free courses', 'Basic progress tracking', 'Certificates for eligible free courses', 'Community access']
  },
  {
    id: 'pl_premium', name: 'Premium', price: 29, period: 'month', description: 'Everything you need to go deep and get certified.',
    features: ['All courses included', 'Certificates with verification', 'Advanced assessments & labs', 'Learning paths & career tracks', 'Priority support', 'Community & events'],
    highlight: true
  },
  {
    id: 'pl_business', name: 'Business', price: 499, period: 'month', description: 'For teams and institutions building a learning culture.',
    features: ['Everything in Premium', 'Team & organization management', 'Organization analytics dashboard', 'Private courses & content', 'Administrative controls', 'Dedicated success manager']
  }
]
