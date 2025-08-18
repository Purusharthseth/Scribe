import { create } from 'zustand';

const useVaultStore = create((set) => ({
  selectedFile: null,
  isOwner: false,
  shareMode: 'private',
  shareToken: null,
  setSelectedFile: (file) => set({ selectedFile: file }),
  setIsOwner: (isOwner) => set({ isOwner }),
  setShareMode: (shareMode) => set({ shareMode }),
  setShareToken: (shareToken) => set({ shareToken }),
  reset: () => set({
    selectedFile: null,
    isOwner: false,
    shareMode: 'private',
    shareToken: null,
  }),

  clearSelections: () => set({ selectedFile: null }),
}));

export default useVaultStore;
