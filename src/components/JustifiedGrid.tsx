import { useEffect, useMemo, useRef, useState } from "react";
import { Photo } from "@/components/Photo";

/** aspect ratio (w / h) for every photo shipped in /public/photos */
export const PHOTO_ASPECTS: Record<string, number> = {
  "1781533716853.png": 0.75,
  "IMG_20260612_112524.jpg": 0.75,
  "IMG_20260612_115911.jpg": 1.7778,
  "IMG_20260612_201029.jpg": 1.7778,
  "IMG_20260612_201054.jpg": 1.3333,
  "IMG_20260612_204349.jpg": 1.3333,
  "IMG_20260612_211422.jpg": 1.7778,
  "IMG_20260612_225116.jpg": 1.7778,
  "IMG_20260613_081111.jpg": 0.75,
  "IMG_20260613_081841.jpg": 1.3333,
  "IMG_20260613_085902.jpg": 1.3333,
  "IMG_20260613_112857.jpg": 0.75,
  "IMG_20260613_200553.jpg": 1.3333,
  "IMG_20260614_165005.jpg": 1.3333,
  "Videoshot_20260612_221728.jpg": 1.7778,
  "Videoshot_20260612_223802.jpg": 1.7778,
  "Videoshot_20260613_210042.jpg": 1.7778,
  "Videoshot_20260613_210114.jpg": 1.7778,
  "Videoshot_20260613_210226.jpg": 1.7778,
  "Videoshot_20260613_210323.jpg": 1.7778,
  "Videoshot_20260613_210638.jpg": 1.7778,
  "huangqian_plaque.jpg": 1.3333,
  "iheart_beijing.jpg": 1.3333,
  "jing_lunch.jpg": 1.3333,
  "mmexport1781354197737.jpg": 1.0,
  "park_gourd.jpg": 0.75,
  "tea_break_dessert.jpg": 0.75,
  "tiantan_altar.jpg": 0.75,
  "tiantan_cypress.jpg": 0.75,
  "tiantan_hall_wide.jpg": 1.3333,
};

export interface JGItem {
  src: string;
  pos?: string;
  fit?: "cover" | "contain";
}

interface JustifiedGridProps {
  items: JGItem[];
  group: string;
  /** target row height at desktop widths (mobile scales down) */
  targetRowHeight?: number;
  gap?: number;
  className?: string;
}

/**
 * Flickr-style justified grid — each row fills the container width exactly
 * by scaling row height so `sum(aspect * H) + gaps = W`. No empty tiles,
 * no jutting cells, every photo scales up to remove whitespace.
 */
export const JustifiedGrid = ({
  items,
  group,
  targetRowHeight,
  gap = 12,
  className = "",
}: JustifiedGridProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const rows = useMemo(() => {
    if (!width || items.length === 0) return [] as { row: (JGItem & { w: number; h: number })[]; h: number }[];

    // responsive target row height
    const H =
      targetRowHeight ??
      (width < 480 ? 200 : width < 720 ? 260 : width < 1024 ? 300 : width < 1400 ? 340 : 380);

    const aspects = items.map((it) => PHOTO_ASPECTS[it.src] ?? 1);

    // first pass: pack indexes into rows (aspect-sum bucket)
    const rowsIdx: number[][] = [];
    let cur: number[] = [];
    let curSum = 0;
    items.forEach((_, i) => {
      cur.push(i);
      curSum += aspects[i];
      const projectedH = (width - (cur.length - 1) * gap) / curSum;
      if (projectedH <= H * 0.9) {
        rowsIdx.push(cur);
        cur = [];
        curSum = 0;
      }
    });
    if (cur.length) rowsIdx.push(cur);

    // orphan fix: if last row has only 1 item and there's a previous row, merge it in
    if (rowsIdx.length >= 2 && rowsIdx[rowsIdx.length - 1].length === 1) {
      const orphan = rowsIdx.pop()![0];
      rowsIdx[rowsIdx.length - 1].push(orphan);
    }

    // second pass: compute each row's height so widths sum to the container width
    const isLastFn = (ri: number) => ri === rowsIdx.length - 1;
    return rowsIdx.map((row, ri) => {
      const totalGap = (row.length - 1) * gap;
      const aspectSum = row.reduce((s, i) => s + aspects[i], 0);
      let rowH = (width - totalGap) / aspectSum;
      // last-row polish: fill width for solo landscapes, but keep portraits from ballooning
      if (isLastFn(ri)) {
        const maxH = row.length === 1 ? H * 1.9 : H * 1.4;
        rowH = Math.min(rowH, maxH);
      }

      const built = row.map((idx) => ({ ...items[idx], w: aspects[idx] * rowH, h: rowH }));
      return { row: built, h: rowH };
    });
  }, [items, width, gap, targetRowHeight]);


  return (
    <div ref={ref} className={className}>
      {rows.map((r, ri) => (
        <div
          key={ri}
          className="flex"
          style={{ gap: `${gap}px`, marginBottom: ri === rows.length - 1 ? 0 : gap }}
        >
          {r.row.map((it, ci) => (
            <div
              key={it.src + ci}
              className="relative reveal group overflow-hidden"
              style={{
                width: `${it.w}px`,
                height: `${it.h}px`,
                transitionDelay: `${Math.min((ri * 4 + ci) * 60, 480)}ms`,
              }}
            >
              <Photo
                src={it.src}
                alt=""
                group={group}
                className="w-full h-full"
                objectPosition={it.pos}
                objectFit={it.fit}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
