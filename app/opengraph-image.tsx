import { ImageResponse } from "next/og";
import { BrandMarkStripes } from "@/lib/brand-mark-stripes";

export const alt = "Normal Things Company";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<BrandMarkStripes />, {
    ...size,
  });
}
