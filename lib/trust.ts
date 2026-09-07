/**
 * Trust data that only the operator can supply. Both slots render NOTHING until filled,
 * so the site is safe to deploy with them empty.
 *
 * 1. INSPECTORS: the Morei Hora'ah who sort and inspect the sets. Fill in only names the
 *    operator has confirmed may be published. The competitor study found nobody in the
 *    space names its inspectors; this is the strongest trust lever available.
 *
 * 2. MEDIA.inspectionClip: a short (20-40 s) clip of a Rav checking and sealing a set.
 *    Drop the file in /public/media, a poster frame in /public/img, and fill the fields.
 *    Keep it under ~6 MB (H.264 MP4, 720p); it is loaded only when pressed.
 */
export interface Inspector {
  /** As it should print in English, e.g. "Rav Y. Cohen" */
  name: string;
  /** Hebrew rendering for /he, e.g. "הרב י. כהן" */
  nameHe: string;
  /** One line: role and place, e.g. "Moreh Hora'ah, Yerushalayim" */
  role: string;
  roleHe: string;
}

export const INSPECTORS: Inspector[] = [];

export interface Clip {
  src: string;
  poster: string;
  /** Plain-ASCII caption shown under the player */
  caption: string;
  captionHe: string;
}

export const MEDIA: { inspectionClip: Clip | null } = {
  inspectionClip: null,
};
