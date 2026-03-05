<script lang="ts">
  import { trpc } from "$lib/trpc.js";
  import { Search, Clock, Tag } from "lucide-svelte";
  import Header from "../../components/Header.svelte";
  import SearchBar from "../../components/SearchBar.svelte";

  let query = $state("");
  let results = $state<any[]>([]);
  let totalHits = $state(0);
  let searchTime = $state(0);
  let searched = $state(false);
  let loading = $state(false);

  async function handleSearch(q: string) {
    if (!q.trim()) return;
    loading = true;
    searched = true;
    try {
      const res = await trpc.search.query.query({ q, limit: 50 });
      results = res.hits;
      totalHits = res.estimatedTotalHits ?? 0;
      searchTime = res.processingTimeMs ?? 0;
    } catch {
      results = [];
    } finally {
      loading = false;
    }
  }
</script>

<Header title="Search" />

<div class="p-6">
  <div class="mx-auto max-w-2xl">
    <SearchBar bind:value={query} onSearch={handleSearch} placeholder="Search media by title, description, tags..." />

    {#if searched}
      <div class="mt-2 flex items-center gap-3 text-xs text-gray-500">
        <span>{totalHits} result{totalHits !== 1 ? "s" : ""}</span>
        <span class="flex items-center gap-1">
          <Clock class="h-3 w-3" />
          {searchTime}ms
        </span>
      </div>
    {/if}
  </div>

  {#if loading}
    <div class="mt-8 flex items-center justify-center">
      <div class="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
    </div>
  {:else if searched && results.length === 0}
    <div class="mt-8 text-center text-gray-500">
      <Search class="mx-auto h-10 w-10 text-gray-300" />
      <p class="mt-2">No results found for "{query}"</p>
    </div>
  {:else if results.length > 0}
    <div class="mt-6 space-y-3">
      {#each results as hit (hit.id)}
        <a
          href="/media/{hit.id}"
          class="block rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-md"
        >
          <h3 class="font-medium text-gray-900">{hit.title}</h3>
          {#if hit.description}
            <p class="mt-1 text-sm text-gray-600 line-clamp-2">{hit.description}</p>
          {/if}
          {#if hit.tags && hit.tags.length > 0}
            <div class="mt-2 flex flex-wrap gap-1">
              {#each hit.tags as tag}
                <span class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
                  <Tag class="h-2.5 w-2.5" />
                  {tag}
                </span>
              {/each}
            </div>
          {/if}
        </a>
      {/each}
    </div>
  {/if}
</div>
