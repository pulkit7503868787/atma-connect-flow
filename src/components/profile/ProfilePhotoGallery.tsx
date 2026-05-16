import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";

type ProfilePhotoGalleryProps = {
  photos: string[];
  alt: string;
  className?: string;
  autoSlideMs?: number;
};

export const ProfilePhotoGallery = ({ photos, alt, className, autoSlideMs = 5500 }: ProfilePhotoGalleryProps) => {
  const urls = photos.filter(Boolean);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: urls.length > 1, align: "start" });
  const [index, setIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || urls.length < 2 || !autoSlideMs) return;
    const timer = window.setInterval(() => emblaApi.scrollNext(), autoSlideMs);
    return () => window.clearInterval(timer);
  }, [emblaApi, urls.length, autoSlideMs]);

  if (!urls.length) return null;

  return (
    <div className={cn("relative h-full w-full", className)}>
      <div ref={emblaRef} className="h-full w-full overflow-hidden">
        <div className="flex h-full">
          {urls.map((src, i) => (
            <div key={`${src}-${i}`} className="min-w-0 shrink-0 grow-0 basis-full h-full">
              <img src={src} alt={alt} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>
      {urls.length > 1 ? (
        <>
          <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5 z-10 pointer-events-none">
            {urls.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-5 bg-primary" : "w-1.5 bg-background/70"
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
};
