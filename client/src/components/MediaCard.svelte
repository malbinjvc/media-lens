<script lang="ts">
  import { FileText, Image, FileIcon, Tag, CheckCircle, Clock, AlertCircle } from "lucide-svelte";

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
    media: MediaItem;
  }

  let { media }: Props = $props();

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "analyzed": return "text-green-600";
      case "failed": return "text-red-600";
      default: return "text-yellow-600";
    }
  }
</script>

<a
  href="/media/{media.id}"
  class="group block rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-md"
>
  <div class="mb-3 flex h-32 items-center justify-center rounded-lg bg-gray-50">
    {#if media.mimeType.startsWith("image/") && media.downloadUrl}
      <img
        src={media.downloadUrl}
        alt={media.title}
        class="h-full w-full rounded-lg object-cover"
      />
    {:else if media.mimeType === "application/pdf"}
      <FileText class="h-12 w-12 text-red-400" />
    {:else if media.mimeType.startsWith("image/")}
      <Image class="h-12 w-12 text-blue-400" />
    {:else}
      <FileIcon class="h-12 w-12 text-gray-400" />
    {/if}
  </div>

  <h3 class="truncate text-sm font-medium text-gray-900 group-hover:text-primary-600">
    {media.title}
  </h3>

  <div class="mt-1 flex items-center gap-2 text-xs text-gray-500">
    <span>{formatSize(media.size)}</span>
    <span class={getStatusColor(media.status)}>
      {#if media.status === "analyzed"}
        <CheckCircle class="inline h-3 w-3" />
      {:else if media.status === "failed"}
        <AlertCircle class="inline h-3 w-3" />
      {:else}
        <Clock class="inline h-3 w-3" />
      {/if}
      {media.status}
    </span>
  </div>

  {#if media.tags && media.tags.length > 0}
    <div class="mt-2 flex flex-wrap gap-1">
      {#each media.tags.slice(0, 3) as tag}
        <span class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
          <Tag class="h-2.5 w-2.5" />
          {tag}
        </span>
      {/each}
      {#if media.tags.length > 3}
        <span class="text-xs text-gray-400">+{media.tags.length - 3}</span>
      {/if}
    </div>
  {/if}
</a>
