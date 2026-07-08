export type SiteLink = {
  label: string;
  href: string;
  external: boolean;
};

export type ProjectStat = {
  value: string;
  label: string;
  detail: string;
};

export const site = {
  name: "Dhanush Varanasi",
  location: "Bengaluru, Karnataka, India",
  title:
    "Forward Deployed Engineer | Senior Backend Engineer | GenAI & Cloud | Ex-Army",
  heroLine:
    "Senior backend engineer who takes production-grade, cloud-native systems from prototype to production for enterprise clients in regulated domains, now building applied AI and moving toward forward deployed engineering.",
  links: [
    {
      label: "Email",
      href: "mailto:dhanushvaranasi@gmail.com",
      external: false,
    },
    {
      label: "LinkedIn",
      href: "https://linkedin.com/in/dhanushvaranasi",
      external: true,
    },
    {
      label: "GitHub",
      href: "https://github.com/dhanushvaranasi-alpha",
      external: true,
    },
    { label: "+91 8762689484", href: "tel:+918762689484", external: false },
  ] satisfies SiteLink[],
};

export const navItems = [
  { id: "about", label: "About" },
  { id: "project", label: "Project" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
];

export const about =
  "Senior Backend Engineer with 7+ years taking production-grade, cloud-native systems from prototype to production for enterprise clients in regulated domains including banking, public sector, and defense. Now focused on Forward Deployed Engineering: embedding with customers to translate ambiguous business problems into deployed AI solutions. Combines deep hands-on delivery in C#/.NET Core, Python, distributed microservices, and REST APIs across AWS and Azure with applied GenAI (RAG, agentic systems, and LLM evaluation), currently deepened through a self-directed defense-domain AI build and backed by an IIIT-Bangalore PG in ML & AI. Track record of owning end-to-end delivery under ambiguity, onboarding 12+ enterprise accounts, and mentoring engineering teams. Ex-Officer Cadet, Indian Army (OTA Chennai), bringing command-grade ownership, decisive judgment under pressure, and zero-defect execution discipline to high-stakes production environments.";

export const project = {
  title: "Supply Chain Tracer",
  subtitle:
    "AI-powered defense supply-chain risk intelligence (personal project, in active development)",
  tech: [
    "Python",
    "RAG",
    "ChromaDB",
    "Agentic AI",
    "NetworkX",
    "Pydantic",
    "LLM Evaluation",
  ],
  what: "An LLM-powered system designed to ingest public regulatory filings, trace corporate ownership through sanctions lists, and flag supply-chain threats 2 to 4 quarters ahead of regulatory thresholds.",
  stats: [
    {
      value: "85%",
      label: "entity-resolution F1 target",
      detail:
        "Embedding similarity plus LLM tiebreaker, against a 65% fuzzy-matching baseline.",
    },
    {
      value: "60% to 90%",
      label: "sanctions coverage target",
      detail:
        "A sanctions-ownership graph applying the OFAC 50% rule across multi-hop chains.",
    },
    {
      value: ">=0.85",
      label: "grounding target",
      detail:
        "Four-part LLM evaluation harness: unit, LLM-as-judge, regression, online sampling.",
    },
    {
      value: "<=0.10",
      label: "hallucination target",
      detail: "On generated risk reports, enforced by the evaluation harness.",
    },
  ] satisfies ProjectStat[],
  designPoints: [
    "Designing an LLM-powered system to ingest public regulatory filings, trace corporate ownership through sanctions lists, and flag supply-chain threats 2 to 4 quarters ahead of regulatory thresholds.",
    "Architecting an entity-resolution approach (embedding similarity plus LLM tiebreaker) targeting 85% F1 against a 65% fuzzy-matching baseline.",
    "Designing a sanctions-ownership graph that applies the OFAC 50% rule across multi-hop chains, targeting a lift in sanctions coverage from ~60% to ~90%.",
    "Defining a four-part LLM evaluation harness (unit, LLM-as-judge, regression, online sampling) with targets of >=0.85 grounding and <=0.10 hallucination on generated risk reports.",
    "Designing an agentic query layer to pair structured graph traversal for computed signals with RAG over filings for open-ended queries.",
  ],
  why: "Most people say they built a RAG system. This project is defined by measurable targets and rigorous evaluation from the start: entity resolution F1, sanctions coverage, grounding and hallucination thresholds. It also documents honest limitations (for example, supplier country coverage is genuinely incomplete because disclosure is voluntary), which signals real understanding of scope rather than a demo. The defense-domain focus also connects directly to my army background.",
};

export const experience = [
  {
    company: "Ernst & Young (EY)",
    title: "Associate Project Manager",
    dates: "Jan 2026 to Present",
    location: "Bengaluru, India",
    bullets: [
      "Own end-to-end delivery of 3 concurrent engineering projects for a mid-size US bank across lending, core banking, and payments, coordinating ~5 developers per team from scoping through production.",
      "Led merger-and-acquisition integration work following the client's acquisition of another bank, delivering against a demanding integration schedule across data migration, systems consolidation, and account reconciliation.",
      "Stay hands-on as an individual contributor, building and reviewing backend code alongside delivery ownership, ensuring architecture and quality standards hold under real deadlines.",
      "Translate ambiguous, regulation-bound banking requirements into executable delivery plans with clear ownership, dependencies, and risk controls.",
    ],
  },
  {
    company: "Ernst & Young (EY)",
    title: "Senior Technical Lead / Technical Lead",
    dates: "May 2023 to Dec 2025",
    location: "Bengaluru, India",
    bullets: [
      "Delivered Open Banking (Consumer Data Right) solutions aligned to ACCC regulatory standards for the Australian market, building to the compliance bar set by the CDR's lead regulator.",
      "Owned backend delivery of an ASP.NET Core platform integrated with AWS services, embedding with client teams to onboard 12 enterprise clients supporting $3.5M in annual recurring revenue.",
      "Architected and documented RESTful API contracts (Swagger) consumed by 5 frontend teams, cutting integration turnaround 30%.",
      "Drove engineering quality across a team of 8, instituting structured code reviews and SOLID adoption that reduced post-release defects 28%.",
      "Re-engineered SQL Server query performance through index tuning and refactoring, slashing average response time from 1.8s to 320ms on core reporting modules.",
    ],
  },
  {
    company: "Ernst & Young (EY)",
    title: "Senior Software Engineer",
    dates: "Sep 2021 to May 2023",
    location: "Bengaluru, India",
    bullets: [
      "Built scalable C#/.NET Core backend modules for a client-facing enterprise portal, driving a 20% lift in end-user satisfaction.",
      "Decomposed a legacy monolith into modular service layers, reducing complexity 30% and accelerating feature delivery by ~2 weeks per cycle.",
      "Sustained 95% sprint-velocity consistency delivering across 3 global time zones in Agile ceremonies.",
    ],
  },
  {
    company: "Aurigo Software Technologies",
    title: "Member of Technical Staff",
    dates: "Jun 2020 to Jul 2021",
    location: "Bengaluru, India",
    bullets: [
      "Identified a client pain point in parsing and generating legal documents for the US Department of Transportation, then built and demoed a prototype on personal initiative to the client and product teams.",
      "Solution was adopted into the production platform and shipped to all active clients, with a configurable DocuSign integration, cutting roughly 2 hours of manual review and alignment per document across projects that process thousands of documents monthly.",
      "Shipped feature enhancements to a capital-infrastructure SaaS platform serving 200+ North American government agencies across the US.",
      "Integrated third-party REST APIs into the .NET backend, eliminating 60% of manual data-reconciliation workflows.",
    ],
  },
  {
    company: "Indian Army",
    title: "Officer Cadet, Short Service Commission (Technical)",
    dates: "Oct 2018 to Jan 2020",
    location: "Officer's Training Academy, Chennai",
    bullets: [
      "Trained to make structured go/no-go decisions in ambiguous, high-stakes scenarios, directly applicable to production incident response, deployment calls, and technical risk triage.",
      "Drilled in decomposing complex objectives into executable plans with clear ownership and contingencies, mirroring sprint planning and cross-team dependency management.",
      "Developed the ability to lead and drive progress without complete information, a core Forward Deployed Engineer trait in ambiguous customer deployments.",
      "Internalized a zero-defect accountability culture, applied to code-review standards, CI/CD quality gates, and release governance.",
    ],
  },
  {
    company: "Fintellix Solutions (formerly iCreate), Capitec Bank",
    title: "Associate Consultant",
    dates: "Jul 2017 to Sep 2018",
    location: "Bengaluru, India",
    bullets: [
      "Delivered an n-tier ASP.NET MVC5 banking application for the South African market (SQL Server, REST APIs, full stack) serving 15,000+ active users.",
      "Led a 3-member team to build a POC that won client buy-in, resulting in a signed MOU with Verisk Financial for full-scale development.",
    ],
  },
];

export const skills = [
  {
    category: "Languages",
    items: [
      "Python",
      "C#",
      ".NET Core",
      "ASP.NET (MVC / Web API)",
      "SQL",
      "JavaScript",
    ],
  },
  {
    category: "GenAI & AI",
    items: [
      "Retrieval-Augmented Generation (RAG)",
      "Agentic AI",
      "Function-Calling / Tool-Use",
      "Vector Databases (ChromaDB)",
      "LLM Evaluation & Observability",
      "Prompt Engineering",
      "LangChain / LangGraph",
      "Model Deployment",
      "Supervised Learning",
    ],
  },
  {
    category: "System Design & Backend",
    items: [
      "Distributed Systems",
      "System Design",
      "Microservices",
      "REST APIs",
      "Event-Driven Architecture",
      "API Integration",
      "Entity Framework",
      "LINQ",
      "Authentication (OAuth / JWT)",
      "Scalability & Performance Optimization",
    ],
  },
  {
    category: "Cloud",
    items: ["AWS (EC2, S3, Lambda, RDS, CloudWatch)", "Microsoft Azure"],
  },
  {
    category: "Data",
    items: [
      "Microsoft SQL Server",
      "Azure SQL",
      "PostgreSQL",
      "Redis",
      "Data Pipelines",
      "Graph Modeling (NetworkX)",
      "Pydantic",
    ],
  },
  {
    category: "DevOps & Delivery",
    items: [
      "Azure DevOps",
      "Git",
      "GitHub Actions",
      "CI/CD Pipelines",
      "Agile Scrum",
      "TDD",
      "Code Reviews",
    ],
  },
  {
    category: "Consulting & Domain",
    items: [
      "Enterprise / Customer-Facing Delivery",
      "Stakeholder Management",
      "Secure & Compliant Deployment",
      "Regulated Industries (BFSI, Public Sector, Defense)",
    ],
  },
];

export const education = [
  {
    degree: "Post Graduate Diploma, Machine Learning & Artificial Intelligence",
    school: "IIIT Bangalore",
    year: "2022",
  },
  {
    degree: "B.E., Computer Science & Engineering",
    school: "Visvesvaraya Technological University",
    year: "2017",
  },
];

export const certifications = [
  "Microsoft Certified: Azure Fundamentals (AZ-900)",
  "GitHub Foundations",
  "EY Microsoft Azure Bronze",
  "EY Innovation Agile Bronze",
  "EY Artificial Intelligence Bronze",
];

export const currentFocus =
  "Current focus: moving from senior backend delivery into forward deployed engineering. I am building Supply Chain Tracer, an applied AI project in the defense domain, and bringing the same discipline I learned in regulated banking and public-sector work to LLM systems: measurable targets, honest evaluation, and production standards.";
