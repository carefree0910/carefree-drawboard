export const allDownloadFormat = ["JPG", "PNG", "SVG", "NOLI"] as const;
export type ImageFormat = "JPG" | "PNG" | "SVG";
export type DownloadFormat = (typeof allDownloadFormat)[number];
