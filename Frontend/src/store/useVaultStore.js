import { create } from 'zustand';

const useVaultStore = create((set) => ({
  selectedFile: null,
  setSelectedFile: (file) => set({ selectedFile: file }),
}));

export default useVaultStore;
