import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import kanjiN5 from '../../public/data/jlpt-kanji/n5.json'
import { locale, setLocale } from '@/i18n'
import router from '@/router'
import DictionaryView from '@/views/DictionaryView.vue'

describe('DictionaryView', () => {
    let previousLocale = locale.value

    beforeEach(() => {
        previousLocale = locale.value
    })

    async function mountDictionary() {
        await router.push('/dictionary/kana')
        return mount(DictionaryView, { global: { plugins: [router] } })
    }

    afterEach(() => {
        setLocale(previousLocale)
        vi.unstubAllGlobals()
    })

    it('shows the hiragana and katakana charts in that order with romaji readings', async () => {
        const wrapper = await mountDictionary()

        expect(wrapper.findAll('.script-heading').map((heading) => heading.text())).toEqual([
            'Hiragana',
            'Katakana',
        ])
        expect(wrapper.find('.kana-cell').text()).toContain('あ')
        expect(wrapper.find('.kana-cell').text()).toContain('a')
        expect(wrapper.findAll('.kana-glyph').map((glyph) => glyph.text())).toContain('ア')
        expect(wrapper.find('.basic-grid').exists()).toBe(true)
        expect(wrapper.find('.dakuten-grid').exists()).toBe(true)
        expect(wrapper.find('.combination-grid').exists()).toBe(true)
        expect(wrapper.findAll('.chart-scroll')).toHaveLength(6)
        expect(wrapper.find('.kana-cell-basic .kana-romaji').text()).toBe('a')
        expect(wrapper.find('.kana-cell-basic .kana-glyph').text()).toBe('あ')
    })

    it('shows an animated loading status while a dictionary catalog is pending', async () => {
        let rejectCatalog!: (error: Error) => void
        vi.stubGlobal(
            'fetch',
            vi.fn<typeof fetch>(
                () =>
                    new Promise<Response>((_resolve, reject) => {
                        rejectCatalog = reject
                    }),
            ),
        )
        const wrapper = await mountDictionary()

        await wrapper.get('#dictionary-tab-vocabulary').trigger('click')
        await flushPromises()
        expect(router.currentRoute.value.path).toBe('/dictionary/vocabulary')

        expect(wrapper.get('[role="status"]').text()).toBe('Loading dictionary…')
        expect(wrapper.get('.loading-spinner').attributes('aria-hidden')).toBe('true')

        rejectCatalog(new Error('Catalog unavailable'))
        await flushPromises()
        expect(wrapper.find('.dictionary-loading').exists()).toBe(false)
    })

    it('shows vocabulary records and filters them by JLPT level', async () => {
        setLocale('es')
        vi.stubGlobal(
            'fetch',
            vi.fn<typeof fetch>().mockResolvedValue(
                Response.json([
                    {
                        word: '水',
                        meaning: { en: 'water', es: 'agua' },
                        furigana: 'みず',
                        romaji: 'mizu',
                        level: 4,
                    },
                    {
                        word: '猫',
                        meaning: { en: 'cat', es: 'gato' },
                        furigana: 'ねこ',
                        romaji: 'neko',
                        level: 5,
                    },
                ]),
            ),
        )
        const wrapper = await mountDictionary()

        await wrapper.get('#dictionary-tab-vocabulary').trigger('click')
        await flushPromises()

        expect(wrapper.findAll('.level-option span').map((option) => option.text())).toEqual([
            'JLPT N5',
            'JLPT N4',
            'JLPT N3',
            'JLPT N2',
            'JLPT N1',
        ])
        expect(wrapper.find('#dictionary-panel-kana').exists()).toBe(false)
        expect(wrapper.findAll('.vocabulary-card')).toHaveLength(2)
        expect(wrapper.findAll('.level-option-selected')).toHaveLength(5)
        expect(wrapper.findAll('.level-badge').map((badge) => badge.text())).toEqual([
            'JLPT N5',
            'JLPT N4',
        ])
        expect(wrapper.get('.vocabulary-card').text()).toContain('gato')
        expect(wrapper.get('.vocabulary-card').text()).not.toContain('cat')
        expect(wrapper.get('.vocabulary-card').text()).toContain('ねこ')
        expect(wrapper.get('.vocabulary-card').text()).toContain('neko')

        for (const level of [1, 2, 3, 5]) {
            await wrapper.get(`input[value="${level}"]`).setValue(false)
        }

        const visibleCards = wrapper.findAll('.vocabulary-card')
        expect(visibleCards).toHaveLength(1)
        expect(wrapper.findAll('.level-option-selected')).toHaveLength(1)
        expect(visibleCards[0]!.text()).toContain('水')
        expect(visibleCards[0]!.text()).toContain('JLPT N4')
    })

    it('shows kanji cards, filters by JLPT, and opens all readings in a modal', async () => {
        setLocale('es')
        vi.stubGlobal(
            'fetch',
            vi.fn<typeof fetch>().mockImplementation(async (input) => {
                const url = String(input)
                if (url.includes('n5.json')) return Response.json(kanjiN5)
                if (url.includes('n4.json')) {
                    return Response.json({
                        kanjis: {
                            語: {
                                grade: 2,
                                heisig_en: 'word',
                                jlpt: 4,
                                kanji: '語',
                                kun_readings: ['かた'],
                                meanings_en: ['word'],
                                meanings_es: ['palabra'],
                                name_readings: [],
                                on_readings: ['ゴ'],
                                unicode: '8A9E',
                                id: 'n4-1',
                            },
                        },
                    })
                }
                return Response.json({ kanjis: {} })
            }),
        )
        const wrapper = await mountDictionary()

        await wrapper.get('#dictionary-tab-kanji').trigger('click')
        await flushPromises()
        expect(router.currentRoute.value.path).toBe('/dictionary/kanji')
        const kanjiLevels = wrapper
            .findAll('.kanji-card .level-badge')
            .map((badge) => badge.text())
        expect([...new Set(kanjiLevels)]).toEqual(['JLPT N5', 'JLPT N4'])
        expect(wrapper.get('.translation-notice').text()).toContain('N3, N2, N1')
        expect(wrapper.get('.translation-notice').text()).toContain('no están traducidos al español')

        setLocale('en')
        await nextTick()
        expect(wrapper.get('.translation-notice').text()).toBe('')
        expect(wrapper.get('.translation-notice').attributes('aria-hidden')).toBe('true')
        setLocale('es')

        for (const level of [1, 2, 3, 4]) {
            await wrapper.get(`input[value="${level}"]`).setValue(false)
        }
        expect(wrapper.get('.translation-notice').classes()).toContain('translation-notice-hidden')

        const card = wrapper.get('.kanji-card:not(.kanji-card-expanded)')
        expect(wrapper.findAll('dialog')).toHaveLength(1)
        expect(card.text()).toContain('一')
        expect(card.text()).toContain('ひと')
        expect(card.text()).toContain('uno')
        expect(card.text()).toContain('JLPT N5')

        const dialogElement = wrapper.get('dialog').element as HTMLDialogElement
        Object.defineProperty(dialogElement, 'showModal', {
            value: () => dialogElement.setAttribute('open', ''),
        })
        Object.defineProperty(dialogElement, 'close', {
            value: () => {
                dialogElement.removeAttribute('open')
                dialogElement.dispatchEvent(new Event('close'))
            },
        })
        await card.trigger('click')
        await flushPromises()

        const dialog = wrapper.get('dialog')
        expect(dialog.attributes('open')).toBeDefined()
        expect(dialog.text()).toContain('Heisig: one')
        expect(dialog.text()).toContain('Lecturas kun')
        expect(dialog.text()).toContain('ひと.つ')
        expect(dialog.text()).toContain('Lecturas on')
        expect(dialog.text()).toContain('イチ')
        expect(dialog.text()).toContain('Lecturas de nombres')
        expect(dialog.text()).toContain('はじめ')

        await dialog.get('.close-dialog').trigger('click')
        expect(dialog.text()).not.toContain('Heisig: one')
    })
})
