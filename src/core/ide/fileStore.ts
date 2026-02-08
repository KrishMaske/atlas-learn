import { create } from 'zustand';
import { GraphState, NodeData, EdgeData } from '@/core/types';
import { useGraphStore } from '@/core/graph/graphStore';

// -----------------------------------------------------------------------------
// File Types
// -----------------------------------------------------------------------------

export interface FileData {
    id: string;
    name: string;
    type: 'architecture'; // expandable for other types later
    graph: GraphState;
    createdAt: number;
    updatedAt: number;
}

interface FileStore {
    files: FileData[];
    activeFileId: string | null;

    // Actions
    createFile: (name?: string) => string;
    deleteFile: (id: string) => void;
    selectFile: (id: string) => void;
    renameFile: (id: string, newName: string) => void;

    // Sync the active graph state back to the file store
    saveActiveFile: () => void;
}

// -----------------------------------------------------------------------------
// Helper: Initial Graph State
// -----------------------------------------------------------------------------

const INITIAL_GRAPH: GraphState = {
    nodes: [],
    edges: [],
    selectedNodeId: null,
    selectedEdgeId: null,
};

// -----------------------------------------------------------------------------
// File Store Implementation
// -----------------------------------------------------------------------------

export const useFileStore = create<FileStore>((set, get) => ({
    files: [],
    activeFileId: null,

    createFile: (name = 'Untitled Architecture') => {
        const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newFile: FileData = {
            id,
            name,
            type: 'architecture',
            graph: JSON.parse(JSON.stringify(INITIAL_GRAPH)), // Deep copy
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        set((state) => ({
            files: [...state.files, newFile],
            activeFileId: id,
        }));

        // Load into graph store immediately
        useGraphStore.getState().loadGraph(newFile.graph);

        return id;
    },

    deleteFile: (id) => {
        set((state) => {
            const newFiles = state.files.filter((f) => f.id !== id);
            // If we deleted the active file, switch to another or null
            let newActiveId = state.activeFileId;
            if (state.activeFileId === id) {
                newActiveId = newFiles.length > 0 ? newFiles[0].id : null;
                if (newActiveId) {
                    useGraphStore.getState().loadGraph(newFiles[0].graph);
                } else {
                    useGraphStore.getState().clearGraph();
                }
            }
            return { files: newFiles, activeFileId: newActiveId };
        });
    },

    selectFile: (id) => {
        const state = get();
        // 1. Save current work first
        if (state.activeFileId) {
            get().saveActiveFile();
        }

        // 2. Switch
        const file = state.files.find((f) => f.id === id);
        if (file) {
            set({ activeFileId: id });
            useGraphStore.getState().loadGraph(file.graph);
        }
    },

    renameFile: (id, newName) => {
        set((state) => ({
            files: state.files.map((f) => f.id === id ? { ...f, name: newName, updatedAt: Date.now() } : f)
        }));
    },

    saveActiveFile: () => {
        const { activeFileId, files } = get();
        if (!activeFileId) return;

        // Get current graph state
        const currentGraph = useGraphStore.getState();
        const graphSnapshot: GraphState = {
            nodes: currentGraph.nodes,
            edges: currentGraph.edges,
            selectedNodeId: null, // Don't persist selection
            selectedEdgeId: null,
        };

        set({
            files: files.map((f) =>
                f.id === activeFileId
                    ? { ...f, graph: graphSnapshot, updatedAt: Date.now() }
                    : f
            ),
        });
    },
}));
