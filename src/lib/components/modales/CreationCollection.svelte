<script lang="ts">
  import {Plus, XIcon} from "@lucide/svelte";
  import {Dialog, Portal} from "@skeletonlabs/skeleton-svelte";
  import {invalidateAll} from "$app/navigation";

  const {label, handleToastSuccess, parentId}: {
    label: string,
    handleToastSuccess: (message: string) => void,
    parentId?: string
  } = $props()

  let collectionName = $state('');
  let isSubmitting = $state(false);
  let errorMessage = $state('');
  let parentCollectionId = $derived<string | undefined>(parentId);

  async function handleCreateCollection() {
    errorMessage = '';

    if (!collectionName.trim()) {
      errorMessage = 'Le nom de la collection est requis';
      return;
    }

    if (collectionName.trim().length > 100) {
      errorMessage = 'Le nom de la collection ne peut pas dépasser 100 caractères';
      return;
    }

    isSubmitting = true;

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: collectionName.trim(),
          parentId: parentCollectionId
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        errorMessage = error.message || 'Erreur lors de la création de la collection';
        return;
      }

      handleToastSuccess('Collection créée avec succès')

      collectionName = '';
      parentCollectionId = undefined;
      await invalidateAll();
    } catch (err) {
      errorMessage = 'Erreur lors de la création de la collection';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Dialog>
    <Dialog.Trigger>
        <Plus class="size-4 hover:preset-filled-primary-500"/>
        <span class="sr-only">{label}</span></Dialog.Trigger>
    <Portal>
        <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50"/>
        <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
            <Dialog.Content
                    class="card bg-surface-100-900 w-full max-w-xl p-4 space-y-4 shadow-xl">
                <header class="flex justify-between items-center">
                    <Dialog.Title class="text-lg font-bold">
                        {label}
                    </Dialog.Title>
                    <Dialog.CloseTrigger class="btn-icon hover:preset-tonal">
                        <XIcon class="size-4"/>
                    </Dialog.CloseTrigger>
                </header>

                <form class="space-y-4"
                      onsubmit={(e) => { e.preventDefault(); handleCreateCollection(); }}>
                    <div>
                        <label class="block text-sm font-medium mb-2" for="collection-name">
                            Nom de la collection
                        </label>

                        <input
                                bind:value={collectionName}
                                class="input w-full"
                                disabled={isSubmitting}
                                id="collection-name"
                                maxlength="100"
                                placeholder="Ex: Mes parties de tournoi"
                                required
                                type="text"
                        />
                        {#if errorMessage}
                            <p class="text-error-500 text-sm mt-2">{errorMessage}</p>
                        {/if}
                    </div>

                    <Dialog.CloseTrigger class="btn preset-tonal">Annuler</Dialog.CloseTrigger>
                    <button
                            class="btn preset-filled-primary-500"
                            disabled={isSubmitting}
                            type="submit"
                    >
                        {isSubmitting ? 'Création...' : 'Créer'}
                    </button>
                </form>
            </Dialog.Content>
        </Dialog.Positioner>
    </Portal>
</Dialog>