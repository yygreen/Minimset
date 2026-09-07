import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { Faq } from "@/components/Faq";
import { LEVELS, SITES } from "@/lib/data";
import { HE_FAQ, HE_LEVEL, HE_SITE } from "@/lib/he";
import { IMG } from "@/lib/images";
import { money } from "@/lib/orders";
import { HeLang } from "./HeLang";
import { Share } from "@/components/Share";
import { OpenOnly } from "@/components/OpenOnly";
import { CompareTable } from "@/components/CompareTable";
import { InspectedBy } from "@/components/InspectedBy";
import { InspectionClip } from "@/components/InspectionClip";
import { MEDIA } from "@/lib/trust";
import { Heebo } from "next/font/google";

/* Hebrew body face, loaded only on the Hebrew route so English pages do not pay for it. */
const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "סט ארבעת המינים מהודר בהזמנה מוקדמת בארה\"ב | ושמחת",
  description:
    "סט ארבעת המינים שלם, נברר על ידי מורי הוראה בארץ ישראל, ארוז וחתום, ונמסר בבית המדרש בקהילה שלכם למחרת יום כיפור. שלוש דרגות הידור, החל מ-40 דולר. בולטימור, לייקווד, מונסי ופייב טאונס.",
  alternates: { canonical: "/he", languages: { en: "/", he: "/he" } },
  openGraph: {
    title: "ארבעת המינים שלכם, נבחרו על ידי מורה הוראה | ושמחת",
    description: "סטים מהודרים מארץ ישראל, חתומים, נמסרים בבית המדרש שלכם אחרי יום כיפור. החל מ-40 דולר.",
    type: "website",
    locale: "he_IL",
    images: [{ url: "/og-he.jpg", width: 1200, height: 630 }],
  },
};

const MINIM = [
  { key: "esrog", name: "אתרוג", line: "בקופסה משלו, עם הפיטם.", photo: IMG.esrog },
  { key: "lulav", name: "לולב", line: "סגור עד הקצה. חתום.", photo: IMG.lulav },
  { key: "hadassim", name: "הדסים", line: "משולשים לכל אורך הענף.", photo: IMG.hadassim },
  { key: "aravos", name: "ערבות", line: "טריות, בשקית חתומה יחד עם ההדסים.", photo: IMG.aravos },
];

const STEPS = [
  { n: "1", title: "מזמינים ומשלמים", body: "בוחרים קהילה וסטים, ומשלמים את מלוא הסכום עד מוצאי שבת, 5 בספטמבר." },
  { n: "2", title: "הרבנים בוררים", body: "מורי הוראה בארץ ישראל בוחרים ובודקים כל פריט. שום דבר לא נארז לפני שעבר בדיקה." },
  { n: "3", title: "טס ארוז וחתום", body: "האתרוג בקופסה, ההדסים והערבות בשקית, הלולב חתום. יום אחד באוויר." },
  { n: "4", title: "אוספים למחרת יום כיפור", body: "מציגים את הקוד בבית המדרש. נכנסים ויוצאים תוך דקות, עם מורה הוראה ליד השולחן." },
];

const LEVEL_PHOTO = {
  MEHUDAR_AA: IMG.levelAA,
  MEHUDAR_A: IMG.levelA,
  CHINUCH: IMG.levelChinuch,
} as const;

export default function HebrewHome() {
  const from = Math.min(...LEVELS.map((l) => l.basePriceCents)) / 100;

  return (
    <div dir="rtl" lang="he" className={`${heebo.variable} [font-family:var(--font-heebo),system-ui,sans-serif]`}>
      <HeLang />

      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-sand-100">
        <div className="relative aspect-[16/11] w-full sm:aspect-[16/9] lg:absolute lg:inset-0 lg:right-auto lg:aspect-auto lg:w-[58%]">
          <Image
            src={IMG.hero.src}
            alt={IMG.hero.alt}
            fill
            priority
            fetchPriority="high"
            decoding="sync"
            quality={70}
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover object-[50%_45%]"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-sand-100 to-transparent lg:hidden" />
          <div className="photo-veil-rtl absolute inset-0 hidden lg:block" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-4 sm:pb-16 sm:pt-6 lg:pb-28 lg:pt-24">
          <div className="max-w-xl">
            <OpenOnly
              closed={
                <p className="rise inline-flex items-center gap-2 rounded-full border border-sand-300 bg-white/90 px-3 py-1 text-[13px] font-bold text-ink-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-alert-800" />
                  ההרשמה לסוכות תשפ&quot;ז נסגרה
                </p>
              }
            >
              <p className="rise inline-flex items-center gap-2 rounded-full border border-esrog-300 bg-white/90 px-3 py-1 text-[13px] font-bold text-esrog-900">
                <span className="h-1.5 w-1.5 rounded-full bg-leaf-600" />
                ההזמנה המוקדמת לסוכות תשפ&quot;ז פתוחה
              </p>
            </OpenOnly>
            <h1 className="rise rise-2 mt-5 font-display text-[2.5rem] font-bold leading-[1.1] text-ink-950 sm:text-[3.3rem] lg:text-[3.9rem]">
              ארבעת המינים שלכם, נבחרו על ידי מורה הוראה.
              <span className="block text-leaf-800">ממתינים לכם אחרי יום כיפור.</span>
            </h1>
            <p className="rise rise-3 mt-5 max-w-md text-[17px] leading-relaxed text-ink-700 sm:text-lg">
              סטים מהודרים מארץ ישראל, ארוזים וחתומים, נמסרים לכם בבית המדרש בקהילה שלכם. שבע עשרה
              שנה במאה שערים. עכשיו גם אצלכם.
            </p>

            <OpenOnly closed={
              <div className="rise rise-4 mt-7 rounded-2xl border border-esrog-300 bg-esrog-100 p-5">
                <p className="font-display text-xl font-bold text-ink-950">ההרשמה לסוכות תשפ&quot;ז נסגרה.</p>
                <p className="mt-1 text-[15px] text-ink-700">המשלוח נארז לפי הסיכומים הסופיים. כבר הזמנתם? פרטי האיסוף בדף ההזמנה שלכם.</p>
                <Link href="/order" className="mt-4 inline-flex h-12 items-center rounded-lg bg-leaf-800 px-6 text-[15px] font-bold text-white">
                  איתור ההזמנה שלי
                </Link>
              </div>
            }>
            <div className="rise rise-4 mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="#levels"
                className="flex h-14 items-center justify-center rounded-lg bg-leaf-800 px-8 text-[17px] font-bold text-white shadow-lift transition hover:bg-leaf-900"
              >
                להזמנת סט, החל מ-{from} דולר
              </Link>
              <Link
                href="#how"
                className="flex h-12 items-center justify-center rounded-lg px-4 text-[15px] font-bold text-leaf-900 underline underline-offset-4 sm:h-14 sm:border sm:border-ink-900/15 sm:bg-white/80 sm:px-7 sm:text-[16px] sm:text-ink-900 sm:no-underline sm:transition sm:hover:border-leaf-800 sm:hover:text-leaf-800"
              >
                איך זה עובד
              </Link>
            </div>

            </OpenOnly>
            <div className="mt-8">
              <p className="mb-2 text-[13px] font-bold text-ink-700">ההרשמה נסגרת בעוד</p>
              <div dir="rtl">
                <Countdown he />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- TRUST STRIP ---------- */}
      <section className="border-y border-sand-200 bg-white">
        <ul className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-sand-200 px-4 sm:grid-cols-3 sm:divide-x sm:divide-x-reverse sm:divide-y-0">
          {[
            ["נבדק על ידי מורה הוראה", "כל פריט מאושר על ידי מורי הוראה לפני שהוא נחתם"],
            ["ארוז וחתום", "האתרוג בקופסה, ההדסים והערבות בשקית, הלולב חתום"],
            ["החלפה במקום", "אם מורה ההוראה בחלוקה קובע שהפריט אינו שווה את מחירו, מחליפים אותו במקום"],
          ].map(([k, v]) => (
            <li key={k} className="flex items-start gap-3 py-4 sm:px-6 sm:py-5 sm:first:pr-0 sm:last:pl-0">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-800">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6.2l2.6 2.6L10 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="font-display text-[18px] font-bold text-ink-950">{k}</p>
                <p className="mt-0.5 text-[14px] leading-snug text-ink-700">{v}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <InspectedBy lang="he" />

      {/* ---------- THE SETS ---------- */}
      <section id="levels" className="scroll-mt-20 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <p className="text-[13px] font-bold text-esrog-800">הסטים</p>
            <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
              שלוש דרגות הידור. כל סט שלם.
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-700 sm:text-[17px]">
              אתרוג, לולב, הדסים וערבות בכל סט. ההבדל בין הדרגות הוא רק במידת ההקפדה בברירה.
            </p>
            <p className="mt-2 text-[14px] text-ink-500">דפי המוצר ותהליך ההזמנה מוצגים באנגלית.</p>
          </div>

          <div className="mt-8 grid gap-5 sm:mt-10 md:grid-cols-3 md:gap-6">
            {LEVELS.map((level, i) => {
              const he = HE_LEVEL[level.key];
              const photo = LEVEL_PHOTO[level.key];
              const featured = i === 0;
              return (
                <article
                  key={level.key}
                  className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-card transition hover:shadow-lift ${
                    featured ? "border-esrog-500 ring-1 ring-esrog-500" : "border-sand-200"
                  }`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-sand-100">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                    {featured && (
                      <span className="absolute right-4 top-4 rounded-md bg-esrog-500 px-2.5 py-1 text-[12px] font-bold text-ink-950 shadow">
                        המובחר
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <p className="text-[13px] font-bold text-esrog-800">{he.tier}</p>
                    <h3 className="mt-1.5 font-display text-2xl font-bold leading-tight text-ink-950 sm:text-[1.7rem]">
                      {he.name}
                    </h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink-700">{he.who}</p>
                    <div className="mt-5 flex items-baseline gap-2">
                      <span dir="ltr" className="tnum font-display text-[2.6rem] font-bold leading-none text-leaf-900">
                        {money(level.basePriceCents)}
                      </span>
                      <span className="text-sm text-ink-500">לסט</span>
                    </div>
                    {level.pitomSurchargeCents ? (
                      <p className="mt-1.5 text-sm text-ink-700">
                        <span dir="ltr">{money(level.basePriceCents + level.pitomSurchargeCents)}</span> עם פיטם,
                        לבחירתכם בקופה
                      </p>
                    ) : (
                      <p className="mt-1.5 text-sm text-ink-500">אתרוג, לולב, הדסים וערבות כלולים</p>
                    )}

                    <details className="group mt-5 rounded-xl border border-sand-200 bg-sand-50">
                      <summary className="flex items-center justify-between px-4 py-3 text-sm font-bold text-leaf-800">
                        התקן המלא
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="transition group-open:rotate-180">
                          <path d="M2.5 5l4.5 4.5L11.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </summary>
                      <dl className="space-y-3 border-t border-sand-200 px-4 py-4 text-[14px] leading-relaxed text-ink-700">
                        {(
                          [
                            ["אתרוג", he.spec.esrog],
                            ["לולב", he.spec.lulav],
                            ["הדסים", he.spec.hadassim],
                          ] as const
                        ).map(([term, text]) => (
                          <div key={term}>
                            <dt className="font-display text-[15px] font-bold text-ink-950">{term}</dt>
                            <dd className="mt-0.5">{text}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>

                    <Link
                      href={`/sets/${level.slug}`}
                      className={`mt-6 flex h-13 items-center justify-center rounded-lg px-6 text-[15px] font-bold transition ${
                        featured
                          ? "bg-leaf-800 text-white hover:bg-leaf-900"
                          : "border-2 border-leaf-800 text-leaf-900 hover:bg-leaf-800 hover:text-white"
                      }`}
                    >
                      להזמנת {he.name}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[14px] text-ink-500">
              בהזמנה אחת אפשר לשלב כמה סטים. מהודר א-א לאבא וסטים של חינוך לילדים זו ההזמנה הרגילה.
            </p>
            <Link href="#compare" className="inline-block py-1.5 text-[14px] font-bold text-leaf-800 underline underline-offset-4">
              השוואת שלוש הדרגות זו לצד זו
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- COMPARE ---------- */}
      <section id="compare" className="scroll-mt-20 border-t border-sand-200 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-[13px] font-bold text-esrog-800">השוואה</p>
          <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
            שלוש הדרגות, זו לצד זו.
          </h2>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-ink-700 sm:text-[17px]">
            אותם מורי הוראה, אותה קופסה חתומה. ההבדל הוא רק בברירה.
          </p>
          <div className="mt-8">
            <CompareTable locale="he" />
          </div>
        </div>
      </section>

      {/* ---------- FOUR MINIM ---------- */}
      <section id="minim" className="scroll-mt-20 border-y border-sand-200 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-xl">
            <p className="text-[13px] font-bold text-esrog-800">בכל קופסה</p>
            <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
              ארבעה מינים. נבררו בארץ ישראל, נחתמו לפני הטיסה.
            </h2>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:mt-10 lg:grid-cols-4 lg:gap-5">
            {MINIM.map((m) => (
              <li key={m.key} className="group">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand-100">
                  <Image
                    src={m.photo.src}
                    alt={m.photo.alt}
                    fill
                    sizes="(min-width: 1024px) 280px, 50vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <h3 className="mt-3 font-display text-xl font-bold text-ink-950">{m.name}</h3>
                <p className="mt-0.5 text-[14px] leading-snug text-ink-700">{m.line}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how" className="scroll-mt-20 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 lg:grid lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div>
            <p className="text-[13px] font-bold text-esrog-800">איך זה עובד</p>
            <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
              בלי דוכן. בלי למשמש. בלי לנחש.
            </h2>
            <p className="mt-3 max-w-md text-[16px] leading-relaxed text-ink-700 sm:text-[17px]">
              בארץ ישראל כך פשוט קונים ארבעת המינים. הברירה נעשית בשבילכם, על ידי רבנים, לפני שהסט
              בכלל יוצא לדרך.
            </p>
            {MEDIA.inspectionClip ? (
              <InspectionClip lang="he" className="mt-8" />
            ) : (
              <div className="relative mt-8 hidden aspect-[4/3] overflow-hidden rounded-2xl lg:block">
                <Image src={IMG.inspection.src} alt={IMG.inspection.alt} fill sizes="(min-width: 1024px) 520px, 100vw" className="object-cover" />
              </div>
            )}
          </div>
          <ol className="mt-8 space-y-3 lg:mt-0">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-4 rounded-2xl border border-sand-200 bg-white p-5 shadow-card sm:p-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-esrog-200 font-display text-lg font-bold text-esrog-900">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-ink-950">{s.title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-700">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- GUARANTEE ---------- */}
      <section className="bg-esrog-100 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 lg:grid lg:grid-cols-2 lg:items-center lg:gap-14">
          <div>
            <p className="text-[13px] font-bold text-esrog-900">האחריות</p>
            <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
              המו&quot;צ נמצא במקום.
            </h2>
            <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-ink-900">
              מורה הוראה נוכח בחלוקה. אם יקבע שפריט אינו שווה את מה ששילמתם, הוא יוחלף במקום.
            </p>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-ink-700">
              מלאי רזרבה טס בדיוק בשביל זה. כשר וישר, מאה אחוז, ואתם סומכים על הרבנים שמביאים אותו.
            </p>
            <Link
              href="#levels"
              className="mt-7 inline-flex h-13 items-center justify-center rounded-lg bg-leaf-800 px-7 text-[16px] font-bold text-white transition hover:bg-leaf-900"
            >
              לבחירת סט
            </Link>
          </div>
          <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-2xl shadow-lift lg:mt-0">
            <Image src={IMG.community.src} alt={IMG.community.alt} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* ---------- PICKUP ---------- */}
      <section id="sites" className="scroll-mt-20 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <p className="text-[13px] font-bold text-esrog-800">איסוף</p>
            <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
              איפה אתם אוספים?
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-700 sm:text-[17px]">
              לכל קהילה בית מדרש מארח ונציג משלה. בוחרים את שלכם ומתחילים.
            </p>
          </div>
          <OpenOnly closed={
              <div className="mt-8 rounded-2xl border border-esrog-300 bg-esrog-100 p-5 sm:p-6">
                <p className="font-display text-xl font-bold text-ink-950">ההרשמה לסוכות תשפ&quot;ז נסגרה.</p>
                <p className="mt-1 text-[15px] text-ink-700">כבר הזמנתם? פרטי האיסוף בדף ההזמנה שלכם.</p>
                <Link href="/order" className="mt-4 inline-flex h-12 items-center rounded-lg bg-leaf-800 px-6 text-[15px] font-bold text-white">איתור ההזמנה שלי</Link>
              </div>
          }>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SITES.map((site) => (
              <Link
                key={site.slug}
                href={`/${site.slug}/order`}
                className="group flex flex-col rounded-2xl border border-sand-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-leaf-700 hover:shadow-lift sm:p-6"
              >
                <h3 className="font-display text-2xl font-bold text-ink-950">{HE_SITE[site.slug]}</h3>
                <p className="mt-0.5 text-[14px] text-ink-700">{site.hostInstitution}</p>
                <p className="mt-4 text-[14px] leading-snug text-ink-700">
                  יום שלישי, 22 בספטמבר
                  <br />
                  <span className="font-bold text-ink-950" dir="ltr">10:00 AM - 5:00 PM</span>
                </p>
                <span className="mt-5 flex h-11 items-center justify-center rounded-lg border-2 border-leaf-800 text-[15px] font-bold text-leaf-900 transition group-hover:bg-leaf-800 group-hover:text-white">
                  להזמנה ב{HE_SITE[site.slug]}
                </span>
              </Link>
            ))}
          </div>
          </OpenOnly>
          <p className="mt-6 text-[14px] text-ink-500">
            הקהילה שלכם לא ברשימה? דברו עם הרב על פתיחת נקודת חלוקה. התוכנית מתרחבת שכונה אחר שכונה.
          </p>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="border-t border-sand-200 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <p className="text-[13px] font-bold text-esrog-800">שאלות</p>
          <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
            חדש באמריקה. מוכר היטב בירושלים.
          </h2>
          <div className="mt-8">
            <Faq items={HE_FAQ} />
          </div>
        </div>
      </section>

      {/* ---------- FINAL CTA ---------- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src={IMG.set.src} alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-sand-50/88" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <h2 className="mx-auto max-w-2xl font-display text-[2.1rem] font-bold leading-tight text-ink-950 sm:text-[2.8rem]">
            מזמינים עד מוצאי שבת. פותחים את הקופסה אחרי יום כיפור.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[16px] text-ink-700">
            סטים החל מ-{from} דולר. חתומים, בדוקים, וממתינים לכם בבית המדרש.
          </p>
          <Link
            href="#levels"
            className="mt-7 inline-flex h-14 items-center justify-center rounded-lg bg-leaf-800 px-9 text-[17px] font-bold text-white shadow-lift transition hover:bg-leaf-900"
          >
            להזמנת סט
          </Link>
          <div className="mt-8 flex flex-col items-center gap-2">
            <p className="text-[13px] text-ink-500">שלחו הלאה לקבוצת בית הכנסת</p>
            <Share
              compact
              path="/he"
              text="ארבעת המינים מהודרים מארץ ישראל, נבדקו על ידי מורה הוראה, חתומים, איסוף אחרי יום כיפור. סטים החל מ-40 דולר:"
              label="שיתוף בוואטסאפ"
              copyLabel="העתקת קישור"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
