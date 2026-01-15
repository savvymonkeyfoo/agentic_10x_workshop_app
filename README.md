# Agentic 10x Workshop Application

A modern, agentic workflow application for managing strategic workshops, from divergent research to convergent execution, using the **Agentic 10x Protocol**.

## 🚀 Overview

This application bridges the gap between **Strategic Divergence** (Research & Ideation) and **Tactical Convergence** (Planning & Execution). It provides a structured interface for facilitating workshops, facilitating deep research, stress-testing ideas, and converting them into execution-ready opportunities.

### Key Features

#### 🧠 Divergent Thinking (Sandbox)

- **Research Interface** - AI-powered "Research Loop" that ingests client context to identifying strategic blind spots.
- **Ideation Board** - A masonry-style board for mashing up, merging, and stress-testing ideas with AI personas.
- **Synthetic Stress Testing** - Simulate stakeholder feedback (e.g., "The CFO", "The Security Audit") on specific ideas.

#### 🎯 Convergent Thinking (Workshop)

- **Opportunity Capture** - Structured input forms with auto-save and completeness tracking.
- **Workflow Builder** - Drag-and-drop phase cards with autonomy level selection (L1-L5).
- **Strategic Prioritization** - Matrix and Waves visualizations for portfolio analysis.
- **Canvas Reporting** - A3 PDF export with VRCC Kite charts, DFV diagrams, and ROI calculations.

#### 📜 Project Charter

- **Charter Generation** - Automated generation of project charters based on selected opportunities and workshop context.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS, Framer Motion, `sonner` for toasts
- **Database**: PostgreSQL (via Prisma ORM)
- **Vector Store**: [Pinecone](https://www.pinecone.io/) (for RAG & Research context)
- **AI**: Google Gemini via [Vercel AI SDK](https://sdk.vercel.ai/)
- **Storage**: Vercel Blob (for file uploads)

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/)
- **Google AI Studio API Key**
- **Pinecone API Key** (for Research features)
- **Vercel Blob Token** (for file uploads)

## ⚙️ Installation

### 1. Clone & Install

```bash
git clone https://github.com/savvymonkeyfoo/agentic_10x_workshop_app.git
cd agentic_10x_workshop_app/web
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL="postgresql://..."

# AI
GOOGLE_GENERATIVE_AI_API_KEY="AI..."

# Vector Store (Pinecone)
PINECONE_API_KEY="pc..."
PINECONE_INDEX="agentic-10x"

# Storage
BLOB_READ_WRITE_TOKEN="vercel_blob..."
```

### 3. Initialize

```bash
npx prisma db push
npm run db:seed  # Optional: Seeds sample workshop data
```

## 🏃‍♂️ Running the Application

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## 🧭 Application Workflow

1. **Login** - Authenticate to access workspaces.
2. **Divergent Phase** (`/divergent/...`)
    - **Research**: Ingest documents, analyze backlog vs. market signals.
    - **Ideate**: Create, merge, and stress-test ideas on the board.
    - **Promote**: Select winning ideas to move to the workshop.
3. **Convergent Phase** (`/workshop/[id]`)
    - **Capture**: Refine opportunities with structured financial & operational data.
    - **Prioritise**: Visual analysis (Matrix/Waves).
    - **Canvas**: Generate detailed reports.
4. **Charter** - Finalize and export the project charter.

## 📂 Project Structure

```text
web/src/
├── app/
│   ├── actions/           # Server Actions
│   ├── api/               # API Routes
│   ├── charter/           # Charter generation
│   ├── divergent/         # Research & Ideation Sandbox
│   ├── login/             # Authentication
│   └── workshop/          # Core workshop flow
├── components/
│   ├── analysis/          # Matrix/Waves charts
│   ├── charter/           # Charter components
│   ├── divergent/         # Ideation board, Research interface
│   ├── reporting/         # Canvas exports
│   └── workshop/          # Capture forms & Workflow builder
└── lib/                   # Utilities (Prisma, AI, Pinecone)
```

## 🧪 Verification

- **Verify Data**: `npx tsx scripts/verify-data.ts`
- **Lint**: `npm run lint`
- **Tests**: `npm test`
