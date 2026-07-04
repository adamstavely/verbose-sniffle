// Role-based "choose your own adventure" entry point for the User Guide.
// Each role groups a few common workflows; each workflow is a curated set of
// links into existing guide pages (no new content). `to` is a path passed
// through withBase() at render time.

export interface WorkflowLink {
  label: string;
  to: string;
}

export interface Workflow {
  title: string;
  summary: string;
  links: WorkflowLink[];
}

export interface RoleGuide {
  slug: string;
  name: string;
  tagline: string;
  workflows: Workflow[];
}

export const ROLE_GUIDES: RoleGuide[] = [
  {
    slug: 'analyst',
    name: 'Analyst',
    tagline: 'Search, analyze, and annotate in the Analyst Workspace.',
    workflows: [
      {
        title: 'Get set up',
        summary: 'Sign in, find your workspace, and learn the essentials.',
        links: [
          { label: 'Getting started', to: 'user-guide/tutorials/getting-started' },
          { label: 'Build your first project', to: 'user-guide/tutorials/first-project' },
          { label: 'Keyboard shortcuts', to: 'user-guide/reference/keyboard-shortcuts' },
        ],
      },
      {
        title: 'Analyze & annotate',
        summary: 'Work through documents and capture your findings.',
        links: [
          { label: 'Build your first project', to: 'user-guide/tutorials/first-project' },
          { label: 'How the platform fits together', to: 'user-guide/explanation/architecture-overview' },
          { label: 'Glossary', to: 'user-guide/reference/glossary' },
        ],
      },
      {
        title: 'Work with your team',
        summary: 'Bring teammates in and stay in the loop.',
        links: [
          { label: 'Invite teammates', to: 'user-guide/how-to/invite-teammates' },
          { label: 'Configure notifications', to: 'user-guide/how-to/configure-notifications' },
        ],
      },
    ],
  },
  {
    slug: 'operations',
    name: 'Operations',
    tagline: 'Coordinate workflows, alerts, and reporting in the Operations Workspace.',
    workflows: [
      {
        title: 'Onboard your team',
        summary: 'Set up people and the access they need.',
        links: [
          { label: 'Getting started', to: 'user-guide/tutorials/getting-started' },
          { label: 'Invite teammates', to: 'user-guide/how-to/invite-teammates' },
          { label: 'Understanding the permissions model', to: 'user-guide/explanation/permissions-model' },
        ],
      },
      {
        title: 'Set up alerts & notifications',
        summary: 'Stay ahead of incidents and platform updates.',
        links: [
          { label: 'Configure notifications', to: 'user-guide/how-to/configure-notifications' },
          { label: 'Platform status', to: 'roadmap/status' },
        ],
      },
      {
        title: 'Understand how it fits together',
        summary: 'Background on the architecture and access model.',
        links: [
          { label: 'How the platform fits together', to: 'user-guide/explanation/architecture-overview' },
          { label: 'Understanding the permissions model', to: 'user-guide/explanation/permissions-model' },
          { label: 'Glossary', to: 'user-guide/reference/glossary' },
        ],
      },
    ],
  },
];
