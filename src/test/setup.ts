import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { beforeEach, vi } from 'vitest'

vi.mock('../db', async () => {
  const actual = await vi.importActual<typeof import('../db')>('../db')
  return {
    ...actual,
    getAllRecords: vi.fn().mockResolvedValue([]),
    saveRecord: vi.fn(),
    deleteRecord: vi.fn(),
    mergeBackup: vi.fn(),
  }
})

beforeEach(() => localStorage.clear())
