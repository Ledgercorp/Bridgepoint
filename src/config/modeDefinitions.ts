export type UserMode = "community" | "student" | "professional" | "instructor";

export interface ModeDefinition {
  id: UserMode;
  name: string;
  tagline: string;
  description: string;
  purpose: string;
  features: string[];
  boundaries: string[];
  requiresVerification: boolean;
  verificationType?: string;
  solaceStyle: string;
  targetAudience: string;
}

export const MODE_DEFINITIONS: Record<UserMode, ModeDefinition> = {
  community: {
    id: "community",
    name: "Community Mode",
    tagline: "Community Resources Navigator",
    description: "Default mode for general users seeking help for themselves",
    purpose: "Help users find support for their own needs with simple, warm, and accessible information",
    features: [
      "Resource Finder",
      "Location-based navigation",
      "Solace guidance in simple, everyday language",
      "Document Safe Box",
      "Life Navigation Tools",
      "Cost of Living Explorer",
      "My Hub"
    ],
    boundaries: [
      "No educational tools",
      "No professional tools",
      "No teaching or preview features"
    ],
    requiresVerification: false,
    solaceStyle: "Simple, warm, and everyday language focused on personal help",
    targetAudience: "General users looking for help for themselves"
  },
  student: {
    id: "student",
    name: "Student Mode",
    tagline: "Student Learning Mode",
    description: "For Human Services, Social Work, Counseling, and related students",
    purpose: "Teach students how systems work, build foundational knowledge, and practice tasks in a safe, non-client way",
    features: [
      "Mini-Lessons",
      "Practice scenarios (non-client)",
      "Resource Kits",
      "Solace in educational, step-based style",
      "Skills explanations",
      "System overviews for learning"
    ],
    boundaries: [
      "No client work",
      "No professional tools",
      "No access to Instructor Mode features",
      "No real client information allowed"
    ],
    requiresVerification: true,
    verificationType: ".edu email verification",
    solaceStyle: "Educational, step-based explanations focused on learning",
    targetAudience: "Students in Human Services, Social Work, Counseling, and related fields"
  },
  professional: {
    id: "professional",
    name: "Professional Mode (Organization Access Only)",
    tagline: "Professional Tools Workspace",
    description: "Paid organizational tools for verified nonprofits, shelters, and community agencies",
    purpose: "Provide efficient workflow tools and resource management for organization staff serving community members",
    features: [
      "Smart Resource Bundles (reusable, non-client-specific)",
      "Multi-Step System Navigator (AI-powered)",
      "Appointment Prep Tools",
      "Outreach Mode & Inter-Agency Connector",
      "Team Resource Kits & Organizational Library",
      "Multi-location support",
      "Export tools (PDF, Link, QR)",
      "Agency branding & customization",
      "Organization Admin Panel (seat management)"
    ],
    boundaries: [
      "For verified organizations with active paid subscription only",
      "Tool-level resource guidance only",
      "Does NOT store or request client identifiers",
      "No clinical, legal, or crisis guidance",
      "Workflow and resource production focused",
      "Organization-only access, not available to individual users"
    ],
    requiresVerification: true,
    verificationType: "Organization verification + paid subscription required",
    solaceStyle: "Structured organizational guidance for staff helping community members",
    targetAudience: "Verified nonprofit staff, community agency workers, shelter employees, and outreach teams"
  },
  instructor: {
    id: "instructor",
    name: "Instructor Mode",
    tagline: "Instructor Mode",
    description: "For faculty and educators in Human Services and related fields",
    purpose: "Allow instructors to understand what students see, assist with assignment design, provide safe teaching preview",
    features: [
      "Preview Student Mode",
      "View Mini-Lessons",
      "Review educational tools",
      "Understand Resource Kits",
      "See how Solace teaches concepts",
      "Instructor Guide for curriculum integration"
    ],
    boundaries: [
      "No student data",
      "No student analytics",
      "No editing or creating Student Mode materials",
      "No resource bundles",
      "No professional tools"
    ],
    requiresVerification: true,
    verificationType: "Secure Instructor Access Code",
    solaceStyle: "Educational preview focused on teaching and curriculum integration",
    targetAudience: "Faculty and educators in Human Services and related fields"
  }
};

export const MODE_COMPARISONS = {
  "professional-vs-instructor": {
    professional: [
      "Real-world tools",
      "Resource Bundles",
      "Appointment tools",
      "Scripts for client-facing conversations",
      "Practical workflows",
      "Structured system explanations for field work",
      "Exportable materials",
      "Shortcuts for direct services"
    ],
    instructor: [
      "Education-focused",
      "Student Mode previews",
      "Teaching guides",
      "No real-world client tools",
      "No exporting",
      "No bundles",
      "No shortcuts",
      "No professional workflow tools",
      "Used for instruction, not field service"
    ],
    summary: "Professional Mode = tools for helping real people | Instructor Mode = tools for teaching students"
  },
  "student-vs-professional": {
    student: [
      "For learning only",
      "Practice scenarios",
      "Understanding systems at a beginner level",
      "No real-world tools",
      "No exporting",
      "No professional shortcuts",
      "No client interaction support"
    ],
    professional: [
      "Real-world tools",
      "Script creation for client-facing work",
      "Appointment preparation",
      "Frequently used resources",
      "Bundles and exports",
      "Advanced, practical system explanations"
    ],
    summary: "Student Mode = Learn the system | Professional Mode = Use the system to help others"
  },
  "community-vs-all": {
    community: [
      "Personal use only",
      "Simple, everyday language",
      "Getting help for yourself",
      "No educational features",
      "No professional tools",
      "No instructor previews"
    ],
    others: [
      "Student: Learning and education",
      "Professional: Helping others professionally",
      "Instructor: Teaching and curriculum development"
    ],
    summary: "Community = personal help | Student = learning | Professional = helping others | Instructor = teaching"
  }
};

export function getModeDefinition(mode: UserMode): ModeDefinition {
  return MODE_DEFINITIONS[mode];
}

export function hasFeature(mode: UserMode, feature: string): boolean {
  return MODE_DEFINITIONS[mode].features.includes(feature);
}

export function getSolaceGreeting(mode: UserMode): string {
  const greetings: Record<UserMode, string> = {
    community: "BridgePoint helps you find local resources and support services in your community. Solace, your personal guide, is here to help you navigate these services with simple, clear guidance tailored to your needs.",
    student: "Let's build your knowledge step by step, preparing you for real-world challenges.",
    professional: "You're in Professional Mode. This mode is designed for nonprofit and community agency staff. I can help you create reusable resource bundles, explain systems, support outreach work, and provide structured resource guidance. I do not store or use any client information.",
    instructor: "Discover how BridgePoint prepares students for real-world challenges in your field."
  };
  return greetings[mode];
}
