"use client";

import * as React from "react";
import Link from "next/link";
import {
  Printer,
  Home,
  ChevronRight,
  Grid2x2,
  Grid3x3,
  Square,
  Eraser,
  PenTool,
  Type,
  Loader2,
  Shapes,
} from "lucide-react";
import { pinyin } from "pinyin-pro";
import { apiGetRadicals } from "@/lib/api";
import type { Radical } from "@/lib/types";
import { cn } from "@/lib/utils";

type GridType = "tian" | "mi" | "blank";
type StrokeData = { strokes: string[] } | null; // null = unavailable

// Han characters only, de-duplicated, in first-seen order.
function uniqueHan(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ch of Array.from(text)) {
    if (/\p{Script=Han}/u.test(ch) && !seen.has(ch)) {
      seen.add(ch);
      out.push(ch);
    }
  }
  return out;
}

function py(ch: string): string {
  try {
    return pinyin(ch, { toneType: "symbol", type: "string" });
  } catch {
    return "";
  }
}

/** The 田字格 / 米字格 guide lines drawn behind each cell. */
function CellGuide({ type }: { type: GridType }) {
  if (type === "blank") return null;
  const line = { stroke: "#e2a8a8", strokeWidth: 0.7, strokeDasharray: "4 3" };
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <line x1="50" y1="0" x2="50" y2="100" {...line} />
      <line x1="0" y1="50" x2="100" y2="50" {...line} />
      {type === "mi" ? (
        <>
          <line x1="0" y1="0" x2="100" y2="100" {...line} />
          <line x1="100" y1="0" x2="0" y2="100" {...line} />
        </>
      ) : null}
    </svg>
  );
}

function Cell({
  type,
  children,
}: {
  type: GridType;
  children?: React.ReactNode;
}) {
  return (
    <div className="writing-cell border border-[#d98c8c]">
      <CellGuide type={type} />
      {children}
    </div>
  );
}

/** One character as a scaled stroke SVG, optionally with the newest stroke red. */
function StrokeGlyph({
  data,
  count,
  transform,
  highlightLast,
}: {
  data: StrokeData;
  count: number; // number of strokes to show (from the start)
  transform: string;
  highlightLast?: boolean;
}) {
  if (!data) return null;
  const shown = data.strokes.slice(0, count);
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
    >
      <g transform={transform}>
        {shown.map((d, i) => (
          <path
            key={i}
            d={d}
            fill={highlightLast && i === count - 1 ? "#dc4a3d" : "#333"}
          />
        ))}
      </g>
    </svg>
  );
}

export function LuyenViet() {
  const [text, setText] = React.useState("你好学习中国木树");
  const [gridType, setGridType] = React.useState<GridType>("tian");
  const [cols, setCols] = React.useState(10);
  const [rows, setRows] = React.useState(2);
  const [showPinyin, setShowPinyin] = React.useState(true);
  const [strokeOrder, setStrokeOrder] = React.useState(true);

  const [strokeData, setStrokeData] = React.useState<Record<string, StrokeData>>(
    {}
  );
  const [transform, setTransform] = React.useState("");
  const [loadingStrokes, setLoadingStrokes] = React.useState(false);

  const [radicals, setRadicals] = React.useState<Radical[] | null>(null);
  const [showRadicals, setShowRadicals] = React.useState(false);

  const chars = React.useMemo(() => uniqueHan(text), [text]);

  // Load hanzi-writer + per-character stroke data (from CDN) when needed.
  React.useEffect(() => {
    if (!strokeOrder || chars.length === 0) return;
    let active = true;
    setLoadingStrokes(true);
    (async () => {
      const HW = (await import("hanzi-writer")).default;
      if (active && !transform) {
        setTransform(HW.getScalingTransform(100, 100, 8).transform);
      }
      for (const ch of chars) {
        if (strokeData[ch] !== undefined) continue;
        try {
          const d = await HW.loadCharacterData(ch);
          if (!active) return;
          setStrokeData((prev) => ({
            ...prev,
            [ch]: d ? { strokes: d.strokes } : null,
          }));
        } catch {
          if (active) setStrokeData((prev) => ({ ...prev, [ch]: null }));
        }
      }
      if (active) setLoadingStrokes(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokeOrder, chars]);

  const openRadicals = async () => {
    setShowRadicals((v) => !v);
    if (!radicals) {
      const r = await apiGetRadicals().catch(() => []);
      setRadicals(r);
    }
  };

  const insert = (s: string) => setText((t) => t + s);

  const sheetStyle = { "--cols": cols } as React.CSSProperties;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="no-print flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground">
          <Home className="size-3.5" /> Trang chủ
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">Luyện viết chữ</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* ── Controls ─────────────────────────────────────────────── */}
        <aside className="no-print space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-card p-4">
            <h1 className="flex items-center gap-2 text-lg font-bold">
              <PenTool className="size-5 text-primary" /> Luyện viết chữ Hán
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Nhập chữ / từ / bộ thủ → tạo vở tập viết ô 田字格 rồi in hoặc lưu PDF.
            </p>

            <label className="mt-3 block text-xs font-medium text-muted-foreground">
              Chữ Hán cần luyện
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập hoặc dán chữ Hán…"
              className="hanzi mt-1 h-24 w-full resize-y rounded-lg border bg-background p-2.5 text-lg outline-none focus:border-primary"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{chars.length} chữ</span>
              <button
                type="button"
                onClick={() => setText("")}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <Eraser className="size-3.5" /> Xoá
              </button>
            </div>

            <button
              type="button"
              onClick={openRadicals}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
            >
              <Shapes className="size-4" /> Chèn bộ thủ
            </button>
            {showRadicals ? (
              <div className="scroll-thin mt-2 max-h-40 overflow-y-auto rounded-lg border p-2">
                {radicals ? (
                  <div className="flex flex-wrap gap-1">
                    {radicals.map((r) => (
                      <button
                        key={r.number}
                        type="button"
                        onClick={() => insert(r.radical)}
                        title={`${r.radical} · ${r.meaning}`}
                        className="hanzi flex size-8 items-center justify-center rounded border text-lg hover:border-primary hover:bg-primary/5"
                      >
                        {r.radical}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Đang tải bộ thủ…
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Options */}
          <div className="space-y-3 rounded-2xl border bg-card p-4">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Kiểu ô
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { k: "tian", label: "田字格", icon: Grid2x2 },
                    { k: "mi", label: "米字格", icon: Grid3x3 },
                    { k: "blank", label: "Ô trống", icon: Square },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.k}
                    type="button"
                    onClick={() => setGridType(g.k)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs",
                      gridType === g.k
                        ? "border-primary bg-primary/5 text-primary"
                        : "hover:bg-secondary"
                    )}
                  >
                    <g.icon className="size-4" />
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <Stepper label="Số ô mỗi hàng" value={cols} set={setCols} min={6} max={16} />
            <Stepper label="Số hàng mỗi chữ" value={rows} set={setRows} min={1} max={6} />

            <Toggle
              label="Hiện pinyin"
              icon={<Type className="size-4" />}
              checked={showPinyin}
              onChange={setShowPinyin}
            />
            <Toggle
              label="Thứ tự nét (笔顺)"
              icon={<PenTool className="size-4" />}
              checked={strokeOrder}
              onChange={setStrokeOrder}
            />
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-primary-foreground shadow-elevated transition-transform hover:scale-[1.02]"
          >
            <Printer className="size-5" /> In / Lưu PDF
          </button>
          {loadingStrokes ? (
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Đang tải nét chữ…
            </p>
          ) : null}
        </aside>

        {/* ── Preview / print sheet ────────────────────────────────── */}
        <div className="overflow-x-auto">
          <div
            id="print-sheet"
            style={sheetStyle}
            className="writing-sheet mx-auto w-fit rounded-lg bg-white p-6 text-black shadow-elevated"
          >
            {chars.length === 0 ? (
              <p className="px-8 py-16 text-center text-sm text-gray-400">
                Nhập chữ Hán ở bên trái để tạo vở tập viết.
              </p>
            ) : (
              <div className="space-y-4">
                {chars.map((ch) => (
                  <CharBlock
                    key={ch}
                    ch={ch}
                    gridType={gridType}
                    cols={cols}
                    rows={rows}
                    showPinyin={showPinyin}
                    strokeOrder={strokeOrder}
                    data={strokeData[ch]}
                    transform={transform}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CharBlock({
  ch,
  gridType,
  cols,
  rows,
  showPinyin,
  strokeOrder,
  data,
  transform,
}: {
  ch: string;
  gridType: GridType;
  cols: number;
  rows: number;
  showPinyin: boolean;
  strokeOrder: boolean;
  data: StrokeData;
  transform: string;
}) {
  const hasStrokes = strokeOrder && data && transform;
  const strokeCount = hasStrokes ? data!.strokes.length : 0;

  // Demo cells: full reference + one cell per cumulative stroke.
  const demoCount = 1 + (hasStrokes ? strokeCount : 0);
  const traceCount = Math.max(cols * rows - demoCount, cols - 1);

  return (
    <div className="break-inside-avoid">
      {showPinyin ? (
        <div className="mb-0.5 pl-0.5 text-[13px] italic text-gray-500">
          {py(ch)}
        </div>
      ) : null}
      <div className="writing-row">
        {/* reference (dark) */}
        <Cell type={gridType}>
          <span className="kaiti writing-char text-[#1a1a1a]">{ch}</span>
        </Cell>
        {/* stroke-order build-up */}
        {hasStrokes
          ? data!.strokes.map((_, i) => (
              <Cell key={`s${i}`} type={gridType}>
                <StrokeGlyph
                  data={data}
                  count={i + 1}
                  transform={transform}
                  highlightLast
                />
              </Cell>
            ))
          : null}
        {/* faded copies to trace */}
        {Array.from({ length: traceCount }).map((_, i) => (
          <Cell key={`t${i}`} type={gridType}>
            <span className="kaiti writing-char text-[#d8d8d8]">{ch}</span>
          </Cell>
        ))}
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  set,
  min,
  max,
}: {
  label: string;
  value: number;
  set: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => set(Math.max(min, value - 1))}
          className="size-7 rounded-md border text-sm hover:bg-secondary"
        >
          −
        </button>
        <span className="w-7 text-center text-sm font-semibold tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={() => set(Math.min(max, value + 1))}
          className="size-7 rounded-md border text-sm hover:bg-secondary"
        >
          +
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  icon,
  checked,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between"
    >
      <span className="inline-flex items-center gap-1.5 text-sm">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-secondary"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}
