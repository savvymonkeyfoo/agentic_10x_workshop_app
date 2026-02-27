# Agentic 10x Protocol - Workshop Application

The **Agentic 10x Workshop Application** is a purpose-built tool for AI Strategy facilitators. It streamlines the process of capturing high-value AI opportunities, mapping enterprise capabilities, and generating actionable implementation plans during live client workshops.

## 🚀 Key Features

### 1. Opportunity Capture Workflow
A guided, interactive canvas ("Input Canvas") for defining AI opportunities in real-time:
*   **Smart Navigation**: A "Sun Visor" style navigator that allows facilitators to switch between opportunities quickly with auto-closing logic to keep the workspace clean.
*   **Strategic Context**: Capture *Friction Statements*, *Strategic Horizons* (Growth, Throughput, Advantage), and *Customer Value Propositions*.
*   **T-Shirt Sizing**: A visual "Hero Grid" for rapidly estimating effort (XS to XL) with proportional visualization.

### 2. Intelligent Capability Management
*   **Drag-and-Drop Interface**: Easily map capabilities across "Enterprise Bank", "Existing in Project", and "Missing/Gap".
*   **AI Recommender**: Powered by Google Gemini, this feature analyzes the workflow context and automatically suggests relevant enterprise capabilities, deduplicating them against the current list.
*   **Gap Analysis**: Visually identify missing critical systems or skills needed for execution.

### 3. AI Execution Co-Pilot 🤖
*   **Executive Strategy Generator**: Drafts high-level execution plans (Definition of Done, Key Decisions, Change Management) using the "Chief Strategy Officer" persona.
*   **Smart Formatting**: Automatically formats lists with clean bullet points and hanging indents for readability.
*   **Safety Valves**: Includes "Action Confirmation" modals to prevent accidental overwrites of existing notes.

### 4. AI Strategy & Analysis
*   **Automated Analysis**: Generates comprehensive "Strategy One-Pagers" using the captured data.
*   **Analysis Dashboard**: View detailed breakdowns including *Strategic Journey Maps*, *Financial Models*, and *Risk Assessments*.

---

## 📋 Recent Updates

### Phase 3: Component Consolidation & Design System (February 2026) ✅

Completed comprehensive UI component consolidation and design system standardization:

* **Textarea Consolidation:** 7 implementations → 2 (base + SmartTextarea)
  * Auto-grow, bullet lists, markdown preview, title variant
  * ~380 LOC reduction
* **SpiderChart Deduplication:** Removed duplicate, unified with semantic tokens
* **Button Standardization:** Migrated 10 files with 20+ raw `<button>` elements to Button component
* **Spinner Component:** Created unified Spinner with sm/md/lg sizes
* **Text Size Cleanup:** Removed arbitrary sizes, standardized to Tailwind scale
* **Design System Documentation:** Comprehensive design tokens and component usage guides

**Total LOC Reduction:** ~500+ lines

**Benefits:** Improved maintainability, theme consistency, developer experience

**Documentation:**

* [Design Tokens](/web/src/styles/design-tokens.md) - Complete design system reference
* [Component Usage Guide](/web/docs/COMPONENT_USAGE.md) - Quick component reference

---

## 🛠️ Tech Stack

*   **Framework**: Next.js 14 (App Router)
*   **Styling**: Tailwind CSS
*   **Database**: Prisma (SQLite/Postgres)
*   **AI**: Google Generative AI SDK (Gemini 1.5 Pro / 2.5 Flash)
*   **Interactions**: `@dnd-kit` for drag-and-drop, `framer-motion` for animations.

## 📦 Getting Started

### Prerequisites
*   Node.js 18+
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-org/agentic-10x-workshop.git
    cd web
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    DATABASE_URL="file:./dev.db"
    GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_api_key" # Get from https://aistudio.google.com/app/apikey
    ```

4.  **Database Setup**
    Initialize the Price database:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Run Development Server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) to view the workshop application.

## 📝 Usage Guide

1.  **Start a Session**: Open the Workshop Input Canvas.
2.  **Add an Opportunity**: Use the Navigator (+) to create a new card.
3.  **Define the Problem**: Fill in the *Friction Statement* and *Value Proposition*.
4.  **Map Capabilities**:
    *   Open the "Capabilities" tab.
    *   Click **"Recommend"** to get AI suggestions.
    *   Drag items to "Existing" or "Missing".
5.  **Draft Execution Plan**:
    *   Navigate to "Execution" tab.
    *   Click **"✨ Recommend"** to draft a comprehensive delivery strategy.
    *   Refine the text using the smart "Bullet List Editor".
6.  **Analyze**: Click "Analyse" to generate the strategic outputs.
