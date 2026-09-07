/**
 * Botanical line-art marks for the four minim.
 *
 * Drawn rather than photographed, deliberately: this is a page about trusting
 * what a Rav inspected, so stock photography of somebody else's esrog would be
 * the wrong kind of dishonest. Each mark is stroke-only and inherits
 * `currentColor`, so the same drawing works as a large plate on cream and as a
 * low-opacity watermark on the deep-green hero.
 *
 * Real product photography of the operator's own esrog / lulav / sealed
 * packaging drops straight into these slots.
 */

type MarkProps = { className?: string };

/* ------------------------------------------------------------------ esrog */
/** Tapered body with ridges hugging the contour, a pitom and shoshanta above, oketz below. */
export function EsrogMark({ className = "" }: MarkProps) {
  return (
    <svg viewBox="0 0 100 140" className={className} fill="none" aria-hidden="true">
      {/* shoshanta — the small crown above the pitom */}
      <path
        d="M43.6 21.6c2.2-3.6 4.3-5.4 6.4-5.4s4.2 1.8 6.4 5.4c-2.2 1.9-4.3 2.8-6.4 2.8s-4.2-.9-6.4-2.8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M50 16.2v8.2" stroke="currentColor" strokeWidth="1" opacity=".5" />
      {/* pitom */}
      <path d="M50 31v-6.6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />

      {/* body */}
      <path
        d="M50 30C31 30 18 49 18 73c0 28 14 47 32 47s32-19 32-47c0-24-13-43-32-43Z"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />

      {/* light on the upper shoulder */}
      <path
        d="M28.5 66c1.4-11 6-20.4 13.3-26.4"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity=".4"
        strokeLinecap="round"
      />

      {/*
        Tuberculate skin: short broken strokes, never dots — an esrog at this
        program's standard is clean of black dots, and the drawing should not
        suggest otherwise.
      */}
      {[
        "M60 50c2.6 1.5 4.6 3.4 6 5.6",
        "M35 60c1-2.6 2.5-4.9 4.4-6.9",
        "M63 74c2.2 1.9 3.8 4.1 4.8 6.6",
        "M31 84c.4-2.8 1.3-5.4 2.7-7.8",
        "M56 95c2.4 1.2 4.3 2.9 5.8 5",
        "M39 101c-1.4-2.4-2.4-5-3-7.7",
        "M47 42c2.8-.6 5.6-.6 8.4 0",
      ].map((d) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth="1.1"
          opacity=".28"
          strokeLinecap="round"
        />
      ))}

      {/* oketz */}
      <path d="M50 119.5v6.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ lulav */
/**
 * A closed frond: leaflets sweep upward and hug the shidra so the silhouette is
 * a narrow column, and the two upper leaves meet at the same height — the tiyumes.
 */
export function LulavMark({ className = "" }: MarkProps) {
  const leaflets = Array.from({ length: 15 }, (_, i) => {
    const t = i / 14;
    return {
      i,
      y: 46 + i * 10,
      len: 8 + t * 13,
      rise: 24 + t * 13,
    };
  });

  return (
    <svg viewBox="0 0 100 200" className={className} fill="none" aria-hidden="true">
      {/* shidra */}
      <path d="M50 195V40" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />

      {/* tiyumes — the two upper leaves closed at the same height */}
      <path
        d="M50 50C45.4 37 44.8 20 47.9 7.6c.8-3.2 2.1-3 2.1.4V50Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M50 50c4.6-13 5.2-30 2.1-42.4-.8-3.2-2.1-3-2.1.4V50Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {leaflets.map(({ i, y, len, rise }) => (
        <g key={i}>
          {/* left leaflet */}
          <path
            d={`M50 ${y}Q${50 - len} ${y - rise * 0.45} ${50 - len * 0.85} ${y - rise}Q${
              50 - len * 0.3
            } ${y - rise * 0.62} 50 ${y - rise * 0.22}Z`}
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          {/* right leaflet */}
          <path
            d={`M50 ${y}Q${50 + len} ${y - rise * 0.45} ${50 + len * 0.85} ${y - rise}Q${
              50 + len * 0.3
            } ${y - rise * 0.62} 50 ${y - rise * 0.22}Z`}
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </g>
      ))}
    </svg>
  );
}

/* --------------------------------------------------------------- hadassim */
/** Myrtle branch, meshulash: three pointed leaves from every node, angled upward. */
export function HadasMark({ className = "" }: MarkProps) {
  const nodes = Array.from({ length: 8 }, (_, i) => ({ i, y: 36 + i * 18 }));

  return (
    <svg viewBox="0 0 100 180" className={className} fill="none" aria-hidden="true">
      <path d="M50 176V22" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />

      {nodes.map(({ i, y }) => (
        <g key={i}>
          {/* left leaf — small, pointed, angled well up the branch */}
          <path
            d={`M50 ${y}Q38 ${y - 13} 27 ${y - 19}Q37 ${y - 5} 49.5 ${y + 1.5}Z`}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d={`M49 ${y - 0.5}Q39 ${y - 8} 28.5 ${y - 18}`}
            stroke="currentColor"
            strokeWidth="0.8"
            opacity=".38"
          />

          {/* right leaf */}
          <path
            d={`M50 ${y}Q62 ${y - 13} 73 ${y - 19}Q63 ${y - 5} 50.5 ${y + 1.5}Z`}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d={`M51 ${y - 0.5}Q61 ${y - 8} 71.5 ${y - 18}`}
            stroke="currentColor"
            strokeWidth="0.8"
            opacity=".38"
          />

          {/* the third leaf of the whorl, foreshortened toward the viewer */}
          <path
            d={`M50 ${y}Q56.5 ${y + 5} 54 ${y + 13}Q47 ${y + 5} 50 ${y}Z`}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />

          <circle cx="50" cy={y} r="1.4" fill="currentColor" opacity=".5" />
        </g>
      ))}
    </svg>
  );
}

/* ----------------------------------------------------------------- aravos */
/** Willow: long lance-shaped leaves with a smooth margin, alternating up a slender stem. */
export function AravaMark({ className = "" }: MarkProps) {
  const x = 49.5;
  const leaves = Array.from({ length: 11 }, (_, i) => ({
    i,
    y: 166 - i * 13.5,
    side: i % 2 === 0 ? -1 : 1,
  }));

  return (
    <svg viewBox="0 0 100 180" className={className} fill="none" aria-hidden="true">
      <path
        d="M52 176C49.5 136 49 80 49.5 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {leaves.map(({ i, y, side }) => (
        <g key={i}>
          <path
            d={`M${x} ${y}Q${x + side * 14} ${y - 14} ${x + side * 20} ${y - 40}Q${
              x + side * 7
            } ${y - 22} ${x} ${y - 6}Z`}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d={`M${x + side * 1} ${y - 3}Q${x + side * 10} ${y - 18} ${x + side * 18.5} ${y - 37}`}
            stroke="currentColor"
            strokeWidth="0.85"
            opacity=".4"
          />
        </g>
      ))}
    </svg>
  );
}

/* --------------------------------------------------------------- full set */
/** The bound set: hadassim and aravos flanking the lulav, esrog alongside. */
export function FullSetMark({ className = "" }: MarkProps) {
  return (
    <div className={`flex items-end justify-center ${className}`}>
      <HadasMark className="-mr-4 h-[62%] w-auto opacity-75" />
      <LulavMark className="h-full w-auto" />
      <AravaMark className="-ml-4 h-[62%] w-auto opacity-75" />
      <EsrogMark className="-ml-1 mb-1 h-[38%] w-auto" />
    </div>
  );
}
