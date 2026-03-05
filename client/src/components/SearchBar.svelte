<script lang="ts">
  import { Search } from "lucide-svelte";

  interface Props {
    value: string;
    placeholder?: string;
    onSearch: (query: string) => void;
  }

  let { value = $bindable(), placeholder = "Search media...", onSearch }: Props = $props();
</script>

<div class="relative">
  <Search class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
  <input
    type="text"
    bind:value
    {placeholder}
    class="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
    onkeydown={(e) => e.key === "Enter" && onSearch(value)}
  />
</div>
