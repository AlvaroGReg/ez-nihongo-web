<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import { locale, t } from '@/i18n'
import type { KanjiRecord } from '@/services/kanji'

const props = defineProps<{ entry: KanjiRecord | null }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)

const reading = computed(() => {
    if (!props.entry) return ''
    return (props.entry.kun_readings[0] ?? props.entry.on_readings[0] ?? '').replace(/[.-]/g, '')
})
const meanings = computed(() => {
    if (!props.entry) return []
    return locale.value === 'es' && props.entry.jlpt >= 4 && props.entry.meanings_es?.length
        ? props.entry.meanings_es
        : props.entry.meanings_en
})

watch(
    () => props.entry,
    async (entry) => {
        await nextTick()
        if (!dialog.value) return
        if (entry && !dialog.value.open) dialog.value.showModal()
        else if (!entry && dialog.value.open) dialog.value.close()
    },
    { flush: 'post' },
)

function closeDialog(): void {
    if (dialog.value?.open) dialog.value.close()
    else emit('close')
}
</script>

<template>
    <dialog
        ref="dialog"
        class="kanji-dialog"
        :aria-labelledby="entry ? `kanji-dialog-title-${entry.id}` : undefined"
        @close="emit('close')"
        @click.self="closeDialog"
    >
        <article v-if="entry" class="kanji-detail-card">
            <span class="level-badge">JLPT N{{ entry.jlpt }}</span>
            <div class="writing-block">
                <span class="furigana" lang="ja">{{ reading }}</span>
                <h2 :id="`kanji-dialog-title-${entry.id}`" class="main-writing" lang="ja">
                    {{ entry.kanji }}
                </h2>
            </div>
            <p class="meaning">{{ meanings.join(', ') }}</p>
            <div class="kanji-details">
                <p><strong>Heisig:</strong> {{ entry.heisig_en || '—' }}</p>
                <p><strong>{{ t('kunReadings') }}:</strong> {{ entry.kun_readings.join('、') || '—' }}</p>
                <p><strong>{{ t('onReadings') }}:</strong> {{ entry.on_readings.join('、') || '—' }}</p>
                <p><strong>{{ t('nameReadings') }}:</strong> {{ entry.name_readings.join('、') || '—' }}</p>
            </div>
            <button class="close-dialog" type="button" @click="closeDialog">
                {{ t('close') }}
            </button>
        </article>
    </dialog>
</template>

<style scoped>
.kanji-dialog {
    width: min(42rem, calc(100% - 2rem));
    max-width: none;
    max-height: min(90vh, 48rem);
    padding: 0;
    overflow: auto;
    border: 0;
    border-radius: 1rem;
    background: transparent;
    color: var(--text);

    &::backdrop {
        background: rgb(15 22 35 / 58%);
        backdrop-filter: blur(3px);
    }

    .kanji-detail-card {
        position: relative;
        display: grid;
        min-height: 20rem;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        align-items: center;
        gap: 1.5rem;
        padding: 2rem;
        border: 1px solid var(--border);
        border-radius: 1rem;
        background: var(--surface);
        box-shadow: 0 1rem 3rem rgb(0 0 0 / 20%);
    }

    .level-badge {
        position: absolute;
        top: 0.9rem;
        right: 1rem;
        color: var(--muted);
        font-size: 0.8rem;
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
        font-size: 0.95rem;
        line-height: 1;
    }

    .main-writing {
        margin: 0;
        color: var(--text);
        font-size: clamp(4rem, 15vw, 6rem);
        font-weight: 700;
        line-height: 1.05;
    }

    .meaning {
        margin: 0;
        padding-top: 0.7rem;
        font-size: 1.2rem;
        text-align: center;
    }

    .kanji-details,
    .close-dialog {
        grid-column: 1 / -1;
    }

    .kanji-details {
        display: grid;
        gap: 0.55rem;
        padding-top: 0.5rem;
        border-top: 1px solid var(--border);

        p {
            margin: 0;
            line-height: 1.6;
        }
    }

    .close-dialog {
        justify-self: end;
        padding: 0.6rem 1rem;
        border: 1px solid var(--border);
        border-radius: 0.55rem;
        background: var(--secondary-background);
        color: var(--text);
        font-weight: 700;
        cursor: pointer;
    }
}

@media (width <= 480px) {
    .kanji-dialog .kanji-detail-card {
        padding: 1.25rem;
    }
}
</style>
