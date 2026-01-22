<script lang="ts">
  import {_} from '$lib/i18n';
  import {createToaster, Toast} from '@skeletonlabs/skeleton-svelte';
  import {FileText, FolderOpen, Tag} from "@lucide/svelte";
  import EditProfile from '$lib/components/modales/EditProfile.svelte';
  import {formatNumber} from '$lib/utils/formatNumber';
  import type {PageData} from './$types';

  const {data}: { data: PageData } = $props();

  let profile = $state(data.profile);
  let statistics = $state(data.statistics);

  const toaster = createToaster();

  function handleToastSuccess(message: string) {
    toaster.success({title: $_('common.messages.success'), description: message});
  }

  function onProfileUpdated(updatedProfile: any) {
    profile = updatedProfile;
  }
</script>

<svelte:head>
    <title>{$_('me.title')} - Kaissa</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-6xl">
    <h1 class="text-3xl font-bold mb-8">{$_('me.title')}</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
            <div class="card bg-surface-100-900 p-6 space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-semibold">{$_('me.profile.title')}</h2>
                    <EditProfile
                            {handleToastSuccess}
                            {onProfileUpdated}
                            {profile}
                    />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p class="text-sm text-surface-600-400 mb-1">{$_('me.profile.lastName')}</p>
                        <p class="text-lg font-medium">{profile.lastName}</p>
                    </div>

                    <div>
                        <p class="text-sm text-surface-600-400 mb-1">{$_('me.profile.firstName')}</p>
                        <p class="text-lg font-medium">{profile.firstName}</p>
                    </div>

                    <div>
                        <p class="text-sm text-surface-600-400 mb-1">{$_('me.profile.email')}</p>
                        <p class="text-lg font-medium">{profile.email}</p>
                    </div>

                    <div>
                        <p class="text-sm text-surface-600-400 mb-1">{$_('me.profile.nationality')}</p>
                        <p class="text-lg font-medium">{profile.nationality}</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="lg:col-span-1">
            <div class="card bg-gradient-to-br from-primary-500 to-primary-700 text-white p-6">
                <h2 class="text-xl font-semibold mb-4">{$_('me.statistics.title')}</h2>
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="bg-white/20 p-2 rounded-lg">
                                <FolderOpen class="size-6"/>
                            </div>
                            <span class="text-sm">{$_('me.statistics.collections')}</span>
                        </div>
                        <span class="text-2xl font-bold">{formatNumber(statistics.collectionsCount)}</span>
                    </div>

                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="bg-white/20 p-2 rounded-lg">
                                <FileText class="size-6"/>
                            </div>
                            <span class="text-sm">{$_('me.statistics.games')}</span>
                        </div>
                        <span class="text-2xl font-bold">{formatNumber(statistics.partiesCount)}</span>
                    </div>

                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="bg-white/20 p-2 rounded-lg">
                                <Tag class="size-6"/>
                            </div>
                            <span class="text-sm">{$_('me.statistics.tags')}</span>
                        </div>
                        <span class="text-2xl font-bold">{formatNumber(statistics.tagsCount)}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<Toast.Group {toaster}>
    {#snippet children(toast)}
        <Toast {toast}>
            <Toast.Message>
                <Toast.Title>{toast.title}</Toast.Title>
                <Toast.Description>{toast.description}</Toast.Description>
            </Toast.Message>
            <Toast.CloseTrigger/>
        </Toast>
    {/snippet}
</Toast.Group>
