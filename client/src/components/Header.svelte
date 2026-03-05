<script lang="ts">
  import { auth } from "$lib/stores/auth.js";
  import { User } from "lucide-svelte";

  interface Props {
    title: string;
  }

  let { title }: Props = $props();
</script>

<header
  class="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6"
>
  <h1 class="text-xl font-semibold text-gray-900">{title}</h1>

  {#if $auth}
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <User class="h-4 w-4" />
        <span>{$auth.name}</span>
      </div>
    </div>
  {/if}
</header>
