<script lang="ts">
  import "../app.css";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth.js";
  import { goto } from "$app/navigation";
  import Toaster from "../components/Toaster.svelte";
  import Sidebar from "../components/Sidebar.svelte";

  let { children } = $props();

  const publicPaths = ["/login", "/callback"];

  onMount(async () => {
    await auth.init();
    auth.subscribe((user) => {
      const isPublic = publicPaths.some((p) => $page.url.pathname.startsWith(p));
      if (!user && !isPublic) {
        goto("/login");
      }
    });
  });
</script>

<Toaster />

{#if publicPaths.some((p) => $page.url.pathname.startsWith(p))}
  {@render children()}
{:else}
  <div class="flex h-screen">
    <Sidebar />
    <main class="flex-1 overflow-auto">
      {@render children()}
    </main>
  </div>
{/if}
