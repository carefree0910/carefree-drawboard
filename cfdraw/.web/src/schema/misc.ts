import type { Lang } from "@carefree0910/core";

export const allDownloadFormat = ["JPG", "PNG", "SVG", "NOLI"] as const;
export type ImageFormat = "JPG" | "PNG" | "SVG";
export type DownloadFormat = (typeof allDownloadFormat)[number];

type I18N = Record<Lang, string>;
export type IStr = string | I18N;
