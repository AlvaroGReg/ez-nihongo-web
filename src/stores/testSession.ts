import { computed, reactive, type ComputedRef } from 'vue'

import { VocabularyContentError, localVocabularyProvider } from '@/services/vocabulary'
import { locale } from '@/i18n'
import { createVocabularyContentId } from '@/services/content'
import { recordVocabularyAttempt } from '@/services/vocabularyProgress'
import { auth } from '@/stores/auth'
import type { ContentProvider, LoadQuestions } from '@/services/contentProvider'
import { isRomajiCorrect } from '@/services/romaji'
import { createKanaQuestions } from '@/services/kana'
import { createKanjiAnswerOptions, KanjiContentError, loadKanjiQuestions } from '@/services/kanji'
import {
    appendHistory,
    clearActiveSession,
    loadActiveSession,
    saveActiveSession,
} from '@/services/storage'
import type {
    TestAnswer,
    AttemptEvent,
    TestConfig,
    TestResult,
    TestSession,
    VocabularyWord,
} from '@/types/domain'

export interface TestSessionStore {
    state: {
        activeSession: TestSession | null
        result: TestResult | null
        isLoading: boolean
        error: string | null
        needsResume: boolean
    }
    currentQuestion: ComputedRef<VocabularyWord | null>
    startTest: (config: TestConfig) => Promise<boolean>
    submitAnswer: (response: string) => boolean
    continueTest: () => boolean
    restoreSession: () => void
    resumeSession: () => void
    abandonSession: () => void
    clearError: () => void
}

function createResult(session: TestSession): TestResult {
    const score = session.answers.filter((answer) => answer.isCorrect).length
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        completedAt: new Date().toISOString(),
        config: session.config,
        questions: session.questions,
        answers: session.answers,
        score,
        percentage: Math.round((score / session.questions.length) * 100),
        levelsUsed: session.levelsUsed,
        attempts: session.attempts,
    }
}

function createId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function createTestSessionStore(
    provider: ContentProvider | LoadQuestions = localVocabularyProvider,
): TestSessionStore {
    const load = typeof provider === 'function' ? provider : provider.loadQuestions
    const state = reactive({
        activeSession: null as TestSession | null,
        result: null as TestResult | null,
        isLoading: false,
        error: null as string | null,
        needsResume: false,
    })

    const currentQuestion = computed(() => {
        const session = state.activeSession
        return session ? (session.questions[session.currentIndex] ?? null) : null
    })

    async function startTest(config: TestConfig): Promise<boolean> {
        state.isLoading = true
        state.error = null
        state.result = null

        try {
            let kanjiDistractorPool: VocabularyWord[] = []
            let loaded: { questions: VocabularyWord[]; levelsUsed: TestSession['levelsUsed'] }
            if (config.contentType === 'kana') {
                loaded = {
                    questions: createKanaQuestions(
                        config.kanaDirection ?? 'hiragana-to-romaji',
                        config.questionCount,
                        config.fullExam ?? false,
                        { rows: config.kanaRows ?? [], types: config.kanaTypes ?? [] },
                        config.kanaScripts ??
                            (config.kanaScript ? [config.kanaScript] : ['hiragana']),
                    ),
                    levelsUsed: [5],
                }
            } else if (config.contentType === 'kanji') {
                const kanjiLoaded = await loadKanjiQuestions(config, locale.value)
                loaded = kanjiLoaded
                kanjiDistractorPool = kanjiLoaded.distractorPool
            } else {
                loaded = await load(config, locale.value)
            }
            const questions = loaded.questions.map((question) => ({
                ...question,
                contentId:
                    question.contentId ??
                    createVocabularyContentId(question.word, question.furigana),
            }))
            const exerciseType =
                config.contentType === 'kanji'
                    ? (config.exerciseType ?? 'reading')
                    : config.contentType === 'kana'
                      ? 'writing'
                      : 'reading'
            state.activeSession = {
                version: 2,
                config,
                questions,
                ...(config.contentType === 'kanji'
                    ? {
                          answerOptions: questions.map((question) =>
                              createKanjiAnswerOptions(
                                  question,
                                  kanjiDistractorPool,
                                  exerciseType === 'meaning' ? 'meaning' : 'reading',
                              ),
                          ),
                      }
                    : {}),
                currentIndex: 0,
                answers: [],
                pendingFeedback: null,
                levelsUsed: loaded.levelsUsed,
                createdAt: new Date().toISOString(),
                sessionId: createId('session'),
                contentType: config.contentType ?? 'vocabulary',
                exerciseType,
                studyMode: 'new',
                attempts: [],
            }
            state.needsResume = false
            saveActiveSession(state.activeSession)
            return true
        } catch (error) {
            state.activeSession = null
            state.error =
                error instanceof VocabularyContentError || error instanceof KanjiContentError
                    ? error.code
                    : 'providerUnknownError'
            return false
        } finally {
            state.isLoading = false
        }
    }

    function submitAnswer(response: string): boolean {
        const session = state.activeSession
        const question = currentQuestion.value
        if (!session || !question || session.pendingFeedback !== null) return false

        const exerciseType = session.exerciseType ?? 'reading'
        const contentId =
            question.contentId ?? createVocabularyContentId(question.word, question.furigana)
        const expected =
            session.contentType === 'kanji' && exerciseType === 'meaning'
                ? question.meaning
                : session.contentType === 'kanji'
                  ? question.furigana
                  : question.romaji
        const exerciseId = `${contentId}:${session.contentType === 'kanji' ? exerciseType : 'reading'}`
        const eventId = createId('event')
        session.sessionId ??= createId('session')
        const answer: TestAnswer = {
            questionIndex: session.currentIndex,
            response,
            expected,
            isCorrect:
                session.contentType === 'kanji'
                    ? response.trim().normalize('NFC') === expected.trim().normalize('NFC')
                    : session.config.contentType === 'kana' &&
                        !session.config.kanaDirection?.endsWith('to-romaji')
                      ? response.trim().normalize('NFC') === question.romaji.normalize('NFC')
                      : isRomajiCorrect(response, question.romaji, question.furigana),
            eventId,
            contentId,
            exerciseId,
        }
        session.answers.push(answer)
        session.pendingFeedback = answer
        const attempt: AttemptEvent = {
            eventId,
            sessionId: session.sessionId,
            contentId,
            exerciseId,
            response,
            correct: answer.isCorrect,
            createdAt: new Date().toISOString(),
        }
        session.attempts ??= []
        session.attempts.push(attempt)
        saveActiveSession(session)
        if (session.contentType === 'vocabulary' && auth.state.accessToken) {
            void recordVocabularyAttempt({
                eventId: attempt.eventId,
                sessionId: attempt.sessionId,
                contentId: attempt.contentId,
                exerciseType,
                correct: attempt.correct,
            }).catch((error: unknown) => {
                console.error('Unable to record vocabulary progress', error)
            })
        }
        return true
    }

    function continueTest(): boolean {
        const session = state.activeSession
        if (!session || session.pendingFeedback === null) return false

        if (session.currentIndex === session.questions.length - 1) {
            const result = createResult(session)
            state.result = result
            state.activeSession = null
            state.needsResume = false
            clearActiveSession()
            appendHistory(result)
            return true
        }

        if (session.contentType === 'kanji') {
            const nextIndex = session.currentIndex + 1
            const nextQuestion = session.questions[nextIndex]!
            session.answerOptions ??= []
            session.answerOptions[nextIndex] = createKanjiAnswerOptions(
                nextQuestion,
                session.questions,
                session.exerciseType === 'meaning' ? 'meaning' : 'reading',
                session.answers
                    .filter((answer) => !answer.isCorrect)
                    .map((answer) => answer.response),
                session.answerOptions?.flat() ?? [],
            )
        }

        session.currentIndex += 1
        session.pendingFeedback = null
        saveActiveSession(session)
        return false
    }

    function restoreSession(): void {
        const saved = loadActiveSession()
        state.activeSession = saved
        state.needsResume = saved !== null
    }

    function resumeSession(): void {
        state.needsResume = false
    }

    function abandonSession(): void {
        state.activeSession = null
        state.needsResume = false
        clearActiveSession()
    }

    function clearError(): void {
        state.error = null
    }

    return {
        state,
        currentQuestion,
        startTest,
        submitAnswer,
        continueTest,
        restoreSession,
        resumeSession,
        abandonSession,
        clearError,
    }
}

export const testSession = createTestSessionStore()
