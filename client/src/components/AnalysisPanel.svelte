<script lang="ts">
  import { Sparkles, Tag, MessageSquare, FileText, Loader2 } from "lucide-svelte";
  import { trpc } from "$lib/trpc.js";
  import { toast } from "$lib/stores/toast.js";

  interface Props {
    mediaId: string;
    onUpdated?: () => void;
  }

  let { mediaId, onUpdated }: Props = $props();

  let analyzing = $state(false);
  let summarizing = $state(false);
  let tagging = $state(false);
  let asking = $state(false);
  let question = $state("");
  let answer = $state("");
  let summary = $state("");

  async function analyze() {
    analyzing = true;
    try {
      await trpc.ai.analyze.mutate({ mediaId });
      toast.success("Analysis complete");
      onUpdated?.();
    } catch (err) {
      toast.error("Analysis failed");
    } finally {
      analyzing = false;
    }
  }

  async function summarize() {
    summarizing = true;
    try {
      const result = await trpc.ai.summarize.mutate({ mediaId });
      summary = result.summary;
      toast.success("Summary generated");
    } catch (err) {
      toast.error("Summarization failed");
    } finally {
      summarizing = false;
    }
  }

  async function tag() {
    tagging = true;
    try {
      await trpc.ai.tag.mutate({ mediaId });
      toast.success("Tags generated");
      onUpdated?.();
    } catch (err) {
      toast.error("Tagging failed");
    } finally {
      tagging = false;
    }
  }

  async function ask() {
    if (!question.trim()) return;
    asking = true;
    try {
      const result = await trpc.ai.ask.mutate({ mediaId, question });
      answer = result.answer;
    } catch (err) {
      toast.error("Q&A failed");
    } finally {
      asking = false;
    }
  }
</script>

<div class="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
  <h3 class="flex items-center gap-2 font-semibold text-gray-900">
    <Sparkles class="h-5 w-5 text-primary-600" />
    AI Analysis
  </h3>

  <div class="grid grid-cols-3 gap-2">
    <button
      onclick={analyze}
      disabled={analyzing}
      class="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
    >
      {#if analyzing}
        <Loader2 class="h-4 w-4 animate-spin" />
      {:else}
        <Sparkles class="h-4 w-4" />
      {/if}
      Analyze
    </button>
    <button
      onclick={summarize}
      disabled={summarizing}
      class="flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
    >
      {#if summarizing}
        <Loader2 class="h-4 w-4 animate-spin" />
      {:else}
        <FileText class="h-4 w-4" />
      {/if}
      Summarize
    </button>
    <button
      onclick={tag}
      disabled={tagging}
      class="flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
    >
      {#if tagging}
        <Loader2 class="h-4 w-4 animate-spin" />
      {:else}
        <Tag class="h-4 w-4" />
      {/if}
      Auto-Tag
    </button>
  </div>

  {#if summary}
    <div class="rounded-lg bg-gray-50 p-3">
      <h4 class="mb-1 text-xs font-medium text-gray-500">Summary</h4>
      <p class="text-sm text-gray-700 whitespace-pre-wrap">{summary}</p>
    </div>
  {/if}

  <div class="space-y-2">
    <h4 class="flex items-center gap-1 text-sm font-medium text-gray-700">
      <MessageSquare class="h-4 w-4" />
      Ask a Question
    </h4>
    <div class="flex gap-2">
      <input
        type="text"
        bind:value={question}
        placeholder="Ask about this media..."
        class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        onkeydown={(e) => e.key === "Enter" && ask()}
      />
      <button
        onclick={ask}
        disabled={asking || !question.trim()}
        class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
      >
        {#if asking}
          <Loader2 class="h-4 w-4 animate-spin" />
        {:else}
          Ask
        {/if}
      </button>
    </div>
    {#if answer}
      <div class="rounded-lg bg-blue-50 p-3">
        <p class="text-sm text-gray-700 whitespace-pre-wrap">{answer}</p>
      </div>
    {/if}
  </div>
</div>
