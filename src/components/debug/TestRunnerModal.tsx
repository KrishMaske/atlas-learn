'use client';

import { useState, useCallback, useEffect } from 'react';
import { RunnerState, TestResult, TestSuite } from '@/core/tests/types';
import { runSuite } from '@/core/tests/runner';
import { graphSuite } from '@/core/tests/suites/graph.test';
import { simulationSuite } from '@/core/tests/suites/simulation.test';
import { codegenSuite } from '@/core/tests/suites/codegen.test';
import { integrationSuite } from '@/core/tests/suites/integration.test';
import { useGraphStore } from '@/core/graph/graphStore';
import { NodeType } from '@/core/types';

const ALL_SUITES = [graphSuite, simulationSuite, codegenSuite, integrationSuite];

export default function TestRunnerModal({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<RunnerState>({
    suites: ALL_SUITES,
    results: {},
    isRunning: false,
    totalPassed: 0,
    totalFailed: 0,
  });

  const handleRunAll = useCallback(async () => {
    setState(s => ({ ...s, isRunning: true, results: {}, totalPassed: 0, totalFailed: 0 }));

    for (const suite of ALL_SUITES) {
      await runSuite(suite, (testName, result) => {
        setState(prev => {
           const suiteResults = prev.results[suite.name] || [];
           // Update or append result
           const idx = suiteResults.findIndex(r => r.name === testName);
           const newResults = [...suiteResults];
           if (idx >= 0) newResults[idx] = result;
           else newResults.push(result);
           
           const newResultsMap = { ...prev.results, [suite.name]: newResults };
           
           // Recalculate totals
           let passed = 0;
           let failed = 0;
           Object.values(newResultsMap).flat().forEach(r => {
               if (r.status === 'passed') passed++;
               if (r.status === 'failed') failed++;
           });

           return { ...prev, results: newResultsMap, totalPassed: passed, totalFailed: failed };
        });
      });
    }

    setState(s => ({ ...s, isRunning: false }));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🐞 System Diagnostics
          </h2>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-4 text-sm font-mono">
                 <span className="text-green-400">Passed: {state.totalPassed}</span>
                 <span className="text-red-400">Failed: {state.totalFailed}</span>
             </div>
             <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           {state.suites.map(suite => {
               const results = state.results[suite.name] || [];
               return (
                   <div key={suite.name} className="bg-slate-800/50 rounded-lg p-4">
                       <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">{suite.name}</h3>
                       <div className="space-y-1">
                           {suite.tests.map(test => {
                               const res = results.find(r => r.name === test.name);
                               const status = res?.status || 'pending';
                               return (
                                   <div key={test.name} className="flex items-start justify-between text-sm py-1 border-b border-slate-700/50 last:border-0">
                                       <div className="flex items-center gap-2">
                                           <StatusIcon status={status} />
                                           <span className={status === 'failed' ? 'text-red-300' : 'text-slate-300'}>{test.name}</span>
                                       </div>
                                       {res?.duration !== undefined && (
                                           <span className="text-slate-500 font-mono text-xs">{(res.duration).toFixed(1)}ms</span>
                                       )}
                                   </div>
                               );
                           })}
                           {/* Error Details */}
                           {results.filter(r => r.status === 'failed').map(r => (
                               <div key={r.name + '-err'} className="mt-2 bg-red-900/20 border border-red-900/50 rounded p-2 text-xs font-mono text-red-300 whitespace-pre-wrap">
                                   {r.error}
                               </div>
                           ))}
                       </div>
                   </div>
               );
           })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-between">
            <button
                onClick={() => {
                  // Generate a test flow: Client → API Gateway → REST API → Database
                  const addNode = useGraphStore.getState().addNode;
                  const addEdge = useGraphStore.getState().addEdge;
                  const clearGraph = useGraphStore.getState().clearGraph;
                  
                  // Clear existing graph
                  clearGraph();
                  
                  // Add nodes at specific positions
                  const clientId = addNode('CLIENT' as NodeType, { x: 100, y: 200 });
                  const gatewayId = addNode('API_GATEWAY' as NodeType, { x: 300, y: 200 });
                  const restApiId = addNode('REST_API' as NodeType, { x: 500, y: 150 });
                  const authId = addNode('AUTH_SERVICE' as NodeType, { x: 500, y: 280 });
                  const dbId = addNode('SQL_DATABASE' as NodeType, { x: 700, y: 200 });
                  
                  // Connect them
                  addEdge(clientId, gatewayId);
                  addEdge(gatewayId, restApiId);
                  addEdge(gatewayId, authId);
                  addEdge(restApiId, dbId);
                  addEdge(authId, dbId);
                  
                  onClose();
                }}
                className="px-4 py-2 rounded-lg font-medium bg-purple-600 hover:bg-purple-500 text-white transition-all"
            >
                🧪 Generate Test Flow
            </button>
            <button
                onClick={handleRunAll}
                disabled={state.isRunning}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                    state.isRunning 
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                }`}
            >
                {state.isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case 'running': return <span className="text-blue-400 animate-spin">↻</span>;
        case 'passed': return <span className="text-green-500">✓</span>;
        case 'failed': return <span className="text-red-500">✗</span>;
        default: return <span className="text-slate-600">○</span>;
    }
}
