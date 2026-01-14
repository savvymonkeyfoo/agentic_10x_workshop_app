# Agentic 10x Workshop Application

A modern, agentic workflow application for managing strategic workshops and opportunities using the **Agentic 10x Protocol**.

## 🚀 Overview

This application provides a structured interface for facilitating workshops, capturing opportunities, and assessing them against the VRCC (Value, Risk, Complexity, Capability) framework and DFV (Desirability, Feasibility, Viability) metrics. It features a reactive "Input Canvas" with real-time validation, financial modeling, AI-powered recommendations, and strategic visualization.

### Key Features

- **Opportunity Capture** - Structured input forms with auto-save and completeness tracking
- **Workflow Builder** - Drag-and-drop phase cards with autonomy level selection (L1-L5)
- **AI Recommendations** - Gemini-powered capability suggestions and execution plan drafting
- **Strategic Prioritization** - Matrix and Waves visualizations for portfolio analysis
- **Canvas Reporting** - A3 PDF export with VRCC Kite charts, DFV diagrams, and ROI calculations

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Database**: PostgreSQL
- **ORM**: Prisma
- **AI**: Google Gemini via [Vercel AI SDK](https://sdk.vercel.ai/)
- **State Management**: React Hooks & Server Actions

## 📋 Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A running instance of **PostgreSQL** (local or cloud, e.g. [Supabase](https://supabase.com/), [Neon](https://neon.tech/), or local Docker)
- A **Google AI Studio API Key** (free tier available)

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/savvymonkeyfoo/agentic_10x_workshop_app.git
cd agentic_10x_workshop_app
```

### 2. Navigate to the web application directory

```bash
cd web
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Then edit the `.env` file with your credentials:

```bash
# web/.env

# ============================
# DATABASE (Required)
# ============================
# PostgreSQL connection string
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME?schema=public
DATABASE_URL="postgresql://postgres:password@localhost:5432/workshop_db?schema=public"

# ============================
# AI / GEMINI (Required for AI features)
# ============================
# Get your free API key from: https://aistudio.google.com/apikey
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key-here"
```

#### Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it into your `.env` file

> **Note**: The free tier includes generous usage limits suitable for development and demos. No credit card required.

### 5. Initialize the Database

Push the Prisma schema to your database and generate the client:

```bash
npx prisma db push
npx prisma generate
```

### 6. (Optional) Seed Sample Data

To populate the database with sample workshop data:

```bash
npm run db:seed
```

## 🏃‍♂️ Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🧭 Application Workflow

1. **Home** (`/`) - Create or select a workshop
2. **Capture** (`/workshop/[id]`) - Add opportunities with structured inputs
3. **Prioritise** (`/workshop/[id]/analysis`) - View Matrix/Waves visualizations
4. **Canvas** (`/workshop/[id]/reporting`) - Generate A3 PDF reports

## 🤖 AI-Powered Features

The application uses Google Gemini for several intelligent features:

| Feature | Description | Trigger |
| ------- | ----------- | ------- |
| **Capability Recommendations** | Suggests missing capabilities based on workflow phases | "Recommend" button in Workflow tab |
| **Execution Plan Drafting** | Generates Definition of Done, Key Decisions, etc. | "Recommend" button in Execution tab |
| **Content Optimization** | Polishes and structures canvas text | "AI Polish" button on Canvas page |
| **Strategic Analysis** | Analyzes portfolio for risks and dependencies | "Analyze" button on Prioritise page |

> **Without an API key**: The application will still function, but AI features will fail gracefully. You can use all core features without AI.

## 🧪 Verification & Utilities

### Verify Data Persistence

```bash
npx tsx scripts/verify-data.ts
```

This fetches the most recently updated Opportunity and dumps its raw data to `verification-dump.json` for inspection.

### Run Tests

```bash
npm test
```

### Lint Code

```bash
npm run lint
```

## 📂 Project Structure

```text
web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── actions/           # Server Actions (AI, CRUD)
│   │   ├── workshop/[id]/     # Workshop pages
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── analysis/          # Prioritization visualizations
│   │   ├── reporting/         # Canvas & PDF export
│   │   ├── shared/            # Reusable chart components
│   │   ├── ui/                # Generic UI components
│   │   └── workshop/          # Input forms & navigation
│   ├── lib/                   # Utilities (Prisma client)
│   ├── types/                 # TypeScript definitions
│   └── utils/                 # Helper functions
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts               # Sample data seeder
└── public/                    # Static assets
```

## 🐛 Troubleshooting

### "GOOGLE_GENERATIVE_AI_API_KEY is not set"

Make sure your `.env` file exists in the `web/` directory and contains the API key. Restart the dev server after adding it.

### "Database connection failed"

1. Ensure PostgreSQL is running
2. Verify your `DATABASE_URL` is correct
3. Run `npx prisma db push` to create tables

### "Module not found" errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### Charts not rendering correctly

Clear your browser cache or try an incognito window. The app uses dynamic imports that can sometimes be cached incorrectly.

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Built with the [Agentic 10x Protocol](https://www.10xworkshop.com/)
- Powered by [Google Gemini](https://ai.google.dev/)
- UI inspired by modern design systems
