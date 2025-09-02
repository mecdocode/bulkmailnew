# Bulk Email Sender

A lightweight, user-friendly bulk email sending tool built with React (frontend), Express + Nodemailer (backend), Tailwind 3 for styling, and pnpm for dependency management.

## 🔹 Key Features

- **SMTP Integration** – works with Gmail, Outlook, Zoho, or custom SMTP
- **Recipient Management** – paste emails or upload CSV with optional variables
- **Email Composition** – HTML + Text editors, merge tags, attachments (≤10MB)
- **Pacing Controls** – adjustable delay (0.5–10s) & concurrency (1–5)
- **Live Monitoring** – real-time progress bar, stats (sent/failed/ETA), and logs
- **Logging & Export** – logs each email attempt with status codes; downloadable CSV
- **Error Handling** – retries on transient errors, clear messages for failures
- **User-Friendly UI** – clean wizard flow, stepper navigation, tooltips, accessibility built-in

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development servers (client + server)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## 📁 Project Structure

```
project-root/
├── client/          # React frontend (Vite + Tailwind)
├── server/          # Express backend (TypeScript + Nodemailer)
├── shared/          # Shared types and contracts
└── package.json     # Workspace configuration
```

## 🔧 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS 3, TypeScript
- **Backend**: Node.js, Express, Nodemailer, WebSocket
- **Package Manager**: pnpm with workspaces
- **No Database**: All data handled in memory (session-based)

## 🛡️ Security & Privacy

- No sign-in required
- No credentials stored permanently
- All data cleared after session
- SMTP passwords never logged

## 🚀 Deployment to Vercel

This monorepo is configured for seamless deployment to Vercel. Follow these steps:

1.  **Push to GitHub**: Make sure your project is pushed to a GitHub repository.
2.  **Import Project on Vercel**: Go to your Vercel dashboard and click "Add New..." > "Project". Select your GitHub repository.
3.  **Configure Project**: Vercel will automatically detect the monorepo structure using `vercel.json`.
    *   **Framework Preset**: It should detect Vite, but ensure it's set for the client.
    *   **Root Directory**: Set the Root Directory to `client`.
    *   **Build & Output Settings**: These should be automatically configured by the preset. The `vercel.json` file will handle the server build.
4.  **Add Environment Variables**: In the project settings on Vercel, navigate to "Environment Variables". Add any sensitive information your server needs, such as API keys or SMTP credentials. For example:
    *   `SMTP_HOST`
    *   `SMTP_USER`
    *   `SMTP_PASS`
5.  **Deploy**: Click the "Deploy" button. Vercel will build and deploy both your frontend and backend.

Your application will be live at the domain provided by Vercel.

## 📊 Limits

- Max 2000 recipients per session
- Max 10MB attachment size
- Default: 2s delay, 1 concurrent connection (Gmail-safe)
