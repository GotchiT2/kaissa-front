<script lang="ts">
  import { Dialog, Portal } from "@skeletonlabs/skeleton-svelte";
  import { XIcon } from "@lucide/svelte";
  import { _ } from '$lib/i18n';

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
            <Dialog.Title class="text-lg font-bold">{$_('database.tags.confirmDelete')}</Dialog.Title>
            <Dialog.CloseTrigger class="btn-icon hover:preset-tonal" onclick={onClose} disabled={isDeleting}>
              <XIcon class="size-4"/>
            </Dialog.CloseTrigger>
          </header>

          <Dialog.Description class="space-y-2">
            <p>{$_('database.tags.deleteWarning')}</p>
            <p class="font-semibold text-primary-500">{tagToDelete.nom}</p>
            <p class="text-sm opacity-75">
              {$_('database.tags.linkedTo', { values: { count: tagToDelete.partiesCount } })}
              {$_('database.tags.associationsWillBeDeleted')}
            </p>
            <p class="text-sm opacity-75">{$_('database.tags.irreversible')}</p>
          </Dialog.Description>

          <footer class="flex justify-end gap-2">
            <button class="btn preset-tonal" onclick={onClose} disabled={isDeleting}>
              {$_('common.actions.cancel')}
            </button>
            <button class="btn preset-filled-error-500" onclick={onConfirm} disabled={isDeleting}>
              {isDeleting ? $_('common.messages.deleting') : $_('common.actions.delete')}
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog>
{/if}
