<script setup lang="ts">
import { computed } from 'vue'

import { locale } from '@/i18n'
import SearchHighlight from '@/components/dictionary/SearchHighlight.vue'
import type { RomajiSearchReading } from '@/services/kanaRomaji'
import type { KanjiRecord } from '@/services/kanji'
import { includesSearchText } from '@/utils/textSearch'

const props = defineProps<{
    entry: KanjiRecord
    searchQuery: string
    searchReadings: {
        kun: RomajiSearchReading[]
        on: RomajiSearchReading[]
    }
}>()
const emit = defineEmits<{ open: [entry: KanjiRecord] }>()

function visibleReadings(readings: RomajiSearchReading[]) {
    const matchingReadings = props.searchQuery.trim()
        ? readings.filter((reading) =>
              includesSearchText([reading.kana, ...reading.forms], props.searchQuery),
          )
        : []
    const displayedReadings = matchingReadings.length > 0 ? matchingReadings : readings.slice(0, 1)
    return displayedReadings
}

const readingFamilies = computed(() =>
    [visibleReadings(props.searchReadings.kun), visibleReadings(props.searchReadings.on)].filter(
        (readings) => readings.length > 0,
    ),
)
const meanings = computed(() =>
    locale.value === 'es' && props.entry.jlpt >= 4 && props.entry.meanings_es?.length
        ? props.entry.meanings_es
        : props.entry.meanings_en,
)
const meaning = computed(() => meanings.value[0] ?? '')
const heisigMatches = computed(
    () =>
        Boolean(props.searchQuery.trim() && props.entry.heisig_en) &&
        includesSearchText([props.entry.heisig_en ?? ''], props.searchQuery),
)
const displayedMeanings = computed(() => {
    if (props.searchQuery.trim()) {
        const matchingMeanings = meanings.value.filter((value) =>
            includesSearchText([value], props.searchQuery),
        )
        if (matchingMeanings.length > 0) return matchingMeanings
    }
    return meaning.value ? [meaning.value] : []
})
</script>

<template>
    <button
        class="kanji-card"
        type="button"
        :aria-label="`${entry.kanji}, ${entry.kun_readings.join(', ')}, ${entry.on_readings.join(', ')}, ${meaning}, JLPT N${entry.jlpt}`"
        @click="emit('open', entry)"
    >
        <span class="level-badge">JLPT N{{ entry.jlpt }}</span>
        <span class="main-writing" lang="ja">
            <SearchHighlight v-if="searchQuery.trim()" :text="entry.kanji" :query="searchQuery" />
            <template v-else>{{ entry.kanji }}</template>
        </span>
        <span class="meaning">
            <template v-for="(value, index) in displayedMeanings" :key="value">
                <span v-if="index"> · </span>
                <SearchHighlight v-if="searchQuery.trim()" :text="value" :query="searchQuery" />
                <template v-else>{{ value }}</template>
            </template>
        </span>
        <span v-if="heisigMatches" class="heisig">
            <strong>Heisig:</strong>
            <SearchHighlight :text="entry.heisig_en ?? ''" :query="searchQuery" />
        </span>
        <span class="reading-details">
            <span
                v-for="(readings, familyIndex) in readingFamilies"
                :key="familyIndex"
                class="reading-family"
            >
                <span
                    v-for="reading in readings"
                    :key="reading.kana"
                    class="reading-entry"
                    lang="ja"
                >
                    <SearchHighlight
                        v-if="searchQuery.trim()"
                        :text="reading.kana"
                        :query="searchQuery"
                    />
                    <template v-else>{{ reading.kana }}</template>
                    <span class="romaji-reading" lang="en">
                        (<template v-for="(romaji, index) in reading.forms" :key="romaji"
                            ><span v-if="index"> / </span
                            ><SearchHighlight
                                v-if="searchQuery.trim()"
                                :text="romaji"
                                :query="searchQuery"
                            /><template v-else>{{ romaji }}</template></template
                        >)
                    </span>
                </span>
            </span>
        </span>
    </button>
</template>

<style scoped>
.kanji-card {
    position: relative;
    display: grid;
    width: 100%;
    min-height: 8.5rem;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
    gap: 1rem;
    padding: 1.25rem 1rem 1rem;
    border: 1px solid var(--border);
    border-radius: 0.9rem;
    background: var(--surface);
    box-shadow: 0 0.5rem 1.5rem rgb(33 49 77 / 6%);
    color: var(--text);
    text-align: left;
    cursor: pointer;
    transition:
        transform 120ms ease,
        box-shadow 120ms ease;

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

    .main-writing {
        color: var(--text);
        font-size: clamp(2.4rem, 7vw, 3.25rem);
        font-weight: 700;
        line-height: 1.05;
    }

    .meaning {
        margin: 0;
        padding-top: 1rem;
        font-size: 1rem;
        text-align: center;
    }

    .heisig {
        grid-column: 1 / -1;
        color: var(--muted);
        font-size: 0.75rem;
    }

    .reading-details {
        display: grid;
        grid-column: 1 / -1;
        gap: 0.2rem;
        color: var(--muted);
        font-size: 0.7rem;
        line-height: 1.4;
    }

    .reading-family {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem 0.45rem;
    }

    .reading-entry {
        white-space: nowrap;
    }

    .romaji-reading {
        color: var(--muted);
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
