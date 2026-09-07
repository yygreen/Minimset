import { MEDIA } from "@/lib/trust";

/**
 * The inspection / sealing clip. Renders nothing until lib/trust.ts MEDIA.inspectionClip is set.
 * preload="none": the poster is the only bytes paid until the visitor presses play.
 * Never autoplays; a Rav checking an esrog deserves the visitor's attention, not a loop.
 */
export function InspectionClip({ lang = "en", className = "" }: { lang?: "en" | "he"; className?: string }) {
  const clip = MEDIA.inspectionClip;
  if (!clip) return null;
  return (
    <figure className={className}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink-950 shadow-lift">
        <video
          className="h-full w-full object-cover"
          controls
          playsInline
          preload="none"
          poster={clip.poster}
          src={clip.src}
        />
      </div>
      <figcaption className="mt-2 text-[13px] leading-snug text-ink-700">
        {lang === "he" ? clip.captionHe : clip.caption}
      </figcaption>
    </figure>
  );
}
