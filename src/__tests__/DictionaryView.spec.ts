import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import DictionaryView from '@/views/DictionaryView.vue'

describe('DictionaryView', () => {
    it('shows the hiragana and katakana charts in that order with romaji readings', () => {
        const wrapper = mount(DictionaryView)

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

    it('switches to the selected dictionary tab', async () => {
        const wrapper = mount(DictionaryView)

        await wrapper.get('#dictionary-tab-vocabulary').trigger('click')

        expect(wrapper.find('#dictionary-panel-kana').exists()).toBe(false)
        expect(wrapper.get('#dictionary-panel-vocabulary').text()).toContain('Vocabulary')
    })
})
