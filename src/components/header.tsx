import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="w-full border-b border-border bg-background">
      <div className="max-w-[1060px] mx-auto px-4">
        <nav className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <div className="text-foreground font-semibold text-lg">VineSight</div>
            <div className="hidden md:flex items-center space-x-6">
              <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground/80">
                Products
              </Button>
              <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground/80">
                Pricing
              </Button>
              <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground/80">
                Docs
              </Button>
            </div>
          </div>
          <Button variant="ghost" className="text-foreground hover:bg-accent">
            Log in
          </Button>
        </nav>
      </div>
    </header>
  )
}
