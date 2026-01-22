<script lang="ts">
  import {Plus, XIcon} from "@lucide/svelte";
  import {Dialog, Portal} from "@skeletonlabs/skeleton-svelte";
  import {invalidateAll} from "$app/navigation";
  import {_} from '$lib/i18n';

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
      errorMessage = $_('database.collections.nameRequired');
      return;
    }

    if (collectionName.trim().length > 100) {
      errorMessage = $_('database.collections.nameTooLong');
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
        errorMessage = error.message || $_('database.collections.createError');
        return;
      }

      handleToastSuccess($_('database.collections.createSuccess'))

      collectionName = '';
      parentCollectionId = undefined;
      await invalidateAll();
    } catch (err) {
      errorMessage = $_('database.collections.createError');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Dialog>
    <Dialog.Trigger class="btn-icon btn-icon-sm hover:preset-filled-primary-500">
        <Plus class="size-4"/>
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
                            {$_('database.collections.name')}
                        </label>

                        <input
                                bind:value={collectionName}
                                class="input w-full"
                                disabled={isSubmitting}
                                id="collection-name"
                                maxlength="100"
                                placeholder={$_('database.collections.namePlaceholder')}
                                required
                                type="text"
                        />
                        {#if errorMessage}
                            <p class="text-error-500 text-sm mt-2">{errorMessage}</p>
                        {/if}
                    </div>

                    <Dialog.CloseTrigger class="btn preset-tonal">{$_('common.actions.cancel')}</Dialog.CloseTrigger>
                    <button
                            class="btn preset-filled-primary-500"
                            disabled={isSubmitting}
                            type="submit"
                    >
                        {isSubmitting ? $_('common.messages.creating') : $_('common.actions.create')}
                    </button>
                </form>
            </Dialog.Content>
        </Dialog.Positioner>
    </Portal>
</Dialog>
