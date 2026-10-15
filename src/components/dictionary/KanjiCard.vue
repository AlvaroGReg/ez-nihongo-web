<script setup lang="ts">
import { computed } from 'vue'

import { locale } from '@/i18n'
import type { KanjiRecord } from '@/services/kanji'

const props = defineProps<{ entry: KanjiRecord }>()
const emit = defineEmits<{ open: [entry: KanjiRecord] }>()

const reading = computed(() =>
    (props.entry.kun_readings[0] ?? props.entry.on_readings[0] ?? '').replace(/[.-]/g, ''),
)
const meaning = computed(() => {
    const meanings =
        locale.value === 'es' && props.entry.jlpt >= 4 && props.entry.meanings_es?.length
            ? props.entry.meanings_es
            : props.entry.meanings_en
    return meanings[0] ?? ''
})
</script>

<template>
    <button
        class="kanji-card"
        type="button"
        :aria-label="`${entry.kanji}, ${reading}, ${meaning}, JLPT N${entry.jlpt}`"
        @click="emit('open', entry)"
    >
        <span class="level-badge">JLPT N{{ entry.jlpt }}</span>
        <span class="writing-block">
            <span class="furigana" lang="ja">{{ reading }}</span>
            <span class="main-writing" lang="ja">{{ entry.kanji }}</span>
        </span>
        <span class="meaning">{{ meaning }}</span>
    </button>
</template>

<style scoped>
.kanji-card {
    position: relative;
    display: grid;
    width: 100%;
    min-height: 8.5rem;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1rem 1rem;
    border: 1px solid var(--border);
    border-radius: 0.9rem;
    background: var(--surface);
    box-shadow: 0 0.5rem 1.5rem rgb(33 49 77 / 6%);
    color: var(--text);
    text-align: left;
    cursor: pointer;
    transition: transform 120ms ease, box-shadow 120ms ease;

    &:hover,
    &:focus-visible {
        box-shadow: 0 0.75rem 1.8rem rgb(33 49 77 / 12%);
        transform: translateY(-2px);
    }

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
        color: var(--text);
        font-size: clamp(2.4rem, 7vw, 3.25rem);
        font-weight: 700;
        line-height: 1.05;
    }

    .meaning {
        margin: 0;
        padding-top: 0.7rem;
        font-size: 1rem;
        text-align: center;
    }
}

@media (width <= 480px) {
    .kanji-card {
        gap: 0.5rem;
        padding-inline: 0.75rem;

        .meaning {
            font-size: 0.9rem;
        }
    }
}
</style>
