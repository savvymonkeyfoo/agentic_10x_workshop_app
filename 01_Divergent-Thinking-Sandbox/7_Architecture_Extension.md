
````
# Technical Spec: Context Engine & Ideation Board

**Project:** Agentic 10x Workshop App – Phase 1 Extension
**Status:** Draft / Build-Ready
**Context:** Implements the "Dossier" storage and "RAG" pipeline.

---

## 1. Infrastructure Strategy ("The Vercel Monolith")

To minimize cost and complexity while maintaining high performance, we utilize the existing Postgres instance for both relational data and vector data, avoiding external vector databases like Pinecone.

* **File Storage:** **Vercel Blob**
    * *Role:* Stores the *Source of Truth* files (PDFs, Markdown, Text).
    * *Constraint:* 250MB limit on Hobby tier (sufficient for text dossiers).
* **Vector Index:** **Postgres + `pgvector`**
    * *Role:* Stores the *Searchable* embeddings derived from the files.
    * *Benefit:* Allows hybrid queries (e.g., "Find vectors matching 'automation' WHERE workshop_id = '123'").
* **Ingestion Pipeline:** **Next.js Server Actions**
    * *Role:* Handles the upload, parsing, embedding, and storage in a single async flow.

---

## 2. New Dependencies

The following packages must be added to `package.json` to support file parsing and storage:

```bash
npm install pdf-parse @vercel/blob
npm install -D @types/pdf-parse
````

---

## 3. The RAG Pipeline (Upload Flow)

**Trigger:** User uploads a file on Screen 1.5 (Research Interface).

**Step-by-Step Execution:**

1. **Upload:** File is sent to Vercel Blob. A public/protected URL is returned.
    
2. **Parse:** Server Action downloads the blob buffer and uses `pdf-parse` (or simple text parsing for MD) to extract raw text.
    
3. **Chunk:** Text is split into 1000-character chunks with a 100-character overlap to preserve semantic context.
    
4. **Embed:** Chunks are sent to Google Gemini (`text-embedding-004`) to generate 768-dimensional vectors.
    
5. **Transaction & Tagging:**
    
    - Create `WorkshopDocument` record (stores metadata + Vercel Blob URL).
        
    - **CRITICAL:** Apply the correct metadata tag (`category`) to support the "Blind Spot" analysis:
        
        - `CLIENT_INTERNAL`: Used for the _Enterprise Discovery Report_ and _Client Backlog_. Represents "What we know/have."
            
        - `MARKET_EXTERNAL`: Used for _Outside-In Signals_ (News, Competitor Reports). Represents "What the market is doing."
            
    - Create `DocumentChunk` records (stores text content + vector data) linked to the document.
        

---

## 4. RAG Retrieval Logic (The "Merge" Assistant)

**Trigger:** User merges cards on Screen 1.6 or asks the AI to "Expand" an idea.

**Logic Flow:**

1. **Context Assembly:**
    
    - Input: The text from Idea Card A + Idea Card B (or the specific query).
        
    - Action: Generate an embedding vector for this input.
        
2. **Vector Search:**
    
    - Perform a cosine similarity search on `DocumentChunk`.
        
    - **Filter:** `WHERE workshopId = [current_workshop_id]`
        
    - _(Optional Filter)_: `AND document.category = 'CLIENT_INTERNAL'` (If validating against constraints) OR `AND document.category = 'MARKET_EXTERNAL'` (If looking for innovation signals).
        
3. **Synthesis:**
    
    - Inject the retrieved text chunks into the System Prompt as "Context".
        
    - Prompt: _"Using the following context from the client's dossier [CONTEXT], combine these ideas..."_
        

**Pseudo-Code for Retrieval:**

TypeScript

```
// Example using Prisma + Raw SQL for vector distance
const relevantChunks = await prisma.$queryRaw`
  SELECT content, 1 - (vector <=> ${queryVector}) as similarity
  FROM "DocumentChunk"
  JOIN "WorkshopDocument" ON "DocumentChunk"."documentId" = "WorkshopDocument"."id"
  WHERE "WorkshopDocument"."workshopId" = ${workshopId}
  -- Optional: AND "WorkshopDocument"."category" = 'CLIENT_INTERNAL'
  ORDER BY similarity DESC
  LIMIT 5;
`
```

---

## 5. The Ideation Board Architecture

**Component:** `IdeationBoard.tsx`

- **Layout:** Masonry Grid layout (CSS Grid or `react-masonry-css`).
    
- **Interactivity:** `@dnd-kit/core`
    
    - **Drag:** Cards can be dragged into "Tiers" (Visual Logic).
        
    - **Select:** Multi-select implemented via localized React State (Set of selected IDs).
        
- **Optimistic UI:**
    
    - When a user moves a card or updates a Tier, the UI updates instantly.
        
    - The Server Action fires in the background to update the `IdeaCard` record.
        

---

## 6. Security & Cleanup

- **Cascade Delete:** If a Workshop is deleted, all associated `WorkshopDocuments` and `IdeaCards` must be deleted (handled via Prisma Schema `onDelete: Cascade`).
    
- **Blob Cleanup:** A separate cleanup script (or cron job) is recommended to delete the actual files from Vercel Blob when their database records are removed, preventing "Orphaned Files."