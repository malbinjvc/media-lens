<script lang="ts">
  import { onMount } from "svelte";
  import { trpc } from "$lib/trpc.js";
  import Header from "../../components/Header.svelte";
  import MediaUploader from "../../components/MediaUploader.svelte";
  import MediaGrid from "../../components/MediaGrid.svelte";

  let items = $state<any[]>([]);
  let loading = $state(true);

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

  onMount(loadMedia);
</script>

<Header title="Media Library" />

<div class="space-y-6 p-6">
  <MediaUploader onUploaded={loadMedia} />
  <MediaGrid {items} {loading} />
</div>
