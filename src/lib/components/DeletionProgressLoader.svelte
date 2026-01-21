<script lang="ts">
  import { CheckCircle, Loader2, XIcon } from '@lucide/svelte';
  import { fly } from 'svelte/transition';

  interface Props {
    current: number;
    total: number;
    isCompleted?: boolean;
    subCollectionsCount?: number;
    onClose?: () => void;
  }

  let { current = $bindable(0), total = $bindable(0), isCompleted = $bindable(false), subCollectionsCount = 0, onClose }: Props = $props();
</script>

{#if total > 0}
  <div
    class="fixed bottom-4 right-4 z-50 card bg-surface-100-900 p-4 shadow-xl min-w-[300px]"
    transition:fly={{ y: 100, duration: 300 }}
  >
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        {#if isCompleted}
          <CheckCircle class="size-6 text-success-500" />
        {:else}
          <Loader2 class="size-6 text-primary-500 animate-spin" />
        {/if}
        <div class="flex flex-col">
          <span class="font-semibold">
            {#if isCompleted}
              Suppression terminée
            {:else}
              Suppression en cours...
            {/if}
          </span>
          <span class="text-sm opacity-75">
            {#if isCompleted}
              {current} partie{current > 1 ? 's' : ''} supprimée{current > 1 ? 's' : ''}
              {#if subCollectionsCount > 0}
                et {subCollectionsCount} collection{subCollectionsCount > 1 ? 's' : ''}
              {/if}
            {:else}
              {current}/{total} partie{total > 1 ? 's' : ''} supprimée{current > 1 ? 's' : ''}
            {/if}
          </span>
        </div>
      </div>
      {#if isCompleted && onClose}
        <button
          class="btn-icon btn-icon-sm hover:preset-tonal"
          onclick={onClose}
          aria-label="Fermer"
        >
          <XIcon class="size-4" />
        </button>
      {/if}
    </div>
    {#if !isCompleted}
      <div class="mt-3 w-full bg-surface-200-800 rounded-full h-2 overflow-hidden">
        <div
          class="bg-primary-500 h-full transition-all duration-300 ease-out"
          style="width: {total > 0 ? (current / total) * 100 : 0}%"
        ></div>
      </div>
    {/if}
  </div>
{/if}
