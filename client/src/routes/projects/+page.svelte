<script lang="ts">
  import { onMount } from "svelte";
  import { trpc } from "$lib/trpc.js";
  import { toast } from "$lib/stores/toast.js";
  import { Plus } from "lucide-svelte";
  import Header from "../../components/Header.svelte";
  import ProjectCard from "../../components/ProjectCard.svelte";

  let projects = $state<any[]>([]);
  let loading = $state(true);
  let showForm = $state(false);
  let name = $state("");
  let description = $state("");
  let color = $state("#6366f1");

  async function loadProjects() {
    loading = true;
    try {
      projects = await trpc.projects.list.query();
    } catch {
      toast.error("Failed to load projects");
    } finally {
      loading = false;
    }
  }

  async function createProject() {
    if (!name.trim()) return;
    try {
      await trpc.projects.create.mutate({ name, description, color });
      toast.success("Project created");
      name = "";
      description = "";
      color = "#6366f1";
      showForm = false;
      loadProjects();
    } catch {
      toast.error("Failed to create project");
    }
  }

  onMount(loadProjects);
</script>

<Header title="Projects" />

<div class="p-6">
  <div class="mb-6 flex items-center justify-between">
    <h2 class="text-lg font-semibold text-gray-900">Your Projects</h2>
    <button
      onclick={() => (showForm = !showForm)}
      class="flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
    >
      <Plus class="h-4 w-4" />
      New Project
    </button>
  </div>

  {#if showForm}
    <div class="mb-6 rounded-xl border border-gray-200 bg-white p-5">
      <div class="space-y-3">
        <input
          type="text"
          bind:value={name}
          placeholder="Project name"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <textarea
          bind:value={description}
          placeholder="Description (optional)"
          rows="2"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        ></textarea>
        <div class="flex items-center gap-3">
          <input type="color" bind:value={color} class="h-8 w-8 cursor-pointer" />
          <button
            onclick={createProject}
            class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Create
          </button>
          <button
            onclick={() => (showForm = false)}
            class="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
    </div>
  {:else if projects.length === 0}
    <div class="py-12 text-center text-gray-500">
      <p>No projects yet. Create one to organize your media.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each projects as project (project.id)}
        <ProjectCard {project} />
      {/each}
    </div>
  {/if}
</div>
