import { render, screen } from '@/test-utils'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with provided text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })
})
