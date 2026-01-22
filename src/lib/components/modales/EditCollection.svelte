<script lang="ts">
  import {PencilIcon, XIcon} from "@lucide/svelte";
  import {Dialog, Portal} from "@skeletonlabs/skeleton-svelte";
  import {_} from '$lib/i18n';

  const {
    collectionId,
    currentName,
    handleToastSuccess
  }: {
    collectionId: string;
    currentName: string;
    handleToastSuccess: (message: string) => void;
  } = $props();

  let collectionName = $state(currentName);
  let isSubmitting = $state(false);
  let errorMessage = $state('');

  async function handleUpdateCollection() {
    errorMessage = '';

    if (!collectionName.trim()) {
      errorMessage = $_('database.collections.nameRequired');
      return;
    }

    if (collectionName.trim().length > 100) {
      errorMessage = $_('database.collections.nameTooLong');
      return;
    }

    if (collectionName.trim() === currentName) {
      errorMessage = $_('database.collections.nameUnchanged');
      return;
    }

    isSubmitting = true;

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: collectionName.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        errorMessage = error.message || $_('database.collections.updateError');
        return;
      }

      handleToastSuccess($_('database.collections.updateSuccess'));

      window.location.reload();
    } catch (err) {
      errorMessage = $_('database.collections.updateError');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Dialog onOpenChange={(open) => { if (open) collectionName = currentName; }}>
    <Dialog.Trigger>
        <button class="btn-icon btn-icon-sm hover:preset-tonal">
            <PencilIcon class="size-4"/>
            <span class="sr-only">{$_('database.collections.edit')}</span>
        </button>
    </Dialog.Trigger>
    <Portal>
        <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50"/>
        <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
            <Dialog.Content
                    class="card bg-surface-100-900 w-full max-w-xl p-4 space-y-4 shadow-xl">
                <header class="flex justify-between items-center">
                    <Dialog.Title class="text-lg font-bold">
                        {$_('database.collections.editTitle')}
                    </Dialog.Title>
                    <Dialog.CloseTrigger class="btn-icon hover:preset-tonal">
                        <XIcon class="size-4"/>
                    </Dialog.CloseTrigger>
                </header>

                <form class="space-y-4"
                      onsubmit={(e) => { e.preventDefault(); handleUpdateCollection(); }}>
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

                    <div class="flex gap-2">
                        <Dialog.CloseTrigger
                                class="btn preset-tonal">{$_('common.actions.cancel')}</Dialog.CloseTrigger>
                        <button
                                class="btn preset-filled-primary-500"
                                disabled={isSubmitting}
                                type="submit"
                        >
                            {isSubmitting ? $_('common.messages.saving') : $_('common.actions.save')}
                        </button>
                    </div>
                </form>
            </Dialog.Content>
        </Dialog.Positioner>
    </Portal>
</Dialog>
