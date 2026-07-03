import { useState, useContext, useRef, useEffect, MouseEvent } from "react";
import { LightboxContext } from "@/components/LightboxContext";

interface PhotoProps {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  caption?: string;
  index?: string;
  loading?: "lazy" | "eager";
  group?: string;
  noLightbox?: boolean;
  /** subtle mouse-tracked 3D tilt on hover */
  tilt?: boolean;
  /** css object-position, e.g. "50% 30%" — keep the subject in view */
  objectPosition?: string;
  /** css object-fit, defaults to "cover" */
  objectFit?: "cover" | "contain";
}


export const Photo = ({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  caption,
  index,
  loading = "lazy",
  group,
  noLightbox = false,
  tilt = true,
  objectPosition = "50% 50%",
  objectFit = "cover",
}: PhotoProps) => {

  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(loading === "eager");
  const ref = useRef<HTMLElement>(null);
  const url = `${import.meta.env.BASE_URL}photos/${src}`;
  const ctx = useContext(LightboxContext);

  // IntersectionObserver-driven lazy mount
  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView]);

  const onClick = () => {
    if (noLightbox || errored || !ctx) return;
    ctx.open(src, group);
  };

  const onPointerMove = (e: MouseEvent<HTMLElement>) => {
    if (!tilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5..0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.setProperty("--tx", `${-y * 4}deg`);  // rotateX
    ref.current.style.setProperty("--ty", `${x * 6}deg`);   // rotateY
  };
  const onPointerLeave = () => {
    if (!tilt || !ref.current) return;
    ref.current.style.setProperty("--tx", `0deg`);
    ref.current.style.setProperty("--ty", `0deg`);
  };

  return (
    <figure
      ref={ref}
      onClick={onClick}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`relative overflow-hidden bg-muted photo-hover ${tilt ? "photo-tilt" : ""} ${
        !noLightbox && !errored ? "cursor-zoom-in" : ""
      } ${className}`}
    >
      {!errored ? (
        <>
          {/* blurred placeholder — fades out when loaded */}
          <div
            aria-hidden
            className={`absolute inset-0 blur-placeholder transition-opacity duration-700 ${
              loaded ? "opacity-0" : "opacity-100"
            }`}
          />
          {inView && (
            <img
              src={url}
              alt={alt}
              loading={loading}
              decoding="async"
              data-loaded={loaded || undefined}
              onLoad={() => setLoaded(true)}
              onError={() => setErrored(true)}
              style={{ objectPosition, objectFit }}
              className={`w-full h-full transition-[opacity,filter] duration-[900ms] ease-out ${
                loaded ? "opacity-100 blur-0" : "opacity-0 blur-md"
              } ${imgClassName}`}
            />
          )}


        </>
      ) : (
        <div className="ph-fallback w-full h-full flex items-center justify-center text-center p-4">
          <div>
            <div className="font-sans-ed text-[9px] tracking-editorial uppercase text-jade mb-2">
              Photo · Pending
            </div>
            <div className="font-sans-ed text-[10px] text-ink/60 break-all">{src}</div>
            <div className="font-sans-ed text-[9px] text-ink/40 mt-2">/public/photos/</div>
          </div>
        </div>
      )}
      {index && (
        <span className="absolute top-3 left-3 font-sans-ed text-[10px] tracking-editorial bg-paper/85 backdrop-blur px-2 py-1 text-ink z-10">
          {index}
        </span>
      )}
      {caption && (
        <figcaption className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-ink/85 to-transparent font-sans-ed text-[11px] text-paper tracking-wide z-10">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};
