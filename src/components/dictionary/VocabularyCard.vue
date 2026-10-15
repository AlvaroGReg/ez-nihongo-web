<script setup lang="ts">
import { computed } from 'vue'

import { locale } from '@/i18n'
import type { CatalogEntry } from '@/services/vocabulary'

const props = defineProps<{ entry: CatalogEntry }>()

const meaning = computed(() => props.entry.meaning[locale.value] || props.entry.meaning.en)
</script>

<template>
    <article class="vocabulary-card" :aria-label="`${entry.word}: ${meaning}`">
        <span class="level-badge">JLPT N{{ entry.level }}</span>
        <div class="writing-block">
            <span class="furigana" lang="ja">{{ entry.furigana }}</span>
            <span class="main-writing" lang="ja">{{ entry.word }}</span>
            <span class="romaji">{{ entry.romaji }}</span>
        </div>
        <p class="meaning">{{ meaning }}</p>
        <span v-if="entry.contentId" class="content-id">{{ entry.contentId }}</span>
    </article>
</template>

<style scoped>
.vocabulary-card {
    position: relative;
    display: grid;
    min-height: 8.5rem;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1rem 1rem;
    border: 1px solid var(--border);
    border-radius: 0.9rem;
    background: var(--surface);
    box-shadow: 0 0.5rem 1.5rem rgb(33 49 77 / 6%);

    .level-badge {
        position: absolute;
        top: 0.65rem;
        right: 0.7rem;
        color: var(--muted);
        font-size: 0.72rem;
        font-weight: 700;
    }

    .writing-block {
        display: grid;
        align-content: start;
        justify-items: start;
        row-gap: 0;
        line-height: 1.05;
    }

    .furigana {
        min-height: 0;
        margin-bottom: -0.12em;
        color: var(--muted);
        font-size: 0.8rem;
        line-height: 1;
    }

    .main-writing {
        min-height: 2.2em;
        color: var(--text);
        font-size: clamp(1.8rem, 5vw, 2.5rem);
        font-weight: 700;
        line-height: 1.05;
    }

    .romaji,
    .content-id {
        color: var(--muted);
        font-size: 0.72rem;
    }

    .meaning {
        margin: 0;
        padding-top: 0.7rem;
        color: var(--text);
        font-size: 1rem;
        text-align: center;
    }

    .content-id {
        grid-column: 1 / -1;
        overflow-wrap: anywhere;
    }
}

@media (width <= 480px) {
    .vocabulary-card {
        gap: 0.5rem;
        padding-inline: 0.75rem;

        .meaning {
            font-size: 0.9rem;
        }
    }
}
</style>
