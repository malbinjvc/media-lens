<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { trpc } from "$lib/trpc.js";
  import { toast } from "$lib/stores/toast.js";
  import { ArrowLeft, Trash2 } from "lucide-svelte";
  import Header from "../../../components/Header.svelte";
  import MediaUploader from "../../../components/MediaUploader.svelte";
  import MediaGrid from "../../../components/MediaGrid.svelte";

  let project = $state<any>(null);
  let loading = $state(true);

  async function loadProject() {
    loading = true;
    try {
      project = await trpc.projects.get.query({ id: $page.params.id });
    } catch {
      toast.error("Project not found");
      goto("/projects");
    } finally {
      loading = false;
    }
  }

  async function deleteProject() {
    if (!confirm("Delete this project? Media files will be kept.")) return;
    try {
      await trpc.projects.delete.mutate({ id: $page.params.id });
      toast.success("Project deleted");
      goto("/projects");
    } catch {
      toast.error("Failed to delete");
    }
  }

  onMount(loadProject);
</script>

<Header title={project?.name || "Project"} />

<div class="p-6">
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
    </div>
  {:else if project}
    <div class="mb-4 flex items-center justify-between">
      <a href="/projects" class="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft class="h-4 w-4" />
        Back to Projects
      </a>
      <button
        onclick={deleteProject}
        class="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
      >
        <Trash2 class="h-4 w-4" />
        Delete Project
      </button>
    </div>

    {#if project.description}
      <p class="mb-6 text-sm text-gray-600">{project.description}</p>
    {/if}

    <div class="space-y-6">
      <MediaUploader projectId={project.id} onUploaded={loadProject} />
      <MediaGrid items={project.media} />
    </div>
  {/if}
</div>
