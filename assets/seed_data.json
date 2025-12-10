
{
  "meta": {
    "description": "Seed data for Agentic 10x Workshop App (v3.0). Includes Strategic Context and Quantitative Benefits for Charter Export.",
    "version": "3.0"
  },
  "workshop_id": "WS-2025-SEED-001",
  "client_name": "Acme Global Logistics",
  "status": "Input",
  "settings": {
    "scoring_scale": 5
  },
  "opportunities": [
    {
      "opportunity_id": "OPP-001",
      "project_name": "Invoice Reconciliation Agent",
      "friction_statement": "AP team spends 40hrs/week manually matching POs.",
      "strategic_horizon": "OPS", 
      "t_shirt_size": "M",
      "why_do_it": "As an AP Manager, I want to automate invoice matching so that my team can focus on high-value vendor relationship management instead of data entry.",
      "agent_directive": {
        "trigger": "New PDF invoice received via Email",
        "action": "Extract Line Items, Match PO in SAP, Schedule Payment",
        "guardrail": "IF confidence < 95% OR Value > $50k, route to Human",
        "autonomy_level": "L1 (Suggest)"
      },
      "quantitative_benefits": {
        "annual_revenue": null,
        "cost_reduction": 150000,
        "efficiency_hours_week": 40
      },
      "dfv_assessment": {
        "desirability": "HIGH",
        "feasibility": "HIGH",
        "viability": "HIGH"
      },
      "execution_details": {
        "definition_of_done": "- System processes 95% of standard PDF invoices without human intervention.\n- Two-way match logic confirmed by Finance.\n- Integration with SAP is live in Prod.",
        "key_decisions": "Security review required for reading Finance Inbox. SAP Service User credentials needed.",
        "impacted_systems": ["SAP", "Microsoft Exchange", "SharePoint"]
      },
      "vrcc_scores": {
        "value": 4,
        "capability": 5,
        "complexity": 2,
        "risk_final": 2,
        "risk_ai_recommended": 2,
        "risk_override_log": null
      },
      "capabilities": {
        "consumed_capabilities": [
          { "name": "OCR Engine", "status": "EXISTING" },
          { "name": "SAP API Access", "status": "MISSING" }
        ],
        "produced_capabilities": [
          "Cleaned Invoice Data"
        ]
      },
      "ui_state": {
        "completeness_score": 100,
        "matrix_coords": { "x": 0, "y": 0, "r": 0 }
      }
    },
    {
      "opportunity_id": "OPP-002",
      "project_name": "Supplier Negotiation Bot",
      "friction_statement": "Manual negotiation takes 3 weeks per contract. We lose 5% margin on tail spend.",
      "strategic_horizon": "GROWTH",
      "t_shirt_size": "L",
      "why_do_it": "As a Procurement Lead, I want to autonomously renegotiate tail-spend contracts so that we can recover 5% margin without adding headcount.",
      "agent_directive": {
        "trigger": "Contract renewal date - 30 days",
        "action": "Draft renewal email with performance data and price target",
        "guardrail": "Human approval required before sending final offer",
        "autonomy_level": "L1 (Suggest)"
      },
      "quantitative_benefits": {
        "annual_revenue": 2000000,
        "cost_reduction": 500000,
        "efficiency_hours_week": 10
      },
      "dfv_assessment": {
        "desirability": "MED",
        "feasibility": "LOW",
        "viability": "HIGH"
      },
      "execution_details": {
        "definition_of_done": "- Bot successfully identifies contracts expiring in 30 days.\n- Generates negotiation email with <5% hallucination rate.\n- Dashboard tracks savings realized.",
        "key_decisions": "Legal approval for automated contract language. Threshold for 'Auto-Send' vs 'Review'.",
        "impacted_systems": ["Coupa", "Salesforce", "Email"]
      },
      "vrcc_scores": {
        "value": 5,
        "capability": 2,
        "complexity": 4,
        "risk_final": 4,
        "risk_ai_recommended": 4,
        "risk_override_log": null
      },
      "capabilities": {
        "consumed_capabilities": [
          { "name": "Cleaned Invoice Data", "status": "MISSING" } 
        ],
        "produced_capabilities": []
      },
      "ui_state": {
        "completeness_score": 100
      }
    }
  ],
  "readme_for_dev": "LOGIC TEST: OPP-002 consumes 'Cleaned Invoice Data' which is produced by OPP-001. Therefore, the Sequencing Engine MUST rank OPP-001 before OPP-002."
}