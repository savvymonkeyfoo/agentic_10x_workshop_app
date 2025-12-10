**Project:** Agentic 10x Protocol Workshop App **Visual Theme:** "Capgemini Spatial" (Glassmorphism) **Framework Target:** React / Tailwind CSS (Recommended) **Version:** 1.0

---

## 1. Design Philosophy: "Intelligent Glass"

The interface behaves like a spatial operating system. Elements do not sit "on" the page; they float "above" it. Hierarchy is determined by **Depth (Z-Axis)** and **Blur**, not just size.

- **Layer 0 (Background):** Slow-moving fluid gradients (Navy/Cyan).
    
- **Layer 1 (The Glass):** Translucent panels that blur the background.
    
- **Layer 2 (Content):** High-contrast text and glowing data visualisations.
    
- **Layer 3 (Overlays):** Modals and Dropdowns that dim Layers 0–2.
    

---

## 2. Design Tokens (CSS Variables)

_Developers must use these variables for all styling to ensure the Light/Dark toggle works instantly without page reloads._

### 2.1 Color Palette (The "Theme Engine")

CSS

```
:root {
  /* GLOBAL BRANDING (Capgemini) */
  --brand-navy: #002D40;
  --brand-cyan: #1BB1E7;
  --brand-blue: #0070AD;
  --brand-white: #FFFFFF;
  
  /* SEMANTIC STATUS */
  --status-safe: #10B981;   /* Emerald */
  --status-risk: #EF4444;   /* Crimson */
  --status-gap: #F59E0B;    /* Amber */
  --status-value: #D97706;  /* Gold */
}

/* DARK MODE (Default - "Command Center") */
[data-theme='dark'] {
  --bg-core: #002D40;
  --glass-surface: rgba(30, 40, 60, 0.60);
  --glass-border: rgba(255, 255, 255, 0.15);
  --text-primary: #FFFFFF;
  --text-secondary: #94A3B8;
  --chart-stroke: var(--brand-cyan);
  --chart-fill: rgba(27, 177, 231, 0.2);
  --shadow-elevation: 0 20px 50px rgba(0,0,0,0.5);
}

/* LIGHT MODE ("Frosted Ice") */
[data-theme='light'] {
  --bg-core: #F0F3F5; /* Pale Grey */
  --glass-surface: rgba(255, 255, 255, 0.75);
  --glass-border: rgba(255, 255, 255, 0.6);
  --text-primary: #002D40; /* Deep Navy */
  --text-secondary: #475569;
  --chart-stroke: var(--brand-blue);
  --chart-fill: rgba(0, 112, 173, 0.1);
  --shadow-elevation: 0 10px 30px rgba(0, 45, 64, 0.1);
}
```

### 2.2 Typography (Hierarchy)

- **Font Family:** _Inter_ or _San Francisco Pro_ (System UI).
    
- **Scale:**
    
    - `Display H1`: 32px / Bold / Tracking -0.02em (Page Titles).
        
    - `Panel H2`: 24px / Semibold (Card Headers).
        
    - `Input Text`: 18px / Regular (Optimized for Projector Readability).
        
    - `Label`: 12px / Uppercase / Tracking 0.05em.
        

### 2.3 The "Glass" Mixin

_Standard CSS class for all cards/panels._

CSS

```
.glass-panel {
  background: var(--glass-surface);
  backdrop-filter: blur(24px) saturate(180%); /* The "Apple" Blur */
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-elevation);
  border-radius: 24px;
}
```

---

## 3. Core Component Library

### 3.1 The "VRCC Slider" (Liquid Bar)

- **Container:** Height 16px, rounded-full, background `rgba(128,128,128, 0.2)`.
    
- **Track (Fill):** Gradient `linear-gradient(90deg, var(--brand-blue), var(--brand-cyan))`.
    
- **Thumb 1 (User - Active):**
    
    - 24px Circle, Solid White (Light Mode) or Cyan (Dark Mode).
        
    - Shadow: `0 2px 10px rgba(0,0,0,0.3)`.
        
- **Thumb 2 (AI - Ghost):**
    
    - 24px Ring (2px border), 50% Opacity.
        
    - **Interaction:** Non-draggable. Click to "Snap" User Thumb to Ghost position.
        

### 3.2 The Spider Chart (The Kite)

- **Library:** Recharts or VisX (React).
    
- **Config:**
    
    - `PolarGrid`: Stroke `var(--glass-border)`.
        
    - `PolarAngleAxis`: Font Size 12px, Color `var(--text-secondary)`.
        
    - `Radar`: Stroke Width 3px, Dot Radius 4px.
        
- **Critical Visual Logic (The Deformity):**
    
    - Value/Capability Axis: 0 → center, 5 → outer edge.
        
    - Risk/Cost Axis: **5 → center, 0 → outer edge**.
        
    - _Result:_ A perfect project is a large, full kite. A risky project creates a visual "dent" in the shape.
        

### 3.3 The "Draft Curtain" (Privacy Toggle)

- **Implementation:** CSS Filter transition.
    
- **State ON (Hidden):**
    
    CSS
    
    ```
    .input-field.privacy-mode {
      filter: blur(8px);
      opacity: 0.5;
      pointer-events: none; /* Prevent accidental clicks */
      transition: all 0.3s ease;
    }
    ```
    
- **State OFF (Reveal):** `filter: blur(0); opacity: 1;`
#### **3.4 The "Traffic Light" Toggle (DFV Score)**

- **Visual:** A horizontal pill containing 3 circular segments.
    
- **States:**
    
    - **Low:** Left circle glows Red.
        
    - **Med:** Center circle glows Amber.
        
    - **High:** Right circle glows Green.
        
- **Interaction:** Single click to select. Smooth sliding animation for the active state.
    

#### **3.5 The "T-Shirt" Selector**

- **Visual:** A row of 5 icons representing generic shirt sizes (XS, S, M, L, XL).
    
- **State:**
    
    - **Inactive:** Outline stroke (Grey).
        
    - **Active:** Solid Fill (Brand Blue) + Glow.
        

#### **3.6 The Input Tabs**

- **Style:** "Glass Tabs".
    
- **Active Tab:** High brightness, white text, subtle "underline" glow.
    
- **Inactive Tab:** 50% opacity, no glow.
    
- **Transition:** Content area slides horizontally (`framer-motion`) when switching tabs.
### 3.7 The "Demo God" Hotkey (Facilitator Utility)
* **Trigger:** Pressing `Ctrl + Shift + D` (Dev Mode).
* **Action:** Pre-fills the current empty Opportunity Card with valid "Lorem Ipsum" strategy data.
* **Why:** Allows the Facilitator to demonstrate the tool instantly if they are running behind schedule or need to bypass typing during a quick demo.
---

## 4. Layout & Hierarchy Rules

### 4.1 The Split Screen Grid (Input Canvas)

- **Container:** CSS Grid.
    
- **Columns:** `1fr 1.5fr` (40% Left / 60% Right).
    
- **Why:** The Right side (Visualization) is the "Show piece" for the client and needs more weight.
    

### 4.2 Spacing System (The 8pt Grid)

- **Padding:** All Glass Panels must have `padding: 32px` internal spacing.
    
- **Gap:** 24px gap between panels.
    
- **Margins:** 48px outer margin (prevent content touching screen edges on projectors).
    

---

## 5. Quality Assurance: Automated Design Testing

_How to ensure developers build exactly what is specified._

### 5.1 Static Analysis (The Code Check)

- **Tool:** `Stylelint` configured with `stylelint-config-standard`.
    
- **Rule:** Enforce usage of CSS Variables. Hardcoded hex codes (e.g., `#FFFFFF`) should throw a build warning.
    
    - _Goal:_ Prevents "theme breakage" where a developer hardcodes a color that doesn't swap in Light Mode.
        

### 5.2 Component Isolation (The Workbench)

- **Tool:** **Storybook**.
    
- **Requirement:** Every component (Slider, Chart, Card) must have a Storybook entry showing it in both:
    
    1. Light Mode.
        
    2. Dark Mode.
        
    3. Empty State vs. Filled State.
        
- **Why:** Allows the Design Lead to review the "Ghost Thumb" interaction in isolation before it is integrated into the complex main screen.
    

### 5.3 Visual Regression Testing (The Pixel Police)

- **Tool:** **Chromatic** (or Percy) integrated into the CI/CD pipeline.
    
- **Process:**
    
    1. Take a snapshot of the "Input Canvas" (Image 4 reference).
        
    2. On every Pull Request, the system renders the code and compares it to the snapshot.
        
    3. **Threshold:** If pixels differ by >1%, the build fails.
        
- **Specific Check:** Verify the "Blur" effect. (Glassmorphism often breaks on different browsers; regression testing catches if the background blur fails to render).
    

---

## 6. Hand-off Checklist

_Before marking a ticket "Ready for Dev":_

- [ ] Are all colors mapped to a `--var`?
    
- [ ] Does the Spider Chart logic invert the Risk axis?
    
- [ ] Is the "Ghost Thumb" interaction defined in Storybook?
    
- [ ] Does the Layout respect the 40/60 split?
    
- [ ] Is the Font size >18px for input fields?