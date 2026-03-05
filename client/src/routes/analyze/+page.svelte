<script lang="ts">
  import { onMount } from "svelte";
  import { trpc } from "$lib/trpc.js";
  import { toast } from "$lib/stores/toast.js";
  import { Sparkles, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-svelte";
  import Header from "../../components/Header.svelte";

  let items = $state<any[]>([]);
  let loading = $state(true);
  let processing = $state<Set<string>>(new Set());

  async function loadMedia() {
    loading = true;
    try {
      const result = await trpc.media.list.query({ limit: 50 });
      items = result.items;
    } catch {
      // ignore
    } finally {
      loading = false;
    }
  }

  async function analyzeItem(id: string) {
    processing = new Set([...processing, id]);
    try {
      await trpc.ai.analyze.mutate({ mediaId: id });
      toast.success("Analysis complete");
      loadMedia();
    } catch {
      toast.error("Analysis failed");
    } finally {
      processing = new Set([...processing].filter((p) => p !== id));
    }
  }

  async function analyzeAll() {
    const pending = items.filter((i) => i.status === "pending");
    for (const item of pending) {
      await analyzeItem(item.id);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "analyzed": return CheckCircle;
      case "failed": return AlertCircle;
      default: return Clock;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "analyzed": return "text-green-600";
      case "failed": return "text-red-600";
      default: return "text-yellow-600";
    }
  }

  onMount(loadMedia);
</script>

<Header title="AI Analysis" />

<div class="p-6">
  <div class="mb-6 flex items-center justify-between">
    <p class="text-sm text-gray-600">
      Analyze your media files with Google Gemini AI
    </p>
    {#if items.some((i) => i.status === "pending")}
      <button
        onclick={analyzeAll}
        class="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
      >
        <Sparkles class="h-4 w-4" />
        Analyze All Pending
      </button>
    {/if}
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
    </div>
  {:else if items.length === 0}
    <div class="py-12 text-center text-gray-500">
      <p>No media to analyze. Upload files first.</p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each items as item (item.id)}
        <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div class="flex items-center gap-3">
            <span class={getStatusColor(item.status)}>
              <svelte:component this={getStatusIcon(item.status)} class="h-5 w-5" />
            </span>
            <div>
              <p class="text-sm font-medium text-gray-900">{item.title}</p>
              <p class="text-xs text-gray-500">{item.filename}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400">{item.status}</span>
            {#if item.status !== "analyzed"}
              <button
                onclick={() => analyzeItem(item.id)}
                disabled={processing.has(item.id)}
                class="flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 disabled:opacity-50"
              >
                {#if processing.has(item.id)}
                  <Loader2 class="h-3 w-3 animate-spin" />
                {:else}
                  <Sparkles class="h-3 w-3" />
                {/if}
                Analyze
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
