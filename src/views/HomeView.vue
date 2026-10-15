<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { t } from '@/i18n'
import { kanaEntries, kanaRowIds, kanaTypes, selectKanaEntries } from '@/services/kana'
import { testSession } from '@/stores/testSession'
import type { KanaDirection, KanaRow, KanaScript, KanaType, JlptLevel } from '@/types/domain'

const router = useRouter()
const selectedLevels = ref<JlptLevel[]>([5])
const questionCount = ref(10)
const exerciseType = ref<'vocabulary' | KanaScript>('vocabulary')
const kanaDirection = ref<KanaDirection>('hiragana-to-romaji')
const selectedKanaRows = ref<KanaRow[]>([])
const selectedKanaTypes = ref<KanaType[]>([])
const fullExam = ref(false)
const validationError = ref('')

const levels = [
    { value: 5 as JlptLevel, label: 'N5' },
    { value: 4 as JlptLevel, label: 'N4' },
    { value: 3 as JlptLevel, label: 'N3' },
    { value: 2 as JlptLevel, label: 'N2' },
    { value: 1 as JlptLevel, label: 'N1' },
]
const hasApiError = computed(() => testSession.state.error !== null)
const isKanaExercise = computed(() => exerciseType.value !== 'vocabulary')
const selectedKanaEntries = computed(() =>
    selectKanaEntries({ rows: selectedKanaRows.value, types: selectedKanaTypes.value }),
)
const hasExplicitAllKanaSelection = computed(
    () =>
        selectedKanaEntries.value.length === kanaEntries.length &&
        (selectedKanaRows.value.length > 0 || selectedKanaTypes.value.length > 0),
)

function selectAllKana(): void {
    selectedKanaRows.value = []
    selectedKanaTypes.value = [...kanaTypes]
}

function rowsForKanaType(type: KanaType): KanaRow[] {
    return [...new Set(kanaEntries.filter((entry) => entry.type === type).map((entry) => entry.row))]
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

function toggleKanaType(type: KanaType, event: Event): void {
    const selected = (event.target as HTMLInputElement).checked
    const rows = rowsForKanaType(type)
    selectedKanaRows.value = selectedKanaRows.value.filter((row) => !rows.includes(row))
    selectedKanaTypes.value = selected
        ? [...selectedKanaTypes.value.filter((item) => item !== type), type]
        : selectedKanaTypes.value.filter((item) => item !== type)
}

function toggleKanaRow(row: KanaRow, event: Event): void {
    const selected = (event.target as HTMLInputElement).checked
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

const directions = computed(() => {
    const script = exerciseType.value
    if (script === 'vocabulary') return []
    return script === 'hiragana'
        ? [
              { value: 'hiragana-to-romaji', label: t('hiraganaToRomaji') },
              { value: 'romaji-to-hiragana', label: t('romajiToHiragana') },
              { value: 'hiragana-to-katakana', label: t('hiraganaToKatakana') },
          ]
        : [
              { value: 'katakana-to-romaji', label: t('katakanaToRomaji') },
              { value: 'romaji-to-katakana', label: t('romajiToKatakana') },
              { value: 'katakana-to-hiragana', label: t('katakanaToHiragana') },
          ]
})
watch([exerciseType, selectedKanaEntries], ([script, entries]) => {
    if (script === 'hiragana') kanaDirection.value = 'hiragana-to-romaji'
    if (script === 'katakana') kanaDirection.value = 'katakana-to-romaji'
    if (script === 'vocabulary') {
        fullExam.value = false
        if (questionCount.value < 10) questionCount.value = 10
    } else if (questionCount.value > entries.length) {
        questionCount.value = entries.length
    }
})

async function startTest(): Promise<void> {
    validationError.value = ''
    testSession.clearError()

    const selectedExercise = exerciseType.value
    const isKana = selectedExercise !== 'vocabulary'
    if (!isKana && selectedLevels.value.length === 0) {
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
            levels: isKana ? [5] : [...selectedLevels.value],
            questionCount: isKana && fullExam.value ? selectedKanaEntries.value.length : questionCount.value,
            ...(isKana
                ? {
                      contentType: 'kana' as const,
                      kanaScript: selectedExercise as KanaScript,
                      kanaDirection: kanaDirection.value,
                      kanaRows: selectedKanaRows.value,
                      kanaTypes: selectedKanaTypes.value,
                      fullExam: fullExam.value,
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
            <h1 id="app-title">{{ t('appTitle') }}</h1>
            <p class="hero-copy">{{ t('homeDescription') }}</p>

            <form class="setup-form" @submit.prevent="startTest">
                <div class="form-grid">
                    <label class="field">
                        <span>{{ t('exerciseType') }}</span>
                        <select v-model="exerciseType">
                            <option value="vocabulary">{{ t('vocabularyExercise') }}</option>
                            <option value="hiragana">{{ t('hiraganaExercise') }}</option>
                            <option value="katakana">{{ t('katakanaExercise') }}</option>
                        </select>
                    </label>

                    <label v-if="exerciseType !== 'vocabulary'" class="field">
                        <span>{{ t('exerciseDirection') }}</span>
                        <select v-model="kanaDirection">
                            <option
                                v-for="direction in directions"
                                :key="direction.value"
                                :value="direction.value"
                            >
                                {{ direction.label }}
                            </option>
                        </select>
                    </label>

                    <fieldset v-if="exerciseType === 'vocabulary'" class="field level-fieldset">
                        <legend>{{ t('jlptLevels') }}</legend>
                        <div class="level-options">
                            <label v-for="level in levels" :key="level.value" class="check-option">
                                <input
                                    v-model="selectedLevels"
                                    type="checkbox"
                                    :value="level.value"
                                />
                                <span>{{ level.label }}</span>
                            </label>
                        </div>
                    </fieldset>

                    <fieldset v-if="isKanaExercise" class="field kana-map-field">
                        <legend>{{ t('kanaMap') }}</legend>
                        <p class="kana-map-hint">{{ t('kanaMapHint') }}</p>
                        <p class="kana-map-count">
                            {{ t('kanaSelectedCount', { count: selectedKanaEntries.length }) }}
                        </p>
                        <button
                            class="button button-secondary kana-select-all"
                            type="button"
                            :disabled="hasExplicitAllKanaSelection"
                            @click="selectAllKana"
                        >
                            {{ t('selectAllKana') }}
                        </button>
                        <div class="kana-map-filter-groups">
                            <fieldset class="field kana-filter-group">
                                <legend>{{ t('kanaRows') }}</legend>
                                <div class="kana-map-options">
                                    <label
                                        v-for="row in kanaRowIds"
                                        :key="row"
                                        class="check-option kana-option"
                                    >
                                        <input
                                            type="checkbox"
                                            :value="row"
                                            :checked="isKanaRowSelected(row)"
                                            @change="toggleKanaRow(row, $event)"
                                        />
                                        <span>{{ row }}</span>
                                    </label>
                                </div>
                            </fieldset>
                            <fieldset class="field kana-filter-group">
                                <legend>{{ t('kanaTypes') }}</legend>
                                <div class="kana-map-options kana-type-options">
                                    <label
                                        v-for="type in kanaTypes"
                                        :key="type"
                                        class="check-option kana-option"
                                    >
                                        <input
                                            type="checkbox"
                                            :value="type"
                                            :checked="isKanaTypeSelected(type)"
                                            @change="toggleKanaType(type, $event)"
                                        />
                                        <span>{{ t(type) }}</span>
                                    </label>
                                </div>
                            </fieldset>
                        </div>
                    </fieldset>

                    <label class="field">
                        <span class="range-label">
                            <span>{{ t(isKanaExercise ? 'questionCount' : 'numberOfWords') }}</span>
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
                            :aria-label="t(isKanaExercise ? 'questionCount' : 'numberOfWords')"
                            :disabled="fullExam"
                        />
                        <span v-if="!fullExam" class="range-limits" aria-hidden="true">
                            <span>{{ isKanaExercise ? 1 : 10 }}</span>
                            <span>{{ isKanaExercise ? selectedKanaEntries.length : 100 }}</span>
                        </span>
                    </label>

                    <label
                        v-if="exerciseType !== 'vocabulary'"
                        class="check-option full-exam-option"
                    >
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
    min-height: calc(100vw - #{var(--header-height)});

    .kana-map-field {
        grid-column: 1 / -1;
    }

    .kana-map-hint,
    .kana-map-count {
        margin: 0;
        color: var(--muted);
        font-weight: 400;
    }

    .kana-map-filter-groups {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(10rem, 1fr);
        gap: 1rem;
    }

    .kana-filter-group {
        gap: 0.6rem;
    }

    .kana-map-options {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(3.5rem, 1fr));
        gap: 0.5rem;
    }

    .kana-type-options {
        grid-template-columns: 1fr;
    }

    .kana-option {
        padding: 0.55rem 0.35rem;
    }
}

@media (max-width: 600px) {
    .setup-page .kana-map-filter-groups {
        grid-template-columns: 1fr;
    }
}
</style>
