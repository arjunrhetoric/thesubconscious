import { ImageIcon } from 'lucide-react'

export function ImageUploadBlock() {
  return (
    <div className="flex flex-col gap-4">
      {/* Uploading state */}
      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground">
            <ImageIcon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">consistent-hashing.png</p>
            <p className="text-xs text-muted-foreground">Uploading to Cloudinary…</p>
          </div>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">64%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-brand" style={{ width: '64%' }} />
        </div>
      </div>

      {/* Uploaded state */}
      <figure className="flex flex-col gap-2">
        <div className="overflow-hidden rounded-lg border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/load-balancer-diagram.png"
            alt="Architecture diagram of a load balancer distributing requests to three backend servers"
            className="block w-full"
          />
        </div>
        <figcaption className="text-xs text-muted-foreground">
          Load balancer request distribution — uploaded just now
        </figcaption>
      </figure>
    </div>
  )
}
