import '@testing-library/jest-dom/vitest'
import { beforeEach, vi } from 'vitest'

vi.mock('../db', async () => {
  return {
    getAllRecords: vi.fn().mockResolvedValue([]),
    saveRecord: vi.fn(),
    deleteRecord: vi.fn(),
    primaryValue: (record: { category: string; text?: string; term?: string; numeral?: string }) =>
      record.category === 'chinese' ? record.text : record.category === 'english' ? record.term : record.numeral,
    isDuplicate: () => false,
  }
})

beforeEach(() => localStorage.clear())
