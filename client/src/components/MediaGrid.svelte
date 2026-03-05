<script lang="ts">
  import MediaCard from "./MediaCard.svelte";

  interface MediaItem {
    id: string;
    title: string;
    filename: string;
    mimeType: string;
    size: number;
    status: string;
    tags: string[] | null;
    createdAt: string;
    downloadUrl?: string;
  }

  interface Props {
    items: MediaItem[];
    loading?: boolean;
  }

  let { items, loading = false }: Props = $props();
</script>

{#if loading}
  <div class="flex items-center justify-center py-12">
    <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
  </div>
{:else if items.length === 0}
  <div class="py-12 text-center text-gray-500">
    <p>No media found. Upload your first file to get started.</p>
  </div>
{:else}
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
    {#each items as item (item.id)}
      <MediaCard media={item} />
    {/each}
  </div>
{/if}
