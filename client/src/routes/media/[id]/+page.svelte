<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { trpc } from "$lib/trpc.js";
  import { toast } from "$lib/stores/toast.js";
  import { ArrowLeft, Trash2, Tag, FileText, Image } from "lucide-svelte";
  import Header from "../../../components/Header.svelte";
  import AnalysisPanel from "../../../components/AnalysisPanel.svelte";

  let item = $state<any>(null);
  let loading = $state(true);

  async function loadMedia() {
    loading = true;
    try {
      item = await trpc.media.get.query({ id: $page.params.id });
    } catch {
      toast.error("Media not found");
      goto("/media");
    } finally {
      loading = false;
    }
  }

  async function deleteMedia() {
    if (!confirm("Delete this media?")) return;
    try {
      await trpc.media.delete.mutate({ id: $page.params.id });
      toast.success("Media deleted");
      goto("/media");
    } catch {
      toast.error("Failed to delete");
    }
  }

  onMount(loadMedia);
</script>

<Header title="Media Detail" />

<div class="p-6">
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
    </div>
  {:else if item}
    <div class="mb-4 flex items-center justify-between">
      <a href="/media" class="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft class="h-4 w-4" />
        Back to Library
      </a>
      <button
        onclick={deleteMedia}
        class="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
      >
        <Trash2 class="h-4 w-4" />
        Delete
      </button>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <div class="rounded-xl border border-gray-200 bg-white p-5">
          {#if item.mimeType.startsWith("image/")}
            <img
              src={item.downloadUrl}
              alt={item.title}
              class="w-full rounded-lg"
            />
          {:else if item.mimeType === "application/pdf"}
            <div class="flex h-64 items-center justify-center rounded-lg bg-gray-50">
              <FileText class="h-16 w-16 text-red-400" />
            </div>
          {:else}
            <div class="flex h-64 items-center justify-center rounded-lg bg-gray-50">
              <Image class="h-16 w-16 text-gray-400" />
            </div>
          {/if}

          <h2 class="mt-4 text-lg font-semibold text-gray-900">{item.title}</h2>
          <p class="text-sm text-gray-500">{item.filename}</p>

          {#if item.description}
            <p class="mt-2 text-sm text-gray-700">{item.description}</p>
          {/if}

          {#if item.tags && item.tags.length > 0}
            <div class="mt-3 flex flex-wrap gap-1">
              {#each item.tags as tag}
                <span class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs text-primary-700">
                  <Tag class="h-3 w-3" />
                  {tag}
                </span>
              {/each}
            </div>
          {/if}

          {#if item.aiAnalysis}
            <div class="mt-4 rounded-lg bg-gray-50 p-3">
              <h4 class="mb-1 text-xs font-medium text-gray-500">AI Analysis</h4>
              <p class="text-sm text-gray-700 whitespace-pre-wrap">{item.aiAnalysis}</p>
            </div>
          {/if}
        </div>
      </div>

      <div>
        <AnalysisPanel mediaId={$page.params.id} onUpdated={loadMedia} />
      </div>
    </div>
  {/if}
</div>
