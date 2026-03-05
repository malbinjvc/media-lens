import { writable } from "svelte/store";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

let nextId = 0;

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  function add(message: string, type: "success" | "error") {
    const id = nextId++;
    update((toasts) => [...toasts, { id, message, type }]);
    setTimeout(() => {
      update((toasts) => toasts.filter((t) => t.id !== id));
    }, 3000);
  }

  return {
    subscribe,
    success: (message: string) => add(message, "success"),
    error: (message: string) => add(message, "error"),
  };
}

export const toast = createToastStore();
