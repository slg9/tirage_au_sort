import { ImageResponse } from "next/og";
import { OgArtwork } from "@/lib/seo/og";

export const runtime = "edge";
export const alt = "WheelDraw — Multi-cycle random draws";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(<OgArtwork locale="en" />, { ...size });
}
