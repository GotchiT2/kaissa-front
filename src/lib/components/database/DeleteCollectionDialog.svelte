<script lang="ts">
  import { Dialog, Portal } from "@skeletonlabs/skeleton-svelte";
  import { XIcon } from "@lucide/svelte";

  let {
    collectionToDelete,
    isDeleting,
    onClose,
    onConfirm
  }: {
    collectionToDelete: { id: string; nom: string; partiesCount: number; subCollectionsCount: number } | null;
    isDeleting: boolean;
    onClose: () => void;
    onConfirm: () => void;
  } = $props();
</script>

{#if collectionToDelete}
  <Dialog open={collectionToDelete !== null}>
    <Portal>
      <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" onclick={onClose}/>
      <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
        <Dialog.Content class="card bg-surface-100-900 w-full max-w-md p-4 space-y-4 shadow-xl">
          <header class="flex justify-between items-center">
            <Dialog.Title class="text-lg font-bold">Confirmer la suppression</Dialog.Title>
            <Dialog.CloseTrigger class="btn-icon hover:preset-tonal" onclick={onClose} disabled={isDeleting}>
              <XIcon class="size-4"/>
            </Dialog.CloseTrigger>
          </header>

          <Dialog.Description class="space-y-2">
            <p>Êtes-vous sûr de vouloir supprimer la collection :</p>
            <p class="font-semibold text-primary-500">{collectionToDelete.nom}</p>
            
            {#if collectionToDelete.subCollectionsCount > 0 || collectionToDelete.partiesCount > 0}
              <div class="bg-error-500/10 border border-error-500/30 rounded p-3 space-y-1">
                <p class="text-sm font-semibold text-error-400">⚠️ Cette action supprimera :</p>
                {#if collectionToDelete.partiesCount > 0}
                  <p class="text-sm opacity-90">
                    • {collectionToDelete.partiesCount} partie{collectionToDelete.partiesCount > 1 ? 's' : ''}
                  </p>
                {/if}
                {#if collectionToDelete.subCollectionsCount > 0}
                  <p class="text-sm opacity-90">
                    • {collectionToDelete.subCollectionsCount} sous-collection{collectionToDelete.subCollectionsCount > 1 ? 's' : ''}
                  </p>
                {/if}
              </div>
            {/if}
            
            <p class="text-sm opacity-75">Cette action est irréversible.</p>
          </Dialog.Description>

          <footer class="flex justify-end gap-2">
            <button class="btn preset-tonal" onclick={onClose} disabled={isDeleting}>
              Annuler
            </button>
            <button class="btn preset-filled-error-500" onclick={onConfirm} disabled={isDeleting}>
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog>
{/if}
