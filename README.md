✦ Flowbase - The AI-Powered Productivity Workspace
Flowbase is a modern, all-in-one productivity workspace designed to help you plan, track, create, and think. It seamlessly integrates task management, note-taking, whiteboarding, and real-time collaboration with powerful AI assistance to turn your loose ideas into an action plan.

Live Demo: Flowbase

🚀 Key Features
📅 Plan & Track
Dashboard: A calm, focused overview of your day, showing focus time, tasks done, upcoming meetings, and captured ideas.

Task / Kanban: A robust drag-and-drop Kanban board with custom columns, priority tags, labels, and due dates.

Real-Time Collaboration (Liveblocks): See active team members on the Kanban board with live presence indicators, user avatars, and real-time task comment threads.

Calendar: Manage your schedule, meetings, and time-blocked tasks seamlessly.

💡 Create & Think
Notes (Notion-style): A clean, block-style rich text editor (powered by Tiptap) with slash commands (/), bubble menus, and auto-save.

Speak to Note (AssemblyAI): Real-time, streaming Speech-to-Text that inserts finalized transcripts directly into your editor at the cursor position.

AI Refine: Select text to improve grammar, rephrase, lengthen, shorten, simplify, or change tone instantly.

Whiteboard (Excalidraw): A Miro-style infinite canvas for freehand drawing, sticky notes, and wireframing.

AI Diagram Generator: Instantly generate flowcharts, mind maps, user journeys, and system architectures on the whiteboard from simple text prompts.

Pages & Spaces: Organize your life and work with top-level "Spaces" (folders) and individual "Pages" (documents), complete with customized icons, breadcrumbs, and list/grid views.

🤖 AI Workflows
AI Assistant: A central ChatGPT-style command center. Chat with the AI using text or voice (AssemblyAI) to create tasks, add calendar reminders, summarize notes, or generate Kanban boards.

AI Template Builder: Enter a prompt to dynamically generate single-page mini-apps (e.g., Habit Tracker, Budget Tracker, Meal Planner) customized just for you, which can be saved directly to your sidebar.

⚙️ Manage
Settings: Manage your profile, subscription plans, dynamic custom categories, UI themes, and AI model preferences.

Cozy UI/UX: Built with a clean, modern aesthetic using soft shadows, rounded cards, and responsive layouts.

🛠️ Tech Stack
Framework: Next.js (React)

Language: TypeScript

Styling: Tailwind CSS

UI Components: Shadcn UI

Icons: Lucide React

Authentication: Clerk

Real-time Collaboration: Liveblocks

Rich Text Editor: Tiptap

Whiteboard: Excalidraw

Voice/Speech-to-Text: AssemblyAI

AI Integrations: OpenAI / Anthropic (for Assistant, Text Refine, and Diagram Generation)

💻 Getting Started
To get a local copy up and running, follow these simple steps.

Prerequisites
Node.js (v18 or higher recommended)

npm, yarn, pnpm, or bun

Installation
Clone the repository

Bash
git clone https://github.com/your-username/flowbase.git
cd flowbase
Install dependencies

Bash
npm install
# or
yarn install
# or
pnpm install
Set up environment variables
Create a .env.local file in the root directory and add your API keys:

Code snippet
# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Database (if applicable, e.g., Supabase / Prisma / Vercel Postgres)
DATABASE_URL=your_database_url

# Real-time Collaboration
LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key

# AI & Voice Services
OPENAI_API_KEY=your_openai_api_key
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
Run the development server

Bash
npm run dev
# or
yarn dev
Open the app
Navigate to http://localhost:3000 in your browser.

🌍 Deployment
This project is optimized for deployment on Vercel.

Push your code to a GitHub repository.

Import the project into Vercel.

Add your environment variables in the Vercel dashboard.

Click Deploy.

🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)
