'use client';

import { useState } from 'react';
import { useFileStore } from '@/core/ide/fileStore';
import { FileText, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

export default function FileExplorer() {
  const { files, activeFileId, createFile, deleteFile, selectFile, renameFile } = useFileStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = () => {
    const id = createFile();
    // Optional: auto-enter edit mode
    setEditingId(id);
    setEditName('Untitled Architecture');
  };

  const startRename = (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(currentName);
  };

  const confirmRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId && editName.trim()) {
      renameFile(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this file?')) {
      deleteFile(id);
    }
  };

  return (
    <div className="w-64 border-r border-border bg-card/30 backdrop-blur-sm flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">Islands</span>
        <button 
          onClick={handleCreate}
          className="p-1 hover:bg-white/10 rounded-md transition-colors"
          title="New File"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => selectFile(file.id)}
            className={`
              group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors text-sm
              ${activeFileId === file.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}
            `}
          >
            <FileText className="w-4 h-4 shrink-0" />
            
            {editingId === file.id ? (
              <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-primary"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmRename(e as any);
                    if (e.key === 'Escape') cancelRename(e as any);
                  }}
                />
                <button onClick={confirmRename} className="text-green-500 hover:text-green-400"><Check className="w-3 h-3" /></button>
                <button onClick={cancelRename} className="text-red-500 hover:text-red-400"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <span className="flex-1 truncate">{file.name}</span>
            )}

            {!editingId && (
              <div className="hidden group-hover:flex items-center gap-1">
                <button 
                  onClick={(e) => startRename(e, file.id, file.name)}
                  className="p-1 hover:text-blue-400"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button 
                  onClick={(e) => handleDelete(e, file.id)}
                  className="p-1 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
        
        {files.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No files yet.<br/>Click + to create one.
          </div>
        )}
      </div>
    </div>
  );
}
