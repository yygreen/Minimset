/**
 * Central photo manifest. Every file lives in /public/img with its provenance in
 * /public/img/LICENSES.md. Swap a path here and every page updates.
 *
 * Rule (2026-08-26, after Joseph's review): the esrog is never a render. FLUX draws
 * lemons and pears with the stem on the wrong end, and a frum buyer sees it at once.
 * Esrogim, lulavim and people are real photographs (Commons, CC). Renders remain only
 * for botanically safe subjects (a distribution hall with boxes) until the operator
 * supplies photography of the actual sets. (The last render, a distribution hall, was retired
 * too: its "boxes" were flat tiles with grass on them.)
 */
export interface Photo {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export const IMG = {
  hero: {
    src: "/img/hero-real.jpg",
    alt: "Esrogim laid out on a table beside bundles of hadassim at a Daled Minim market in Yerushalayim",
    width: 780,
    height: 860,
  },
  set: {
    src: "/img/hero-real.jpg",
    alt: "Esrogim and hadassim on the table of a Daled Minim market",
    width: 780,
    height: 860,
  },
  esrog: {
    src: "/img/esrog-single.jpg",
    alt: "A clean yellow esrog with its pitom, on the market table",
    width: 620,
    height: 620,
  },
  lulav: {
    src: "/img/hands-tall.jpg",
    alt: "A young man checking the tiyumes of a lulav against the light",
    width: 800,
    height: 1000,
  },
  hadassim: {
    src: "/img/hadassim-01.jpg",
    alt: "Three hadassim branches laid on cloth, leaves rising in threes from each node",
    width: 1800,
    height: 2400,
  },
  aravos: {
    src: "/img/aravos-crop.jpg",
    alt: "Fresh aravos: long smooth-edged willow leaves on a reddish stem",
    width: 1000,
    height: 1250,
  },
  levelAA: {
    src: "/img/inspect-real.jpg",
    alt: "Two chassidim examining an esrog and a sleeved lulav",
    width: 1100,
    height: 1100,
  },
  levelA: {
    src: "/img/esrog-single-b.jpg",
    alt: "Esrogim waiting on the market table",
    width: 900,
    height: 790,
  },
  levelChinuch: {
    src: "/img/hadassim-02.jpg",
    alt: "Hadassim laid out on cloth",
    width: 1800,
    height: 2400,
  },
  inspection: {
    src: "/img/inspect-wide.jpg",
    alt: "Chassidim checking esrogim and lulavim at the Daled Minim fair",
    width: 1400,
    height: 1050,
  },
  esrogCluster: {
    src: "/img/esrog-cluster.jpg",
    alt: "A large clean esrog on the market table, others behind it",
    width: 900,
    height: 620,
  },
  community: {
    src: "/img/boxes-real.jpg",
    alt: "Esrog boxes, sleeved lulavim and esrogim laid out on tables at the Daled Minim fair",
    width: 1300,
    height: 870,
  },
} as const satisfies Record<string, Photo>;

export type ImgKey = keyof typeof IMG;
