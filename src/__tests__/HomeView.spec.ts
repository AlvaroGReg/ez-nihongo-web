import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import { setLocale } from '@/i18n'
import HomeView from '@/views/HomeView.vue'
import router from '@/router'

describe('HomeView', () => {
    it('renders the setup in the selected locale', () => {
        setLocale('es')
        const wrapper = mount(HomeView, {
            global: { plugins: [router] },
        })

        expect(wrapper.text()).toContain('Empezar test')
        expect(wrapper.text()).toContain('Niveles JLPT')
        expect(wrapper.text()).not.toContain('Iniciar sesión o crear cuenta')
        setLocale('en')
    })

    it('offers all JLPT levels and a draggable question count', () => {
        const wrapper = mount(HomeView, {
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

    it('offers kana direction selectors and disables the count for a complete exam', async () => {
        const wrapper = mount(HomeView, {
            global: { plugins: [router] },
        })

        await wrapper.get('select').setValue('hiragana')
        expect(wrapper.text()).toContain('Hiragana to romaji')
        expect(wrapper.findAll('select')).toHaveLength(2)

        await wrapper.get('.kana-map-options input[value="ka"]').setValue(true)
        await wrapper.get('.kana-type-options input[value="yoon"]').setValue(true)
        expect(wrapper.text()).toContain('38 kana selected')

        await wrapper.get('.full-exam-option input').setValue(true)
        expect(wrapper.get('input[type="range"]').element).toHaveProperty('disabled', true)
        expect(wrapper.text()).toContain('38')
    })

    it('selects every gojuon row and clears the type when one row is deselected', async () => {
        const wrapper = mount(HomeView, {
            global: { plugins: [router] },
        })

        await wrapper.get('select').setValue('hiragana')
        const gojuon = wrapper.get('.kana-type-options input[value="gojuon"]')
        await gojuon.setValue(true)

        const gojuonRowIds = ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa', 'n']
        const gojuonRows = wrapper
            .findAll('.kana-map-options:not(.kana-type-options) input')
            .filter((input) => gojuonRowIds.includes(input.attributes('value') ?? ''))
        expect(gojuonRows).toHaveLength(11)
        expect(gojuonRows.every((input) => (input.element as HTMLInputElement).checked)).toBe(true)
        expect(wrapper.text()).toContain('46 kana selected')

        await wrapper.get('.kana-map-options:not(.kana-type-options) input[value="ka"]').setValue(false)

        expect((gojuon.element as HTMLInputElement).checked).toBe(false)
        expect((wrapper.get('.kana-map-options:not(.kana-type-options) input[value="ka"]')
            .element as HTMLInputElement).checked).toBe(false)
        expect((wrapper.get('.kana-map-options:not(.kana-type-options) input[value="a"]')
            .element as HTMLInputElement).checked).toBe(true)
        expect(wrapper.text()).toContain('41 kana selected')
    })

    it('selects every kana row and type from a partial selection', async () => {
        const wrapper = mount(HomeView, {
            global: { plugins: [router] },
        })

        await wrapper.get('select').setValue('hiragana')
        await wrapper.get('.kana-map-options input[value="ka"]').setValue(true)
        await wrapper.get('.kana-type-options input[value="yoon"]').setValue(true)
        await wrapper.get('.kana-select-all').trigger('click')

        expect(wrapper.text()).toContain('104 kana selected')
        expect(
            wrapper
                .findAll('.kana-map-options:not(.kana-type-options) input')
                .every((input) => (input.element as HTMLInputElement).checked),
        ).toBe(true)
        expect(
            wrapper
                .findAll('.kana-type-options input')
                .every((input) => (input.element as HTMLInputElement).checked),
        ).toBe(true)
        expect(wrapper.get('.kana-select-all').element).toHaveProperty('disabled', true)
    })
})
