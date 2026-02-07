import { TestSuite } from '../types';
import { assert } from '../runner';
import { useGraphStore } from '../../graph/graphStore';
import { SimulationEngine } from '../../sim/engine';
import { compileGraphToIR } from '../../generator/ir';
import { TUTORIAL_LEVELS } from '../../tutorial/levels';

export const integrationSuite: TestSuite = {
  name: 'Integration Logic',
  tests: [
    {
      name: 'Load Level 1 -> Simulate -> Compile',
      fn: () => {
        const store = useGraphStore.getState();
        store.clearGraph();
        
        // 1. Load Level
        const level1 = TUTORIAL_LEVELS[0];
        assert(level1, 'Level 1 should exist');
        store.loadGraph(level1.starterGraph);
        
        const nodes = useGraphStore.getState().nodes;
        assert(nodes.length > 0, 'Nodes should be loaded');
        
        // 2. Run Simulation
        const engine = new SimulationEngine(useGraphStore.getState());
        for(let i=0; i<5; i++) engine.step();
        
        const snap = engine.getSnapshot();
        assert(snap.tick === 5, 'Simulation should advance');
        
        // 3. Compile
        // Need to ensure graph state is valid for compilation
        const graph = useGraphStore.getState();
        const ir = compileGraphToIR(graph, 'integration-test');
        assert(ir.services.length > 0, 'Should compile services from Level 1');
      }
    }
  ]
};
