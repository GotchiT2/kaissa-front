<script lang="ts">
  import { Dialog, Portal } from "@skeletonlabs/skeleton-svelte";
  import { XIcon } from "@lucide/svelte";
  import { _ } from '$lib/i18n';

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
            <Dialog.Title class="text-lg font-bold">{$_('database.collections.confirmDelete')}</Dialog.Title>
            <Dialog.CloseTrigger class="btn-icon hover:preset-tonal" onclick={onClose} disabled={isDeleting}>
              <XIcon class="size-4"/>
            </Dialog.CloseTrigger>
          </header>

          <Dialog.Description class="space-y-2">
            <p>{$_('database.collections.deleteWarning')}</p>
            <p class="font-semibold text-primary-500">{collectionToDelete.nom}</p>
            
            {#if collectionToDelete.subCollectionsCount > 0 || collectionToDelete.partiesCount > 0}
              <div class="bg-error-500/10 border border-error-500/30 rounded p-3 space-y-1">
                <p class="text-sm font-semibold text-error-400">⚠️ {$_('database.collections.willDelete')}</p>
                {#if collectionToDelete.partiesCount > 0}
                  <p class="text-sm opacity-90">
                    • {$_('database.collections.parties', { values: { count: collectionToDelete.partiesCount } })}
                  </p>
                {/if}
                {#if collectionToDelete.subCollectionsCount > 0}
                  <p class="text-sm opacity-90">
                    • {$_('database.collections.subCollections', { values: { count: collectionToDelete.subCollectionsCount } })}
                  </p>
                {/if}
              </div>
            {/if}
            
            <p class="text-sm opacity-75">{$_('database.collections.irreversible')}</p>
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
