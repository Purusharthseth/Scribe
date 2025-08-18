import { create } from 'zustand';

export const useTreeStore = create((set, get) => ({
  expandedIds: new Set(),
  selectedId: null,

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

  select: (t) => {
    const id = typeof t === 'object' && t !== null ? t.id : t;
    set({ selectedId: id });
  },

  resetUI: () => set({ expandedIds: new Set(), selectedId: null }),

  addNode: async () => false,
  addFolder: async () => false,
  editNode: async () => false,
  deleteNode: async () => {},

  init: ({ addNode, addFolder, editNode, deleteNode }) =>
    set({ addNode, addFolder, editNode, deleteNode }),
}));