<script lang="ts">
  import {Dialog, FileUpload, Portal} from "@skeletonlabs/skeleton-svelte";
  import {FileIcon, XIcon} from "@lucide/svelte";
  import {invalidateAll} from '$app/navigation';
  import ImportProgressLoader from './ImportProgressLoader.svelte';

  interface Props {
    collectionId: string;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
  }

  let {collectionId, onSuccess, onError}: Props = $props();

  let files = $state<File[]>([]);
  let isUploading = $state(false);
  let isModalOpen = $state(false);
  
  let progressCurrent = $state(0);
  let progressTotal = $state(0);
  let isImportComplete = $state(false);
  let showProgressLoader = $state(false);

  const animation =
    'transition transition-discrete opacity-0 translate-y-[100px] starting:data-[state=open]:opacity-0 starting:data-[state=open]:translate-y-[100px] data-[state=open]:opacity-100 data-[state=open]:translate-y-0';

  async function handleUpload() {
    if (files.length === 0) {
      onError?.('Veuillez sélectionner un fichier');
      return;
    }

    const file = files[0];

    if (!file.name.endsWith('.pgn')) {
      onError?.('Le fichier doit être au format PGN');
      return;
    }

    isUploading = true;
    isModalOpen = false;
    
    progressCurrent = 0;
    progressTotal = 0;
    isImportComplete = false;
    showProgressLoader = true;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('stream', 'true');

      const response = await fetch(`/api/collections/${collectionId}/import`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        onError?.(error.message || 'Erreur lors de l\'import des parties');
        showProgressLoader = false;
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        onError?.('Erreur lors de la lecture du stream');
        showProgressLoader = false;
        return;
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          const eventMatch = line.match(/^event: (.+)$/m);
          const dataMatch = line.match(/^data: (.+)$/m);

          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1];
            const data = JSON.parse(dataMatch[1]);

            if (eventType === 'start') {
              progressTotal = data.total;
              progressCurrent = 0;
            } else if (eventType === 'progress') {
              progressCurrent = data.current;
              progressTotal = data.total;
            } else if (eventType === 'complete') {
              progressCurrent = data.imported;
              progressTotal = data.total;
              isImportComplete = true;
              onSuccess?.(data.message);
              
              await invalidateAll();
            }
          }
        }
      }

      files = [];
    } catch (err) {
      onError?.('Erreur lors de l\'import des parties');
      showProgressLoader = false;
    } finally {
      isUploading = false;
    }
  }

  function handleCloseProgressLoader() {
    showProgressLoader = false;
    progressCurrent = 0;
    progressTotal = 0;
    isImportComplete = false;
  }
</script>

<Dialog open={isModalOpen} onOpenChange={(details) => isModalOpen = details.open}>
    <Dialog.Trigger class="btn preset-filled">Importer une partie</Dialog.Trigger>
    <Portal>
        <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50"/>
        <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
            <Dialog.Content
                    class="card bg-surface-100-900 w-full max-w-xl p-4 space-y-4 shadow-xl {animation}">
                <header class="flex justify-between items-center">
                    <Dialog.Title class="text-lg font-bold">Importez vos parties</Dialog.Title>
                    <Dialog.CloseTrigger class="btn-icon hover:preset-tonal">
                        <XIcon class="size-4"/>
                    </Dialog.CloseTrigger>
                </header>

                <FileUpload accept=".pgn" onFileAccept={(f) => files.push(...f.files)}>
                    <FileUpload.Label>Téléversez vos fichiers PGN</FileUpload.Label>
                    <FileUpload.Dropzone>
                        <FileIcon class="size-10"/>
                        <span>Sélectionnez un fichier PGN ou glissez-le ici.</span>
                        <FileUpload.Trigger>Rechercher des fichiers</FileUpload.Trigger>
                        <FileUpload.HiddenInput/>
                    </FileUpload.Dropzone>
                    <FileUpload.ItemGroup>
                        <FileUpload.Context>
                            {#snippet children(fileUpload)}
                                {#each fileUpload().acceptedFiles as file (file.name)}
                                    <FileUpload.Item {file}>
                                        <FileUpload.ItemName>{file.name}</FileUpload.ItemName>
                                        <FileUpload.ItemSizeText>{(file.size / 1024).toFixed(2)}KB
                                        </FileUpload.ItemSizeText>
                                        <FileUpload.ItemDeleteTrigger/>
                                    </FileUpload.Item>
                                {/each}
                            {/snippet}
                        </FileUpload.Context>
                    </FileUpload.ItemGroup>
                    {#if files.length > 0}
                        <FileUpload.ClearTrigger class="btn preset-tonal">Effacer</FileUpload.ClearTrigger>
                    {/if}
                </FileUpload>
                <footer class="flex justify-end gap-2">
                    <Dialog.CloseTrigger class="btn preset-tonal" disabled={isUploading}>Annuler</Dialog.CloseTrigger>
                    <button
                            class="btn preset-filled-primary-500"
                            disabled={isUploading || files.length === 0}
                            onclick={handleUpload}
                            type="button"
                    >
                        Importer
                    </button>
                </footer>
            </Dialog.Content>
        </Dialog.Positioner>
    </Portal>
</Dialog>

{#if showProgressLoader}
    <ImportProgressLoader
            bind:current={progressCurrent}
            bind:total={progressTotal}
            bind:isCompleted={isImportComplete}
            onClose={handleCloseProgressLoader}
    />
{/if}
