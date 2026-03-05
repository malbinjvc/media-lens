<script lang="ts">
  import { toast } from "$lib/stores/toast.js";
  import { CheckCircle, AlertCircle, X } from "lucide-svelte";
</script>

{#if $toast.length > 0}
  <div class="fixed right-4 top-4 z-50 space-y-2">
    {#each $toast as t (t.id)}
      <div
        class="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg
          {t.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}"
      >
        {#if t.type === "success"}
          <CheckCircle class="h-4 w-4 text-green-500" />
        {:else}
          <AlertCircle class="h-4 w-4 text-red-500" />
        {/if}
        {t.message}
      </div>
    {/each}
  </div>
{/if}
