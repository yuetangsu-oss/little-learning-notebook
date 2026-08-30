import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import * as db from './db'

describe('学习小本', () => {
  beforeEach(() => {
    vi.mocked(db.getAllRecords).mockResolvedValue([])
    localStorage.setItem('storage-notice-seen', 'yes')
  })

  it('首页显示三个独立分类', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: /孩子的.*学习小本/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /中文/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /英文/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /数学/ })).toBeInTheDocument()
  })

  it('拒绝非法数学输入', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: /数学/ }))
    await user.click(screen.getByRole('button', { name: '新增数学' }))
    await user.type(screen.getByLabelText(/阿拉伯数字/), '八')
    await user.click(screen.getByRole('button', { name: /保存记录/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('只能填写阿拉伯数字')
  })

  it('新增中文后保留在中文列表', async () => {
    const user = userEvent.setup()
    vi.mocked(db.saveRecord).mockResolvedValue({
      id: '1', category: 'chinese', text: '苹果', pinyin: 'píng guǒ', note: '一种水果',
      createdAt: '2026-08-30T00:00:00.000Z', updatedAt: '2026-08-30T00:00:00.000Z',
    })
    render(<App />)
    await user.click(await screen.findByRole('button', { name: /中文/ }))
    await user.click(screen.getByRole('button', { name: '新增中文' }))
    await user.type(screen.getByLabelText(/汉字或词语/), '苹果')
    await user.type(screen.getByLabelText(/^拼音/), 'píng guǒ')
    await user.click(screen.getByRole('button', { name: /保存记录/ }))
    await waitFor(() => expect(screen.getByText('苹果')).toBeInTheDocument())
  })
})
