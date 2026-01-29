<script lang="ts">
  import {Dialog, FileUpload, Portal} from "@skeletonlabs/skeleton-svelte";
  import {FileIcon, XIcon} from "@lucide/svelte";
  import {invalidateAll} from '$app/navigation';
  import {onMount} from 'svelte';
  import ImportProgressLoader from './ImportProgressLoader.svelte';
  import {_} from '$lib/i18n';

  interface Props {
    collectionId: string;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
  }

  interface ImportState {
    collectionId: string;
    progressCurrent: number;
    progressTotal: number;
    isImportComplete: boolean;
    showProgressLoader: boolean;
    startTime: number;
  }

  let {collectionId, onSuccess, onError}: Props = $props();

  let files = $state<File[]>([]);
  let isUploading = $state(false);
  let isModalOpen = $state(false);
  let importMode = $state<'pgn' | 'fen'>('pgn');

  let progressCurrent = $state(0);
  let progressTotal = $state(0);
  let isImportComplete = $state(false);
  let showProgressLoader = $state(false);

  let fen = $state('');
  let blancNom = $state('');
  let noirNom = $state('');
  let blancElo = $state<number | undefined>(undefined);
  let noirElo = $state<number | undefined>(undefined);
  let event = $state('');
  let site = $state('');
  let datePartie = $state('');
  let isSubmittingFen = $state(false);

  const STORAGE_KEY = 'kaissa_import_state';

  const animation =
    'transition transition-discrete opacity-0 translate-y-[100px] starting:data-[state=open]:opacity-0 starting:data-[state=open]:translate-y-[100px] data-[state=open]:opacity-100 data-[state=open]:translate-y-0';

  function saveImportState() {
    if (!showProgressLoader) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const state: ImportState = {
      collectionId,
      progressCurrent,
      progressTotal,
      isImportComplete,
      showProgressLoader,
      startTime: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadImportState() {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (!savedState) return;

    try {
      const state: ImportState = JSON.parse(savedState);
      
      if (state.collectionId === collectionId) {
        progressCurrent = state.progressCurrent;
        progressTotal = state.progressTotal;
        isImportComplete = state.isImportComplete;
        showProgressLoader = state.showProgressLoader;
      }
    } catch (error) {
      console.error('Error loading import state:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  $effect(() => {
    saveImportState();
  });

  onMount(() => {
    loadImportState();
  });

  async function handleUpload() {
    if (files.length === 0) {
      onError?.($_('database.import.selectFile'));
      return;
    }

    for (const file of files) {
      if (!file.name.endsWith('.pgn')) {
        onError?.($_('database.import.invalidFormat', { values: { fileName: file.name } }));
        return;
      }
    }

    isUploading = true;
    isModalOpen = false;

    progressCurrent = 0;
    progressTotal = 0;
    isImportComplete = false;
    showProgressLoader = true;

    let totalImported = 0;
    let totalFiles = files.length;

    try {
      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex];

        const formData = new FormData();
        formData.append('file', file);
        formData.append('stream', 'true');

        const response = await fetch(`/api/collections/${collectionId}/import`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          onError?.(error.message || $_('database.import.errorImporting', { values: { fileName: file.name } }));
          continue;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          onError?.($_('database.import.errorReading', { values: { fileName: file.name } }));
          continue;
        }

        let buffer = '';

        while (true) {
          const {done, value} = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, {stream: true});
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
                totalImported += data.imported;
              }
            }
          }
        }
      }

      isImportComplete = true;
      onSuccess?.($_('database.import.success', { values: { imported: totalImported, files: totalFiles } }));
      await invalidateAll();

      files = [];
    } catch (error) {
      console.error('Import error:', error);
      onError?.($_('database.import.errorGeneral'));
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
    localStorage.removeItem(STORAGE_KEY);
  }

  function resetFenForm() {
    fen = '';
    blancNom = '';
    noirNom = '';
    blancElo = undefined;
    noirElo = undefined;
    event = '';
    site = '';
    datePartie = '';
  }

  async function handleFenSubmit() {
    if (!fen.trim()) {
      onError?.('Veuillez entrer un FEN');
      return;
    }

    if (!blancNom.trim() || !noirNom.trim()) {
      onError?.('Veuillez renseigner les noms des joueurs');
      return;
    }

    isSubmittingFen = true;

    try {
      const metadata = {
        blancNom: blancNom.trim(),
        noirNom: noirNom.trim(),
        blancElo: blancElo && blancElo > 0 ? blancElo : undefined,
        noirElo: noirElo && noirElo > 0 ? noirElo : undefined,
        event: event.trim() || undefined,
        site: site.trim() || undefined,
        datePartie: datePartie ? new Date(datePartie).toISOString() : undefined,
        resultat: 'INCONNU',
      };

      const response = await fetch(`/api/collections/${collectionId}/import-fen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fen: fen.trim(),
          metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        onError?.(error.message || 'Erreur lors de l\'import du FEN');
        return;
      }

      const result = await response.json();
      onSuccess?.(result.message || 'Partie importée avec succès');
      await invalidateAll();
      
      resetFenForm();
      isModalOpen = false;
    } catch (error) {
      console.error('Import error:', error);
      onError?.('Erreur lors de l\'import de la partie');
    } finally {
      isSubmittingFen = false;
    }
  }
</script>

<Dialog onOpenChange={(details) => isModalOpen = details.open} open={isModalOpen}>
    <Dialog.Trigger class="btn preset-filled">{$_('database.games.import')}</Dialog.Trigger>
    <Portal>
        <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50"/>
        <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
            <Dialog.Content
                    class="card bg-surface-100-900 w-full max-w-xl p-4 space-y-4 shadow-xl {animation}">
                <header class="flex justify-between items-center">
                    <Dialog.Title class="text-lg font-bold">{$_('database.import.title')}</Dialog.Title>
                    <Dialog.CloseTrigger class="btn-icon hover:preset-tonal">
                        <XIcon class="size-4"/>
                    </Dialog.CloseTrigger>
                </header>

                <div class="flex gap-2 border-b border-surface-400-600">
                    <button
                            class="px-4 py-2 font-medium transition-colors {importMode === 'pgn' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-surface-600-400 hover:text-surface-900-100'}"
                            onclick={() => importMode = 'pgn'}
                            type="button"
                    >
                        Fichier PGN
                    </button>
                    <button
                            class="px-4 py-2 font-medium transition-colors {importMode === 'fen' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-surface-600-400 hover:text-surface-900-100'}"
                            onclick={() => importMode = 'fen'}
                            type="button"
                    >
                        Position FEN
                    </button>
                </div>

                {#if importMode === 'pgn'}
                <FileUpload accept=".pgn" maxFiles={10} onFileAccept={(f) => files.push(...f.files)}>
                    <FileUpload.Label>{$_('database.import.uploadLabel')}</FileUpload.Label>
                    <FileUpload.Dropzone>
                        <FileIcon class="size-10"/>
                        <span>{$_('database.import.dropzoneText')}</span>
                        <FileUpload.Trigger>{$_('database.import.browseFiles')}</FileUpload.Trigger>
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
                        <FileUpload.ClearTrigger class="btn preset-tonal">{$_('common.actions.clear')}</FileUpload.ClearTrigger>
                    {/if}
                </FileUpload>
                <footer class="flex justify-end gap-2">
                    <Dialog.CloseTrigger class="btn preset-tonal" disabled={isUploading}>{$_('common.actions.cancel')}</Dialog.CloseTrigger>
                    <button
                            class="btn preset-filled-primary-500"
                            disabled={isUploading || files.length === 0}
                            onclick={handleUpload}
                            type="button"
                    >
                        {$_('database.import.importButton')}
                    </button>
                </footer>
                {:else}
                <form onsubmit={(e) => { e.preventDefault(); handleFenSubmit(); }} class="space-y-4">
                    <div class="space-y-2">
                        <label for="fen" class="label">
                            <span class="text-sm font-medium">FEN <span class="text-error-500">*</span></span>
                        </label>
                        <textarea
                                id="fen"
                                bind:value={fen}
                                class="textarea"
                                rows="3"
                                placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                                required
                        ></textarea>
                        <p class="text-xs text-surface-600-400">
                            Copiez-collez le FEN de la position de départ
                        </p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <label for="blancNom" class="label">
                                <span class="text-sm font-medium">Joueur Blanc <span class="text-error-500">*</span></span>
                            </label>
                            <input
                                    id="blancNom"
                                    type="text"
                                    bind:value={blancNom}
                                    class="input"
                                    placeholder="Nom du joueur blanc"
                                    required
                            />
                        </div>

                        <div class="space-y-2">
                            <label for="noirNom" class="label">
                                <span class="text-sm font-medium">Joueur Noir <span class="text-error-500">*</span></span>
                            </label>
                            <input
                                    id="noirNom"
                                    type="text"
                                    bind:value={noirNom}
                                    class="input"
                                    placeholder="Nom du joueur noir"
                                    required
                            />
                        </div>

                        <div class="space-y-2">
                            <label for="blancElo" class="label">
                                <span class="text-sm font-medium">Elo Blanc</span>
                            </label>
                            <input
                                    id="blancElo"
                                    type="number"
                                    bind:value={blancElo}
                                    class="input"
                                    placeholder="2500"
                                    min="0"
                                    max="3500"
                            />
                        </div>

                        <div class="space-y-2">
                            <label for="noirElo" class="label">
                                <span class="text-sm font-medium">Elo Noir</span>
                            </label>
                            <input
                                    id="noirElo"
                                    type="number"
                                    bind:value={noirElo}
                                    class="input"
                                    placeholder="2500"
                                    min="0"
                                    max="3500"
                            />
                        </div>

                        <div class="space-y-2">
                            <label for="event" class="label">
                                <span class="text-sm font-medium">Événement</span>
                            </label>
                            <input
                                    id="event"
                                    type="text"
                                    bind:value={event}
                                    class="input"
                                    placeholder="Tournoi de Paris 2025"
                            />
                        </div>

                        <div class="space-y-2">
                            <label for="site" class="label">
                                <span class="text-sm font-medium">Lieu</span>
                            </label>
                            <input
                                    id="site"
                                    type="text"
                                    bind:value={site}
                                    class="input"
                                    placeholder="Paris, FRA"
                            />
                        </div>

                        <div class="space-y-2">
                            <label for="datePartie" class="label">
                                <span class="text-sm font-medium">Date</span>
                            </label>
                            <input
                                    id="datePartie"
                                    type="date"
                                    bind:value={datePartie}
                                    class="input"
                            />
                        </div>
                    </div>

                    <footer class="flex justify-end gap-2 pt-4">
                        <Dialog.CloseTrigger class="btn preset-tonal" disabled={isSubmittingFen}>
                            Annuler
                        </Dialog.CloseTrigger>
                        <button
                                class="btn preset-filled-primary-500"
                                disabled={isSubmittingFen}
                                type="submit"
                        >
                            {isSubmittingFen ? 'Import en cours...' : 'Importer la partie'}
                        </button>
                    </footer>
                </form>
                {/if}
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
