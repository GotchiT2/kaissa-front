<script lang="ts">
  import { Dialog, Portal } from "@skeletonlabs/skeleton-svelte";
  import { XIcon } from "@lucide/svelte";

  let {
    tagToDelete,
    isDeleting,
    onClose,
    onConfirm
  }: {
    tagToDelete: { id: string; nom: string; partiesCount: number } | null;
    isDeleting: boolean;
    onClose: () => void;
    onConfirm: () => void;
  } = $props();
</script>

{#if tagToDelete}
  <Dialog open={tagToDelete !== null}>
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
            <p>Êtes-vous sûr de vouloir supprimer le tag :</p>
            <p class="font-semibold text-primary-500">{tagToDelete.nom}</p>
            <p class="text-sm opacity-75">
              Ce tag est actuellement lié à {tagToDelete.partiesCount} partie{tagToDelete.partiesCount > 1 ? 's' : ''}.
              Toutes ces associations seront supprimées.
            </p>
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
