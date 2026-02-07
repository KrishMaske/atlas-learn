import { TestSuite } from '../types';
import { assert, assertEqual } from '../runner';
import { SimulationEngine } from '../../sim/engine';
import { GraphState } from '../../types';

export const simulationSuite: TestSuite = {
  name: 'Simulation Engine',
  tests: [
    {
      name: 'Engine initializes with graph state',
      fn: () => {
        const graph: GraphState = {
          nodes: [{ id: 'n1', type: 'CLIENT', position: { x: 0, y: 0 }, label: 'C', config: { rps: 10, burstMultiplier: 1 } }],
          edges: [],
          selectedNodeId: null,
          selectedEdgeId: null
        };
        const engine = new SimulationEngine(graph);
        assert(engine, 'Engine should be instantiated');
      }
    },
    {
      name: 'Step increments tick',
      fn: () => {
         const graph: GraphState = {
          nodes: [],
          edges: [],
          selectedNodeId: null,
          selectedEdgeId: null
        };
        const engine = new SimulationEngine(graph);
        const snap1 = engine.step();
        const snap2 = engine.step();
        
        assertEqual(snap1.tick, 1, 'First tick should be 1');
        assertEqual(snap2.tick, 2, 'Second tick should be 2');
      }
    },
    {
        name: 'Client node generates load',
        fn: () => {
            const graph: GraphState = {
                nodes: [
                    { id: 'c1', type: 'CLIENT', position: { x: 0, y: 0 }, label: 'Client', config: { rps: 100, burstMultiplier: 1 } },
                    { id: 'api1', type: 'API', position: { x: 100, y: 0 }, label: 'API', config: { capacity: 200, baseLatency: 10, errorRate: 0 } }
                ],
                edges: [{ id: 'e1', sourceId: 'c1', targetId: 'api1' }],
                selectedNodeId: null,
                selectedEdgeId: null
            };
            const engine = new SimulationEngine(graph);
            
            // Run for 10 ticks (1 second)
            for(let i=0; i<10; i++) engine.step();
            
            const snap = engine.getSnapshot();
            const apiMetrics = snap.nodeMetrics.get('api1');
            
            assert(apiMetrics, 'API metrics should exist');
            // 100 RPS / 10 ticks/sec = 10 req/tick. 
            // Throughput should be around 10.
            assert(apiMetrics!.throughput > 0, 'Should have throughput > 0');
        }
    }
  ]
};
