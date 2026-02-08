import { TestSuite } from '../types';
import { assert, assertEqual } from '../runner';
import { useGraphStore } from '../../graph/graphStore';

export const graphSuite: TestSuite = {
  name: 'Graph Logic',
  tests: [
    {
      name: 'addNode adds a node to the store',
      fn: () => {
        const store = useGraphStore.getState();
        store.clearGraph();

        store.addNode('REST_API', { x: 100, y: 100 });
        const nodes = useGraphStore.getState().nodes;

        assert(nodes.length === 1, 'Should have 1 node');
        assertEqual(nodes[0].type, 'REST_API', 'Node type should be REST_API');
      }
    },
    {
      name: 'removeNode removes a node and connected edges',
      fn: () => {
        const store = useGraphStore.getState();
        store.clearGraph();

        store.addNode('REST_API', { x: 0, y: 0 }); // id: api-1
        store.addNode('SQL_DATABASE', { x: 100, y: 0 }); // id: db-1

        const nodes = useGraphStore.getState().nodes;
        const n1 = nodes[0].id;
        const n2 = nodes[1].id;

        store.addEdge(n1, n2);
        assert(useGraphStore.getState().edges.length === 1, 'Edge should be created');

        store.removeNode(n1);

        assert(useGraphStore.getState().nodes.length === 1, 'Should have 1 node left');
        assert(useGraphStore.getState().edges.length === 0, 'Edge should be removed');
      }
    },
    {
      name: 'updateNodePosition updates coordinates',
      fn: () => {
        const store = useGraphStore.getState();
        store.clearGraph();
        store.addNode('REST_API', { x: 0, y: 0 });
        const id = useGraphStore.getState().nodes[0].id;

        store.updateNodePosition(id, { x: 50, y: 50 });
        const node = useGraphStore.getState().nodes[0];

        assertEqual(node.position.x, 50, 'X should be 50');
        assertEqual(node.position.y, 50, 'Y should be 50');
      }
    },
    {
      name: 'prevent duplicate edges',
      fn: () => {
        const store = useGraphStore.getState();
        store.clearGraph();
        store.addNode('REST_API', { x: 0, y: 0 });
        store.addNode('SQL_DATABASE', { x: 100, y: 0 });
        const [n1, n2] = useGraphStore.getState().nodes;

        store.addEdge(n1.id, n2.id);
        store.addEdge(n1.id, n2.id); // Duplicate attempt

        assert(useGraphStore.getState().edges.length === 1, 'Should only have 1 edge');
      }
    }
  ]
};
