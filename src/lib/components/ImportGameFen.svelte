<script lang="ts">
  import {Dialog, Portal} from "@skeletonlabs/skeleton-svelte";
  import {XIcon} from "@lucide/svelte";
  import {invalidateAll} from '$app/navigation';
  import {_} from '$lib/i18n';

  interface Props {
    collectionId: string;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
  }

  let {collectionId, onSuccess, onError}: Props = $props();

  let isModalOpen = $state(false);
  let isSubmitting = $state(false);

  let fen = $state('');
  let blancNom = $state('');
  let noirNom = $state('');
  let blancElo = $state<number | undefined>(undefined);
  let noirElo = $state<number | undefined>(undefined);
  let event = $state('');
  let site = $state('');
  let datePartie = $state('');
  let resultat = $state<'BLANCS' | 'NOIRS' | 'NULLE' | 'INCONNU'>('INCONNU');

  const animation =
    'transition transition-discrete opacity-0 translate-y-[100px] starting:data-[state=open]:opacity-0 starting:data-[state=open]:translate-y-[100px] data-[state=open]:opacity-100 data-[state=open]:translate-y-0';

  function resetForm() {
    fen = '';
    blancNom = '';
    noirNom = '';
    blancElo = undefined;
    noirElo = undefined;
    event = '';
    site = '';
    datePartie = '';
    resultat = 'INCONNU';
  }

  async function handleSubmit() {
    if (!fen.trim()) {
      onError?.('Veuillez entrer un FEN');
      return;
    }

    if (!blancNom.trim() || !noirNom.trim()) {
      onError?.('Veuillez renseigner les noms des joueurs');
      return;
    }

    isSubmitting = true;

    try {
      const metadata = {
        blancNom: blancNom.trim(),
        noirNom: noirNom.trim(),
        blancElo: blancElo && blancElo > 0 ? blancElo : undefined,
        noirElo: noirElo && noirElo > 0 ? noirElo : undefined,
        event: event.trim() || undefined,
        site: site.trim() || undefined,
        datePartie: datePartie ? new Date(datePartie).toISOString() : undefined,
        resultat,
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
      
      resetForm();
      isModalOpen = false;
    } catch (error) {
      console.error('Import error:', error);
      onError?.('Erreur lors de l\'import de la partie');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Dialog onOpenChange={(details) => isModalOpen = details.open} open={isModalOpen}>
    <Dialog.Trigger class="btn preset-filled">Importer depuis FEN</Dialog.Trigger>
    <Portal>
        <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50"/>
        <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
            <Dialog.Content
                    class="card bg-surface-100-900 w-full max-w-2xl p-4 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto {animation}">
                <header class="flex justify-between items-center">
                    <Dialog.Title class="text-lg font-bold">Importer une partie depuis FEN</Dialog.Title>
                    <Dialog.CloseTrigger class="btn-icon hover:preset-tonal">
                        <XIcon class="size-4"/>
                    </Dialog.CloseTrigger>
                </header>

                <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
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

                        <div class="space-y-2">
                            <label for="resultat" class="label">
                                <span class="text-sm font-medium">Résultat</span>
                            </label>
                            <select
                                    id="resultat"
                                    bind:value={resultat}
                                    class="select"
                            >
                                <option value="INCONNU">Inconnu</option>
                                <option value="BLANCS">1-0 (Blancs gagnent)</option>
                                <option value="NOIRS">0-1 (Noirs gagnent)</option>
                                <option value="NULLE">1/2-1/2 (Nulle)</option>
                            </select>
                        </div>
                    </div>

                    <footer class="flex justify-end gap-2 pt-4">
                        <Dialog.CloseTrigger class="btn preset-tonal" disabled={isSubmitting}>
                            Annuler
                        </Dialog.CloseTrigger>
                        <button
                                class="btn preset-filled-primary-500"
                                disabled={isSubmitting}
                                type="submit"
                        >
                            {isSubmitting ? 'Import en cours...' : 'Importer la partie'}
                        </button>
                    </footer>
                </form>
            </Dialog.Content>
        </Dialog.Positioner>
    </Portal>
</Dialog>
