<script lang="ts">
  import { onMount } from "svelte";
  import { trpc } from "$lib/trpc.js";
  import { Image, FolderKanban, Sparkles, Search } from "lucide-svelte";
  import Header from "../components/Header.svelte";

  let stats = $state({ mediaCount: 0, projectCount: 0, analyzedCount: 0 });
  let recentMedia = $state<any[]>([]);
  let loading = $state(true);

  onMount(async () => {
    try {
      const [mediaResult, projects] = await Promise.all([
        trpc.media.list.query({ limit: 6 }),
        trpc.projects.list.query(),
      ]);
      recentMedia = mediaResult.items;
      stats.mediaCount = mediaResult.items.length;
      stats.projectCount = projects.length;
      stats.analyzedCount = mediaResult.items.filter(
        (m: any) => m.status === "analyzed"
      ).length;
    } catch {
      // not authenticated yet
    } finally {
      loading = false;
    }
  });

  const cards = [
    { label: "Total Media", icon: Image, key: "mediaCount" as const, color: "bg-blue-500" },
    { label: "Projects", icon: FolderKanban, key: "projectCount" as const, color: "bg-purple-500" },
    { label: "Analyzed", icon: Sparkles, key: "analyzedCount" as const, color: "bg-green-500" },
  ];
</script>

<Header title="Dashboard" />

<div class="p-6">
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
    </div>
  {:else}
    <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {#each cards as card}
        <div class="rounded-xl border border-gray-200 bg-white p-5">
          <div class="flex items-center gap-3">
            <div class="{card.color} flex h-10 w-10 items-center justify-center rounded-lg text-white">
              <svelte:component this={card.icon} class="h-5 w-5" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{stats[card.key]}</p>
              <p class="text-sm text-gray-500">{card.label}</p>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <div>
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Recent Media</h2>
        <a href="/media" class="text-sm font-medium text-primary-600 hover:text-primary-500">
          View all
        </a>
      </div>

      {#if recentMedia.length === 0}
        <div class="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <Image class="mx-auto h-10 w-10 text-gray-400" />
          <p class="mt-2 text-sm text-gray-500">No media uploaded yet</p>
          <a
            href="/media"
            class="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Upload your first file
          </a>
        </div>
      {:else}
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {#each recentMedia as item (item.id)}
            <a
              href="/media/{item.id}"
              class="rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-md"
            >
              <h3 class="truncate text-sm font-medium text-gray-900">{item.title}</h3>
              <p class="mt-1 text-xs text-gray-500">{item.filename}</p>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
