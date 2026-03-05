<script lang="ts">
  import { Upload, X } from "lucide-svelte";
  import { trpc } from "$lib/trpc.js";
  import { toast } from "$lib/stores/toast.js";

  interface Props {
    projectId?: string;
    onUploaded?: () => void;
  }

  let { projectId, onUploaded }: Props = $props();

  let dragover = $state(false);
  let uploading = $state(false);
  let progress = $state("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    uploading = true;

    try {
      for (const file of Array.from(files)) {
        progress = `Uploading ${file.name}...`;

        const { uploadUrl, storageKey } = await trpc.media.getUploadUrl.mutate({
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        });

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        await trpc.media.create.mutate({
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          storageKey,
          title: file.name.replace(/\.[^/.]+$/, ""),
          projectId,
        });

        toast.success(`${file.name} uploaded`);
      }
      onUploaded?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      uploading = false;
      progress = "";
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragover = false;
    handleFiles(e.dataTransfer?.files ?? null);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    dragover = true;
  }
</script>

<div
  role="button"
  tabindex="0"
  class="relative rounded-xl border-2 border-dashed p-8 text-center transition-colors
    {dragover ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-primary-300'}"
  ondrop={handleDrop}
  ondragover={handleDragOver}
  ondragleave={() => (dragover = false)}
>
  {#if uploading}
    <div class="flex flex-col items-center gap-2">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
      <p class="text-sm text-gray-600">{progress}</p>
    </div>
  {:else}
    <Upload class="mx-auto h-10 w-10 text-gray-400" />
    <p class="mt-2 text-sm text-gray-600">
      Drag & drop files here, or
      <label class="cursor-pointer font-medium text-primary-600 hover:text-primary-500">
        browse
        <input
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.md,.csv"
          class="hidden"
          onchange={(e) => handleFiles(e.currentTarget.files)}
        />
      </label>
    </p>
    <p class="mt-1 text-xs text-gray-400">Images, PDFs, Text files up to 50 MB</p>
  {/if}
</div>
