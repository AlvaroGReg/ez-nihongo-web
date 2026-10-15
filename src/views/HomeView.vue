<script setup lang="ts">
import { t } from '@/i18n'
</script>

<template>
    <main class="page-shell home-page">
        <section class="hero-card" aria-labelledby="home-title">
            <p class="eyebrow">{{ t('appEyebrow') }}</p>
            <h1 id="home-title">{{ t('welcomeTitle') }}</h1>
            <p class="hero-copy">{{ t('homeDescription') }}</p>
            <ul class="exercise-summary">
                <li>{{ t('kanaSummary') }}</li>
                <li>{{ t('vocabularySummary') }}</li>
                <li>{{ t('kanjiSummary') }}</li>
            </ul>
            <RouterLink class="button button-primary home-exercises-link" to="/exercises">
                {{ t('goToExercises') }}
            </RouterLink>
        </section>
    </main>
</template>

<style lang="scss">
.home-page {
    display: grid;
    place-items: center;
    min-height: calc(100vh - var(--header-height));

    .hero-card {
        max-width: none;
    }

    .exercise-summary {
        display: grid;
        gap: 0.65rem;
        margin: 1.5rem 0;
        padding-left: 1.25rem;
        color: var(--muted);
        line-height: 1.5;
    }

    .home-exercises-link {
        display: inline-block;
        text-decoration: none;
    }
}
</style>
