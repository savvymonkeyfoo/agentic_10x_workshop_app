# Agentic 10x Workshop Application

A modern, agentic workflow application for managing strategic workshops, from divergent research to convergent execution, using the **Agentic 10x Protocol**.

## 🚀 Overview

This application bridges the gap between **Strategic Divergence** (Research & Ideation) and **Tactical Convergence** (Planning & Execution). It provides a structured interface for facilitating workshops, facilitating deep research, stress-testing ideas, and converting them into execution-ready opportunities.

### Key Features

#### 🧠 Divergent Thinking (Sandbox)

- **Research Interface** - AI-powered "Research Loop" that ingests client context to identify strategic blind spots.
- **Ideation Board** - A masonry-style whiteboard for visualizing, selecting, and promoting ideas.
  - **Instant Toggle Selection** - Click to select/deselect ideas; changes sync immediately to database.
  - **Visual Promotion Status** - Selected items show with blue border and checkmark; promoted items display "🔒 Promoted" badge.
- **Synthetic Stress Testing** - Simulate stakeholder feedback (e.g., "The CFO", "The Security Audit") on specific ideas.

#### 🎯 Convergent Thinking (Workshop)

- **Opportunity Capture** - Structured input forms with auto-save and completeness tracking.
  - **Auto-Create on Name Entry** - Just type an opportunity name and click away; a new record is created automatically.
  - **Smart Demote/Delete** - Items from Ideation can be demoted back; Capture-only items can be permanently deleted.
- **Workflow Builder** - Drag-and-drop phase cards with autonomy level selection (L1-L5).
- **Strategic Prioritization** - Matrix and Waves visualizations for portfolio analysis.
- **Canvas Reporting** - A3 PDF export with VRCC Kite charts, DFV diagrams, and ROI calculations.

#### 📜 Project Charter

- **Charter Generation** - Automated generation of project charters based on selected opportunities and workshop context.

## 🗄️ Data Architecture

The application uses a **unified data storage** model where opportunities flow through different views:

| Field | Purpose |
|-------|---------|
| `showInIdeation` | Visible on the Ideation Whiteboard |
| `showInCapture` | Visible on the Capture screen (promoted) |
| `promotionStatus` | Tracks promotion state (`PROMOTED` or `null`) |

### Visibility Flow

```
Backlog/Intelligence → Ideation (showInIdeation: true)
                           ↓ [Select & Toggle]
                      Capture (showInCapture: true)
                           ↓ [Demote]
                      Back to Ideation only
```

- **Items from Ideation**: Can be demoted back (non-destructive)
- **Capture-only items**: Created directly in Capture, permanent delete only

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
    - **Ideate**: Create, merge, and stress-test ideas on the whiteboard.
    - **Promote**: Use "Select Ideas" mode to toggle items into Capture view.
3. **Convergent Phase** (`/workshop/[id]`)
    - **Capture**: Refine opportunities with structured financial & operational data.
    - **Prioritise**: Visual analysis (Matrix/Waves).
    - **Canvas**: Generate detailed reports.
4. **Charter** - Finalize and export the project charter.

## 📂 Project Structure

```text
web/src/
├── app/
│   ├── actions/           # Server Actions (CRUD, promotion, AI)
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
│   ├── ui/                # Reusable UI components
│   └── workshop/          # Capture forms & Workflow builder
├── lib/                   # Utilities (Prisma, AI, Pinecone)
└── types/                 # TypeScript type definitions
```

## 🧪 Scripts & Verification

| Script | Purpose |
|--------|---------|
| `npx tsx scripts/verify-data.ts` | Verify database data integrity |
| `npx tsx scripts/backup-ideation-data.ts` | Backup ideation data to JSON |
| `npx tsx scripts/reset-promotion-status.ts` | Reset promotion flags (dev only) |
| `npm run lint` | Run ESLint |
| `npm test` | Run test suite |
| `npx prisma generate` | Regenerate Prisma client after schema changes |

## 📝 Recent Changes

### Data Storage Architecture (v2.0)

- Unified `Opportunity` model with `showInIdeation` and `showInCapture` visibility flags
- Instant toggle selection mode on Ideation Whiteboard
- Conditional demote (back to Ideation) vs. delete (permanent) based on item origin
- Auto-create opportunities when user enters a name on Capture page
- Fixed race conditions between blur and autosave triggers

### Analysis & Visualization (v2.1)

- **True Dependency Waves**: Visualizes dependencies between projects in the Waves view.
  - **Solid Colored Lines**: Lines connect dependent cards, colored by the *destination wave* (Emerald, Blue, Violet, Slate) to clearly indicate direction.
  - **Smart Geometry**: Arrowheads anchor precisely to card edges for clean readability.
- **AI Strategist**: Auto-generates dependency graphs (Requires/Enables) with strategic reasoning.
- **Standardized Strategic Matrix**: Consistent terminology and definitions across all views (Matrix, Sidebar, Canvas):
  - **Quick Win** (High Value, Low Complexity)
  - **Major Project** (High Value, High Complexity)
  - **Tactical** (Low Value, Low Complexity)
  - **Deprioritise** (Low Value, High Complexity)
