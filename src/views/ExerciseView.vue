<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { locale, t } from '@/i18n'
import { kanaEntries, kanaTypes, selectKanaEntries } from '@/services/kana'
import { testSession } from '@/stores/testSession'
import type { KanaDirection, KanaRow, KanaScript, KanaType, JlptLevel } from '@/types/domain'

const router = useRouter()
const route = useRoute()
const exerciseTypes = ['vocabulary', 'kanji', 'kana'] as const
type ExerciseType = (typeof exerciseTypes)[number]
const availableLevels: JlptLevel[] = [5, 4, 3, 2, 1]
const validKanaDirections: KanaDirection[] = [
    'hiragana-to-romaji',
    'romaji-to-hiragana',
    'hiragana-to-katakana',
]
const kanaScripts: KanaScript[] = ['hiragana', 'katakana']
const kanaRows: KanaRow[] = [
    'a',
    'ka',
    'sa',
    'ta',
    'na',
    'ha',
    'ma',
    'ya',
    'ra',
    'wa',
    'n',
    'ga',
    'za',
    'da',
    'ba',
    'pa',
    'kya',
    'sha',
    'cha',
    'nya',
    'hya',
    'mya',
    'rya',
    'gya',
    'ja',
    'bya',
    'pya',
]

function queryValue(key: string): string | undefined {
    const value = route.query[key]
    return typeof value === 'string' ? value : undefined
}

function queryList<T extends string>(key: string, allowed: readonly T[], fallback: T[]): T[] {
    const value = queryValue(key)
    if (value === undefined) return fallback
    const requested = value.split(',')
    return allowed.filter((item) => requested.includes(item))
}

function queryLevels(): JlptLevel[] {
    const value = queryValue('levels')
    if (value === undefined) return [5]
    return availableLevels.filter((level) => value.split(',').includes(String(level)))
}

function queryCount(): number {
    const value = Number(queryValue('count'))
    const isKana = route.params.type === 'kana'
    const minimum = isKana ? 1 : 10
    const maximum = isKana ? kanaEntries.length * kanaScripts.length : 100
    return Number.isInteger(value) ? Math.max(minimum, Math.min(value, maximum)) : 10
}

function queryKanaScripts(): KanaScript[] {
    return queryList('scripts', kanaScripts, ['hiragana'])
}

function ensureKanaScript(value: KanaScript[]): KanaScript[] {
    return value.length > 0 ? value : ['hiragana']
}

function setIfChanged<T>(target: { value: T }, value: T): void {
    if (Array.isArray(value) && Array.isArray(target.value)) {
        const current = target.value as unknown[]
        if (
            value.length === current.length &&
            value.every((item, index) => item === current[index])
        )
            return
    } else if (target.value === value) {
        return
    }
    target.value = value
}

const initialLevels = queryLevels()
const selectedLevels = ref<JlptLevel[]>(initialLevels)
const questionCount = ref(queryCount())
const exerciseType = computed<ExerciseType>(() =>
    exerciseTypes.includes(route.params.type as ExerciseType)
        ? (route.params.type as ExerciseType)
        : 'vocabulary',
)
const kanjiExerciseType = ref<'reading' | 'meaning'>(
    queryValue('kanjiType') === 'meaning' ? 'meaning' : 'reading',
)
const selectedKanjiLevels = ref<JlptLevel[]>([...initialLevels])
const kanaDirection = ref<KanaDirection>(
    queryList('direction', validKanaDirections, ['hiragana-to-romaji'])[0] ?? 'hiragana-to-romaji',
)
const selectedKanaScripts = ref<KanaScript[]>(ensureKanaScript(queryKanaScripts()))
const selectedKanaRows = ref<KanaRow[]>(queryList('rows', kanaRows, []))
const selectedKanaTypes = ref<KanaType[]>(queryList('types', kanaTypes, []))
const fullExam = ref(queryValue('full') === '1')
const validationError = ref('')

const levels = [
    { value: 5 as JlptLevel, label: 'N5' },
    { value: 4 as JlptLevel, label: 'N4' },
    { value: 3 as JlptLevel, label: 'N3' },
    { value: 2 as JlptLevel, label: 'N2' },
    { value: 1 as JlptLevel, label: 'N1' },
]
const hasApiError = computed(() => testSession.state.error !== null)
const isKanaExercise = computed(() => exerciseType.value === 'kana')
const isKanjiExercise = computed(() => exerciseType.value === 'kanji')
const displayedLevels = computed(() => levels)
const untranslatedKanjiLevels = computed(() =>
    locale.value === 'es'
        ? selectedKanjiLevels.value
              .filter((level) => level <= 3)
              .sort((left, right) => right - left)
              .map((level) => `N${level}`)
        : [],
)
const selectedContentLevels = computed({
    get: () => (isKanjiExercise.value ? selectedKanjiLevels.value : selectedLevels.value),
    set: (value: JlptLevel[]) => {
        if (isKanjiExercise.value) selectedKanjiLevels.value = value
        else selectedLevels.value = value
    },
})
const selectedKanaEntries = computed(() =>
    selectKanaEntries({ rows: selectedKanaRows.value, types: selectedKanaTypes.value }).flatMap(
        (entry) => selectedKanaScripts.value.map((script) => ({ entry, script })),
    ),
)
function selectAllKana(): void {
    selectedKanaRows.value = []
    selectedKanaTypes.value = [...kanaTypes]
    selectedKanaScripts.value = ['hiragana', 'katakana']
}

function toggleKanaScript(script: KanaScript): void {
    selectedKanaScripts.value = selectedKanaScripts.value.includes(script)
        ? selectedKanaScripts.value.filter((item) => item !== script)
        : [...selectedKanaScripts.value, script]
    if (selectedKanaScripts.value.length === 0) selectedKanaScripts.value = [script]
}

function kanaRowLabel(row: KanaRow): string {
    const entry = kanaEntries.find((item) => item.row === row)!
    const displayScript = selectedKanaScripts.value.includes('hiragana') ? 'hiragana' : 'katakana'
    return `${entry[displayScript]}/${row}`
}

function rowsForKanaType(type: KanaType): KanaRow[] {
    return [
        ...new Set(kanaEntries.filter((entry) => entry.type === type).map((entry) => entry.row)),
    ]
}

function kanaTypeForRow(row: KanaRow): KanaType {
    return kanaEntries.find((entry) => entry.row === row)!.type
}

function isKanaTypeSelected(type: KanaType): boolean {
    return (
        selectedKanaTypes.value.includes(type) ||
        rowsForKanaType(type).every((row) => selectedKanaRows.value.includes(row))
    )
}

function isKanaRowSelected(row: KanaRow): boolean {
    return (
        selectedKanaRows.value.includes(row) ||
        selectedKanaTypes.value.includes(kanaTypeForRow(row))
    )
}

function toggleKanaType(type: KanaType, selected: boolean): void {
    const rows = rowsForKanaType(type)
    selectedKanaRows.value = selectedKanaRows.value.filter((row) => !rows.includes(row))
    selectedKanaTypes.value = selected
        ? [...selectedKanaTypes.value.filter((item) => item !== type), type]
        : selectedKanaTypes.value.filter((item) => item !== type)
}

function toggleKanaRow(row: KanaRow, selected: boolean): void {
    const type = kanaTypeForRow(row)
    if (selectedKanaTypes.value.includes(type)) {
        selectedKanaTypes.value = selectedKanaTypes.value.filter((item) => item !== type)
        selectedKanaRows.value = [
            ...selectedKanaRows.value,
            ...rowsForKanaType(type).filter((item) => item !== row),
        ]
    }

    selectedKanaRows.value = selected
        ? [...new Set([...selectedKanaRows.value, row])]
        : selectedKanaRows.value.filter((item) => item !== row)
}

const directions = computed<{ value: KanaDirection; label: string }[]>(() => {
    if (!isKanaExercise.value) return []
    return [
        { value: 'hiragana-to-romaji', label: t('kanaToRomaji') },
        { value: 'romaji-to-hiragana', label: t('romajiToKana') },
        { value: 'hiragana-to-katakana', label: t('kanaConversion') },
    ]
})
watch([exerciseType, selectedKanaEntries], ([type, entries]) => {
    if (type === 'kana' && !directions.value.some(({ value }) => value === kanaDirection.value)) {
        kanaDirection.value = 'hiragana-to-romaji'
    }
    if (type !== 'kana') {
        fullExam.value = false
        if (questionCount.value < 10) questionCount.value = 10
    } else if (questionCount.value > entries.length) {
        questionCount.value = entries.length
    }
})

function applyQueryConfiguration(): void {
    const nextLevels = queryLevels()
    setIfChanged(selectedLevels, nextLevels)
    setIfChanged(selectedKanjiLevels, [...nextLevels])
    setIfChanged(questionCount, queryCount())
    setIfChanged(kanjiExerciseType, queryValue('kanjiType') === 'meaning' ? 'meaning' : 'reading')
    setIfChanged(
        kanaDirection,
        queryList('direction', validKanaDirections, ['hiragana-to-romaji'])[0] ??
            'hiragana-to-romaji',
    )
    setIfChanged(selectedKanaScripts, ensureKanaScript(queryKanaScripts()))
    setIfChanged(selectedKanaRows, queryList('rows', kanaRows, []))
    setIfChanged(selectedKanaTypes, queryList('types', kanaTypes, []))
    setIfChanged(fullExam, queryValue('full') === '1')
}

watch(() => route.query, applyQueryConfiguration)

function updateUrlConfiguration(): void {
    const query: Record<string, string> = {}
    const addList = (key: string, values: readonly string[], defaults: readonly string[]) => {
        if (
            values.length !== defaults.length ||
            values.some((value, index) => value !== defaults[index])
        ) {
            query[key] = values.join(',')
        }
    }

    if (isKanaExercise.value) {
        if (!fullExam.value && questionCount.value !== 10) query.count = String(questionCount.value)
        if (fullExam.value) query.full = '1'
        if (kanaDirection.value !== 'hiragana-to-romaji') query.direction = kanaDirection.value
        addList('scripts', selectedKanaScripts.value, ['hiragana'])
        addList('rows', selectedKanaRows.value, [])
        addList('types', selectedKanaTypes.value, [])
    } else {
        const selected = selectedContentLevels.value
        addList('levels', selected.map(String), ['5'])
        if (questionCount.value !== 10) query.count = String(questionCount.value)
        if (isKanjiExercise.value && kanjiExerciseType.value !== 'reading') {
            query.kanjiType = kanjiExerciseType.value
        }
    }

    if (JSON.stringify(query) !== JSON.stringify(route.query)) {
        void router.replace({ path: route.path, query })
    }
}

watch(
    [
        exerciseType,
        selectedLevels,
        selectedKanjiLevels,
        questionCount,
        kanjiExerciseType,
        kanaDirection,
        selectedKanaScripts,
        selectedKanaRows,
        selectedKanaTypes,
        fullExam,
    ],
    updateUrlConfiguration,
    { deep: true },
)

async function startTest(): Promise<void> {
    validationError.value = ''
    testSession.clearError()

    const isKana = isKanaExercise.value
    if (!isKana && selectedContentLevels.value.length === 0) {
        validationError.value = 'chooseLevelError'
        return
    }

    const minimumQuestions = isKana ? 1 : 10
    const maximumQuestions = isKana ? selectedKanaEntries.value.length : 100
    if (
        !fullExam.value &&
        (questionCount.value < minimumQuestions || questionCount.value > maximumQuestions)
    ) {
        validationError.value = 'questionCountError'
        return
    }

    if (
        await testSession.startTest({
            levels: isKana ? [5] : [...selectedContentLevels.value],
            questionCount:
                isKana && fullExam.value ? selectedKanaEntries.value.length : questionCount.value,
            ...(isKana
                ? {
                      contentType: 'kana' as const,
                      kanaScripts: [...selectedKanaScripts.value],
                      kanaDirection: kanaDirection.value,
                      kanaRows: selectedKanaRows.value,
                      kanaTypes: selectedKanaTypes.value,
                      fullExam: fullExam.value,
                  }
                : isKanjiExercise.value
                  ? {
                        contentType: 'kanji' as const,
                        exerciseType: kanjiExerciseType.value,
                    }
                  : { contentType: 'vocabulary' as const }),
        })
    ) {
        await router.push('/test')
    }
}

async function retry(): Promise<void> {
    await startTest()
}

function backToSetup(): void {
    testSession.clearError()
}
</script>

<template>
    <main class="page-shell setup-page">
        <section class="hero-card" aria-labelledby="app-title">
            <p class="eyebrow">{{ t('appEyebrow') }}</p>
            <h1 id="app-title">{{ t('exerciseSelectionTitle') }}</h1>
            <p class="hero-copy">{{ t('exerciseDescription') }}</p>

            <form class="setup-form" @submit.prevent="startTest">
                <div class="exercise-tabs" role="group" :aria-label="t('exerciseType')">
                    <button
                        v-for="type in ['kana', 'vocabulary', 'kanji'] as const"
                        :key="type"
                        class="exercise-tab"
                        type="button"
                        :aria-pressed="exerciseType === type"
                        @click="router.push(`/exercises/${type}`)"
                    >
                        {{ t(type === 'vocabulary' ? 'vocabularyExercise' : `${type}Exercise`) }}
                    </button>
                </div>
                <div
                    class="form-grid"
                    :class="{
                        'kanji-form-grid': isKanjiExercise,
                        'kanji-warning-visible':
                            isKanjiExercise && untranslatedKanjiLevels.length > 0,
                    }"
                >
                    <div v-if="isKanaExercise" class="field kana-direction-field">
                        <span>{{ t('exerciseDirection') }}</span>
                        <div
                            class="kana-direction-tabs"
                            role="group"
                            :aria-label="t('exerciseDirection')"
                        >
                            <button
                                v-for="direction in directions"
                                :key="direction.value"
                                class="kana-direction-tab"
                                type="button"
                                :aria-pressed="kanaDirection === direction.value"
                                @click="kanaDirection = direction.value"
                            >
                                {{ direction.label }}
                            </button>
                        </div>
                    </div>

                    <p
                        v-if="kanaDirection === 'hiragana-to-katakana'"
                        class="kana-direction-help"
                        role="note"
                    >
                        {{ t('kanaConversionHelp') }}
                    </p>

                    <fieldset v-if="!isKanaExercise" class="field level-fieldset">
                        <legend>{{ t('jlptLevels') }}</legend>
                        <div class="level-options">
                            <label
                                v-for="level in displayedLevels"
                                :key="level.value"
                                class="check-option"
                            >
                                <input
                                    v-model="selectedContentLevels"
                                    type="checkbox"
                                    :value="level.value"
                                />
                                <span>{{ level.label }}</span>
                            </label>
                        </div>
                    </fieldset>

                    <p
                        v-if="isKanjiExercise && untranslatedKanjiLevels.length > 0"
                        class="message message-info kanji-translation-notice"
                        role="status"
                    >
                        {{
                            t('kanjiSpanishUnavailable', {
                                levels: untranslatedKanjiLevels.join(', '),
                            })
                        }}
                    </p>

                    <label v-if="isKanjiExercise" class="field kanji-exercise-field">
                        <span>{{ t('exerciseType') }}</span>
                        <select v-model="kanjiExerciseType">
                            <option value="reading">{{ t('kanjiReadingExercise') }}</option>
                            <option value="meaning">{{ t('kanjiMeaningExercise') }}</option>
                        </select>
                    </label>

                    <fieldset v-if="isKanaExercise" class="field kana-map-field">
                        <legend>{{ t('kanaPractice') }}</legend>
                        <div class="kana-script-tabs" role="group" :aria-label="t('kanaScripts')">
                            <button
                                v-for="script in ['hiragana', 'katakana'] as const"
                                :key="script"
                                class="kana-script-tab"
                                type="button"
                                :aria-pressed="selectedKanaScripts.includes(script)"
                                @click="toggleKanaScript(script)"
                            >
                                {{ t(script) }}
                            </button>
                        </div>
                        <button
                            class="kana-all-button"
                            type="button"
                            :aria-pressed="
                                selectedKanaScripts.length === 2 &&
                                selectedKanaEntries.length === kanaEntries.length * 2
                            "
                            @click="selectAllKana"
                        >
                            {{ t('allKana') }}
                        </button>
                        <p class="kana-map-count">
                            {{ t('kanaSelectedCount', { count: selectedKanaEntries.length }) }}
                        </p>
                        <div class="kana-map-filter-groups">
                            <section
                                v-for="type in kanaTypes"
                                :key="type"
                                class="kana-category"
                                :class="`kana-category-${type}`"
                            >
                                <h2>{{ t(type) }}</h2>
                                <button
                                    class="kana-choice kana-category-all"
                                    type="button"
                                    :aria-pressed="isKanaTypeSelected(type)"
                                    @click="toggleKanaType(type, !isKanaTypeSelected(type))"
                                >
                                    {{ t(`all${type[0]!.toUpperCase()}${type.slice(1)}`) }}
                                </button>
                                <div class="kana-category-rows">
                                    <button
                                        v-for="row in rowsForKanaType(type)"
                                        :key="row"
                                        class="kana-choice"
                                        type="button"
                                        :aria-pressed="isKanaRowSelected(row)"
                                        @click="toggleKanaRow(row, !isKanaRowSelected(row))"
                                    >
                                        {{ kanaRowLabel(row) }}
                                    </button>
                                </div>
                            </section>
                        </div>
                    </fieldset>

                    <label class="field question-count-field">
                        <span class="range-label">
                            <span>
                                {{
                                    t(
                                        isKanaExercise || isKanjiExercise
                                            ? 'questionCount'
                                            : 'numberOfWords',
                                    )
                                }}
                            </span>
                            <output>
                                {{ fullExam ? selectedKanaEntries.length : questionCount }}
                            </output>
                        </span>
                        <input
                            v-model.number="questionCount"
                            class="range-input"
                            type="range"
                            :min="isKanaExercise ? 1 : 10"
                            :max="isKanaExercise ? selectedKanaEntries.length : 100"
                            :step="isKanaExercise ? 1 : 10"
                            :aria-label="
                                t(
                                    isKanaExercise || isKanjiExercise
                                        ? 'questionCount'
                                        : 'numberOfWords',
                                )
                            "
                            :disabled="fullExam"
                        />
                        <span v-if="!fullExam" class="range-limits" aria-hidden="true">
                            <span>{{ isKanaExercise ? 1 : 10 }}</span>
                            <span>{{ isKanaExercise ? selectedKanaEntries.length : 100 }}</span>
                        </span>
                    </label>

                    <label v-if="isKanaExercise" class="check-option full-exam-option">
                        <input v-model="fullExam" type="checkbox" />
                        <span>{{ t('fullKanaExam') }}</span>
                    </label>
                </div>

                <p v-if="validationError" class="message message-error" role="alert">
                    {{ t(validationError) }}
                </p>
                <div v-if="hasApiError" class="error-panel" role="alert">
                    <p class="message message-error">{{ t(testSession.state.error ?? '') }}</p>
                    <div class="button-row">
                        <button class="button button-secondary" type="button" @click="retry">
                            {{ t('retry') }}
                        </button>
                        <button class="button button-quiet" type="button" @click="backToSetup">
                            {{ t('backToSetup') }}
                        </button>
                    </div>
                </div>

                <button
                    class="button button-primary button-wide"
                    type="submit"
                    :disabled="testSession.state.isLoading"
                >
                    {{ testSession.state.isLoading ? t('loadingTest') : t('startTest') }}
                </button>
            </form>
        </section>
    </main>
</template>

<style lang="scss">
.setup-page {
    width: min(100% - 2rem, 1560px);
    min-height: calc(100vh - var(--header-height));
    align-items: start;

    .hero-card {
        max-width: none;
    }

    .exercise-tabs {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.5rem;
    }

    .exercise-tab {
        min-height: 3rem;
        border: 1px solid var(--field-border);
        border-radius: 0.7rem;
        background: var(--surface);
        color: var(--field-label);
        font-weight: 700;
    }

    .exercise-tab[aria-pressed='true'] {
        border-color: #5167c7;
        background: var(--selected-background);
        color: var(--selected-text);
    }

    .kanji-form-grid {
        grid-template-areas: 'levels exercise' 'count .';

        &.kanji-warning-visible {
            grid-template-areas: 'levels exercise' 'count notice';
        }

        .level-fieldset {
            grid-area: levels;
        }

        .kanji-exercise-field {
            grid-area: exercise;
        }

        .question-count-field {
            grid-area: count;
        }

        .kanji-translation-notice {
            grid-area: notice;
            align-self: center;
            margin: 0;
        }
    }

    .kana-direction-tabs {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.5rem;
    }

    .kana-direction-tab {
        min-height: 3rem;
        padding: 0.5rem;
        border: 1px solid var(--field-border);
        border-radius: 0.7rem;
        background: var(--surface);
        color: var(--field-label);
        font-size: 0.9rem;
        font-weight: 700;
    }

    .kana-direction-tab[aria-pressed='true'] {
        border-color: #5167c7;
        background: var(--selected-background);
        color: var(--selected-text);
    }

    .kana-map-field {
        grid-column: 1 / -1;
        display: grid;
        gap: 0.9rem;
    }

    .kana-map-count {
        margin: 0;
        color: var(--muted);
        font-weight: 400;
    }

    .kana-direction-help {
        grid-column: 1 / -1;
        margin: 0;
        color: var(--muted);
        font-size: 0.9rem;
        font-weight: 400;
        line-height: 1.5;
    }

    .kana-script-tabs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
    }

    .kana-script-tab,
    .kana-all-button,
    .kana-choice {
        min-height: 3rem;
        border: 2px solid #5167c7;
        border-radius: 0;
        background: transparent;
        color: #5167c7;
        font-size: 1.05rem;
    }

    .kana-script-tab[aria-pressed='true'],
    .kana-choice[aria-pressed='true'] {
        background: #5167c7;
        color: white;
    }

    .kana-all-button {
        width: 100%;
    }

    .kana-map-filter-groups {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 1rem;
        margin-top: 1.5rem;
    }

    .kana-category {
        display: grid;
        align-content: start;
        gap: 0.7rem;

        h2 {
            margin: 0 0 0.35rem;
            color: #5167c7;
            text-align: center;
        }
    }

    .kana-category-rows {
        display: grid;
        gap: 0.65rem;
    }

    .kana-category-gojuon .kana-category-rows {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .kana-category-yoon .kana-category-rows {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .kana-category-all {
        font-weight: 700;
    }
}

@media (max-width: 600px) {
    .setup-page .kanji-form-grid {
        grid-template-areas: 'levels' 'exercise' 'count';

        &.kanji-warning-visible {
            grid-template-areas: 'levels' 'exercise' 'notice' 'count';
        }
    }

    .setup-page .kana-map-filter-groups {
        grid-template-columns: 1fr;
    }

    .setup-page .kana-script-tab,
    .setup-page .kana-all-button,
    .setup-page .kana-choice {
        min-height: 2.65rem;
        font-size: 0.9rem;
    }
}
</style>
