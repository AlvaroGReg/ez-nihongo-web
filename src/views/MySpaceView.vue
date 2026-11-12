<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { t } from '@/i18n'
import { auth } from '@/stores/auth'
</script>

<template>
    <main class="page-shell my-space-page">
        <section class="hero-card my-space-card" aria-labelledby="my-space-title">
            <div class="my-space-heading">
                <div>
                    <p class="eyebrow">{{ t('clientArea') }}</p>
                    <h1 id="my-space-title">{{ t('mySpaceTitle') }}</h1>
                    <p class="hero-copy">{{ t('mySpaceDescription') }}</p>
                </div>
                <button class="button button-secondary" type="button" @click="auth.signOut">
                    {{ t('signOut') }}
                </button>
            </div>

            <div class="my-space-sections">
                <RouterLink class="my-space-section" to="/progress">
                    <h2>{{ t('progressTitle') }}</h2>
                    <p>{{ t('allProgressDescription') }}</p>
                    <span>{{ t('openSection') }} <span aria-hidden="true">→</span></span>
                </RouterLink>
                <RouterLink class="my-space-section" to="/my-vocabulary">
                    <h2>{{ t('myVocabularyTitle') }}</h2>
                    <p>{{ t('knownContentDescription') }}</p>
                    <span>{{ t('openSection') }} <span aria-hidden="true">→</span></span>
                </RouterLink>
            </div>
        </section>
    </main>
</template>

<style scoped>
.my-space-page {
    display: grid;
    justify-items: center;
}

.my-space-card {
    display: grid;
    gap: 2rem;
    width: 100%;
    max-width: none;
}

.my-space-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
}

.my-space-heading h1,
.my-space-heading p {
    margin-bottom: 0;
}

.my-space-sections {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
}

.my-space-section {
    display: grid;
    align-content: start;
    gap: 0.75rem;
    min-height: 11rem;
    padding: 1.25rem;
    border: 1px solid var(--border);
    border-radius: 1rem;
    color: var(--text);
    text-decoration: none;
}

.my-space-section:hover {
    background: var(--secondary-background);
}

.my-space-section h2,
.my-space-section p {
    margin: 0;
}

.my-space-section p {
    color: var(--muted);
}

.my-space-section > span {
    align-self: end;
    color: var(--selected-text);
    font-weight: 700;
}

@media (width <= 640px) {
    .my-space-heading {
        flex-direction: column;
    }

    .my-space-sections {
        grid-template-columns: 1fr;
    }
}
</style>
