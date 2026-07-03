import { useEffect, useRef, ReactNode } from "react";
import { useContext } from "react";
import { LightboxContext } from "./LightboxContext";

interface Props {
  group: string;
  srcs: string[];
  children: ReactNode;
  className?: string;
}

/** Registers a group's photo srcs so the lightbox can navigate within it. */
export const PhotoGroup = ({ group, srcs, children, className }: Props) => {
  const ctx = useContext(LightboxContext);
  const key = srcs.join("|");
  useEffect(() => {
    ctx?.registerGroup(group, srcs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, key]);
  return <div className={className}>{children}</div>;
};

/** Horizontal draggable film-strip. */
export const FilmStrip = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let scrollL = 0;
    const down = (e: PointerEvent) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollL = el.scrollLeft;
      el.classList.add("dragging");
    };
    const move = (e: PointerEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      el.scrollLeft = scrollL - (x - startX) * 1.2;
    };
    const up = () => {
      isDown = false;
      el.classList.remove("dragging");
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointerleave", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointerleave", up);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="film-strip flex gap-4 md:gap-6 overflow-x-auto pb-6 -mx-4 px-4 md:-mx-8 md:px-8 cursor-grab select-none snap-x snap-mandatory"
    >
      {children}
    </div>
  );
};
