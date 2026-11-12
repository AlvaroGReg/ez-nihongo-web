import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { addVocabulary, addKanji } = vi.hoisted(() => ({
    addVocabulary: vi.fn(),
    addKanji: vi.fn(),
}))

vi.mock('@/stores/knownContent', () => ({
    knownContent: { addVocabulary, addKanji, addCatalog: vi.fn() },
}))
vi.mock('@/services/vocabulary', () => ({ loadLocalCatalog: vi.fn().mockResolvedValue([]) }))
vi.mock('@/services/kanji', () => ({ loadKanjiCatalog: vi.fn().mockResolvedValue([]) }))

import KnownContentAddDialog from '@/components/known-content/KnownContentAddDialog.vue'

describe('KnownContentAddDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        addVocabulary.mockResolvedValue({})
        addKanji.mockResolvedValue({})
    })

    it('submits a custom vocabulary item and announces success', async () => {
        const wrapper = mount(KnownContentAddDialog, { props: { contentType: 'vocabulary' } })
        await flushPromises()
        expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
        expect(wrapper.find('form').exists()).toBe(true)
        expect(wrapper.get('select').element.value).toBe('vocabulary')
        await wrapper.findAll('button.button-quiet').find((button) => button.text().includes('Browse the catalog'))!.trigger('click')
        expect(wrapper.find('select').exists()).toBe(true)
        await wrapper.findAll('button.button-quiet').find((button) => button.text().includes('Create custom content'))!.trigger('click')
        const fields = wrapper.findAll('input')
        await fields[0]!.setValue('語彙')
        await fields[1]!.setValue('ごい')
        await fields[2]!.setValue('goi')
        await fields[3]!.setValue('vocabulary')
        await wrapper.get('form').trigger('submit')
        await flushPromises()
        expect(addVocabulary).toHaveBeenCalledWith({ word: '語彙', reading: 'ごい', romaji: 'goi', meaning: 'vocabulary' }, 'en')
        expect(wrapper.text()).toContain('Added to your known-content list.')
    })

    it('does not submit a kanji form with no readings', async () => {
        const wrapper = mount(KnownContentAddDialog, { props: { contentType: 'vocabulary' } })
        await flushPromises()
        await wrapper.get('select').setValue('kanji')
        expect(wrapper.findAll('textarea')).toHaveLength(2)
        await wrapper.findAll('input')[0]!.setValue('学')
        await wrapper.findAll('textarea')[0]!.setValue('')
        await wrapper.findAll('textarea')[1]!.setValue('study')
        await wrapper.get('form').trigger('submit')
        await flushPromises()
        expect(addKanji).not.toHaveBeenCalled()
        expect(wrapper.text()).toContain('Check the required fields and their allowed lengths and formats.')
    })
})
