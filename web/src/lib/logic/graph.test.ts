import { detectCircularDependency, sortOpportunities, LogicOpportunity } from './graph'

describe('Logic Engine: Graph Constraints', () => {

    const oppA: LogicOpportunity = {
        id: 'A',
        projectName: 'Project A',
        capabilitiesConsumed: [],
        capabilitiesProduced: [{ name: 'Cap-X' }]
    }

    const oppB: LogicOpportunity = {
        id: 'B',
        projectName: 'Project B',
        capabilitiesConsumed: [{ name: 'Cap-X', status: 'MISSING' }], // B depends on A
        capabilitiesProduced: [{ name: 'Cap-Y' }]
    }

    const oppC: LogicOpportunity = {
        id: 'C',
        projectName: 'Project C',
        capabilitiesConsumed: [{ name: 'Cap-Y', status: 'MISSING' }], // C depends on B
        capabilitiesProduced: []
    }

    test('Constraint 1: The Loop Breaker (Simple Cycle A->B->A)', () => {
        const cycleA: LogicOpportunity = { ...oppA, capabilitiesConsumed: [{ name: 'Cap-Y', status: 'MISSING' }] } // A now depends on B
        // A produces X. B consumes X (from A) and produces Y. A consumes Y (from B).
        // Cycle: A -> B -> A

        // Note: status must be 'MISSING' to create dependency (Task definition)
        const options: LogicOpportunity[] = [cycleA, oppB]

        expect(detectCircularDependency(options)).toBe(true)
    })

    test('Constraint 1: No Cycle (Linear A->B->C)', () => {
        const linearOps = [oppA, oppB, oppC]
        expect(detectCircularDependency(linearOps)).toBe(false)
    })

    test('Constraint 2: Feasibility Lock (Sorts Producers before Consumers)', () => {
        // Input order is randomized: C, A, B
        // Correct Order: A -> B -> C
        // A produces X. B consumes X (needs A). B produces Y. C consumes Y (needs B).

        const input = [oppC, oppA, oppB]
        const sorted = sortOpportunities(input)

        expect(sorted[0].id).toBe('A')
        expect(sorted[1].id).toBe('B')
        expect(sorted[2].id).toBe('C')
    })

    test('Constraint 2: Throws on Cycle during Sort', () => {
        const cycleA: LogicOpportunity = { ...oppA, capabilitiesConsumed: [{ name: 'Cap-Y', status: 'MISSING' }] }
        const input = [cycleA, oppB] // A->B->A

        expect(() => sortOpportunities(input)).toThrow('Circular dependency detected')
    })

    test('Constraint 3: Load Bearing (Is Orphan Check - Implicit Logic)', () => {
        // While the Load Bearing UI guardrail ("Cannot delete") is a UI interaction check,
        // we can verify the graph recognises dependencies exist.
        // If we detect dependencies for B, we know it relies on A.
        // This test ensures our graph building correctly identifies B as a dependent.

        const sorted = sortOpportunities([oppA, oppB])
        // B should be after A
        const indexA = sorted.findIndex(o => o.id === 'A')
        const indexB = sorted.findIndex(o => o.id === 'B')
        expect(indexA).toBeLessThan(indexB)
    })
})
