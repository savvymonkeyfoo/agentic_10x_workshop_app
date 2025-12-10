**Project:** Agentic 10x Protocol Workshop App **Architecture Style:** Local-First, Containerised Monorepo **Version:** 1.0

## 1. Executive Recommendation

**Decision:** We will build a **Local-First Web Application** wrapped in **Docker**.

- **Why Local Database?** In a high-stakes client workshop, Wi-Fi can fail. A local database running inside Docker guarantees zero latency and 100% uptime. It also addresses client data privacy concerns immediately (no data leaves the room).
    
- **Why Next.js?** It is the industry standard for React. It allows us to build the Frontend (UI) and the Backend (API/Logic) in a single codebase ("Monorepo"), which is perfect for a standalone Docker delivery.
    

---

## 2. The Technology Stack (The "Build List")

### **2.1 Core Framework**

- **Framework:** **Next.js 14 (App Router)**.
    
    - _Why:_ Provides React Server Components (RSC) for performance and Server Actions for the Logic Engine (Layer 1).
        
- **Language:** **TypeScript**.
    
    - _Why:_ Non-negotiable for "Ironclad" logic. It catches type errors (e.g., missing VRCC scores) before the app even runs.
        

### 2.2 The Database Engine (The "Brain")

- **Recommendation:** **PostgreSQL** (running in a Docker Container).
    
- **ORM (Object-Relational Mapping):** **Prisma**.
    
    - _Why Prisma?_ It is the "modern" companion to Next.js. It auto-generates the database schema from a simple file.
        
    - _The "Switch" Capability:_ Prisma allows you to run on a Local Postgres today, but if you ever decide to host this on the cloud (AWS/Vercel), you change **one line of code** in the `.env` file. It future-proofs the app.
        

### 2.3 UI & Animation (The "Glass" Look)

- **Styling:** **Tailwind CSS**.
    
    - _Why:_ Rapid development. We will define the "Glassmorphism" classes in the `tailwind.config.ts`.
        
- **Animation:** **Framer Motion**.
    
    - _Why:_ Standard CSS transitions are too jerky for the "Spider Chart" morphing. Framer Motion handles the 60fps physics required for the "Kite" visualization.
        
- **Visualization:** **Recharts** (React wrapper for D3).
    
    - _Why:_ The standard for React charts. Highly customizable for the "Inverted Axis" logic we need.
        

### 2.4 AI Orchestration

- **SDK:** **Vercel AI SDK**.
    
    - _Why:_ A lightweight wrapper that makes calling OpenAI or Gemini streaming APIs trivial. It handles the "Ghost Thumb" streaming response effortlessly.
        

---

## 3. Infrastructure & Deployment (Docker Strategy)

We will use **Docker Compose** to orchestrate the application. This ensures that when another user downloads the repo, they run _one command_ and everything works.

### **3.1 The Container Architecture**

The `docker-compose.yml` file will define two services that talk to each other internally:

1. **Service A: The App (`web`)**
    
    - Runs the Next.js application (Frontend + API).
        
    - Exposes Port `3000` (localhost:3000).
        
2. **Service B: The Database (`db`)**
    
    - Runs the official PostgreSQL Alpine image.
        
    - Uses a **Docker Volume** (`pgdata`) to ensure workshop data persists even if the laptop is restarted.
        

### **3.2 The Developer/User Workflow**

- **Step 1:** Download Repo from GitHub.
    
- **Step 2:** Add API Key to `.env` file (OpenAI/Gemini Key).
    
- **Step 3:** Run `docker-compose up`.
    
    - _Result:_ Docker downloads Postgres, sets up the Schema (via Prisma), starts the App, and opens it in the browser.
        

---

## 4. Prisma Schema Definition (The Blueprint)

To ensure the developer builds the _exact_ data structure we defined in the PRD, we provide the **Prisma Schema**. This is code-ready logic.

_Copy this block into a file named `schema.prisma` in your Hand-off Package._

Code snippet
```
// schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 1. Workshop Container
model Workshop {
  id          String   @id @default(uuid())
  clientName  String
  createdAt   DateTime @default(now())
  status      String   @default("INPUT") // Draft, Input, Analysis
  opportunities Opportunity[]
}

// 2. The Opportunity Asset
model Opportunity {
  id              String   @id @default(uuid())
  workshopId      String
  workshop        Workshop @relation(fields: [workshopId], references: [id])
  
  // Tab A: Strategic Context
  projectName       String
  frictionStatement String
  strategicHorizon  String   // "GROWTH", "OPS", "STRATEGY"
  whyDoIt           String   @db.Text
  
  // Tab B: The Agent
  agentDirective    Json     
  // { "trigger": "...", "action": "...", "guardrail": "...", "autonomy": "L1" }

  // Tab C: Business Case (VRCC + Financials)
  scoreValue        Int
  scoreCapability   Int
  scoreComplexity   Int
  scoreRiskFinal    Int      @default(0)
  scoreRiskAI       Int      @default(0)
  riskOverrideLog   String?
  tShirtSize        String   // "XS", "S", "M", "L", "XL"
  
  benefitRevenue    Float?
  benefitCost       Float?
  benefitEfficiency Float?
  
  dfvDesirability   String   // "HIGH", "MED", "LOW"
  dfvFeasibility    String
  dfvViability      String

  // Tab D: Execution
  definitionOfDone  String   @db.Text
  keyDecisions      String   @db.Text
  impactedSystems   String[]

  // Logic Engine
  capabilitiesConsumed CapabilityConsumed[]
  capabilitiesProduced CapabilityProduced[]
  
  // Outputs
  sequenceRank    Int?
  matrixX         Float?
  matrixY         Float?
}

// 3. Capabilities
model CapabilityConsumed {
  id            String      @id @default(uuid())
  opportunityId String
  opportunity   Opportunity @relation(fields: [opportunityId], references: [id])
  name          String
  status        String      // "EXISTING" or "MISSING"
}

model CapabilityProduced {
  id            String      @id @default(uuid())
  opportunityId String
  opportunity   Opportunity @relation(fields: [opportunityId], references: [id])
  name          String
}
```

### 4.1 Database Initialization Strategy (The "Cold Start" Fix)

**Requirement:** The "One-Command" Setup.
The developer must include a `seed.ts` script in Prisma.

**Logic:**
When the user runs `npm run db:seed` (or during the initial Docker build), the system must parse `seed_data.json` and insert the "Acme Global" workshop into the local database.

**Why:**
This ensures the user instantly sees a fully populated "Happy Path" demo upon first launch, rather than an empty white screen.
---

## 5. Security & Persistence Strategy

### **5.1 Zero-Trust Local Environment**

- **Constraint:** The AI API Key (OpenAI/Gemini) must **never** be hardcoded.
    
- **Solution:** The app will read the key from the user's local `.env` file at runtime. This allows you to share the Docker container publicly without leaking your credentials.
    

### **5.2 Backup Strategy**

- Since the database is local, if the user deletes the Docker container/volume, data is lost.
    
- **Requirement:** We will build a **"Export Workshop"** button in the Dashboard.
    
- **Action:** Downloads a full JSON dump (and the PDF Charter) to the user's _Documents_ folder. This acts as the physical backup.
    

---

### **Summary of the Tech Stack**

| Component      | Choice             | Reason                                          |
| -------------- | ------------------ | ----------------------------------------------- |
| **Frontend**   | **Next.js 14**     | React Standard, Server Actions for Logic.       |
| **Styling**    | **Tailwind CSS**   | Fast, modern, handles "Glass" classes easily.   |
| **Animation**  | **Framer Motion**  | Critical for the Spider Chart & Slider feel.    |
| **Database**   | **PostgreSQL**     | Ironclad relational integrity for dependencies. |
| **Deployment** | **Docker Compose** | One-click run on any laptop.                    |
| **Data Layer** | **Prisma**         | Type-safe DB access, future-proof for Cloud.    |
|                |                    |                                                 |
