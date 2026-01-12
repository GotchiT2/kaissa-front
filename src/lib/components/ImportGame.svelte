<script lang="ts">
  import {Dialog, FileUpload, Portal} from "@skeletonlabs/skeleton-svelte";
  import {FileIcon, XIcon} from "@lucide/svelte";
  import {invalidateAll} from '$app/navigation';

  interface Props {
    collectionId: string;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
  }

  let {collectionId, onSuccess, onError}: Props = $props();

  let files = $state<File[]>([]);
  let isUploading = $state(false);

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

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/collections/${collectionId}/import`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        onError?.(error.message || 'Erreur lors de l\'import des parties');
        return;
      }

      const result = await response.json();
      onSuccess?.(result.message);

      files = [];
      await invalidateAll();
    } catch (err) {
      onError?.('Erreur lors de l\'import des parties');
    } finally {
      isUploading = false;
    }
  }
</script>

<Dialog>
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
                            disabled={isUploading ?? files.length === 0}
                            onclick={handleUpload}
                            type="button"
                    >
                        {isUploading ? 'Import en cours...' : 'Importer'}
                    </button>
                </footer>
            </Dialog.Content>
        </Dialog.Positioner>
    </Portal>
</Dialog>
