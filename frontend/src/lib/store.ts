import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  // Note: Actual cart data is owned by Apollo Cache (server state)
  // We only use Zustand for UI state and optimistic local state if needed
}

export const useCartStore = create<CartState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}));

interface UIState {
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  isTickerDismissed: boolean;
  dismissTicker: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: false,
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      isTickerDismissed: false,
      dismissTicker: () => set({ isTickerDismissed: true }),
    }),
    {
      name: "reyvouge-ui-storage",
      partialize: (state) => ({ isTickerDismissed: state.isTickerDismissed }),
    }
  )
);
