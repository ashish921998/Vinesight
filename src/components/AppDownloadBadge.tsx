import Image from 'next/image'

export interface AppDownloadLink {
  label: string
  href: string
  badgeSrc: string
}

interface AppDownloadBadgeProps {
  link: AppDownloadLink
  compact?: boolean
}

export function AppDownloadBadge({ link, compact = false }: AppDownloadBadgeProps) {
  return (
    <a
      aria-label={link.label}
      className={`group mx-auto inline-flex w-[220px] max-w-full items-center justify-center rounded-[14px] transition-all hover:-translate-y-0.5 hover:drop-shadow-[0_14px_24px_rgba(15,23,42,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 md:mx-0 ${
        compact ? 'md:w-[176px]' : 'md:w-[202px]'
      }`}
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Image
        src={link.badgeSrc}
        alt=""
        width={240}
        height={72}
        className="h-auto w-full select-none"
      />
    </a>
  )
}
