## Super App Status Page

Angular + Tailwind status dashboard backed by an ElasticSearch-powered Node API.

### Projects

- `frontend`: Angular SPA with Tailwind v4 showing:
  - Overall platform health
  - Core service status
  - Workspace-level feature status
  - External system dependencies
- `backend`: Node/Express API proxying status queries to ElasticSearch.

### Getting Started

1. **Backend**

```bash
cd backend
npm install
cp ../.env.example .env   # then edit values
npm run build
npm start
```

This starts the status API on port `4000` by default.

2. **Frontend**

```bash
cd frontend
npm install
npm start
```

The Angular app will be served on its default dev port and expects the backend at `/api/status` (configure your dev proxy or reverse proxy accordingly).

### Accessibility

The UI is structured with semantic landmarks (`main`, `header`, `nav`), accessible tables with captions and scopes, visible focus outlines, skip links, and status messaging via `aria-live` where appropriate, aimed at Section 508 / WCAG 2.1 AA compliance.

