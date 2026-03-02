type ImageFit = "fill" | "limit" | "scale";

interface CloudinaryImageOptions {
  width?: number;
  height?: number;
  fit?: ImageFit;
  quality?: "auto" | "auto:good" | "auto:best";
}

const DEFAULT_QUALITY: CloudinaryImageOptions["quality"] = "auto:good";

export const getOptimizedImageUrl = (
  url?: string | null,
  options: CloudinaryImageOptions = {}
): string => {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url;
  }

  const {
    width,
    height,
    fit = "limit",
    quality = DEFAULT_QUALITY,
  } = options;

  const transforms = ["f_auto", `q_${quality.replace(":", ":")}`, "dpr_auto"];

  if (fit === "fill" && width && height) {
    transforms.push(`c_fill`, `g_auto`, `w_${width}`, `h_${height}`);
  } else {
    transforms.push(`c_limit`);
    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
  }

  const transformationString = transforms.join(",");
  return url.replace("/image/upload/", `/image/upload/${transformationString}/`);
};
