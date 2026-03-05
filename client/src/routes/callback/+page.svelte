<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { trpc } from "$lib/trpc.js";
  import { auth } from "$lib/stores/auth.js";

  let error = $state("");

  onMount(async () => {
    const code = $page.url.searchParams.get("code");
    const urlState = $page.url.searchParams.get("state");
    const provider = sessionStorage.getItem("oauth_provider") as
      | "google"
      | "github"
      | null;
    const savedState = sessionStorage.getItem("oauth_state");

    if (!code || !provider || !urlState) {
      error = "Missing OAuth parameters";
      return;
    }

    // Validate state matches (CSRF protection)
    if (!savedState || urlState !== savedState) {
      error = "Invalid OAuth state. Please try logging in again.";
      return;
    }

    try {
      const result = await trpc.auth.callback.mutate({
        provider,
        code,
        state: urlState,
      });
      auth.setUser(result.user);
      sessionStorage.removeItem("oauth_provider");
      sessionStorage.removeItem("oauth_state");
      goto("/");
    } catch (err) {
      error = err instanceof Error ? err.message : "Authentication failed";
    }
  });
</script>

<div class="flex min-h-screen items-center justify-center">
  {#if error}
    <div class="text-center">
      <p class="text-red-600">{error}</p>
      <a href="/login" class="mt-4 inline-block text-primary-600 hover:underline">
        Back to login
      </a>
    </div>
  {:else}
    <div class="flex items-center gap-3">
      <div class="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
      <span class="text-gray-600">Authenticating...</span>
    </div>
  {/if}
</div>
