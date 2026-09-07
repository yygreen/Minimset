import { AravaMark, EsrogMark, HadasMark, LulavMark } from "./Minim";

const MINIM = [
  {
    numeral: "I",
    Mark: EsrogMark,
    name: "Esrog",
    hebrew: "אתרוג",
    body:
      "Boxed on its own. Sorted for cleanliness of black dots, for bletlech, and for a gidul na'eh — a beautiful shape.",
  },
  {
    numeral: "II",
    Mark: LulavMark,
    name: "Lulav",
    hebrew: "לולב",
    body:
      "Sorted for a closed tiyumes, with the two upper leaves standing at the same height.",
  },
  {
    numeral: "III",
    Mark: HadasMark,
    name: "Hadassim",
    hebrew: "הדסים",
    body:
      "Meshulash — three leaves rising from a single node, the length of the branch.",
  },
  {
    numeral: "IV",
    Mark: AravaMark,
    name: "Aravos",
    hebrew: "ערבות",
    body: "Fresh, sealed together with the hadassim in a securely sealed bag.",
  },
];

/**
 * The botanical plate: what is actually in every set, drawn at size.
 * `tone="dark"` renders it on the deep-green ground.
 */
export function MinimPlate({ tone = "light" }: { tone?: "light" | "dark" }) {
  const card =
    tone === "dark"
      ? "border-forest-700 bg-forest-900"
      : "border-cream-300 bg-cream-50";
  const ink = tone === "dark" ? "text-cream-50" : "text-forest-950";
  const body = tone === "dark" ? "text-cream-100/75" : "text-forest-900/75";
  const accent = tone === "dark" ? "text-gold-300" : "text-gold-700";
  const drawing = tone === "dark" ? "text-gold-300/70" : "text-forest-700";

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {MINIM.map(({ numeral, Mark, name, hebrew, body: text }) => (
        <figure
          key={name}
          className={`flex flex-col rounded-2xl border p-6 transition ${card}`}
        >
          <div className="flex items-baseline justify-between">
            <span className={`font-display text-sm font-bold ${accent}`}>{numeral}</span>
            <span dir="rtl" className={`font-display text-xl font-bold ${accent}`}>
              {hebrew}
            </span>
          </div>

          <div className="flex h-52 items-end justify-center py-4">
            <Mark className={`h-full w-auto ${drawing}`} />
          </div>

          <div className="rule-gold h-px w-full" />

          <figcaption className="mt-4">
            <h3 className={`font-display text-xl font-bold ${ink}`}>{name}</h3>
            <p className={`mt-1.5 text-sm leading-relaxed ${body}`}>{text}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
