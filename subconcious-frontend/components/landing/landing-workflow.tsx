'use client'

import { Bot, Cpu, FileEdit, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'

export function LandingWorkflow() {
  const steps = [
    {
      number: '01',
      title: 'Write in structured blocks',
      description:
        'Capture ideas naturally using slash commands, task lists, tables, and syntax code blocks with automated hierarchical tree nesting.',
      icon: <FileEdit className="size-5 text-white" />,
      tag: 'Tiptap + Tree',
      visual: (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 font-mono text-xs text-neutral-400 space-y-2">
          <div className="flex items-center gap-1.5 text-neutral-300">
            <span className="text-white font-bold">/</span>
            <span>heading 2</span>
          </div>
          <div className="pl-3 border-l border-neutral-800 text-[11px] text-neutral-300 font-sans">
            Consistent hashing on a 360° virtual ring
          </div>
          <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <CheckCircle2 className="size-3" /> Auto-saved (2s debounce)
          </div>
        </div>
      ),
    },
    {
      number: '02',
      title: 'Automatic Vector Indexing',
      description:
        'Every save automatically parses your Tiptap content into clean semantic chunks, embeds them into 768 dimensions with Gemini, and stores them in Qdrant Cloud.',
      icon: <Cpu className="size-5 text-white" />,
      tag: 'Qdrant Cloud RAG',
      visual: (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 font-mono text-xs text-neutral-400 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-neutral-300">gemini-embedding-001</span>
            <span className="text-emerald-400">768 dim</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
            <div className="h-full bg-white w-full rounded-full" />
          </div>
          <div className="flex items-center justify-between text-[10px] text-neutral-500">
            <span>Payload: userId + ancestorPath</span>
            <span className="text-neutral-300">Indexed ✓</span>
          </div>
        </div>
      ),
    },
    {
      number: '03',
      title: 'Conversational Recall with Citations',
      description:
        'Ask questions in natural language. The system retrieves the most relevant vector chunks and streams answers citing exact notes.',
      icon: <Bot className="size-5 text-white" />,
      tag: 'SSE Stream',
      visual: (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 text-xs text-neutral-300 space-y-2">
          <p className="text-[11px] leading-relaxed text-neutral-300">
            &quot;Virtual nodes balance key distribution across physical servers.&quot;
          </p>
          <div className="flex items-center gap-1.5 border-t border-neutral-800 pt-2 text-[10px]">
            <span className="text-neutral-500 font-bold uppercase">Source:</span>
            <span className="rounded bg-neutral-800 px-2 py-0.5 text-white font-mono">
              Distributed Systems 101
            </span>
          </div>
        </div>
      ),
    },
  ]

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-black relative border-t border-neutral-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/60 px-3.5 py-1 text-xs font-medium text-neutral-400">
            <Sparkles className="size-3 text-white" />
            The AI Pipeline
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl text-balance">
            How your Second Brain operates
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-base text-neutral-400">
            From raw notes to conversational retrieval with verified citations in 3 automatic stages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 flex flex-col justify-between hover:border-neutral-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700 text-white shadow-inner">
                    {step.icon}
                  </div>
                  <span className="font-mono text-xl font-bold text-neutral-600">
                    {step.number}
                  </span>
                </div>

                <div className="inline-block rounded-full bg-neutral-800/80 border border-neutral-700/60 px-2.5 py-0.5 text-[10px] font-mono text-neutral-300 uppercase tracking-wider mb-3">
                  {step.tag}
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                  {step.title}
                </h3>

                <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                  {step.description}
                </p>
              </div>

              {step.visual}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
