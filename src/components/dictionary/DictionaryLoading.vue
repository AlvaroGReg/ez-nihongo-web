<script setup lang="ts">
import { t } from '@/i18n'
</script>

<template>
    <p class="dictionary-loading" role="status">
        <span class="loading-spinner" aria-hidden="true"></span>
        <span>{{ t('loadingDictionary') }}</span>
    </p>
</template>

<style scoped>
.dictionary-loading {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin: 0;
    color: var(--muted);
}

.loading-spinner {
    width: 1.1rem;
    height: 1.1rem;
    flex: 0 0 auto;
    border: 2px solid var(--border);
    border-top-color: var(--selected-text);
    border-radius: 50%;
    animation: dictionary-spinner 0.8s linear infinite;
}

@keyframes dictionary-spinner {
    to {
        transform: rotate(360deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .loading-spinner {
        animation-duration: 2s;
    }
}
</style>
