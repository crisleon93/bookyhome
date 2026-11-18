import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createRoot: vi.fn(),
  render: vi.fn(),
}))

vi.mock('react-dom/client', () => ({
  createRoot: mocks.createRoot,
}))
vi.mock('../App.jsx', () => ({ default: () => null }))
vi.mock('../index.css', () => ({}))

describe('main.jsx bootstrap', () => {
  beforeEach(() => {
    vi.resetModules()
    mocks.createRoot.mockReturnValue({ render: mocks.render })
    mocks.createRoot.mockClear()
    mocks.render.mockClear()
    document.body.innerHTML = '<div id="app-favicon"></div><div id="root"></div>'
  })

  it('sets the favicon and mounts the React application in root', async () => {
    const root = document.getElementById('root')

    await import('../main.jsx')

    expect(document.getElementById('app-favicon').href).toContain('icono')
    expect(mocks.createRoot).toHaveBeenCalledWith(root)
    expect(mocks.render).toHaveBeenCalledOnce()
  })
})
