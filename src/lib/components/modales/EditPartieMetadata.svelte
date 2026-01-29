<script lang="ts">
  import {Dialog, Portal} from '@skeletonlabs/skeleton-svelte';
  import {XIcon} from '@lucide/svelte';
  import {invalidateAll} from '$app/navigation';
  import {_} from '$lib/i18n';

  interface Props {
    partieData: {
      id: string;
      whitePlayer: string;
      blackPlayer: string;
      whiteElo: number | null;
      blackElo: number | null;
      tournament: string;
      date: string;
    } | null;
    onClose: () => void;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
  }

  let {partieData, onClose, onSuccess, onError}: Props = $props();

  let isUpdating = $state(false);
  let formData = $state({
    whitePlayer: '',
    blackPlayer: '',
    whiteElo: '',
    blackElo: '',
    tournament: '',
    date: ''
  });

  $effect(() => {
    if (partieData) {
      let dateValue = '';
      if (partieData.date) {
        const parts = partieData.date.split('/');
        if (parts.length === 3) {
          dateValue = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      formData = {
        whitePlayer: partieData.whitePlayer || '',
        blackPlayer: partieData.blackPlayer || '',
        whiteElo: partieData.whiteElo?.toString() || '',
        blackElo: partieData.blackElo?.toString() || '',
        tournament: partieData.tournament || '',
        date: dateValue
      };
    }
  });

  function handleClose() {
    if (!isUpdating) {
      onClose();
    }
  }

  async function save() {
    if (!partieData) return;

    isUpdating = true;

    try {
      const dateValue = formData.date ? new Date(formData.date).toISOString() : null;

      const response = await fetch(`/api/parties/${partieData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blancNom: formData.whitePlayer || null,
          noirNom: formData.blackPlayer || null,
          blancElo: formData.whiteElo ? parseInt(formData.whiteElo) : null,
          noirElo: formData.blackElo ? parseInt(formData.blackElo) : null,
          event: formData.tournament || null,
          datePartie: dateValue,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || $_('database.table.updateError'));
      }

      await invalidateAll();

      onSuccess?.($_('database.table.metadataUpdateSuccess'));
      onClose();
    } catch (error: any) {
      onError?.(error.message || $_('database.table.updateError'));
    } finally {
      isUpdating = false;
    }
  }
</script>

{#if partieData}
  <Dialog open={partieData !== null}>
    <Portal>
      <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" onclick={handleClose}/>
      <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
        <Dialog.Content class="card bg-surface-100-900 w-full max-w-md p-4 space-y-4 shadow-xl">
          <header class="flex justify-between items-center">
            <Dialog.Title class="text-lg font-bold">{$_('database.table.editMetadata')}</Dialog.Title>
            <Dialog.CloseTrigger class="btn-icon hover:preset-tonal" onclick={handleClose} disabled={isUpdating}>
              <XIcon class="size-4"/>
            </Dialog.CloseTrigger>
          </header>

          <Dialog.Description class="space-y-4">
            <div class="space-y-2">
              <label class="label" for="whitePlayer">
                <span>{$_('database.table.whitePlayer')}</span>
                <input
                  id="whitePlayer"
                  type="text"
                  class="input"
                  bind:value={formData.whitePlayer}
                  disabled={isUpdating}
                  placeholder={$_('database.table.whitePlayerName')}
                />
              </label>

              <label class="label" for="whiteElo">
                <span>{$_('database.table.whiteElo')}</span>
                <input
                  id="whiteElo"
                  type="number"
                  class="input"
                  bind:value={formData.whiteElo}
                  disabled={isUpdating}
                  placeholder={$_('database.table.whitePlayerElo')}
                />
              </label>

              <label class="label" for="blackPlayer">
                <span>{$_('database.table.blackPlayer')}</span>
                <input
                  id="blackPlayer"
                  type="text"
                  class="input"
                  bind:value={formData.blackPlayer}
                  disabled={isUpdating}
                  placeholder={$_('database.table.blackPlayerName')}
                />
              </label>

              <label class="label" for="blackElo">
                <span>{$_('database.table.blackElo')}</span>
                <input
                  id="blackElo"
                  type="number"
                  class="input"
                  bind:value={formData.blackElo}
                  disabled={isUpdating}
                  placeholder={$_('database.table.blackPlayerElo')}
                />
              </label>

              <label class="label" for="tournament">
                <span>{$_('database.table.tournament')}</span>
                <input
                  id="tournament"
                  type="text"
                  class="input"
                  bind:value={formData.tournament}
                  disabled={isUpdating}
                  placeholder={$_('database.table.tournamentName')}
                />
              </label>

              <label class="label" for="date">
                <span>{$_('database.table.date')}</span>
                <input
                  id="date"
                  type="date"
                  class="input"
                  bind:value={formData.date}
                  disabled={isUpdating}
                />
              </label>
            </div>
          </Dialog.Description>

          <footer class="flex justify-end gap-2">
            <button
              class="btn preset-tonal"
              onclick={handleClose}
              disabled={isUpdating}
            >
              {$_('common.actions.cancel')}
            </button>
            <button
              class="btn preset-filled-primary-500"
              onclick={save}
              disabled={isUpdating}
            >
              {isUpdating ? $_('common.messages.saving') : $_('common.actions.save')}
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog>
{/if}
