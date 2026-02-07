import { TestSuite } from '../types';
import { assert } from '../runner';
import { compileGraphToIR } from '../../generator/ir';
import { generateCode } from '../../generator/codegen';
import { GraphState } from '../../types';

export const codegenSuite: TestSuite = {
  name: 'Code Generator',
  tests: [
    {
      name: 'Compile IR from valid graph',
      fn: () => {
         const graph: GraphState = {
            nodes: [
                { id: 'c1', type: 'CLIENT', position: { x: 0, y: 0 }, label: 'Client', config: { rps: 10, burstMultiplier: 1 } },
                { id: 'api1', type: 'API', position: { x: 100, y: 0 }, label: 'API', config: { capacity: 100, baseLatency: 10, errorRate: 0 } }
            ],
            edges: [{ id: 'e1', sourceId: 'c1', targetId: 'api1' }],
            selectedNodeId: null,
            selectedEdgeId: null
        };
        
        const ir = compileGraphToIR(graph, 'test-project');
        assert(ir.services.length === 1, 'Should compile 1 service (API), Client excluded');
        assert(ir.services[0].id === 'api1', 'Service ID should match');
      }
    },
    {
        name: 'Generate code files',
        fn: () => {
             const graph: GraphState = {
                nodes: [
                    { id: 'api1', type: 'API', position: { x: 100, y: 0 }, label: 'API', config: { capacity: 100, baseLatency: 10, errorRate: 0 } }
                ],
                edges: [],
                selectedNodeId: null,
                selectedEdgeId: null
            };
            
            const ir = compileGraphToIR(graph, 'gen-test');
            const files = generateCode(ir);
            
            assert(files.length > 5, 'Should generate multiple files (package.json, tsconfig, etc)');
            assert(files.some(f => f.path === 'package.json'), 'Should include package.json');
            assert(files.some(f => f.path.includes('src/shared/types.ts')), 'Should include shared types');
        }
    }
  ]
};
