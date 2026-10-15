import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import { setLocale } from '@/i18n'
import ExerciseView from '@/views/ExerciseView.vue'
import HomeView from '@/views/HomeView.vue'
import router from '@/router'

async function chooseExercise(
    wrapper: ReturnType<typeof mount>,
    type: 'kana' | 'kanji',
): Promise<void> {
    await wrapper
        .findAll('.exercise-tab')
        .find((button) => button.text().toLowerCase() === type)!
        .trigger('click')
}

describe('HomeView', () => {
    it('briefly describes the implemented exercises and links to their selection', () => {
        const wrapper = mount(HomeView, {
            global: { plugins: [router] },
        })

        expect(wrapper.text()).toContain('Vocabulary: study words from JLPT levels N1–N5.')
        expect(wrapper.text()).toContain('Kanji: practice JLPT readings and meanings from N1–N5.')
        expect(wrapper.get('a[href="#/exercises"]').text()).toBe('Go to exercises')
    })

    it('renders the setup in the selected locale', () => {
        setLocale('es')
        const wrapper = mount(ExerciseView, {
            global: { plugins: [router] },
        })

        expect(wrapper.text()).toContain('Empezar test')
        expect(wrapper.text()).toContain('Niveles JLPT')
        expect(wrapper.text()).not.toContain('Iniciar sesión o crear cuenta')
        setLocale('en')
    })

    it('offers all JLPT levels and a draggable question count', () => {
        const wrapper = mount(ExerciseView, {
            global: { plugins: [router] },
        })

        expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(5)
        expect(wrapper.get('input[type="range"]').attributes()).toMatchObject({
            min: '10',
            max: '100',
            step: '10',
        })
        expect(wrapper.text()).toContain('Start test')
        expect(wrapper.text()).not.toContain('Log in or create account')
    })

    it('offers a combined kana exercise and disables the count for a complete exam', async () => {
        const wrapper = mount(ExerciseView, {
            global: { plugins: [router] },
        })

        await chooseExercise(wrapper, 'kana')
        expect(wrapper.text()).toContain('Kana to romaji')
        expect(wrapper.findAll('select')).toHaveLength(0)
        expect(wrapper.get('.kana-direction-tab[aria-pressed="true"]').text()).toBe(
            'Kana to romaji',
        )

        await wrapper
            .get('.kana-category-gojuon .kana-choice:not(.kana-category-all)')
            .trigger('click')
        await wrapper.get('.kana-category-yoon .kana-category-all').trigger('click')
        expect(wrapper.text()).toContain('38 kana selected')

        await wrapper.get('.full-exam-option input').setValue(true)
        expect(wrapper.get('input[type="range"]').element).toHaveProperty('disabled', true)
        expect(wrapper.text()).toContain('38')
    })

    it('offers offline N1-N5 kanji reading and meaning exercises', async () => {
        const wrapper = mount(ExerciseView, {
            global: { plugins: [router] },
        })

        await chooseExercise(wrapper, 'kanji')

        expect(wrapper.text()).toContain('Kanji reading')
        expect(wrapper.text()).toContain('Kanji meaning')
        expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(5)
        expect(wrapper.text()).toContain('N5')
        expect(wrapper.text()).toContain('N4')
        expect(wrapper.text()).toContain('N1')

        const selects = wrapper.findAll('select')
        await selects[0]!.setValue('meaning')
        expect(selects[0]!.element).toHaveProperty('value', 'meaning')
    })

    it('notifies when selected kanji levels do not have Spanish translations', async () => {
        setLocale('es')
        const wrapper = mount(ExerciseView, {
            global: { plugins: [router] },
        })

        await chooseExercise(wrapper, 'kanji')
        expect(wrapper.find('.kanji-translation-notice').exists()).toBe(false)
        expect(wrapper.get('.form-grid').classes()).not.toContain('kanji-warning-visible')

        for (const level of [3, 2, 1]) {
            await wrapper.get(`input[type="checkbox"][value="${level}"]`).setValue(true)
        }

        expect(wrapper.get('.kanji-translation-notice').text()).toContain('N3, N2, N1')
        expect(wrapper.get('.kanji-translation-notice').text()).toContain(
            'no están traducidos al español',
        )
        expect(wrapper.get('.form-grid').classes()).toContain('kanji-warning-visible')
        setLocale('en')
    })

    it('explains the conversion exercise and how kana selections work', async () => {
        const wrapper = mount(ExerciseView, {
            global: { plugins: [router] },
        })

        await chooseExercise(wrapper, 'kana')
        await wrapper
            .findAll('.kana-direction-tab')
            .find((button) => button.text() === 'Convert between kana')!
            .trigger('click')

        expect(
            wrapper.get('.kana-direction-tab[aria-pressed="true"]').text(),
        ).toBe('Convert between kana')
        expect(wrapper.get('.kana-direction-help').text()).toContain(
            'write its equivalent in the other',
        )
        expect(wrapper.get('.kana-direction-help').text()).toContain(
            'these selections are combined',
        )
    })

    it('selects every main kana row and clears the category when one row is deselected', async () => {
        const wrapper = mount(ExerciseView, {
            global: { plugins: [router] },
        })

        await chooseExercise(wrapper, 'kana')
        const gojuon = wrapper.get('.kana-category-gojuon .kana-category-all')
        await gojuon.trigger('click')

        const gojuonRows = wrapper.findAll('.kana-category-gojuon .kana-category-rows .kana-choice')
        expect(gojuonRows).toHaveLength(11)
        expect(gojuonRows.every((button) => button.attributes('aria-pressed') === 'true')).toBe(
            true,
        )
        expect(wrapper.text()).toContain('46 kana selected')

        await wrapper
            .findAll('.kana-category-gojuon .kana-choice')
            .find((button) => button.text().includes('/ka'))!
            .trigger('click')

        expect(gojuon.attributes('aria-pressed')).toBe('false')
        expect(
            wrapper
                .findAll('.kana-category-gojuon .kana-choice')
                .find((button) => button.text().includes('/ka'))!
                .attributes('aria-pressed'),
        ).toBe('false')
        expect(
            wrapper
                .findAll('.kana-category-gojuon .kana-choice')
                .find((button) => button.text().endsWith('/a'))!
                .attributes('aria-pressed'),
        ).toBe('true')
        expect(wrapper.text()).toContain('41 kana selected')
    })

    it('selects both scripts and all kana from a partial selection', async () => {
        const wrapper = mount(ExerciseView, {
            global: { plugins: [router] },
        })

        await chooseExercise(wrapper, 'kana')
        await wrapper
            .get('.kana-category-gojuon .kana-choice:not(.kana-category-all)')
            .trigger('click')
        await wrapper.get('.kana-category-yoon .kana-category-all').trigger('click')
        await wrapper.get('.kana-all-button').trigger('click')

        expect(wrapper.text()).toContain('208 kana selected')
        expect(wrapper.get('.kana-script-tab[aria-pressed="true"]').text()).toContain(
            'Practice Hiragana',
        )
        expect(wrapper.findAll('.kana-script-tab[aria-pressed="true"]')).toHaveLength(2)
        expect(wrapper.get('.kana-all-button').attributes('aria-pressed')).toBe('true')
    })

    it('shows katakana row labels when hiragana is not selected', async () => {
        const wrapper = mount(ExerciseView, {
            global: { plugins: [router] },
        })
        await chooseExercise(wrapper, 'kana')
        await wrapper
            .findAll('.kana-script-tab')
            .find((button) => button.text().includes('Katakana'))!
            .trigger('click')
        await wrapper
            .findAll('.kana-script-tab')
            .find((button) => button.text().includes('Hiragana'))!
            .trigger('click')

        expect(wrapper.get('.kana-category-gojuon .kana-category-rows').text()).toContain('ア/a')
    })
})
