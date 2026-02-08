'use client';

import { useState, useCallback, useEffect } from 'react';
import { RunnerState, TestResult, TestSuite } from '@/core/tests/types';
import { runSuite } from '@/core/tests/runner';
import { graphSuite } from '@/core/tests/suites/graph.test';
import { codegenSuite } from '@/core/tests/suites/codegen.test';
import { useGraphStore } from '@/core/graph/graphStore';
import { NodeType } from '@/core/types';

const ALL_SUITES = [graphSuite, codegenSuite];

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
                  const state = useGraphStore.getState();
                  const { addNode, addEdge, clearGraph, updateNodeLabel, updateNodeConfig } = state;
                  
                  clearGraph();
                  
                  // 1. Context
                  const contextId = addNode('CONTEXT', { x: 100, y: 300 });
                  updateNodeLabel(contextId, 'System Context');
                  updateNodeConfig(contextId, { context: 'Auth System' });

                  // 2. Connector (was Gateway)
                  const gatewayId = addNode('REST_API', { x: 350, y: 300 });
                  updateNodeLabel(gatewayId, 'Auth API');
                  updateNodeConfig(gatewayId, { path: '/auth', method: 'POST' });

                  // 3. Auth Logic
                  const authCode = `
// ... (Auth Logic) ...
// Transformed to Function Node
`;
                  const authId = addNode('FUNCTION', { x: 600, y: 200 });
                  updateNodeLabel(authId, 'Auth Logic');
                  updateNodeConfig(authId, { code: authCode, language: 'typescript' });

                  // 4. Database
                  const dbId = addNode('SQL_DATABASE', { x: 850, y: 300 });
                  updateNodeLabel(dbId, 'Users DB');
                  
                  // Connect them
                  addEdge(contextId, gatewayId);
                  addEdge(gatewayId, authId);
                  addEdge(authId, dbId);
                  
                  onClose();
                }}
                className="px-3 py-2 rounded-lg font-medium bg-purple-600 hover:bg-purple-500 text-white transition-all flex items-center gap-2 text-xs"
            >
                ⚡ Auth Flow
            </button>
            <button
                onClick={() => {
                  const state = useGraphStore.getState();
                  const { addNode, addEdge, clearGraph, updateNodeLabel, updateNodeConfig } = state;
                  
                  clearGraph();
                  
                  // === BOOK REVIEW BACKEND ===
                  
                  // 1. Context Node
                  const contextId = addNode('CONTEXT', { x: 50, y: 250 });
                  updateNodeLabel(contextId, 'App Context');
                  updateNodeConfig(contextId, { context: 'Book Review Application - A simple backend for managing books and reviews. Use SQLite for storage.' });

                  // 2. SQL Database for books & reviews
                  const dbId = addNode('SQL_DATABASE', { x: 700, y: 250 });
                  updateNodeLabel(dbId, 'Books DB');
                  updateNodeConfig(dbId, { dbType: 'sqlite', schema: 'books(title, author), reviews(book_id, rating, comment)' });

                  // 3. GET /books - List all books
                  const getBooksId = addNode('REST_API', { x: 300, y: 100 });
                  updateNodeLabel(getBooksId, 'Get Books');
                  updateNodeConfig(getBooksId, { 
                    path: '/api/books', 
                    method: 'GET',
                    customCode: `
    // Query Books DB
    const books = await new Promise((resolve, reject) => {
      books_db.all("SELECT * FROM books", (err, rows) => err ? reject(err) : resolve(rows));
    });
    res.json({ success: true, count: books.length, books });
`
                  });

                  // 4. POST /books - Add a book
                  const addBookId = addNode('REST_API', { x: 300, y: 250 });
                  updateNodeLabel(addBookId, 'Add Book');
                  updateNodeConfig(addBookId, { 
                    path: '/api/books', 
                    method: 'POST',
                    jobSpec: 'Add a new book. Body: { "title": "String", "author": "String" }',
                    sampleInput: { title: "The Lightning Thief", author: "Rick Riordan" },
                    customCode: `
    const { title, author } = req.body || {};
    if (!title) throw new Error('Title is required');
    
    await new Promise((resolve, reject) => {
      books_db.run("INSERT INTO books (title, author) VALUES (?, ?)", [title, author || 'Unknown'], function(err) {
        err ? reject(err) : resolve(this.lastID);
      });
    });
    res.json({ success: true, message: "Book added", title });
`
                  });

                  // 5. POST /reviews - Add a review
                  const addReviewId = addNode('REST_API', { x: 300, y: 400 });
                  updateNodeLabel(addReviewId, 'Add Review');
                  updateNodeConfig(addReviewId, { 
                    path: '/api/reviews', 
                    method: 'POST',
                    jobSpec: 'Add a review. Body: { "book_id": Number, "rating": Number, "comment": "String" }',
                    sampleInput: { book_id: 1, rating: 5, comment: "Great read!" },
                    customCode: `
    const { book_id, rating, comment } = req.body || {};
    if (!book_id || !rating) throw new Error('book_id and rating are required');

    await new Promise((resolve, reject) => {
      books_db.run("INSERT INTO reviews (book_id, rating, comment) VALUES (?, ?, ?)", [book_id, rating, comment || ''], function(err) {
        err ? reject(err) : resolve(this.lastID);
      });
    });
    res.json({ success: true, message: "Review added" });
`
                  });

                  // Connect APIs to Database
                  addEdge(getBooksId, dbId);
                  addEdge(addBookId, dbId);
                  addEdge(addReviewId, dbId);
                  
                  onClose();
                }}
                className="px-3 py-2 rounded-lg font-medium bg-green-600 hover:bg-green-500 text-white transition-all flex items-center gap-2 text-xs"
            >
                📚 Book Review
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
