import type { VirtualTemplateMeta } from "@/lib/invitationCardDocument";

export function InvitationTemplatePreview({
  template,
  className = "",
}: {
  template: VirtualTemplateMeta;
  className?: string;
}) {
  const { bg, fg, accent, motif } = template.preview;

  return (
    <div
      className={`relative overflow-hidden aspect-[3/4] w-full ${className}`}
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      {motif === "blank" && (
        <div className="absolute inset-4 border border-dashed border-slate-300 rounded-sm" />
      )}
      {motif === "formal" && (
        <>
          <div
            className="absolute inset-3 rounded-md"
            style={{ backgroundColor: accent }}
          />
          <div className="absolute left-1/2 top-[28%] h-1 w-10 -translate-x-1/2 rounded-full opacity-80" style={{ backgroundColor: fg }} />
          <div className="absolute left-[18%] right-[18%] top-[38%] h-2 rounded-sm opacity-90" style={{ backgroundColor: fg }} />
          <div className="absolute left-[22%] right-[22%] top-[52%] h-1 rounded-sm opacity-50" style={{ backgroundColor: fg }} />
        </>
      )}
      {motif === "bar" && (
        <>
          <div className="absolute left-0 right-0 top-0 h-1" style={{ backgroundColor: accent }} />
          <div className="absolute left-3 right-6 top-[30%] h-2.5 rounded-sm" style={{ backgroundColor: fg }} />
          <div className="absolute left-3 w-8 top-[48%] h-0.5" style={{ backgroundColor: accent }} />
          <div className="absolute left-3 right-8 top-[58%] h-1 rounded-sm opacity-40" style={{ backgroundColor: fg }} />
        </>
      )}
      {motif === "blobs" && (
        <>
          <div className="absolute -right-4 -top-3 size-14 rounded-full opacity-80" style={{ backgroundColor: "#d9f99d" }} />
          <div className="absolute -left-3 bottom-4 size-12 rounded-full" style={{ backgroundColor: accent }} />
          <div className="absolute left-[20%] right-[20%] top-[40%] h-2 rounded-sm" style={{ backgroundColor: fg }} />
          <div className="absolute left-[28%] right-[28%] top-[55%] h-1 rounded-sm opacity-50" style={{ backgroundColor: fg }} />
        </>
      )}
      {motif === "frame" && (
        <>
          <div className="absolute inset-2.5 rounded-md bg-white border" style={{ borderColor: "#c7d2fe" }} />
          <div className="absolute left-5 top-[28%] h-1 w-10 rounded-sm" style={{ backgroundColor: accent }} />
          <div className="absolute left-5 right-5 top-[38%] h-2 rounded-sm" style={{ backgroundColor: fg }} />
          <div className="absolute left-5 right-8 top-[55%] h-1 rounded-sm opacity-40" style={{ backgroundColor: fg }} />
        </>
      )}
      {motif === "gift" && (
        <>
          <div className="absolute inset-x-3 top-[18%] bottom-[18%] rounded-lg bg-white/85 dark:bg-black/30" style={{ boxShadow: `inset 0 0 0 1px ${accent}55` }} />
          <div className="absolute left-[22%] right-[22%] top-[36%] h-2 rounded-sm" style={{ backgroundColor: fg }} />
          <div className="absolute left-[30%] right-[30%] top-[52%] h-1 rounded-sm opacity-60" style={{ backgroundColor: accent }} />
          <div className="absolute left-1/2 top-[68%] size-3 -translate-x-1/2 rounded-full" style={{ backgroundColor: accent }} />
        </>
      )}
      {motif === "stars" && (
        <>
          <div className="absolute left-2 top-3 size-1.5 rotate-45" style={{ backgroundColor: accent }} />
          <div className="absolute right-4 top-8 size-2 rotate-45" style={{ backgroundColor: accent }} />
          <div className="absolute left-5 bottom-10 size-1.5 rotate-45" style={{ backgroundColor: accent }} />
          <div className="absolute inset-x-4 top-[28%] bottom-[28%] rounded-2xl bg-indigo-950/50" />
          <div className="absolute left-[20%] right-[20%] top-[40%] h-2 rounded-sm" style={{ backgroundColor: fg }} />
          <div className="absolute left-[28%] right-[28%] top-[55%] h-1 rounded-sm" style={{ backgroundColor: accent }} />
        </>
      )}
      {motif === "ivory" && (
        <>
          <div className="absolute inset-3 border" style={{ borderColor: accent, backgroundColor: "rgba(255,253,250,0.9)" }} />
          <div className="absolute left-[24%] right-[24%] top-[32%] h-1 rounded-sm opacity-50" style={{ backgroundColor: fg }} />
          <div className="absolute left-[18%] right-[18%] top-[42%] h-2 rounded-sm" style={{ backgroundColor: fg }} />
          <div className="absolute left-1/2 top-[58%] h-px w-8 -translate-x-1/2" style={{ backgroundColor: accent }} />
          <div className="absolute left-[26%] right-[26%] top-[66%] h-1 rounded-sm opacity-45" style={{ backgroundColor: fg }} />
        </>
      )}
    </div>
  );
}
