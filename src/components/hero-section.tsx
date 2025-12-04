import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="relative pt-[216px] pb-16 bg-background">
      <div className="max-w-[1060px] mx-auto px-4">
        <div className="flex flex-col items-center gap-12">
          {/* Hero Content */}
          <div className="max-w-[937px] flex flex-col items-center gap-3">
            <div className="flex flex-col items-center gap-6">
              <h1 className="max-w-[748px] text-center text-foreground text-5xl md:text-[80px] font-normal leading-tight md:leading-[96px] font-serif">
                Smart Grape Farming with VineSight
              </h1>
              <p className="max-w-[506px] text-center text-muted-foreground text-lg font-medium leading-7">
                Transform your vineyard management with AI-powered insights, weather forecasting,
                and precision agriculture tools.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Button className="h-10 px-12 rounded-full font-medium text-sm">
              Start for free
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
