import { describe, expect, it } from 'vitest'
import { createBackup, parseBackup } from './db'
import type { LearningRecord } from './types'

const chineseRecord: LearningRecord = {
  id: 'record-1',
  category: 'chinese',
  text: '苹果',
  pinyin: 'píng guǒ',
  note: '一种水果',
  createdAt: '2026-10-04T00:00:00.000Z',
  updatedAt: '2026-10-04T00:00:00.000Z',
}

describe('备份文件', () => {
  it('可以生成并解析有效备份', () => {
    const backup = createBackup([chineseRecord])
    expect(parseBackup(backup).records).toEqual([chineseRecord])
  })

  it('拒绝未知或损坏的文件', () => {
    expect(() => parseBackup({ version: 1, records: [] })).toThrow('有效备份')
    expect(() => parseBackup({ app: 'little-learning-notebook', version: 1, records: [{ id: 'x' }] })).toThrow('无法识别')
  })
})
