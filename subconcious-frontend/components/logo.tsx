import { Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({
  className,
  iconClassName,
  showWordmark = true,
}: {
  className?: string
  iconClassName?: string
  showWordmark?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn(
          'inline-flex size-6 items-center justify-center rounded-md bg-brand text-brand-foreground',
          iconClassName,
        )}
      >
        <Brain className="size-3.5" />
      </span>
      {showWordmark && (
        <span className="text-sm font-semibold tracking-tight text-foreground">
          The Subconscious
        </span>
      )}
    </span>
  )
}
