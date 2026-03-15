import { render } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { BrowserRouter } from 'react-router-dom'

/** Wraps component with all required providers for integration tests */
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

/** Custom render that wraps with all providers */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

// Re-export everything
export * from '@testing-library/react'

// Override render with custom version
export { customRender as render }
