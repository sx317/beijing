import { useEffect, useState, useCallback, ReactNode, useRef, useMemo } from "react";
import { LightboxContext } from "./LightboxContext";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface Props {
  children: ReactNode;
}

export const LightboxProvider = ({ children }: Props) => {
  const groupsRef = useRef<Record<string, string[]>>({});
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [open, setOpen] = useState(false);
  const [photoMode, setPhotoMode] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);

  const registerGroup = useCallback((group: string, srcs: string[]) => {
    groupsRef.current[group] = srcs;
  }, []);

  const openFn = useCallback((src: string, group?: string) => {
    const g = group ?? "__all__";
    const list = groupsRef.current[g] ?? [src];
    const idx = Math.max(0, list.indexOf(src));
    setActiveGroup(g);
    setActiveIdx(idx);
    setDir(1);
    setChromeVisible(true);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const list = activeGroup ? groupsRef.current[activeGroup] ?? [] : [];
  const prev = useCallback(() => {
    setDir(-1);
    setActiveIdx((i) => (i - 1 + list.length) % list.length);
  }, [list.length]);
  const next = useCallback(() => {
    setDir(1);
    setActiveIdx((i) => (i + 1) % list.length);
  }, [list.length]);

  // preload neighbours for instant next/prev
  useEffect(() => {
    if (!open || list.length === 0) return;
    [-1, 1].forEach((d) => {
      const i = (activeIdx + d + list.length) % list.length;
      const img = new Image();
      img.src = `${import.meta.env.BASE_URL}photos/${list[i]}`;
    });
  }, [open, activeIdx, list]);

  // scroll active thumb into view
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const el = stripRef.current?.querySelector<HTMLElement>(`[data-thumb-idx="${activeIdx}"]`);
    if (!el || !stripRef.current) return;
    const bar = stripRef.current;
    const target = el.offsetLeft - bar.clientWidth / 2 + el.clientWidth / 2;
    bar.scrollTo({ left: target, behavior: "smooth" });
  }, [activeIdx, open]);

  // keyboard
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Home") { setDir(-1); setActiveIdx(0); }
      else if (e.key === "End")  { setDir(1);  setActiveIdx(list.length - 1); }
      else if (e.key.toLowerCase() === "h") setChromeVisible((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, prev, next, list.length]);

  // touch swipe
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touchStart.current; touchStart.current = null;
    if (!s) return;
    const dx = e.changedTouches[0].clientX - s.x;
    const dy = e.changedTouches[0].clientY - s.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? next() : prev();
    } else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) {
      close();
    }
  };

  const current = list[activeIdx];
  const total = list.length;

  const ctxValue = useMemo(
    () => ({ open: openFn, registerGroup, photoMode, setPhotoMode }),
    [openFn, registerGroup, photoMode]
  );

  return (
    <LightboxContext.Provider value={ctxValue}>
      {children}
      {open && current && (
        <div
          className="fixed inset-0 z-[100] bg-[#050505] animate-fade-in"
          onClick={close}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* subtle ambient glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage: `radial-gradient(1200px 700px at 50% 40%, hsl(var(--jade) / 0.12), transparent 70%),
                                radial-gradient(900px 600px at 90% 90%, hsl(var(--gold) / 0.10), transparent 70%)`,
            }}
          />

          {/* TOP CHROME */}
          <div
            className={`absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5 md:px-8 py-5 transition-opacity duration-500 ${
              chromeVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 font-sans-ed text-[10px] tracking-editorial uppercase text-[#f4ecd8]/70">
              <span className="w-1.5 h-1.5 rounded-full bg-jade animate-pulse" />
              Immersive · 沉浸式浏览
              <span className="hidden md:inline text-[#f4ecd8]/40 ml-4">
                ← → 切换 · Esc 关闭 · H 隐藏
              </span>
            </div>
            <button
              onClick={close}
              className="text-[#f4ecd8]/80 hover:text-gold transition-colors p-2"
              aria-label="关闭"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* SIDE ARROWS */}
          {list.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className={`absolute left-3 md:left-8 top-1/2 -translate-y-1/2 z-20 text-[#f4ecd8]/70 hover:text-gold hover:scale-110 transition-all p-4 rounded-full bg-black/40 backdrop-blur border border-white/10 ${
                  chromeVisible ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                aria-label="上一张"
              >
                <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className={`absolute right-3 md:right-8 top-1/2 -translate-y-1/2 z-20 text-[#f4ecd8]/70 hover:text-gold hover:scale-110 transition-all p-4 rounded-full bg-black/40 backdrop-blur border border-white/10 ${
                  chromeVisible ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                aria-label="下一张"
              >
                <ChevronRight className="w-6 h-6 md:w-7 md:h-7" />
              </button>
            </>
          )}

          {/* IMAGE STAGE — click background to close, click image to toggle chrome */}
          <div
            className="absolute inset-0 flex items-center justify-center px-4 pt-16 pb-32 md:pb-36"
            onClick={close}
          >
            <img
              key={current}
              src={`${import.meta.env.BASE_URL}photos/${current}`}
              alt=""
              onClick={(e) => { e.stopPropagation(); setChromeVisible((v) => !v); }}
              className="max-w-[96vw] max-h-full object-contain shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] cursor-zoom-out select-none"
              style={{
                animation: `lb-slide-${dir > 0 ? "in-right" : "in-left"} .5s cubic-bezier(.2,.8,.2,1)`,
              }}
              draggable={false}
            />
          </div>

          {/* BOTTOM CHROME — counter + thumbnail strip */}
          <div
            className={`absolute bottom-0 inset-x-0 z-20 transition-opacity duration-500 ${
              chromeVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* counter */}
            <div className="flex items-center justify-center gap-4 pb-2 font-sans-ed text-[11px] tracking-editorial uppercase text-[#f4ecd8]/70">
              <span className="h-px w-10 bg-gold/60" />
              <span className="text-[#f4ecd8]">
                <span className="text-gold">{String(activeIdx + 1).padStart(2, "0")}</span>
                <span className="text-[#f4ecd8]/40"> / {String(total).padStart(2, "0")}</span>
              </span>
              <span className="h-px w-10 bg-gold/60" />
            </div>

            {/* film-strip thumbnails */}
            {list.length > 1 && (
              <div
                ref={stripRef}
                className="flex gap-2 overflow-x-auto px-4 md:px-8 pb-5 pt-2"
                style={{ scrollbarWidth: "none" }}
              >
                {list.map((src, i) => {
                  const active = i === activeIdx;
                  return (
                    <button
                      key={src + i}
                      data-thumb-idx={i}
                      onClick={() => { setDir(i > activeIdx ? 1 : -1); setActiveIdx(i); }}
                      className={`relative shrink-0 h-14 md:h-16 aspect-[4/3] overflow-hidden border transition-all duration-300 ${
                        active
                          ? "border-gold scale-110 shadow-[0_0_20px_hsl(var(--gold)/0.5)]"
                          : "border-white/10 opacity-45 hover:opacity-90 hover:border-white/30"
                      }`}
                      aria-label={`第 ${i + 1} 张`}
                    >
                      <img
                        src={`${import.meta.env.BASE_URL}photos/${src}`}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {/* slide-in keyframes (scoped) */}
      <style>{`
        @keyframes lb-slide-in-right {
          from { opacity: 0; transform: translate3d(40px, 0, 0) scale(.98); }
          to   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes lb-slide-in-left {
          from { opacity: 0; transform: translate3d(-40px, 0, 0) scale(.98); }
          to   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
      `}</style>
    </LightboxContext.Provider>
  );
};
