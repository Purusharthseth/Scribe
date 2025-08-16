// src/store/useTreeStore.js
import { create } from 'zustand';

export const useTreeStore = create((set, get) => ({
  // --- UI state ---
  expandedIds: new Set(),
  selectedId: null,

  // --- UI actions ---
  toggleExpand: (id) =>
    set((state) => {
      const next = new Set(state.expandedIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { expandedIds: next };
    }),

  expandMany: (ids = []) =>
    set((state) => {
      const next = new Set(state.expandedIds);
      ids.forEach((id) => next.add(id));
      return { expandedIds: next };
    }),

  select: (idOrObj) => {
    // You were storing the whole node object in selectedNode earlier.
    // Here we store just the id (UI) and you can still keep selectedFile in your vault store.
    const id = typeof idOrObj === 'object' && idOrObj !== null ? idOrObj.id : idOrObj;
    set({ selectedId: id });
  },

  resetUI: () => set({ expandedIds: new Set(), selectedId: null }),

  // --- CRUD placeholders (injected from Tree) ---
  addNode: async () => false,
  addFolder: async () => false,
  editNode: async () => false,
  deleteNode: async () => {},

  // Inject real implementations from Tree
  init: ({ addNode, addFolder, editNode, deleteNode }) =>
    set({ addNode, addFolder, editNode, deleteNode }),
}));