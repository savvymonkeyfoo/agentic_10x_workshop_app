

Feature: Agentic Workshop Logic Gates

  Scenario: Prevent Circular Dependencies (The Ouroboros)
    Given I have "Project A" which consumes "Capability X" (Missing)
    And I have "Project B" which consumes "Capability Y" (Missing)
    When I edit "Project A" to produce "Capability Y"
    And I edit "Project B" to produce "Capability X"
    Then the system should IMMEDIATELY pause analysis
    And trigger the "Loop Breaker Modal"
    And display "Circular Dependency Detected: Project A <-> Project B"

  Scenario: Logic Gap Resolution (Spawn Parent)
    Given I am editing "Project A"
    And I add a consumed capability tag "Vector DB"
    And I mark the tag as "MISSING" (Amber)
    And no other project produces "Vector DB"
    When I click the "Resolve Gap" button
    Then the system should create a NEW card titled "Build Capability: Vector DB"
    And link it as the producer for "Project A"

  Scenario: Load Bearing Protection (Delete Block)
    Given "Project A" produces "Clean Data"
    And "Project B" consumes "Clean Data"
    When I attempt to DELETE "Project A"
    Then the action should be BLOCKED
    And I should see an Alert saying "Cannot delete. This project provides 'Clean Data' required by Project B."

  Scenario: Visual Kite Logic (Chart Rendering)
    Given "Project A" has a Value Score of 5 (High)
    And "Project A" has a Risk Score of 5 (High)
    Then the Spider Chart point for Value should be at the OUTER EDGE (Radius 100%)
    And the Spider Chart point for Risk should be at the CENTER (Radius 0%)
    And the shape should appear "Deformed" (Dented on the Risk axis)