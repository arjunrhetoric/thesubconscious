import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeProps = React.ComponentProps<'span'> & {
  variant?: 'neutral' | 'suggested' | 'outline'
}

function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors',
        variant === 'neutral' && 'bg-secondary text-secondary-foreground',
        variant === 'suggested' &&
          'border border-dashed border-brand/70 text-brand hover:bg-brand/10',
        variant === 'outline' && 'border border-border text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
