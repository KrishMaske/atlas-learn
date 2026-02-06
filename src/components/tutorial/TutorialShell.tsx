'use client';

import { useState } from 'react';
import { TutorialLevel } from '@/core/types';
import { EvaluationResult, formatObjective } from '@/core/tutorial/evaluator';

// -----------------------------------------------------------------------------
// Tutorial Shell
// -----------------------------------------------------------------------------

interface TutorialShellProps {
  level: TutorialLevel;
  evaluation: EvaluationResult | null;
  onComplete: () => void;
  onExit: () => void;
}

export default function TutorialShell({
  level,
  evaluation,
  onComplete,
  onExit,
}: TutorialShellProps) {
  const [showHints, setShowHints] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const passed = evaluation?.passed ?? false;

  return (
    <>
      {/* Top Bar: Level Info */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-700">
          <span className="text-xs text-slate-400 uppercase tracking-wider">Level</span>
          <h1 className="text-lg font-bold text-white">{level.title}</h1>
        </div>
      </div>

      {/* Left Panel: Objectives */}
      <div className="absolute top-20 left-4 w-72 z-40">
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700 p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Objectives
          </h2>
          <ul className="space-y-2">
            {level.objectives.map((obj, i) => {
              const result = evaluation?.objectiveResults[i];
              const isPassed = result?.passed ?? false;
              return (
                <li
                  key={i}
                  className={`flex items-center gap-2 text-sm ${
                    isPassed ? 'text-green-400' : 'text-slate-300'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    isPassed ? 'bg-green-500/20' : 'bg-slate-600/50'
                  }`}>
                    {isPassed ? '✓' : '○'}
                  </span>
                  {formatObjective(obj)}
                  {result && (
                    <span className="text-xs text-slate-500 ml-auto">
                      ({result.currentValue.toFixed(1)})
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Scenario */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Scenario
            </h3>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{level.scenario}</p>
          </div>

          {/* Hints */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <button
              onClick={() => setShowHints(!showHints)}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showHints ? 'Hide Hints' : `Show Hints (${level.hints.length})`}
            </button>
            {showHints && (
              <div className="mt-2 space-y-2">
                {level.hints.slice(0, hintIndex + 1).map((hint, i) => (
                  <div key={i} className="text-sm text-slate-400 bg-slate-700/50 rounded p-2">
                    💡 {hint}
                  </div>
                ))}
                {hintIndex < level.hints.length - 1 && (
                  <button
                    onClick={() => setHintIndex(hintIndex + 1)}
                    className="text-xs text-slate-500 hover:text-slate-400"
                  >
                    Show next hint
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Exit Button */}
        <button
          onClick={onExit}
          className="mt-4 w-full py-2 bg-slate-700/50 text-slate-400 rounded-lg hover:bg-slate-700 transition-colors text-sm"
        >
          ← Exit Tutorial
        </button>
      </div>

      {/* Success Modal */}
      {passed && !showExplanation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl border border-green-500/50 p-8 max-w-md text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-2">Level Complete!</h2>
            <p className="text-slate-400 mb-6">You've passed all objectives.</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowExplanation(true)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                What did I learn?
              </button>
              <button
                onClick={onComplete}
                className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explanation Modal */}
      {showExplanation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">What You Learned</h2>
            <div className="prose prose-invert prose-sm">
              <pre className="whitespace-pre-wrap text-slate-300 font-sans text-sm leading-relaxed">
                {level.explanation}
              </pre>
            </div>
            <button
              onClick={onComplete}
              className="mt-6 w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
