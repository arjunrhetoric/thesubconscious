import { Sparkles } from 'lucide-react'

const EXAMPLE_PROMPTS = [
  'Summarize my notes',
  'What are my open to-dos across my workspace?',
  'Explain key architecture concepts from my notes',
]

export function EmptyChat({ onPick }: { onPick?: (prompt: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
        <Sparkles className="size-5" />
      </span>
      <div>
        <p className="text-base font-semibold text-foreground">Converse with The Subconscious</p>
        <p className="mt-1 text-sm text-muted-foreground text-pretty max-w-sm mx-auto">
          Ask anything. Answers are grounded in your notes with verifiable source citations.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 max-w-md mt-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPick?.(prompt)}
            className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground transition-all hover:border-neutral-600 hover:text-foreground cursor-pointer shadow-xs"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
