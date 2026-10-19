import type { GalleryTemplate } from "@/shared/config";

/** Icon tile colours of the template cards. */
export const TONES: Record<GalleryTemplate["tone"], string> = {
  teal: "bg-primary-soft text-primary-fg",
  orange: "bg-orange/12 text-accent-text",
  plum: "bg-plum/10 text-plum dark:bg-plum/30 dark:text-[#f0c6dc]",
  carmine: "bg-carmine/10 text-carmine dark:bg-carmine/30 dark:text-[#f6b8c2]",
};
