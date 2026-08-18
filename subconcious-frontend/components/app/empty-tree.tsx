import { Brain, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyTree({ onNewPage }: { onNewPage?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-3 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
        <Brain className="size-5" />
      </span>
      <div>
        <p className="text-sm font-medium">Your brain is empty</p>
        <p className="mt-1 text-xs text-muted-foreground text-pretty">
          Create your first page to start capturing ideas.
        </p>
      </div>
      <Button size="sm" className="mt-1" onClick={onNewPage}>
        <Plus className="size-3.5" />
        New Page
      </Button>
    </div>
  )
}
