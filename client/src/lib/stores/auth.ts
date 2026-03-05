import { writable } from "svelte/store";
import { trpc } from "../trpc.js";

interface User {
  id: string;
  email: string;
  name: string;
}

function createAuthStore() {
  const { subscribe, set } = writable<User | null>(null);

  return {
    subscribe,
    async init() {
      const token = localStorage.getItem("session_token");
      if (!token) return;
      try {
        const user = await trpc.auth.me.query();
        set(user);
      } catch {
        localStorage.removeItem("session_token");
        set(null);
      }
    },
    setUser(user: User, token: string) {
      localStorage.setItem("session_token", token);
      set(user);
    },
    async logout() {
      try {
        await trpc.auth.logout.mutate();
      } catch {
        // ignore
      }
      localStorage.removeItem("session_token");
      set(null);
    },
  };
}

export const auth = createAuthStore();
