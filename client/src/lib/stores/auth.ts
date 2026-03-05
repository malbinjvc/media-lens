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
      // Session is managed via httpOnly cookie (set by server).
      // Try to fetch user - cookie is sent automatically via credentials: "include".
      try {
        const user = await trpc.auth.me.query();
        set(user);
      } catch {
        set(null);
      }
    },
    setUser(user: User) {
      // Cookie is already set by server via Set-Cookie header.
      set(user);
    },
    async logout() {
      try {
        await trpc.auth.logout.mutate();
      } catch {
        // ignore
      }
      set(null);
    },
  };
}

export const auth = createAuthStore();
