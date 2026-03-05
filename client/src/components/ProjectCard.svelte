<script lang="ts">
  import { FolderKanban } from "lucide-svelte";

  interface Project {
    id: string;
    name: string;
    description: string | null;
    color: string;
    createdAt: string;
  }

  interface Props {
    project: Project;
  }

  let { project }: Props = $props();
</script>

<a
  href="/projects/{project.id}"
  class="group block rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-primary-300 hover:shadow-md"
>
  <div class="flex items-start gap-3">
    <div
      class="flex h-10 w-10 items-center justify-center rounded-lg"
      style="background-color: {project.color}20"
    >
      <FolderKanban class="h-5 w-5" style="color: {project.color}" />
    </div>
    <div class="flex-1 overflow-hidden">
      <h3 class="truncate text-sm font-medium text-gray-900 group-hover:text-primary-600">
        {project.name}
      </h3>
      {#if project.description}
        <p class="mt-1 truncate text-xs text-gray-500">{project.description}</p>
      {/if}
    </div>
  </div>
</a>
