import { useToast } from "@chakra-ui/react";

export type IToast = ReturnType<typeof useToast>;

export const allDownloadFormat = ["JPG", "PNG", "SVG", "NOLI"] as const;
export type ImageFormat = "JPG" | "PNG" | "SVG";
export type DownloadFormat = typeof allDownloadFormat[number];
