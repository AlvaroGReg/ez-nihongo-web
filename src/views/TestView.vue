<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { t } from '@/i18n'
import { testSession } from '@/stores/testSession'

const router = useRouter()
const response = ref('')
const inputError = ref('')
const responseInput = ref<HTMLInputElement | null>(null)
const feedbackPanel = ref<HTMLElement | null>(null)
const currentQuestion = testSession.currentQuestion
const isKana = computed(() => testSession.state.activeSession?.contentType === 'kana')
const isKanji = computed(() => testSession.state.activeSession?.contentType === 'kanji')
const isMeaningExercise = computed(
    () => testSession.state.activeSession?.exerciseType === 'meaning',
)
const showReadingHint = ref(false)
const answerOptions = computed(() => {
    const session = testSession.state.activeSession
    return session?.answerOptions?.[session.currentIndex] ?? []
})
const pendingFeedback = computed(() => testSession.state.activeSession?.pendingFeedback ?? null)
const promptLabel = computed(() => {
    const session = testSession.state.activeSession
    if (session?.contentType === 'kanji') {
        return t(isMeaningExercise.value ? 'kanjiMeaningPrompt' : 'kanjiReadingPrompt', {
            levels: session.config.levels.map((level) => `N${level}`).join(' + '),
        })
    }
    const direction = testSession.state.activeSession?.config.kanaDirection ?? 'hiragana-to-romaji'
    const labels: Record<string, string> = {
        'hiragana-to-romaji': 'kanaToRomaji',
        'katakana-to-romaji': 'kanaToRomaji',
        'romaji-to-hiragana': 'romajiToKana',
        'romaji-to-katakana': 'romajiToKana',
        'hiragana-to-katakana': 'kanaConversion',
        'katakana-to-hiragana': 'kanaConversion',
    }
    return t(isKana.value ? (labels[direction] ?? 'kanaToRomaji') : 'jlptPractice', {
        levels:
            testSession.state.activeSession?.config.levels
                .map((level) => `N${level}`)
                .join(' + ') ?? '',
    })
})
const hasFallbackLevels = computed(() => {
    const session = testSession.state.activeSession
    return session?.levelsUsed.some((level) => !session.config.levels.includes(level)) ?? false
})

function focusResponse(): void {
    void nextTick(() => responseInput.value?.focus())
}

function focusFeedback(): void {
    void nextTick(() => feedbackPanel.value?.focus())
}

function submitAnswer(): void {
    inputError.value = ''
    if (response.value.trim() === '') {
        inputError.value = isKana.value ? 'enterAnswer' : 'enterRomanji'
        focusResponse()
        return
    }

    if (testSession.submitAnswer(response.value)) focusFeedback()
}

function submitChoice(choice: string): void {
    if (testSession.submitAnswer(choice)) focusFeedback()
}

function continueTest(): void {
    const finished = testSession.continueTest()
    response.value = ''
    inputError.value = ''
    if (finished) {
        void router.push('/result')
    } else {
        focusResponse()
    }
}

function abandon(): void {
    testSession.abandonSession()
    void router.push('/')
}

onMounted(() => {
    if (!testSession.state.activeSession) {
        void router.replace('/')
    } else if (testSession.state.activeSession.pendingFeedback === null) {
        focusResponse()
    }
})

watch(
    () => testSession.state.activeSession?.currentIndex,
    () => {
        showReadingHint.value = false
        if (testSession.state.activeSession?.pendingFeedback === null) focusResponse()
    },
)
</script>

<template>
    <main v-if="testSession.state.activeSession && currentQuestion" class="page-shell test-page">
        <header class="test-header">
            <div>
                <p class="eyebrow">
                    {{ promptLabel }}
                </p>
                <p class="progress-label">
                    {{ t('question') }} {{ testSession.state.activeSession.currentIndex + 1 }}
                    {{ t('of') }} {{ testSession.state.activeSession.questions.length }}
                </p>
            </div>
            <button class="button button-quiet" type="button" @click="abandon">
                {{ t('abandon') }}
            </button>
        </header>

        <p v-if="hasFallbackLevels" class="message message-info">{{ t('fallbackNotice') }}</p>

        <section class="question-card" aria-labelledby="question-word">
            <p class="question-index">
                {{ testSession.state.activeSession.currentIndex + 1 }} /
                {{ testSession.state.activeSession.questions.length }}
            </p>
            <h1 id="question-word" class="japanese-word">{{ currentQuestion.word }}</h1>
            <p v-if="!isKanji && currentQuestion.furigana" class="furigana">
                {{ currentQuestion.furigana }}
            </p>

            <p v-if="isKanji" class="kanji-question-instruction">
                {{ t(isMeaningExercise ? 'chooseMeaning' : 'chooseReading') }}
            </p>

            <div v-if="isKanji && isMeaningExercise" class="kanji-reading-hint">
                <button
                    v-if="!showReadingHint && !testSession.state.activeSession.pendingFeedback"
                    class="button button-quiet"
                    type="button"
                    @click="showReadingHint = true"
                >
                    {{ t('showReadingHint') }}
                </button>
                <p v-if="showReadingHint" class="furigana" aria-live="polite">
                    {{ t('readingHint') }}: {{ currentQuestion.furigana }}
                </p>
            </div>

            <div
                v-if="isKanji && !testSession.state.activeSession.pendingFeedback"
                class="kanji-answer-options"
                role="group"
                :aria-label="t(isMeaningExercise ? 'chooseMeaning' : 'chooseReading')"
            >
                <button
                    v-for="option in answerOptions"
                    :key="option"
                    class="button button-secondary kanji-answer-option"
                    type="button"
                    @click="submitChoice(option)"
                >
                    {{ option }}
                </button>
            </div>

            <form
                v-if="!isKanji && !testSession.state.activeSession.pendingFeedback"
                class="answer-form"
                @submit.prevent="submitAnswer"
            >
                <label class="field" for="romanji-answer">
                    <span>{{ t(isKana ? 'yourAnswer' : 'romanjiAnswer') }}</span>
                    <input
                        id="romanji-answer"
                        ref="responseInput"
                        v-model="response"
                        type="text"
                        autocomplete="off"
                        autocapitalize="none"
                        spellcheck="false"
                        :aria-invalid="Boolean(inputError)"
                    />
                </label>
                <p v-if="inputError" class="message message-error" role="alert">
                    {{ t(inputError) }}
                </p>
                <button class="button button-primary button-wide" type="submit">
                    {{ t('checkAnswer') }}
                </button>
            </form>

            <section
                v-if="pendingFeedback"
                ref="feedbackPanel"
                class="feedback"
                tabindex="-1"
                :class="{
                    'feedback-correct': pendingFeedback?.isCorrect,
                }"
                role="status"
                @keydown.enter.prevent="continueTest"
            >
                <p class="feedback-title">
                    {{ pendingFeedback?.isCorrect ? t('correct') : t('notQuite') }}
                </p>
                <p>
                    {{ t('yourAnswer') }}:
                    <strong>{{ pendingFeedback?.response }}</strong>
                </p>
                <p v-if="!isKana">
                    {{ t('meaning') }}:
                    <strong>{{ currentQuestion.meaning }}</strong>
                </p>
                <p
                    v-if="
                        isKana ||
                        (!isKanji && !pendingFeedback?.isCorrect) ||
                        (isKanji && !isMeaningExercise)
                    "
                >
                    {{
                        t(isKanji ? 'correctAnswer' : isKana ? 'correctAnswer' : 'correctRomanji')
                    }}:
                    <strong>{{ pendingFeedback?.expected }}</strong>
                </p>
                <button
                    class="button button-primary button-wide"
                    type="button"
                    @click="continueTest"
                >
                    {{ t('continue') }}
                </button>
            </section>
        </section>
    </main>
</template>

<style lang="scss">
.test-page .question-card {
    margin-inline: auto;
    margin-top: 1.5rem;
    text-align: center;
}

.kanji-question-instruction {
    color: var(--muted);
}

.kanji-reading-hint {
    margin-block: 1rem;
}

.kanji-answer-options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    margin-top: 1.5rem;
}

.kanji-answer-option {
    min-height: 3.5rem;
    font-size: 1.1rem;
}

@media (max-width: 480px) {
    .kanji-answer-options {
        grid-template-columns: 1fr;
    }
}
</style>
