<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { trpc } from "$lib/trpc.js";
  import { auth } from "$lib/stores/auth.js";

  let error = $state("");

  onMount(async () => {
    const code = $page.url.searchParams.get("code");
    const provider = sessionStorage.getItem("oauth_provider") as
      | "google"
      | "github"
      | null;
    const codeVerifier = sessionStorage.getItem("oauth_code_verifier") || undefined;

    if (!code || !provider) {
      error = "Missing OAuth parameters";
      return;
    }

    try {
      const result = await trpc.auth.callback.mutate({
        provider,
        code,
        codeVerifier,
      });
      auth.setUser(result.user, result.token);
      sessionStorage.removeItem("oauth_provider");
      sessionStorage.removeItem("oauth_code_verifier");
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
