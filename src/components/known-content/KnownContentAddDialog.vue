<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { t, locale } from '@/i18n'
import { loadLocalCatalog, type CatalogEntry } from '@/services/vocabulary'
import { createVocabularyContentId } from '@/services/content'
import { loadKanjiCatalog, type KanjiRecord } from '@/services/kanji'
import { knownContent } from '@/stores/knownContent'
import type { KnownContentType } from '@/services/knownContent'

const emit = defineEmits<{ close: []; saved: [] }>()
const type = ref<KnownContentType>('vocabulary')
const query = ref('')
const catalogLoading = ref(true)
const catalogError = ref(false)
const vocabulary = ref<CatalogEntry[]>([])
const kanji = ref<KanjiRecord[]>([])
const customMode = ref(false)
const savingId = ref('')
const error = ref('')
const message = ref('')
const form = ref({ word: '', reading: '', romaji: '', meaning: '', kanji: '', readings: '', meanings: '' })

function vocabularyId(entry: CatalogEntry): string {
    return entry.contentId ?? createVocabularyContentId(entry.word, entry.furigana)
}

onMounted(async () => {
    try {
        const [words, ...kanjiLevels] = await Promise.all([
            loadLocalCatalog(),
            ...([1, 2, 3, 4, 5] as const).map((level) => loadKanjiCatalog(level)),
        ])
        vocabulary.value = words
        kanji.value = kanjiLevels.flat()
    } catch {
        catalogError.value = true
    } finally {
        catalogLoading.value = false
    }
})

const matches = computed(() => {
    const needle = query.value.trim().toLocaleLowerCase()
    if (!needle) return []
    if (type.value === 'vocabulary') {
        return vocabulary.value.filter((entry) =>
            [entry.word, entry.furigana, entry.romaji, entry.meaning.en, entry.meaning.es]
                .some((value) => value?.toLocaleLowerCase().includes(needle)),
        ).slice(0, 40)
    }
    return kanji.value.filter((entry) =>
        [entry.kanji, ...entry.on_readings, ...entry.kun_readings, ...entry.meanings_en, ...(entry.meanings_es ?? [])]
            .some((value) => value.toLocaleLowerCase().includes(needle)),
    ).slice(0, 40)
})

function resetFeedback(): void { error.value = ''; message.value = '' }

async function addOfficial(id: string): Promise<void> {
    resetFeedback()
    savingId.value = id
    try {
        const result = await knownContent.addCatalog(type.value, id, locale.value)
        message.value = result.alreadyPresent ? t('knownContentAlreadyPresent') : t('knownContentAdded')
        emit('saved')
    } catch {
        error.value = t('knownContentSaveError')
    } finally {
        savingId.value = ''
    }
}

function splitValues(value: string): string[] {
    return value.split(/[\n,]/).map((part) => part.trim()).filter(Boolean)
}

async function submitCustom(): Promise<void> {
    resetFeedback()
    try {
        const readings = splitValues(form.value.readings)
        const meanings = splitValues(form.value.meanings)
        const kana = /^[\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u
        if (type.value === 'vocabulary') {
            if (!kana.test(form.value.reading.trim()) || [...form.value.word.trim()].length > 100 || [...form.value.reading.trim()].length > 200 || [...form.value.romaji.trim()].length > 200 || [...form.value.meaning.trim()].length > 500) {
                error.value = t('knownContentValidationError')
                return
            }
        } else if ([...form.value.kanji.trim()].length !== 1 || !/^[\p{Script=Han}]$/u.test(form.value.kanji.trim()) || readings.length < 1 || readings.length > 20 || readings.some((reading) => !kana.test(reading) || [...reading].length > 200) || meanings.length < 1 || meanings.length > 20 || meanings.some((meaning) => [...meaning].length > 500)) {
            error.value = t('knownContentValidationError')
            return
        }
        if (type.value === 'vocabulary') {
            await knownContent.addVocabulary({ word: form.value.word, reading: form.value.reading, romaji: form.value.romaji, meaning: form.value.meaning }, locale.value)
        } else {
            await knownContent.addKanji({ kanji: form.value.kanji, readings, meanings }, locale.value)
        }
        message.value = t('knownContentAdded')
        emit('saved')
        form.value = { word: '', reading: '', romaji: '', meaning: '', kanji: '', readings: '', meanings: '' }
    } catch (cause) {
        const code = (cause as { code?: string }).code
        error.value = code === 'catalog-duplicate' ? t('knownContentCatalogDuplicate') : code === 'duplicate' ? t('knownContentDuplicate') : t('knownContentSaveError')
    }
}
</script>

<template>
    <div class="dialog-backdrop" @click.self="emit('close')">
        <section class="add-dialog" role="dialog" aria-modal="true" :aria-labelledby="'known-add-title'">
            <header class="dialog-header">
                <h2 id="known-add-title">{{ t('knownContentAddTitle') }}</h2>
                <button class="button button-quiet" type="button" @click="emit('close')">{{ t('close') }}</button>
            </header>
            <label class="field">
                <span>{{ t('knownContentType') }}</span>
                <select v-model="type" @change="customMode = false; query = ''; resetFeedback()">
                    <option value="vocabulary">{{ t('vocabularyExercise') }}</option>
                    <option value="kanji">{{ t('kanjiExercise') }}</option>
                </select>
            </label>
            <template v-if="!customMode">
                <label class="field">
                    <span>{{ t('search') }}</span>
                    <input v-model="query" type="search" :placeholder="t('knownContentSearchPlaceholder')" />
                </label>
                <p v-if="catalogLoading" role="status">{{ t('knownContentCatalogLoading') }}</p>
                <p v-else-if="catalogError" class="message message-error" role="alert">{{ t('knownContentCatalogError') }}</p>
                <p v-else-if="query && matches.length === 0" role="status">{{ t('knownContentNoMatches') }}</p>
                <ul v-if="matches.length" class="catalog-results">
                    <li v-for="entry in matches" :key="type === 'vocabulary' ? vocabularyId(entry as CatalogEntry) : (entry as KanjiRecord).id">
                        <div v-if="type === 'vocabulary'">
                            <strong>{{ (entry as CatalogEntry).word }}</strong> · {{ (entry as CatalogEntry).furigana }} · {{ (entry as CatalogEntry).meaning[locale] || (entry as CatalogEntry).meaning.en }}
                            <small>N{{ (entry as CatalogEntry).level }}</small>
                        </div>
                        <div v-else>
                            <strong>{{ (entry as KanjiRecord).kanji }}</strong> · {{ (entry as KanjiRecord).meanings_en.join(', ') }}
                            <small>N{{ (entry as KanjiRecord).jlpt }}</small>
                        </div>
                        <button class="button button-secondary" type="button" :disabled="savingId !== ''" @click="addOfficial(type === 'vocabulary' ? vocabularyId(entry as CatalogEntry) : (entry as KanjiRecord).id)">{{ savingId === (type === 'vocabulary' ? vocabularyId(entry as CatalogEntry) : (entry as KanjiRecord).id) ? t('authSubmitting') : t('knownContentAdd') }}</button>
                    </li>
                </ul>
                <button class="button button-quiet" type="button" @click="customMode = true; resetFeedback()">{{ t('knownContentCreateCustom') }}</button>
            </template>
            <form v-else class="custom-form" @submit.prevent="submitCustom">
                <template v-if="type === 'vocabulary'">
                    <label class="field"><span>{{ t('knownContentWord') }}</span><input v-model="form.word" maxlength="100" required /></label>
                    <label class="field"><span>{{ t('knownContentReading') }}</span><input v-model="form.reading" maxlength="200" required /></label>
                    <label class="field"><span>Romaji</span><input v-model="form.romaji" maxlength="200" required /></label>
                    <label class="field"><span>{{ t('meaning') }}</span><input v-model="form.meaning" maxlength="500" required /></label>
                </template>
                <template v-else>
                    <label class="field"><span>{{ t('knownContentKanji') }}</span><input v-model="form.kanji" maxlength="2" required /></label>
                    <label class="field"><span>{{ t('knownContentReadings') }}</span><textarea v-model="form.readings" :placeholder="t('knownContentArrayHint')" required /></label>
                    <label class="field"><span>{{ t('knownContentMeanings') }}</span><textarea v-model="form.meanings" :placeholder="t('knownContentArrayHint')" required /></label>
                </template>
                <button class="button button-secondary" type="submit">{{ t('knownContentSave') }}</button>
                <button class="button button-quiet" type="button" @click="customMode = false">{{ t('backToSetup') }}</button>
            </form>
            <p v-if="message" class="message" role="status">{{ message }}</p>
            <p v-if="error" class="message message-error" role="alert">{{ error }}</p>
        </section>
    </div>
</template>

<style scoped>
.dialog-backdrop { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; padding: 1rem; background: rgb(0 0 0 / 45%); }
.add-dialog { width: min(100%, 42rem); max-height: min(90vh, 52rem); overflow: auto; display: grid; gap: 1rem; padding: 1.25rem; border: 1px solid var(--border); border-radius: 1rem; background: var(--surface); color: var(--text); }
.dialog-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.dialog-header h2 { margin: 0; }
.catalog-results { display: grid; gap: .5rem; max-height: 18rem; overflow: auto; padding: 0; list-style: none; }
.catalog-results li { display: flex; justify-content: space-between; align-items: center; gap: .75rem; padding: .7rem; border: 1px solid var(--border); border-radius: .65rem; }
.catalog-results small { display: block; color: var(--muted); }
.custom-form { display: grid; gap: .8rem; }
</style>
