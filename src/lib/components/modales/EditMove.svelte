<script lang="ts">
  import {XIcon} from "@lucide/svelte";
  import {Dialog, Portal} from "@skeletonlabs/skeleton-svelte";
  import {_} from '$lib/i18n';

  const {
    nodeId,
    handleToastSuccess
  }: {
    nodeId: string;
    handleToastSuccess: (message: string) => void;
  } = $props();

  let commentAvant = $state('');
  let commentApres = $state('');
  let isSaving = $state(false);
  let errorMessage = $state('');

  async function loadComments() {
    try {
      const response = await fetch(`/api/nodes/${nodeId}/comments`);
      if (response.ok) {
        const data = await response.json();
        commentAvant = data.avant || '';
        commentApres = data.apres || '';
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }

  async function handleSaveComments() {
    errorMessage = '';
    isSaving = true;

    try {
      const response = await fetch(`/api/nodes/${nodeId}/comments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avant: commentAvant,
          apres: commentApres,
        }),
      });

      if (response.ok) {
        handleToastSuccess($_('chessboard.comments.saveSuccess'));
      } else {
        const error = await response.json();
        errorMessage = error.message || $_('chessboard.comments.saveError');
      }
    } catch (error) {
      console.error('Error saving comments:', error);
      errorMessage = $_('chessboard.comments.saveError');
    } finally {
      isSaving = false;
    }
  }
</script>

<Dialog onOpenChange={(open) => { if (open) loadComments(); }}>
    <Dialog.Trigger>
        <button class="btn btn-sm">
            {$_('chessboard.comments.editButton')}
        </button>
    </Dialog.Trigger>
    <Portal>
        <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50"/>
        <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
            <Dialog.Content
                    class="card bg-surface-100-900 w-full max-w-xl p-4 space-y-4 shadow-xl">
                <header class="flex justify-between items-center">
                    <Dialog.Title class="text-lg font-bold">
                        {$_('chessboard.comments.editTitle')}
                    </Dialog.Title>
                    <Dialog.CloseTrigger class="btn-icon hover:preset-tonal">
                        <XIcon class="size-4"/>
                    </Dialog.CloseTrigger>
                </header>

                <form class="space-y-4"
                      onsubmit={(e) => { e.preventDefault(); handleSaveComments(); }}>
                    <div>
                        <label class="block text-sm font-medium mb-2" for="comment-avant">
                            {$_('chessboard.comments.beforeMove')}
                        </label>
                        <textarea
                                bind:value={commentAvant}
                                class="textarea w-full"
                                id="comment-avant"
                                maxlength="250"
                                placeholder={$_('chessboard.comments.beforeMovePlaceholder')}
                                rows="3"
                        ></textarea>
                        <p class="text-sm text-surface-600-400 mt-1">
                            {commentAvant.length}/250 {$_('chessboard.comments.characters')}
                        </p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2" for="comment-apres">
                            {$_('chessboard.comments.afterMove')}
                        </label>
                        <textarea
                                bind:value={commentApres}
                                class="textarea w-full"
                                id="comment-apres"
                                maxlength="250"
                                placeholder={$_('chessboard.comments.afterMovePlaceholder')}
                                rows="3"
                        ></textarea>
                        <p class="text-sm text-surface-600-400 mt-1">
                            {commentApres.length}/250 {$_('chessboard.comments.characters')}
                        </p>
                    </div>

                    {#if errorMessage}
                        <p class="text-error-500 text-sm">{errorMessage}</p>
                    {/if}

                    <div class="flex gap-2">
                        <Dialog.CloseTrigger class="btn preset-tonal">
                            {$_('common.actions.cancel')}
                        </Dialog.CloseTrigger>
                        <button
                                class="btn preset-filled-primary-500"
                                disabled={isSaving}
                                type="submit"
                        >
                            {isSaving ? $_('common.messages.saving') : $_('common.actions.save')}
                        </button>
                    </div>
                </form>
            </Dialog.Content>
        </Dialog.Positioner>
    </Portal>
</Dialog>
