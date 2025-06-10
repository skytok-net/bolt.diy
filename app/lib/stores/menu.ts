import { atom } from 'nanostores';

export const menuStore = atom<{ isOpen: boolean }>({
  isOpen: false,
});

export function toggleMenu() {
  const current = menuStore.get();
  menuStore.set({ isOpen: !current.isOpen });
}

export function openMenu() {
  menuStore.set({ isOpen: true });
}

export function closeMenu() {
  menuStore.set({ isOpen: false });
}
