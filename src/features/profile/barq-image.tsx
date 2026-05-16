/* eslint-disable @next/next/no-img-element */
import type { UploadedImage } from "@/domain/barq/types";
import { imageAspectRatio, imageUrl } from "@/domain/barq/images";

export function BarqImage({
  image,
  alt,
  width,
  className,
  priority = false,
}: {
  image: UploadedImage | null;
  alt: string;
  width: number;
  className?: string;
  priority?: boolean;
}) {
  if (!image) {
    return (
      <div className={className} style={{ aspectRatio: "1 / 1" }}>
        <span className="text-sm font-medium text-muted-foreground">
          Locked
        </span>
      </div>
    );
  }

  return (
    <img
      alt={alt}
      className={className}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : "lazy"}
      src={imageUrl(image.uuid, width)}
      style={{ aspectRatio: imageAspectRatio(image) }}
    />
  );
}
