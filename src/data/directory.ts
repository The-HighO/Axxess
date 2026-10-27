/* People and applications, taken from the Figma screens.
   Values the designs don't show are marked "sample". Replace with API data. */

export interface Person {
  id: string;
  name: string;
  email: string;
  /** Avatar fill, from the accent palette. */
  color: string;
  role: string;
  team: string;
  managerId: string;
}

export interface AccessLevel {
  id: string;
  name: string;
  description: string;
}

export interface Application {
  id: string;
  name: string;
  type: string;
  risk: "Low" | "Medium" | "High";
  provisioning: "Automatic" | "Manual";
  ownerId: string;
  administratorId: string;
  levels: AccessLevel[];
}

export interface CurrentAccess {
  levelId: string;
  source: string;
  granted: string;
  expires: string;
}

export const CURRENT_USER_ID = "chinedu";

export const people: Person[] = [
  { id: "chinedu", name: "Chinedu Adeyemi", email: "chinedu.adeyemi@paidhr.com", color: "var(--accent-lavender-glow)", role: "Design Manager", team: "Product", managerId: "jordan" }, // role, team, manager: sample
  { id: "aisha", name: "Aisha Bello", email: "aisha.bello@paidhr.com", color: "var(--accent-access-red)", role: "Account Executive", team: "Sales", managerId: "brandon" }, // role, team, manager: sample
  { id: "amara", name: "Amara Okafor", email: "amara.okafor@paidhr.com", color: "var(--accent-skyline-blue)", role: "Product Designer", team: "Product", managerId: "chinedu" },
  { id: "bisi", name: "Bisi Adeyemi", email: "bisi.adeyemi@paidhr.com", color: "var(--accent-access-brown)", role: "Data Analyst", team: "Finance", managerId: "jordan" }, // sample
  { id: "bola", name: "Bola Odebayo", email: "bola.adebayo@paidhr.com", color: "var(--accent-meadow-green)", role: "Support Lead", team: "Customer Success", managerId: "jordan" }, // sample
  { id: "brandon", name: "Brandon Cole", email: "brandon.cole@paidhr.com", color: "var(--accent-lavender-glow)", role: "Sales Director", team: "Sales", managerId: "jordan" }, // sample
  { id: "kemi", name: "Kemi Danjuma", email: "kemi.danjuma@paidhr.com", color: "var(--accent-electric-orchid)", role: "Platform Lead", team: "Engineering", managerId: "jordan" }, // sample: owns AWS, Datadog and Jira
  { id: "jordan", name: "Jordan Baker", email: "jordan.baker@paidhr.com", color: "var(--accent-fiery-coral)", role: "IT Administrator", team: "IT", managerId: "jordan" }, // role, team: sample
  // More sample people, so the beneficiary list is long enough to scroll.
  { id: "adaeze", name: "Adaeze Nwosu", email: "adaeze.nwosu@paidhr.com", color: "var(--accent-meadow-green)", role: "Product Manager", team: "Product", managerId: "chinedu" },
  { id: "chioma", name: "Chioma Eze", email: "chioma.eze@paidhr.com", color: "var(--accent-electric-orchid)", role: "Content Designer", team: "Product", managerId: "chinedu" },
  { id: "daniel", name: "Daniel Mensah", email: "daniel.mensah@paidhr.com", color: "var(--accent-skyline-blue)", role: "Backend Engineer", team: "Engineering", managerId: "kemi" },
  { id: "efosa", name: "Efosa Igbinedion", email: "efosa.igbinedion@paidhr.com", color: "var(--accent-access-brown)", role: "Security Analyst", team: "IT", managerId: "jordan" },
  { id: "emeka", name: "Emeka Obi", email: "emeka.obi@paidhr.com", color: "var(--accent-fiery-coral)", role: "Frontend Engineer", team: "Engineering", managerId: "kemi" },
  { id: "fatima", name: "Fatima Sule", email: "fatima.sule@paidhr.com", color: "var(--accent-lavender-glow)", role: "Finance Manager", team: "Finance", managerId: "jordan" },
  { id: "grace", name: "Grace Adebayo", email: "grace.adebayo@paidhr.com", color: "var(--accent-meadow-green)", role: "Recruiter", team: "People", managerId: "jordan" },
  { id: "ibrahim", name: "Ibrahim Musa", email: "ibrahim.musa@paidhr.com", color: "var(--accent-access-red)", role: "Data Engineer", team: "Engineering", managerId: "kemi" },
  { id: "kofi", name: "Kofi Asante", email: "kofi.asante@paidhr.com", color: "var(--accent-skyline-blue)", role: "Account Manager", team: "Sales", managerId: "brandon" },
  { id: "lola", name: "Lola Akande", email: "lola.akande@paidhr.com", color: "var(--accent-electric-orchid)", role: "Marketing Lead", team: "Marketing", managerId: "jordan" },
  { id: "musa", name: "Musa Bello", email: "musa.bello@paidhr.com", color: "var(--accent-access-brown)", role: "Support Agent", team: "Customer Success", managerId: "bola" },
  { id: "ngozi", name: "Ngozi Okeke", email: "ngozi.okeke@paidhr.com", color: "var(--accent-lavender-glow)", role: "QA Engineer", team: "Engineering", managerId: "kemi" },
  { id: "olumide", name: "Olumide Bakare", email: "olumide.bakare@paidhr.com", color: "var(--accent-fiery-coral)", role: "Sales Engineer", team: "Sales", managerId: "brandon" },
  { id: "sade", name: "Sade Williams", email: "sade.williams@paidhr.com", color: "var(--accent-meadow-green)", role: "People Partner", team: "People", managerId: "jordan" },
  { id: "tunde", name: "Tunde Alabi", email: "tunde.alabi@paidhr.com", color: "var(--accent-access-red)", role: "DevOps Engineer", team: "Engineering", managerId: "kemi" },
  { id: "yemi", name: "Yemi Ogunleye", email: "yemi.ogunleye@paidhr.com", color: "var(--accent-skyline-blue)", role: "Customer Success Manager", team: "Customer Success", managerId: "bola" },
];

/** People who can be picked as a beneficiary: everyone but the requester. */
export const beneficiaryOptions = people.filter((p) => !["chinedu", "jordan", "kemi"].includes(p.id));

const crmLevels: AccessLevel[] = [
  { id: "viewer", name: "Viewer", description: "View customer records" }, // sample description
  { id: "editor", name: "Editor", description: "Create and update customer records" },
  // The design repeats Editor's description here; kept until the copy is written.
  { id: "administrator", name: "Administrator", description: "Create and update customer records" },
];

// Only Salesforce is specified in the designs; the other four are sample entries.
export const applications: Application[] = [
  { id: "aws", name: "AWS", type: "Cloud infrastructure", risk: "High", provisioning: "Manual", ownerId: "kemi", administratorId: "jordan",
    levels: [{ id: "read-only", name: "Read only", description: "View resources and billing" }, { id: "developer", name: "Developer", description: "Deploy and manage services" }, { id: "administrator", name: "Administrator", description: "Full access to the account" }] },
  { id: "datadog", name: "Datadog", type: "Monitoring", risk: "Medium", provisioning: "Automatic", ownerId: "kemi", administratorId: "jordan",
    levels: [{ id: "viewer", name: "Viewer", description: "View dashboards and monitors" }, { id: "editor", name: "Editor", description: "Create dashboards and monitors" }] },
  { id: "figma", name: "Figma", type: "Design", risk: "Low", provisioning: "Automatic", ownerId: "chinedu", administratorId: "jordan",
    levels: [{ id: "viewer", name: "Viewer", description: "View and comment on files" }, { id: "editor", name: "Editor", description: "Create and edit files" }] },
  { id: "jira", name: "Jira", type: "Project management", risk: "Low", provisioning: "Automatic", ownerId: "kemi", administratorId: "jordan",
    levels: [{ id: "viewer", name: "Viewer", description: "View projects and issues" }, { id: "member", name: "Member", description: "Create and update issues" }] },
  { id: "salesforce", name: "Salesforce", type: "Customer relationship management", risk: "High", provisioning: "Automatic", ownerId: "chinedu", administratorId: "jordan", levels: crmLevels },
];

/** Access people already hold, keyed by `${personId}:${applicationId}`. */
export const currentAccess: Record<string, CurrentAccess> = {
  "amara:salesforce": { levelId: "viewer", source: "Product Designer entitlement", granted: "12 Aug 2026", expires: "No expiration" },
  "bola:figma": { levelId: "viewer", source: "Support Lead entitlement", granted: "3 Mar 2026", expires: "No expiration" }, // sample
  "bisi:figma": { levelId: "viewer", source: "Data Analyst entitlement", granted: "18 Jan 2026", expires: "No expiration" }, // sample
  "brandon:jira": { levelId: "viewer", source: "Sales Director entitlement", granted: "2 Feb 2026", expires: "No expiration" }, // sample
  "amara:figma": { levelId: "editor", source: "Product Designer entitlement", granted: "12 Aug 2026", expires: "No expiration" }, // sample
};

export const personById = (id: string) => people.find((p) => p.id === id)!;
export const applicationById = (id: string) => applications.find((a) => a.id === id)!;
