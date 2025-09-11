import { render as rtlRender, type RenderOptions } from '@testing-library/react'
import type { ReactElement, PropsWithChildren } from 'react'

function Providers({ children }: PropsWithChildren) {
  return children
}

export const render = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  rtlRender(ui, { wrapper: Providers, ...options })

export * from '@testing-library/react'
