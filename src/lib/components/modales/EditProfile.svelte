<script lang="ts">
  import {XIcon} from "@lucide/svelte";
  import {Dialog, Portal} from "@skeletonlabs/skeleton-svelte";
  import {_} from '$lib/i18n';
  import {COUNTRIES} from '$lib/utils/countries';

  const {
    profile,
    handleToastSuccess,
    onProfileUpdated
  }: {
    profile: {
      firstName: string;
      lastName: string;
      nationality: string;
    };
    handleToastSuccess: (message: string) => void;
    onProfileUpdated: (updatedProfile: any) => void;
  } = $props();

  let firstName = $state(profile.firstName);
  let lastName = $state(profile.lastName);
  let nationality = $state(profile.nationality);
  let isSubmitting = $state(false);
  let errorMessage = $state('');

  async function handleUpdateProfile() {
    errorMessage = '';

    if (!firstName.trim() || !lastName.trim() || !nationality) {
      errorMessage = $_('me.profile.requiredFields');
      return;
    }

    isSubmitting = true;

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          nationality,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        errorMessage = error.message || $_('me.profile.updateError');
        return;
      }

      const data = await response.json();
      handleToastSuccess($_('me.profile.updateSuccess'));
      onProfileUpdated(data.profile);
    } catch (err) {
      errorMessage = $_('me.profile.updateError');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Dialog>
    <Dialog.Trigger>
        <button class="btn preset-outlined-primary-500">
            {$_('me.profile.editButton')}
        </button>
    </Dialog.Trigger>
    <Portal>
        <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50"/>
        <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
            <Dialog.Content
                    class="card bg-surface-100-900 w-full max-w-xl p-4 space-y-4 shadow-xl">
                <header class="flex justify-between items-center">
                    <Dialog.Title class="text-lg font-bold">
                        {$_('me.profile.editTitle')}
                    </Dialog.Title>
                    <Dialog.CloseTrigger class="btn-icon hover:preset-tonal">
                        <XIcon class="size-4"/>
                    </Dialog.CloseTrigger>
                </header>

                <form class="space-y-4"
                      onsubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }}>
                    <div>
                        <label class="block text-sm font-medium mb-2" for="firstName">
                            {$_('me.profile.firstName')}
                        </label>
                        <input
                                bind:value={firstName}
                                class="input w-full"
                                disabled={isSubmitting}
                                id="firstName"
                                required
                                type="text"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2" for="lastName">
                            {$_('me.profile.lastName')}
                        </label>
                        <input
                                bind:value={lastName}
                                class="input w-full"
                                disabled={isSubmitting}
                                id="lastName"
                                required
                                type="text"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2" for="nationality">
                            {$_('me.profile.nationality')}
                        </label>
                        <select
                                bind:value={nationality}
                                class="select w-full"
                                disabled={isSubmitting}
                                id="nationality"
                                required
                        >
                            {#each COUNTRIES as country}
                                <option value={country}>{country}</option>
                            {/each}
                        </select>
                    </div>

                    {#if errorMessage}
                        <p class="text-error-500 text-sm mt-2">{errorMessage}</p>
                    {/if}

                    <div class="flex gap-2">
                        <Dialog.CloseTrigger class="btn preset-tonal">
                            {$_('common.actions.cancel')}
                        </Dialog.CloseTrigger>
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
