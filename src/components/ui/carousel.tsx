"use client"

import * as React from 'react'
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react'

import { cn } from '@/lib/utils'

export type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>[0]

type CarouselProps = React.PropsWithChildren<{
  opts?: UseCarouselParameters
  orientation?: 'horizontal' | 'vertical'
  className?: string
  setApi?: (api: CarouselApi) => void
}>

type CarouselContextValue = {
  carouselRef: UseEmblaCarouselType[0]
  api: CarouselApi | undefined
  orientation: NonNullable<CarouselProps['orientation']>
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

const useCarouselContext = () => {
  const context = React.useContext(CarouselContext)
  if (!context) {
    throw new Error('Carousel components must be used within <Carousel>')
  }
  return context
}

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ opts, orientation = 'horizontal', setApi, className, children, ...props }, ref) => {
    const [carouselRef, api] = useEmblaCarousel({
      ...opts,
      axis: orientation === 'horizontal' ? 'x' : 'y',
    })

    React.useEffect(() => {
      if (api && setApi) {
        setApi(api)
      }
    }, [api, setApi])

    return (
      <CarouselContext.Provider value={{ carouselRef, api, orientation }}>
        <div ref={ref} className={cn('relative', className)} {...props}>
          <div ref={carouselRef} className="overflow-hidden">
            {children}
          </div>
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = 'Carousel'

const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { orientation } = useCarouselContext()
    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CarouselContent.displayName = 'CarouselContent'

const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { orientation } = useCarouselContext()
    return (
      <div
        ref={ref}
        className={cn(
          'min-w-0 shrink-0 grow-0 basis-full',
          orientation === 'horizontal' ? 'pl-4' : 'pt-4',
          className
        )}
        {...props}
      />
    )
  }
)
CarouselItem.displayName = 'CarouselItem'

export { Carousel, CarouselContent, CarouselItem }
