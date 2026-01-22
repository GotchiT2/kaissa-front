<script lang="ts">
  import type { WDLData } from '$lib/services/stockfishService';

  const {
    wdl
  }: {
    wdl: WDLData | null;
  } = $props();

  const whitePercentage = $derived(() => {
    if (!wdl) return 50;

    const total = wdl.whiteWin + wdl.draw + wdl.blackWin;
    if (total === 0) return 50;

    const whiteScore = wdl.whiteWin + (wdl.draw / 2);
    return (whiteScore / total) * 100;
  });

  const blackPercentage = $derived(() => {
    return 100 - whitePercentage();
  });
</script>

<div class="evaluation-bar-container">
  <div class="evaluation-bar">
    <div
      class="black-section"
      style="height: {blackPercentage()}%"
    ></div>
    <div
      class="white-section"
      style="height: {whitePercentage()}%"
    ></div>
  </div>
</div>

<style>
  .evaluation-bar-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .evaluation-bar {
    width: 48px;
    height: 100%;
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .black-section {
    background: linear-gradient(to bottom, #1a1a1a, #2a2a2a);
    width: 100%;
    transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
  }

  .white-section {
    background: linear-gradient(to top, #e8e8e8, #f5f5f5);
    width: 100%;
    transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
  }

  .evaluation-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    color: rgba(255, 255, 255, 0.7);
  }
</style>
