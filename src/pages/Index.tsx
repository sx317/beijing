import { useEffect, useState, useMemo, useRef, useContext } from "react";
import { Photo } from "@/components/Photo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { JustifiedGrid } from "@/components/JustifiedGrid";
import { LightboxContext } from "@/components/LightboxContext";


import { PhotoGroup } from "@/components/FilmStrip";
import { useReveal } from "@/hooks/useReveal";
import { Images, X as XIcon, Moon, Sun, Expand } from "lucide-react";



/** 每张照片的位置/裁切偏好——保证主体不被 object-cover 切到 */
type Slot = {
  src: string;
  pos?: string;
  fit?: "cover" | "contain";
};

interface Section {
  id: string;
  day: string;      // Day 1 / Day 2
  date: string;     // 06.12
  time: string;     // 上午 / 夜里 / 主会场...
  title: string;    // 天坛 · 清晨
  en: string;       // Temple of Heaven
  note: string;
  slots: Slot[];
}

const ITINERARY: Section[] = [
  {
    id: "d1-arrival",
    day: "Day 1", date: "06.12", time: "抵京",
    title: "落地北京 · 一路向北",
    en: "Arrival",
    note: "石家庄到北京，一趟高铁的时间。走出车站的第一口空气，比想象里更干、更亮。",
    slots: [
      { src: "1781533716853.png", pos: "50% 60%" },
      { src: "Videoshot_20260612_223802.jpg", pos: "50% 45%" },
    ],
  },
  {
    id: "d1-am",
    day: "Day 1", date: "06.12", time: "上午",
    title: "天坛 · 清晨",
    en: "Temple of Heaven",
    note: "第一站。蓝瓦圆顶下，回声压得很低，像有人在你耳边轻轻清嗓。走完祈年殿、皇乾殿、天贶殿，古柏在头顶投下整片碎光。",
    slots: [
      { src: "IMG_20260613_081111.jpg", pos: "50% 40%" },
      { src: "huangqian_plaque.jpg", pos: "50% 40%" },
      { src: "tiantan_cypress.jpg", pos: "50% 45%" },
      { src: "IMG_20260612_115911.jpg", pos: "50% 40%" },
      { src: "tiantan_altar.jpg", pos: "50% 50%" },
      { src: "IMG_20260612_225116.jpg", pos: "60% 45%" },
      { src: "tiantan_hall_wide.jpg", pos: "50% 45%" },
      { src: "IMG_20260612_112524.jpg", pos: "50% 45%" },
    ],
  },
  {
    id: "d1-noon",
    day: "Day 1", date: "06.12", time: "午饭",
    title: "京味 · 一大碗",
    en: "Lunch — Beijing Style",
    note: "从天坛出来正好中午。找了家胡同小馆，一大碗肉菜炖到冒气，一罐冰凉的汽水，太阳穴的汗才终于停下来。",
    slots: [
      { src: "jing_lunch.jpg", pos: "50% 50%" },
    ],
  },
  {
    id: "d1-pm",
    day: "Day 1", date: "06.12", time: "夜里",
    title: "什刹海 · 鼓楼 · 南锣 · 鸟巢",
    en: "By Night",
    note: "从水边走到胡同，一盏一盏灯亮起来。烟袋斜街的旧纸味、鼓楼下的风，再拐去鸟巢，钢筋编成一只巨大的红笼。",
    slots: [
      { src: "IMG_20260612_201029.jpg", pos: "30% 55%" },
      { src: "IMG_20260612_201054.jpg", pos: "50% 40%" },
      { src: "IMG_20260612_204349.jpg", pos: "50% 50%" },
      { src: "iheart_beijing.jpg", pos: "50% 50%" },
      { src: "IMG_20260612_211422.jpg", pos: "40% 50%" },
      { src: "Videoshot_20260612_221728.jpg", pos: "50% 40%" },
    ],
  },
  {
    id: "d2-conf",
    day: "Day 2", date: "06.13", time: "白天",
    title: "主会场 · 分会场",
    en: "Conference Day",
    note: "第一排的位置，笔记本翻到新的一页。上午听 Keynote，中午在门口拍了一张，下午自己上台，做完汇报，长舒一口气。",
    slots: [
      { src: "IMG_20260613_085902.jpg", pos: "50% 35%" },
      { src: "IMG_20260613_081841.jpg", pos: "50% 55%" },
      { src: "IMG_20260613_112857.jpg", pos: "50% 50%" },
      { src: "mmexport1781354197737.jpg", pos: "50% 55%" },
    ],
  },
  {
    id: "d2-eve",
    day: "Day 2", date: "06.13", time: "夜里",
    title: "举杯 · 合影 · 相遇",
    en: "Dinner & Friends",
    note: "把一天的话说完，把明天的话留着。餐桌一转，认识了整桌人；走廊尽头又碰见外校的前辈、同门的朋友。",
    slots: [
      { src: "IMG_20260613_200553.jpg", pos: "50% 55%" },
      { src: "Videoshot_20260613_210638.jpg", pos: "50% 40%" },
      { src: "Videoshot_20260613_210042.jpg", pos: "50% 45%" },
      { src: "Videoshot_20260613_210114.jpg", pos: "50% 45%" },
      { src: "Videoshot_20260613_210226.jpg", pos: "50% 45%" },
      { src: "Videoshot_20260613_210323.jpg", pos: "50% 45%" },
    ],
  },
  {
    id: "d3",
    day: "Day 3", date: "06.14", time: "回程日",
    title: "茶歇 · 湖边 · 一个葫芦",
    en: "Farewell Day",
    note: "会议之外，留一个上午的茶歇，一个下午给自己。湖面上有人划板，公园角落一只红葫芦，风把三天的话全吹散了。",
    slots: [
      { src: "tea_break_dessert.jpg", pos: "50% 55%" },
      { src: "IMG_20260614_165005.jpg", pos: "50% 45%" },
      { src: "park_gourd.jpg", pos: "50% 55%" },
    ],
  },
];

const HERO_SRC = "IMG_20260612_201029.jpg";





const Index = () => {
  useReveal();
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [photoMode, setPhotoMode] = useState(false);
  const [activeId, setActiveId] = useState<string>(ITINERARY[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Intersection observer for active timeline entry
  useEffect(() => {
    if (photoMode) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    ITINERARY.forEach((s) => {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [photoMode]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const isMobile = window.innerWidth < 768;
    // account for fixed nav + (mobile) sticky timeline bar
    const offset = isMobile ? 128 : 96;
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
    // pulse the target for visual feedback
    el.classList.remove("section-pulse");
    // force reflow to restart animation
    void el.offsetWidth;
    el.classList.add("section-pulse");
    setActiveId(id);
  };


  useEffect(() => {
    if (!photoMode) {
      setTimeout(() => {
        document.querySelectorAll(".reveal,.reveal-left,.reveal-right,.reveal-up-lg")
          .forEach((el) => el.classList.add("in"));
      }, 50);
    }
  }, [photoMode]);

  const photoModeSections = useMemo(
    () =>
      ITINERARY.map((s) => ({
        id: `pm-${s.id}`,
        title: `${s.day} · ${s.time} · ${s.title}`,
        srcs: s.slots.map((sl) => sl.src).filter((v): v is string => !!v),
      })).filter((s) => s.srcs.length > 0),
    []
  );

  // group by day for sidebar
  const days = useMemo(() => {
    const map = new Map<string, Section[]>();
    ITINERARY.forEach((s) => {
      if (!map.has(s.day)) map.set(s.day, []);
      map.get(s.day)!.push(s);
    });
    return Array.from(map.entries());
  }, []);

  // flatten all photos for immersive "全部" browsing
  const allPhotos = useMemo(
    () => ITINERARY.flatMap((s) => s.slots.map((sl) => sl.src).filter((v): v is string => !!v)),
    []
  );
  const lightbox = useContext(LightboxContext);
  // register "__all__" group so nav button can open immersive mode across every photo
  const allKey = allPhotos.join("|");
  useEffect(() => {
    lightbox?.registerGroup("__all__", allPhotos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allKey]);
  const openImmersive = () => {
    if (allPhotos.length) lightbox?.open(allPhotos[0], "__all__");
  };


  return (
    <div className="min-h-screen bg-paper text-ink relative">
      {/* NAV */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled || photoMode ? "bg-paper/92 backdrop-blur border-b border-ink/10" : "bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between h-16">
          <button
            onClick={() => { setPhotoMode(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="flex items-center gap-2 leading-none"
          >
            <span className="seal-stamp seal-sm" aria-hidden>时</span>
            <span className="font-serif text-2xl italic text-ink">小时</span>
            <span className="font-sans-ed text-[10px] tracking-editorial text-gold uppercase hidden sm:inline">— 京 Vol.01</span>
          </button>
          <div className="hidden md:flex items-center gap-8 font-sans-ed text-[11px] uppercase tracking-editorial text-ink/80">
            <button onClick={() => { setPhotoMode(false); setTimeout(() => scrollTo("d1-arrival"), 50); }} className="link-underline">Day 1</button>
            <button onClick={() => { setPhotoMode(false); setTimeout(() => scrollTo("d2-conf"), 50); }} className="link-underline">Day 2</button>
            <button onClick={() => { setPhotoMode(false); setTimeout(() => scrollTo("d3"), 50); }} className="link-underline">Day 3</button>
            <button onClick={() => { setPhotoMode(false); setTimeout(() => scrollTo("end"), 50); }} className="link-underline">回看</button>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={openImmersive}
              className="font-sans-ed text-[11px] uppercase tracking-editorial border border-gold text-gold px-3 py-1.5 hover:bg-gold hover:text-ink transition-colors inline-flex items-center gap-2"
              title="沉浸式浏览所有照片 · 方向键切换"
            >
              <Expand className="w-3.5 h-3.5" />沉浸
            </button>
            <button
              onClick={() => setPhotoMode((v) => !v)}
              className="font-sans-ed text-[11px] uppercase tracking-editorial border border-ink/40 px-3 py-1.5 hover:bg-jade hover:text-paper hover:border-jade transition-colors inline-flex items-center gap-2"
            >
              {photoMode ? (<><XIcon className="w-3.5 h-3.5" />退出</>) : (<><Images className="w-3.5 h-3.5" />照片墙</>)}
            </button>
          </div>

        </div>
      </nav>


      {photoMode ? (
        <PhotoModeView sections={photoModeSections} />
      ) : (
        <>
          {/* HERO */}
          <section className="relative pt-28 pb-16 md:pt-32 md:pb-24 paper-grain overflow-hidden">
            {/* decoration */}
            <div
              className="pointer-events-none absolute -top-10 -right-10 w-80 h-80 rounded-full bg-jade/12 blur-3xl"
              style={{ transform: `translate3d(0, ${scrollY * 0.15}px, 0)` }}
            />
            <div
              className="pointer-events-none absolute bottom-0 -left-10 w-72 h-72 rounded-full bg-gold/15 blur-3xl"
              style={{ transform: `translate3d(0, ${-scrollY * 0.1}px, 0)` }}
            />
            <div className="absolute inset-x-0 top-16 h-40 cloud-pattern opacity-40 pointer-events-none" />
            {/* single big background hanzi, safely tucked bottom-right */}
            <div
              aria-hidden
              className="hanzi-bg absolute -bottom-10 -right-6 md:-right-16 text-jade/[0.07] text-[40vw] md:text-[26vw] leading-none select-none pointer-events-none"
              style={{ transform: `translate3d(0, ${scrollY * 0.08}px, 0)` }}
            >京</div>

            <div className="container relative z-10">
              <div className="flex items-center justify-between font-sans-ed text-[10px] tracking-editorial uppercase text-ink/60 mb-10">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-jade rounded-full animate-pulse" />
                  京城手记 · Graduate Diary · Vol. 01
                </span>
                <span className="hidden sm:flex items-center gap-3">
                  <span className="h-px w-10 bg-gold/60" />
                  June · 2026
                </span>
              </div>

              <div className="grid md:grid-cols-12 gap-10 items-center">
                <div className="md:col-span-6 reveal-left">
                  <h1 className="font-serif text-ink leading-[0.9]">
                    <span className="block font-light text-6xl md:text-[7.5rem]">
                      北<span className="text-jade">京</span>
                    </span>
                    <span className="block font-serif italic text-2xl md:text-3xl text-gold-shine mt-3">
                      Beijing Memorandum
                    </span>
                  </h1>
                  <div className="mt-8 border-l-2 border-jade pl-5 max-w-lg">
                    <p className="font-sans-ed text-[10px] tracking-editorial uppercase text-jade mb-2">研究生 · 小时 / SJZ → BJS</p>
                    <p className="font-cn-serif text-lg leading-[1.9] text-ink/80">
                      三天，两城，一份论文之外的记录。<br />
                      <span className="text-jade italic">06.12 → 06.14 · 2026</span>
                    </p>
                  </div>

                  <div className="mt-10 grid grid-cols-4 gap-0 border-y border-ink/20 divide-x divide-ink/10 max-w-md">
                    {[
                      { k: "Days",  v: "3"  },
                      { k: "Spots", v: "4"  },
                      { k: "会议",  v: "1"  },
                      { k: "№",     v: "01" },
                    ].map((s, i) => (
                      <div key={s.k} className="py-4 px-2 text-center reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                        <div className="font-serif text-3xl text-ink">{s.v}</div>
                        <div className="font-sans-ed text-[9px] tracking-editorial uppercase text-ink/55 mt-1">{s.k}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-6 reveal-right">
                  <div
                    className="relative corner-frame"
                    style={{ transform: `translate3d(0, ${scrollY * -0.05}px, 0)` }}
                  >
                    <Photo
                      src={HERO_SRC}
                      alt="北京夜色"
                      loading="eager"
                      className="w-full aspect-[4/5] md:aspect-[16/12]"
                      group="hero"
                      objectPosition="30% 55%"
                    />

                    <PhotoGroup group="hero" srcs={[HERO_SRC]}><></></PhotoGroup>
                    <div className="washi-tape -top-3 left-8 tilt-l">06.12 · 首夜</div>
                    <div className="absolute -bottom-5 -right-5 bg-ink text-paper px-4 py-2 flex flex-col items-center shadow-xl border border-gold/40">
                      <span className="text-[9px] tracking-editorial uppercase opacity-70 text-gold">Date</span>
                      <span className="font-serif italic text-lg leading-none mt-1">06.12 — 14</span>
                    </div>
                    <span className="seal-stamp absolute -top-6 -right-6 shadow-lg z-20" aria-hidden>京</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* long wall silhouette */}
          <div className="wall-silhouette w-full" aria-hidden />

          {/* MARQUEE */}
          <div className="marquee-panel overflow-hidden py-4 relative">
            <div className="absolute inset-0 lattice-pattern opacity-25" />
            <div className="marquee-soft font-serif italic text-2xl md:text-3xl relative">
              {Array(2).fill(0).map((_, i) => (
                <div key={i} className="flex gap-14 items-center pr-14">
                  <span className="text-gold-shine text-3xl md:text-4xl">北 · 京 · 手 · 记</span>
                  <span className="text-jade text-3xl">❖</span>
                  <span className="text-paper/85">天坛 · 什刹海 · 鼓楼 · 南锣</span>
                  <span className="text-jade text-3xl">✦</span>
                  <span className="text-paper/85">06.12 → 06.14 / 2026</span>
                  <span className="text-jade text-3xl">❖</span>
                  <span className="text-paper/85">A Graduate Diary by 小时</span>
                  <span className="text-jade text-3xl">✦</span>
                </div>
              ))}
            </div>
          </div>

          <div className="wall-silhouette wall-silhouette-flip w-full" aria-hidden />

          {/* ITINERARY — sidebar timeline + sections */}
          <div className="container py-20 md:py-28 lg:pl-56 xl:pl-64">
            <header className="mb-14 md:mb-20 max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="seal-stamp seal-sm" aria-hidden>行</span>
                <div className="font-sans-ed text-[11px] tracking-editorial uppercase text-gold">
                  Itinerary · 三日行程
                </div>
              </div>
              <h2 className="font-serif font-light text-5xl md:text-7xl leading-[0.95]">
                按<span className="text-jade italic">时间</span>翻页——<br />
                白天走路，<span className="italic">夜里吃灯</span>。
              </h2>
              <p className="mt-6 font-cn-serif text-base md:text-lg leading-[1.9] text-ink/75 max-w-xl">
                左边是时间线，点一下就滑过去；右边是那半天里，眼睛落到的所有地方。
              </p>
            </header>

            <div className="space-y-16 md:space-y-24">
              {ITINERARY.map((s, idx) => {
                const groupSrcs = s.slots.map((sl) => sl.src).filter((v): v is string => !!v);
                return (
                  <section
                    key={s.id}
                    id={s.id}
                    ref={(el) => (sectionRefs.current[s.id] = el)}
                    className={`scroll-mt-32 md:scroll-mt-24 relative ${s.id.startsWith("d2-") ? "academic" : ""}`}
                  >

                    {/* section header */}
                    <div className="mb-10 md:mb-12 reveal-left">
                      <div className="flex items-baseline gap-4 mb-3 flex-wrap">
                        <span className="font-serif italic text-jade text-2xl md:text-3xl">
                          {s.day}
                        </span>
                        <span className="h-px w-10 bg-gold" />
                        <span className="font-sans-ed text-[10px] tracking-editorial uppercase text-ink/60">
                          {s.date} · {s.time}
                        </span>
                        <span className="ml-auto font-sans-ed text-[10px] tracking-editorial uppercase text-ink/40">
                          {String(idx + 1).padStart(2, "0")} / {String(ITINERARY.length).padStart(2, "0")}
                        </span>
                      </div>
                      <h3 className="font-serif font-light text-4xl md:text-6xl leading-[1.05] text-ink">
                        {s.title}
                      </h3>
                      <div className="font-sans-ed text-[10px] tracking-editorial uppercase text-gold mt-2">
                        {s.en}
                      </div>
                      <p className="mt-5 font-cn-serif text-[14px] md:text-[16px] leading-[1.9] text-ink/70 max-w-2xl">
                        {s.note}
                      </p>
                      <div className="h-px w-16 bg-ink/25 mt-6" />
                    </div>

                    {/* justified photo grid — every row fills width exactly, no gaps, no jutting tiles */}
                    <PhotoGroup group={s.id} srcs={groupSrcs}>
                      <JustifiedGrid items={s.slots} group={s.id} />
                    </PhotoGroup>

                  </section>
                );
              })}
            </div>
          </div>

          {/* FLOATING TIMELINE — desktop fixed left, appears after hero */}
          <FloatingTimeline
            days={days}
            activeId={activeId}
            scrollY={scrollY}
            onJump={scrollTo}
          />

          {/* MOBILE STICKY TIMELINE BAR — below nav, appears after hero */}
          <MobileTimelineBar
            items={ITINERARY}
            activeId={activeId}
            scrollY={scrollY}
            onJump={scrollTo}
          />


          {/* END */}
          <section id="end" className="relative py-28 md:py-40 paper-grain overflow-hidden bg-paper">
            {/* 忆 — 完整可见，右下角，不做负偏移避免裁切 */}
            <div
              aria-hidden
              className="hanzi-bg absolute bottom-6 right-4 md:bottom-10 md:right-10 text-jade/[0.09] text-[38vw] md:text-[22vw] leading-[0.85] select-none pointer-events-none"
            >忆</div>


            <div className="container relative z-10 flex flex-col items-center">
              <div className="reveal-up-lg text-center max-w-2xl">
                <div className="font-sans-ed text-[11px] tracking-editorial uppercase text-gold mb-6">
                  After Beijing · 回程
                </div>
                <h2 className="font-serif font-light text-5xl md:text-7xl leading-[0.95]">
                  北京之后，<br />
                  <span className="italic text-jade">继续出发</span>。
                </h2>
                <p className="mt-8 font-cn-serif text-base md:text-lg leading-[1.9] text-ink/75">
                  这趟行程被照片保存，<br />
                  也被一些新的想法悄悄延续。
                </p>
              </div>

              {/* 2026 — separate block, generous spacing so nothing overlaps */}
              <div className="reveal mt-24 md:mt-32 text-center w-full">
                <div
                  className="font-serif italic text-[18vw] md:text-[11vw] leading-[0.85] tracking-tight text-ink/90"
                  style={{ transform: `translate3d(0, ${Math.max(-24, Math.min(24, (scrollY - 4200) * -0.02))}px, 0)` }}
                >
                  2026
                </div>
                <div className="mt-10 md:mt-14 font-sans-ed text-[11px] tracking-editorial uppercase text-ink/55">
                  06.12 — 06.14 · Beijing · Diary № 01 · 完
                </div>
                <div className="mt-8 inline-flex items-center gap-4 font-serif italic text-xl text-ink/70">
                  <span className="h-px w-12 bg-gold" />
                  by 小时
                  <span className="seal-stamp seal-sm" aria-hidden>时</span>
                  <span className="h-px w-12 bg-gold" />
                </div>
              </div>
            </div>
          </section>


          <footer className="border-t border-ink/15 py-10 bg-paper">
            <div className="container flex flex-wrap items-center justify-between gap-4 font-sans-ed text-[10px] tracking-editorial uppercase text-ink/55">
              <span>© 2026 · 小时 · A Personal Diary</span>
              <span>Made with ☕ · SJZ → Beijing</span>
              <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="link-underline text-ink/70">
                回到顶部 ↑
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};

/* ============ FLOATING TIMELINE (desktop, fixed left) ============ */
const FloatingTimeline = ({
  days,
  activeId,
  scrollY,
  onJump,
}: {
  days: [string, Section[]][];
  activeId: string;
  scrollY: number;
  onJump: (id: string) => void;
}) => {
  // hide until past hero (~viewport height)
  const visible = scrollY > 400;
  return (
    <aside
      aria-label="Timeline"
      className={`hidden lg:flex fixed left-4 xl:left-6 top-1/2 -translate-y-1/2 z-40 flex-col transition-all duration-700 h-[72vh] max-h-[820px] ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6 pointer-events-none"
      }`}
      style={{ width: "168px" }}
    >
      <div className="font-sans-ed text-[9px] tracking-editorial uppercase text-ink/45 mb-3 pl-5 flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-jade animate-pulse" />
        Timeline · 时间线
      </div>

      {/* rail + entries, flex-1 so the vertical line stretches full height */}
      <div className="relative flex-1 pl-5">
        {/* central gradient rail — full height */}
        <svg
          className="absolute left-[7px] top-0 h-full w-[2px] pointer-events-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="rail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="hsl(var(--gold))" stopOpacity="0.1" />
              <stop offset="20%"  stopColor="hsl(var(--jade))" stopOpacity="0.55" />
              <stop offset="80%"  stopColor="hsl(var(--jade))" stopOpacity="0.55" />
              <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <line x1="1" y1="0" x2="1" y2="100%" stroke="url(#rail)" strokeWidth="1.5" />
          {/* tick marks */}
          <line x1="0" y1="1"   x2="4" y2="1"   stroke="hsl(var(--gold))" strokeWidth="1" opacity="0.7" />
          <line x1="0" y1="50%" x2="4" y2="50%" stroke="hsl(var(--gold))" strokeWidth="1" opacity="0.5" />
          <line x1="0" y1="99%" x2="4" y2="99%" stroke="hsl(var(--gold))" strokeWidth="1" opacity="0.7" />
        </svg>

        {/* entries evenly distributed top→bottom */}
        <ul className="h-full flex flex-col justify-between py-1">
          {days.flatMap(([day, sections]) =>
            sections.map((s, i) => {
              const isFirstOfDay = i === 0;
              const active = activeId === s.id;
              return (
                <li key={s.id} className="relative">
                  {isFirstOfDay && (
                    <div className="absolute -top-4 left-3 font-serif italic text-[13px] text-jade whitespace-nowrap">
                      {day} <span className="text-ink/40 text-[10px] not-italic ml-1">· {s.date}</span>
                    </div>
                  )}
                  <button
                    onClick={() => onJump(s.id)}
                    className={`group relative w-full text-left pl-4 pr-1 py-1.5 transition-all duration-500 ${
                      active
                        ? "scale-[1.15] origin-left"
                        : "opacity-55 hover:opacity-100 hover:translate-x-1"
                    }`}
                  >
                    <span
                      className={`absolute -left-[5px] top-1/2 -translate-y-1/2 rounded-full transition-all duration-500 border ${
                        active
                          ? "w-4 h-4 bg-jade border-gold ring-4 ring-jade/25 shadow-[0_0_18px_hsl(var(--jade)/0.7)]"
                          : "w-2 h-2 bg-paper border-gold/70 group-hover:bg-gold/60"
                      }`}
                    />
                    <div
                      className={`font-sans-ed text-[9px] tracking-editorial uppercase transition-colors leading-none ${
                        active ? "text-jade" : "text-ink/55"
                      }`}
                    >
                      {s.time}
                    </div>
                    <div
                      className={`font-cn-serif leading-tight transition-all whitespace-nowrap mt-0.5 ${
                        active ? "text-ink text-[13px] font-medium" : "text-ink/70 text-[11px]"
                      }`}
                    >
                      {s.title}
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </aside>
  );
};


/* ============ MOBILE STICKY TIMELINE BAR ============ */
const MobileTimelineBar = ({
  items,
  activeId,
  scrollY,
  onJump,
}: {
  items: Section[];
  activeId: string;
  scrollY: number;
  onJump: (id: string) => void;
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const visible = scrollY > 400;

  // auto-center the active pill horizontally
  useEffect(() => {
    if (!visible) return;
    const bar = barRef.current;
    if (!bar) return;
    const btn = bar.querySelector<HTMLButtonElement>(`[data-pill="${activeId}"]`);
    if (!btn) return;
    const targetLeft = btn.offsetLeft - bar.clientWidth / 2 + btn.clientWidth / 2;
    bar.scrollTo({ left: targetLeft, behavior: "smooth" });
  }, [activeId, visible]);

  return (
    <div
      className={`lg:hidden fixed top-16 inset-x-0 z-40 bg-paper/92 backdrop-blur border-b border-ink/10 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
    >
      <div
        ref={barRef}
        className="flex gap-2 overflow-x-auto px-4 py-2.5 scrollbar-thin"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((s) => {
          const active = activeId === s.id;
          return (
            <button
              key={s.id}
              data-pill={s.id}
              onClick={() => onJump(s.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full border font-sans-ed text-[10px] tracking-wider transition-all duration-300 whitespace-nowrap ${
                active
                  ? "bg-jade text-paper border-jade scale-110 shadow-[0_4px_14px_hsl(var(--jade)/0.4)]"
                  : "bg-paper text-ink/70 border-ink/20"
              }`}
            >
              <span className="opacity-70 mr-1.5">{s.date.slice(3)}</span>
              {s.time}
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface PMSection { id: string; title: string; srcs: string[] }


const PhotoModeView = ({ sections }: { sections: PMSection[] }) => {
  const scrollPM = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="pt-24 pb-20 bg-paper min-h-screen animate-fade-in">
      <div className="container">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-ink/15 pb-6">
          <div>
            <div className="font-sans-ed text-[10px] tracking-editorial uppercase text-gold mb-2">
              Photo Mode · 全部照片
            </div>
            <h2 className="font-serif font-light text-3xl md:text-5xl">
              {sections.reduce((n, s) => n + s.srcs.length, 0)} 张瞬间
            </h2>
          </div>
          <nav className="flex flex-wrap gap-4 font-sans-ed text-[11px] tracking-editorial uppercase">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollPM(s.id)}
                className="link-underline text-ink/70 hover:text-jade"
              >
                {s.title}
              </button>
            ))}
          </nav>
        </header>

        <div className="space-y-16">
          {sections.map((sec) => (
            <section key={sec.id} id={sec.id} className="scroll-mt-24">
              <div className="flex items-center gap-4 mb-5">
                <h3 className="font-serif italic text-2xl md:text-3xl text-ink">{sec.title}</h3>
                <span className="h-px flex-1 bg-gold/40" />
                <span className="font-sans-ed text-[10px] tracking-editorial text-ink/50">
                  {sec.srcs.length} 张
                </span>
              </div>
              <PhotoGroup group={`pm-${sec.id}`} srcs={sec.srcs}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                  {sec.srcs.map((src, i) => (
                    <Photo
                      key={src + i}
                      src={src}
                      group={`pm-${sec.id}`}
                      className="w-full aspect-square"
                    />
                  ))}
                </div>
              </PhotoGroup>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
