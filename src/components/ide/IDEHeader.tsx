'use client';

import { useFileStore } from '@/core/ide/fileStore';
import { Play, Pause, RotateCcw, Monitor, Code, Share, Bug, Sparkles, Loader2 } from 'lucide-react';

interface IDEHeaderProps {
  viewMode: 'visual' | 'code';
  setViewMode: (mode: 'visual' | 'code') => void;
  onExport: () => void;
  onTest: () => void;
  onGenerateBackend?: () => void;
  isGenerating?: boolean;
  onStartServer?: () => void;
  onStopServer?: () => void;
  isServerRunning?: boolean;
  isStartingServer?: boolean;
}

export default function IDEHeader({
  viewMode,
  setViewMode,
  onExport,
  onTest,
  onGenerateBackend,
  isGenerating = false,
  onStartServer,
  onStopServer,
  isServerRunning = false,
  isStartingServer = false,
}: IDEHeaderProps) {
  const { activeFileId, files } = useFileStore();
  const activeFile = files.find(f => f.id === activeFileId);

  return (
    <div className="h-14 border-b border-border bg-card/30 backdrop-blur-sm flex items-center justify-between px-4 z-40">
      {/* Left: Active File Info */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-foreground">
          {activeFile ? activeFile.name : 'No File Selected'}
        </span>
        
        <div className="h-4 w-px bg-border" />

        {/* View Toggle */}
        <div className="flex bg-muted rounded-lg border border-border overflow-hidden p-0.5">
          <button
            onClick={() => setViewMode('visual')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'visual'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Visual
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'code'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Code
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Generate Backend Button */}
        {onGenerateBackend && (
          <button
            onClick={onGenerateBackend}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-md shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Generate complete backend code from graph"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Backend'}
          </button>
        )}

        {/* Run/Stop Controls */}
        {onStartServer && onStopServer && (
          isServerRunning ? (
            <button
              onClick={onStopServer}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-md shadow-sm transition-all"
              title="Stop Server"
            >
              <div className="w-2.5 h-2.5 bg-white rounded-[1px]" />
              Stop
            </button>
          ) : (
            <button
              onClick={onStartServer}
              disabled={isStartingServer}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-500 rounded-md shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Start Server"
            >
              {isStartingServer ? (
                 <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              Run
            </button>
          )
        )}

        <button
          onClick={onExport}
          className="p-2 text-muted-foreground hover:text-primary transition-colors"
          title="Export Code"
        >
          <Share className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

