export interface LogicOpportunity {
    id: string
    projectName: string
    capabilitiesConsumed: { name: string; status: 'EXISTING' | 'MISSING' }[]
    capabilitiesProduced: { name: string }[]
}

/**
 * Detects circular dependencies in the opportunity graph.
 * Returns true if a cycle is detected (The Loop Breaker).
 */
export function detectCircularDependency(opportunities: LogicOpportunity[]): boolean {
    if (opportunities.length === 0) return false

    // 1. Build Adjacency List (Producer ID -> Consumer IDs)
    // We need to know which opportunities produce the capabilities that others consume.

    // Map capability name to Producer Opportunity ID
    const capabilityProducerMap = new Map<string, string>()
    opportunities.forEach(opp => {
        opp.capabilitiesProduced.forEach(cap => {
            capabilityProducerMap.set(cap.name, opp.id)
        })
    })

    // Build the graph: Node -> Neighbors (Dependencies)
    // Edge exists if Node A consumes a capability produced by Node B.
    // Wait, dependency direction: A consumes X from B. So A depends on B.
    // Standard Cycle Detection: A -> B means A depends on B.
    // So if we have A -> B and B -> A, that's a cycle.
    // Let's build "Depends On" graph.
    const adjList = new Map<string, string[]>()

    opportunities.forEach(opp => {
        const dependencies: string[] = []
        opp.capabilitiesConsumed.forEach(cap => {
            // Only care if it's MISSING (creates dependency) and produced by another opportunity in this list
            // Tech Stack says "MISSING (Amber): Creates Dependency"
            if (cap.status === 'MISSING') {
                const producerId = capabilityProducerMap.get(cap.name)
                if (producerId && producerId !== opp.id) {
                    dependencies.push(producerId)
                }
            }
        })
        adjList.set(opp.id, dependencies)
    })

    // 2. DFS Cycle Detection
    const visited = new Set<string>()
    const recStack = new Set<string>()

    function isCyclic(nodeId: string): boolean {
        if (recStack.has(nodeId)) return true
        if (visited.has(nodeId)) return false

        visited.add(nodeId)
        recStack.add(nodeId)

        const neighbors = adjList.get(nodeId) || []
        for (const neighbor of neighbors) {
            if (isCyclic(neighbor)) return true
        }

        recStack.delete(nodeId)
        return false
    }

    for (const opp of opportunities) {
        if (isCyclic(opp.id)) return true
    }

    return false
}

/**
 * Sorts opportunities based on topological order (Producers before Consumers).
 * Implements "The Feasibility Lock".
 * Throws error if cycle detected (should be checked before).
 */
export function sortOpportunities(opportunities: LogicOpportunity[]): LogicOpportunity[] {
    // Same graph build
    const capabilityProducerMap = new Map<string, string>()
    opportunities.forEach(opp => {
        opp.capabilitiesProduced.forEach(cap => {
            capabilityProducerMap.set(cap.name, opp.id)
        })
    })

    const adjList = new Map<string, string[]>()

    // Initialize all nodes in adjList to ensure disjoint nodes are included
    opportunities.forEach(opp => adjList.set(opp.id, []))

    // In topological sort, typically Edge A -> B means A comes BEFORE B.
    // Dependency: Consumer depends on Producer. So Producer must come BEFORE Consumer.
    // Edge: Producer -> Consumer.
    // Let's build Producer -> Consumer graph.

    opportunities.forEach(consumer => {
        consumer.capabilitiesConsumed.forEach(cap => {
            if (cap.status === 'MISSING') {
                const producerId = capabilityProducerMap.get(cap.name)
                if (producerId && producerId !== consumer.id) {
                    // Producer (producerId) -> Consumer (consumer.id)
                    const edges = adjList.get(producerId) || []
                    edges.push(consumer.id)
                    adjList.set(producerId, edges)
                }
            }
        })
    })

    // Topological Sort (Kahn's Algorithm or DFS)
    // Kahn's is good for detecting cycles too.

    // Calculate Indegrees (number of incoming edges, i.e., number of producers satisfying this node)
    const inDegree = new Map<string, number>()
    opportunities.forEach(opp => inDegree.set(opp.id, 0))

    for (const [_producer, consumers] of adjList.entries()) {
        for (const consumerId of consumers) {
            inDegree.set(consumerId, (inDegree.get(consumerId) || 0) + 1)
        }
    }

    // Queue of nodes with no dependencies (indegree 0)
    const queue: string[] = []
    inDegree.forEach((degree, id) => {
        if (degree === 0) queue.push(id)
    })

    const sortedIds: string[] = []

    while (queue.length > 0) {
        // Deterministic sort for stable queue popping if needed, but standard queue is fine
        const u = queue.shift()!
        sortedIds.push(u)

        const neighbors = adjList.get(u) || []
        for (const v of neighbors) {
            const newDegree = (inDegree.get(v) || 0) - 1
            inDegree.set(v, newDegree)
            if (newDegree === 0) {
                queue.push(v)
            }
        }
    }

    if (sortedIds.length !== opportunities.length) {
        throw new Error('Circular dependency detected during sort')
    }

    // Map back to objects
    // Note: This sort gives a valid execution order.
    // We want to handle "stable sort" nuances if needed, but for now strict topology is the goal.
    return sortedIds.map(id => opportunities.find(o => o.id === id)!)
}
