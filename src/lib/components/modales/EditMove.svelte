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
  let nagCoup = $state<number | null>(null);
  let nagPosition = $state<number | null>(null);
  let isSaving = $state(false);
  let errorMessage = $state('');

  const moveAnnotations = [
    { value: 0, label: $_('chessboard.nag.none') },
    { value: 1, label: '! ' + $_('chessboard.nag.move.good') },
    { value: 2, label: '? ' + $_('chessboard.nag.move.mistake') },
    { value: 3, label: '!! ' + $_('chessboard.nag.move.brilliant') },
    { value: 4, label: '?? ' + $_('chessboard.nag.move.blunder') },
    { value: 5, label: '!? ' + $_('chessboard.nag.move.interesting') },
    { value: 6, label: '?! ' + $_('chessboard.nag.move.dubious') },
  ];

  const positionAnnotations = [
    { value: 0, label: $_('chessboard.nag.none') },
    { value: 13, label: '∞ ' + $_('chessboard.nag.position.unclear') },
    { value: 14, label: '+= ' + $_('chessboard.nag.position.slightWhite') },
    { value: 15, label: '=+ ' + $_('chessboard.nag.position.slightBlack') },
    { value: 16, label: '± ' + $_('chessboard.nag.position.moderateWhite') },
    { value: 17, label: '∓ ' + $_('chessboard.nag.position.moderateBlack') },
    { value: 18, label: '+- ' + $_('chessboard.nag.position.decisiveWhite') },
    { value: 19, label: '-+ ' + $_('chessboard.nag.position.decisiveBlack') },
  ];

  async function loadComments() {
    try {
      const response = await fetch(`/api/nodes/${nodeId}/comments`);
      if (response.ok) {
        const data = await response.json();
        commentAvant = data.avant || '';
        commentApres = data.apres || '';
        nagCoup = data.nagCoup || 0;
        nagPosition = data.nagPosition || 0;
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
          nagCoup: nagCoup === 0 ? null : nagCoup,
          nagPosition: nagPosition === 0 ? null : nagPosition,
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
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2" for="nag-coup">
                {$_('chessboard.nag.moveAnnotation')}
              </label>
              <select
                bind:value={nagCoup}
                class="select w-full"
                id="nag-coup"
              >
                {#each moveAnnotations as annotation}
                  <option value={annotation.value}>{annotation.label}</option>
                {/each}
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2" for="nag-position">
                {$_('chessboard.nag.positionAnnotation')}
              </label>
              <select
                bind:value={nagPosition}
                class="select w-full"
                id="nag-position"
              >
                {#each positionAnnotations as annotation}
                  <option value={annotation.value}>{annotation.label}</option>
                {/each}
              </select>
            </div>
          </div>

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
