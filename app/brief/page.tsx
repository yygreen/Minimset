import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What we still need from you",
  robots: { index: false, follow: false },
};

const SEND_TO = "joseph@rankfriendly.com";

const SHOTS: { n: number; title: string; how: string; why: string }[] = [
  {
    n: 1,
    title: "The three sets side by side, boxed",
    how: "Mehudar A-A, Mehudar A and Chinuch in a row on a plain table, labels facing the camera. Horizontal.",
    why: "Becomes the home page hero. Today the hero is a market table in Yerushalayim, not your sets.",
  },
  {
    n: 2,
    title: "One esrog in its open box",
    how: "Lid beside the box, pitom up, shot from slightly above at a three-quarter angle. Daylight from a window, no flash.",
    why: "The product page for each level opens on this frame.",
  },
  {
    n: 3,
    title: "The esrog in a hand",
    how: "An adult hand holding the esrog with the pitom toward the camera. Only the hand, no face needed.",
    why: "Shows real size; every buyer asks how big it is.",
  },
  {
    n: 4,
    title: "The sealed lulav in its sleeve",
    how: "Full length, laid on the diagonal so it fits the frame, seal visible. Vertical.",
    why: "\"Sealed\" is a promise on every page; this is the proof.",
  },
  {
    n: 5,
    title: "The hadassim bag, sealed",
    how: "Close enough that the leaves in threes are visible through the bag, label readable.",
    why: "Goes on the four-minim strip and the Chinuch page.",
  },
  {
    n: 6,
    title: "The aravos bag, sealed",
    how: "Same as the hadassim: close, label readable, daylight.",
    why: "Completes the four minim with your own packaging.",
  },
  {
    n: 7,
    title: "A Rav checking an esrog",
    how: "From the side, with the loupe or against the light. The esrog is the subject; the face may be turned away if the Rav prefers.",
    why: "\"How it works\" step one. Nobody else in the space shows the inspection.",
  },
  {
    n: 8,
    title: "The seal going on",
    how: "The moment the sticker or seal is pressed onto the box or sleeve. Hands and product only.",
    why: "The single most convincing frame for \"kasher v'yashar, one hundred percent\".",
  },
  {
    n: 9,
    title: "Cartons ready to ship, or stacked at a Beis Medrash",
    how: "Horizontal, whole stack in frame, room lights fine.",
    why: "The community pages show pickup day; a real stack beats a stock photo.",
  },
  {
    n: 10,
    title: "The complete set opened out",
    how: "Esrog box open, lulav, hadassim bag, aravos bag, laid out on a cloth. Shot from above.",
    why: "\"What you get\", one picture, used on the confirmation and share cards.",
  },
];

const RULES = [
  "Daylight near a window. No flash, no overhead fluorescent if you can avoid it.",
  "Plain background: a white tablecloth or a clean wood table.",
  "Wipe the phone lens first. Do not zoom; step closer.",
  "Take every shot both horizontal and vertical.",
  "Send the originals: email, Google Drive, or WhatsApp as a Document (not as a photo, which shrinks it).",
  "JPG, not HEIC. iPhone: Settings > Camera > Formats > Most Compatible.",
  "No women in frame (house style). Boys holding the Chinuch set are welcome.",
];

export default function BriefPage() {
  return (
    <div className="bg-sand-50">
      <div className="bg-leaf-800 text-white">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-300">4minimset.com</p>
          <h1 className="mt-2 font-display text-[2.2rem] font-bold leading-tight sm:text-[3rem]">
            Four things only you can give the site.
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-leaf-100">
            The site is live and fast. Every picture on it today is a licensed stock photo of somebody
            else&#39;s esrogim. These four items turn it into yours. Send everything to{" "}
            <a href={`mailto:${SEND_TO}`} className="font-semibold text-white underline decoration-esrog-300 underline-offset-4">
              {SEND_TO}
            </a>
            .
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        {/* 1 PHOTOS */}
        <section>
          <div className="flex items-baseline gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-esrog-200 font-display text-lg font-bold text-esrog-900">
              1
            </span>
            <h2 className="font-display text-[1.7rem] font-bold text-ink-950 sm:text-[2.1rem]">Ten photographs</h2>
          </div>
          <p className="mt-3 text-[16px] leading-relaxed text-ink-700">
            Open this page on your phone and work down the list. Twenty minutes, one afternoon, one table.
          </p>

          <div className="mt-6 rounded-2xl border border-esrog-300 bg-esrog-100 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-900">Before you start</p>
            <ul className="mt-2 space-y-1.5 text-[15px] leading-snug text-ink-900">
              {RULES.map((r) => (
                <li key={r} className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-esrog-700" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <ol className="mt-6 space-y-3">
            {SHOTS.map((s) => (
              <li key={s.n} className="flex gap-4 rounded-2xl border border-sand-200 bg-white p-4 shadow-card sm:p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf-100 font-display text-[16px] font-bold text-leaf-900">
                  {s.n}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-[18px] font-bold leading-tight text-ink-950">{s.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-ink-900">{s.how}</p>
                  <p className="mt-1.5 text-[13px] leading-snug text-ink-500">Where it goes: {s.why}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 2 RABBANIM */}
        <section className="mt-14">
          <div className="flex items-baseline gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-esrog-200 font-display text-lg font-bold text-esrog-900">
              2
            </span>
            <h2 className="font-display text-[1.7rem] font-bold text-ink-950 sm:text-[2.1rem]">
              The names of the Morei Hora&#39;ah
            </h2>
          </div>
          <div className="mt-4 rounded-2xl bg-leaf-50 p-5 sm:p-6">
            <p className="text-[16px] leading-relaxed text-ink-900">
              We studied about fifty sellers. Not one names the Rabbanim who check its sets. Your whole
              offer rests on &quot;selected and inspected by Morei Hora&#39;ah&quot;; printing who they are is the
              strongest trust signal available, and the site already has the slot ready.
            </p>
            <p className="mt-3 text-[15px] font-semibold text-ink-950">For each Rav, if he agrees to be named:</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-[15px] text-ink-900">
              <li>Name exactly as it should print in English (for example: Rav Y. Cohen)</li>
              <li>Name in Hebrew, for the Hebrew page</li>
              <li>One line: his role and city (for example: Moreh Hora&#39;ah, Yerushalayim)</li>
            </ul>
            <p className="mt-3 text-[14px] leading-snug text-ink-700">
              If a Rav prefers not to be named, say so and the band simply stays hidden. Nothing is
              published without your word.
            </p>
          </div>
        </section>

        {/* 3 CLIP */}
        <section className="mt-14">
          <div className="flex items-baseline gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-esrog-200 font-display text-lg font-bold text-esrog-900">
              3
            </span>
            <h2 className="font-display text-[1.7rem] font-bold text-ink-950 sm:text-[2.1rem]">
              A short clip of the inspection and sealing
            </h2>
          </div>
          <div className="mt-4 rounded-2xl border border-sand-200 bg-white p-5 shadow-card sm:p-6">
            <ul className="space-y-1.5 text-[15px] leading-snug text-ink-900">
              <li className="flex gap-2.5"><span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-700" />20 to 40 seconds, phone held horizontal, steady (lean on the table).</li>
              <li className="flex gap-2.5"><span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-700" />A Rav checking an esrog, then the seal going on the box or sleeve.</li>
              <li className="flex gap-2.5"><span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-700" />Quiet room is fine; no music, no narration needed.</li>
              <li className="flex gap-2.5"><span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-700" />Send the original file (Drive or WhatsApp as a Document).</li>
            </ul>
            <p className="mt-3 text-[14px] leading-snug text-ink-700">
              It plays in &quot;How it works&quot; only when a visitor presses play. Never on a loop.
            </p>
          </div>
        </section>

        {/* 4 HEBREW */}
        <section className="mt-14">
          <div className="flex items-baseline gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-esrog-200 font-display text-lg font-bold text-esrog-900">
              4
            </span>
            <h2 className="font-display text-[1.7rem] font-bold text-ink-950 sm:text-[2.1rem]">
              Your own Hebrew wording of the three standards
            </h2>
          </div>
          <div className="mt-4 rounded-2xl bg-esrog-100 p-5 sm:p-6">
            <p className="text-[16px] leading-relaxed text-ink-900">
              The English standard on the site is your text, word for word. The Hebrew page carries our
              faithful rendering of it. If you have the standard written in Hebrew the way you would say it
              to a customer in Yerushalayim, send it and it replaces ours, word for word, the same day.
            </p>
            <p className="mt-3 text-[14px] leading-snug text-ink-700">
              Three short paragraphs: Mehudar A-A, Mehudar A, Chinuch. WhatsApp text is fine.
            </p>
          </div>
        </section>

        <div className="mt-14 rounded-2xl border border-leaf-200 bg-white p-5 text-center shadow-card sm:p-7">
          <p className="font-display text-[20px] font-bold text-ink-950">Send it all to</p>
          <a href={`mailto:${SEND_TO}`} className="mt-1 block text-[18px] font-semibold text-leaf-800 underline underline-offset-4">
            {SEND_TO}
          </a>
          <p className="mt-2 text-[14px] text-ink-700">Photos go live the same day they arrive.</p>
          <Link href="/" className="mt-5 inline-block text-[14px] font-semibold text-ink-700 underline underline-offset-4">
            Back to the site
          </Link>
        </div>
      </div>
    </div>
  );
}
