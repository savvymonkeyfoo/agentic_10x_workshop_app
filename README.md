# Agentic 10x Workshop Application

A modern, agentic workflow application for managing strategic workshops and opportunities using the **Agentic 10x Protocol**.

## 🚀 Overview

This application provides a structured interface for facilitating workshops, capturing opportunities, and assessing them against the VRCC (Value, Risk, Complexity, Capability) framework and DFV (Desirability, Feasibility, Viability) metrics. It features a reactive "Input Canvas" with real-time validation, financial modeling, and strategic visualization.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Database**: PostgreSQL
- **ORM**: Prisma
- **State Management**: React Hooks & Server Actions

## 📋 Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A running instance of **PostgreSQL** (local or cloud)

## ⚙️ Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/savvymonkeyfoo/agentic_10x_workshop_app.git
    cd agentic_10x_workshop_app
    ```

2.  **Navigate to the web application directory:**
    ```bash
    cd web
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Configure Environment Variables:**
    Create a `.env` file in the `web` directory and add your database connection string:
    ```bash
    # web/.env
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME?schema=public"
    ```
    *Replace the values with your actual PostgreSQL credentials.*

5.  **Initialize the Database:**
    Push the schema to your database and generate the Prisma client:
    ```bash
    npx prisma db push
    npx prisma generate
    ```

## 🏃‍♂️ Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🧪 Verification & Utilities

Includes a script to verify that complex data structures (like Bullet Lists and JSON fields) are saving correctly to the database.

**Run the verification script:**
```bash
# Inside the /web directory
npx tsx scripts/verify-data.ts
```
This will fetch the most recently updated Opportunity and dump its raw data to `verification-dump.json` for inspection.

## 📂 Project Structure

- `src/app`: Next.js App Router pages and API routes.
- `src/components`: Reusable UI components (Workshop, Inputs, Visualizations).
- `src/types`: Shared TypeScript definitions.
- `src/utils`: Utility functions (Completeness logic, Formatting).
- `prisma`: Database schema definition (`schema.prisma`).
