<script setup lang="ts">
import { computed } from 'vue'

import { t } from '@/i18n'
import { kanaEntries } from '@/services/kana'

const basicFamilies = ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa', 'n']
const vowelOrder = ['a', 'i', 'u', 'e', 'o']
const voicedFamilies = ['ga', 'za', 'da', 'ba', 'pa']
const combinationRows = ['gya', 'ja', 'bya', 'pya']

const basicGrid = computed(() =>
    vowelOrder.flatMap((vowel) =>
        basicFamilies.map((family) =>
            kanaEntries.find(
                (entry) =>
                    entry.type === 'gojuon' &&
                    entry.row === family &&
                    (family === 'n' ? vowel === 'o' : entry.romaji.endsWith(vowel)),
            ),
        ),
    ),
)

const dakutenEntries = computed(() =>
    voicedFamilies.flatMap((family) =>
        kanaEntries.filter((entry) => entry.type === 'dakuon' && entry.row === family),
    ),
)

const combinationEntries = computed(() => kanaEntries.filter((entry) => entry.type === 'yoon'))
</script>

<template>
    <div class="kana-dictionary">
        <section
            v-for="script in ['hiragana', 'katakana'] as const"
            :key="script"
            class="kana-script"
            :aria-labelledby="`${script}-heading`"
        >
            <h2 :id="`${script}-heading`" class="script-heading">
                {{ t(script === 'hiragana' ? 'hiraganaTitle' : 'katakanaTitle') }}
            </h2>

            <div class="kana-upper-layout">
                <section class="chart-section">
                    <h3 class="section-heading">{{ t('gojuon') }}</h3>
                    <div class="chart-scroll">
                        <ul class="kana-grid basic-grid" :aria-label="t('gojuon')">
                            <li
                                v-for="(entry, index) in basicGrid"
                                :key="entry?.hiragana ?? `empty-${index}`"
                                class="kana-cell kana-cell-basic"
                            >
                                <template v-if="entry">
                                    <span class="kana-romaji">{{ entry.romaji }}</span>
                                    <span class="kana-glyph" lang="ja">{{ entry[script] }}</span>
                                </template>
                            </li>
                        </ul>
                    </div>
                </section>

                <section class="chart-section">
                    <h3 class="section-heading">{{ t('dakuon') }}</h3>
                    <div class="chart-scroll">
                        <ul class="kana-grid dakuten-grid" :aria-label="t('dakuon')">
                            <li
                                v-for="entry in dakutenEntries"
                                :key="entry.hiragana"
                                class="kana-cell kana-cell-dakuten"
                            >
                                <span class="kana-romaji">{{ entry.romaji }}</span>
                                <span class="kana-glyph" lang="ja">{{ entry[script] }}</span>
                            </li>
                        </ul>
                    </div>
                </section>
            </div>

            <section class="chart-section combination-section">
                <h3 class="section-heading">{{ t('yoon') }}</h3>
                <div class="chart-scroll">
                    <ul class="kana-grid combination-grid" :aria-label="t('yoon')">
                        <li
                            v-for="entry in combinationEntries"
                            :key="entry.hiragana"
                            class="kana-cell"
                            :class="combinationRows.includes(entry.row) ? 'kana-cell-voiced' : 'kana-cell-combination'"
                        >
                            <span class="kana-romaji">{{ entry.romaji }}</span>
                            <span class="kana-glyph" lang="ja">{{ entry[script] }}</span>
                        </li>
                    </ul>
                </div>
            </section>
        </section>
    </div>
</template>

<style scoped>
.kana-dictionary {
    display: grid;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    gap: 1rem;
}

.kana-script {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 1rem;
    background: var(--surface);
    box-shadow: 0 0.75rem 2rem rgb(33 49 77 / 6%);
}

.script-heading {
    margin-bottom: 0.85rem;
    font-size: 1.2rem;
}

.kana-upper-layout {
    display: grid;
    grid-template-columns: max-content max-content;
    align-items: start;
    gap: 1.5rem;
}

.section-heading {
    margin-bottom: 0.6rem;
    color: var(--muted);
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.kana-grid {
    display: grid;
    width: max-content;
    gap: 0.35rem;
    margin: 0;
    padding: 0;
    list-style: none;
}

.basic-grid {
    grid-template-columns: repeat(11, minmax(4rem, 1fr));
}

.dakuten-grid {
    grid-template-rows: repeat(5, auto);
    grid-auto-flow: column;
    grid-auto-columns: 4rem;
}

.combination-section {
    margin-top: 1rem;
    padding-top: 0.9rem;
    border-top: 1px solid var(--border);
}

.combination-grid {
    grid-template-rows: repeat(3, auto);
    grid-auto-flow: column;
    grid-auto-columns: 4rem;
}

.kana-cell {
    position: relative;
    display: grid;
    min-width: 4rem;
    min-height: 4rem;
    align-content: center;
    justify-items: center;
    gap: 0.05rem;
    padding: 0.45rem 0.1rem 0.1rem;
    border-radius: 0.55rem;
}

.kana-cell-basic {
    background: #a8e4f5;
}

.kana-cell-dakuten {
    background: #ffe59b;
}

.kana-cell-combination {
    background: #d3a4ee;
}

.kana-cell-voiced {
    background: #a9e3c0;
}

.kana-glyph {
    color: #282b30;
    font-size: 1.85rem;
    line-height: 1.2;
    white-space: nowrap;
}

.kana-romaji {
    position: absolute;
    top: -0.45rem;
    left: 50%;
    min-width: 2rem;
    padding: 0.1rem 0.3rem;
    border-radius: 999px;
    background: #343434;
    color: #fff;
    font-size: 0.65rem;
    font-weight: 600;
    line-height: 1.25;
    text-align: center;
    text-transform: uppercase;
    transform: translateX(-50%);
    white-space: nowrap;
}

@media (width <= 900px) {
    .kana-dictionary,
    .kana-script {
        width: 100%;
    }

    .kana-upper-layout {
        width: 100%;
        grid-template-columns: minmax(0, 1fr);
        gap: 1rem;
    }

    .chart-section {
        min-width: 0;
        max-width: 100%;
    }

    .chart-scroll {
        width: 100%;
        min-width: 0;
        max-width: 100%;
        overflow-x: auto;
        overscroll-behavior-inline: contain;
    }

    .combination-section {
        width: 100%;
    }
}
</style>
