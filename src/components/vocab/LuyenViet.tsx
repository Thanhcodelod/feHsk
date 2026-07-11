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
  SquareDashedBottom,
  Eraser,
  PenTool,
  Type,
  Loader2,
  Shapes,
  Sparkles,
} from "lucide-react";
import { pinyin } from "pinyin-pro";
import { apiGetRadicals } from "@/lib/api";
import type { Radical } from "@/lib/types";
import { cn } from "@/lib/utils";

type GridType = "tian" | "mi" | "hui" | "blank";
type SheetMode = "practice" | "blank";
type StrokeData = { strokes: string[] } | null; // null = unavailable

const LINE_COLORS = {
  red: { name: "Đỏ", border: "#d98c8c", guide: "#e8b4b4" },
  green: { name: "Xanh lá", border: "#7fbf90", guide: "#a9d8b6" },
  gray: { name: "Xám", border: "#b7b7b7", guide: "#d6d6d6" },
  blue: { name: "Xanh dương", border: "#93b4db", guide: "#b8cfec" },
} as const;
type LineColor = keyof typeof LINE_COLORS;

const FONTS = {
  kaiti: { name: "Khải thư", cls: "kaiti" },
  songti: { name: "Tống thể", cls: "songti" },
  heiti: { name: "Hắc thể", cls: "hanzi" },
} as const;
type FontKey = keyof typeof FONTS;

const TRACE_SHADES = {
  light: { name: "Nhạt", color: "#e7e7e7" },
  medium: { name: "Vừa", color: "#cfcfcf" },
  dark: { name: "Đậm", color: "#b2b2b2" },
} as const;
type TraceShade = keyof typeof TRACE_SHADES;

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

/** 田字格 / 米字格 / 回宫格 guide lines behind each cell. */
function CellGuide({ type, color }: { type: GridType; color: string }) {
  if (type === "blank") return null;
  const line = { stroke: color, strokeWidth: 0.7, strokeDasharray: "4 3" };
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
      {type === "hui" ? (
        <rect x="20" y="20" width="60" height="60" fill="none" {...line} />
      ) : null}
    </svg>
  );
}

function Cell({
  type,
  color,
  border,
  children,
}: {
  type: GridType;
  color: string;
  border: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="writing-cell" style={{ border: `1px solid ${border}` }}>
      <CellGuide type={type} color={color} />
      {children}
    </div>
  );
}

function StrokeGlyph({
  data,
  count,
  transform,
}: {
  data: StrokeData;
  count: number;
  transform: string;
}) {
  if (!data) return null;
  const shown = data.strokes.slice(0, count);
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
      <g transform={transform}>
        {shown.map((d, i) => (
          <path key={i} d={d} fill={i === count - 1 ? "#dc4a3d" : "#333"} />
        ))}
      </g>
    </svg>
  );
}

export function LuyenViet() {
  const [text, setText] = React.useState("你好学习中国木树");
  const [sheetMode, setSheetMode] = React.useState<SheetMode>("practice");
  const [gridType, setGridType] = React.useState<GridType>("tian");
  const [lineColor, setLineColor] = React.useState<LineColor>("red");
  const [font, setFont] = React.useState<FontKey>("kaiti");
  const [trace, setTrace] = React.useState<TraceShade>("light");
  const [cols, setCols] = React.useState(10);
  const [rows, setRows] = React.useState(2);
  const [blankRows, setBlankRows] = React.useState(15);
  const [showPinyin, setShowPinyin] = React.useState(true);
  const [showRef, setShowRef] = React.useState(true);
  const [strokeOrder, setStrokeOrder] = React.useState(true);

  const [strokeData, setStrokeData] = React.useState<Record<string, StrokeData>>(
    {}
  );
  const [transform, setTransform] = React.useState("");
  const [loadingStrokes, setLoadingStrokes] = React.useState(false);

  const [radicals, setRadicals] = React.useState<Radical[] | null>(null);
  const [showRadicals, setShowRadicals] = React.useState(false);

  const chars = React.useMemo(() => uniqueHan(text), [text]);
  const colorSet = LINE_COLORS[lineColor];
  const fontCls = FONTS[font].cls;
  const traceColor = TRACE_SHADES[trace].color;

  React.useEffect(() => {
    if (sheetMode !== "practice" || !strokeOrder || chars.length === 0) return;
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
  }, [sheetMode, strokeOrder, chars]);

  const openRadicals = async () => {
    setShowRadicals((v) => !v);
    if (!radicals) setRadicals(await apiGetRadicals().catch(() => []));
  };

  const applyPreset = (p: Partial<Preset>) => {
    if (p.sheetMode) setSheetMode(p.sheetMode);
    if (p.gridType) setGridType(p.gridType);
    if (p.lineColor) setLineColor(p.lineColor);
    if (p.font) setFont(p.font);
    if (p.trace) setTrace(p.trace);
    if (p.rows) setRows(p.rows);
    if (p.strokeOrder !== undefined) setStrokeOrder(p.strokeOrder);
    if (p.showPinyin !== undefined) setShowPinyin(p.showPinyin);
  };

  const sheetStyle = { "--cols": cols } as React.CSSProperties;

  return (
    <div className="space-y-4">
      <nav className="no-print flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground">
          <Home className="size-3.5" /> Trang chủ
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">Luyện viết chữ</span>
      </nav>

      <div className="lv-grid grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* ── Controls ─────────────────────────────────────────────── */}
        <aside className="no-print space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-card p-4">
            <h1 className="flex items-center gap-2 text-lg font-bold">
              <PenTool className="size-5 text-primary" /> Luyện viết chữ Hán
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Nhập chữ / từ / bộ thủ → tạo vở tập viết rồi in hoặc lưu PDF (tự
              động sang trang mới nếu nhiều chữ).
            </p>

            {/* Quick presets */}
            <p className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5" /> Mẫu nhanh
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded-full border px-2.5 py-1 text-xs font-medium hover:border-primary hover:bg-primary/5"
                >
                  {p.name}
                </button>
              ))}
            </div>

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
                        onClick={() => setText((t) => t + r.radical)}
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
          <div className="space-y-3.5 rounded-2xl border bg-card p-4">
            {/* Sheet mode */}
            <Segment
              label="Loại vở"
              value={sheetMode}
              onChange={(v) => setSheetMode(v as SheetMode)}
              options={[
                { k: "practice", label: "Tập viết chữ" },
                { k: "blank", label: "Giấy ô trống" },
              ]}
            />

            {/* Grid style */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Kiểu ô</p>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    { k: "tian", label: "田字", icon: Grid2x2 },
                    { k: "mi", label: "米字", icon: Grid3x3 },
                    { k: "hui", label: "回宫", icon: SquareDashedBottom },
                    { k: "blank", label: "Trống", icon: Square },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.k}
                    type="button"
                    onClick={() => setGridType(g.k)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-2 text-[11px]",
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

            {/* Line color */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Màu kẻ ô</p>
              <div className="flex gap-2">
                {(Object.keys(LINE_COLORS) as LineColor[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setLineColor(k)}
                    title={LINE_COLORS[k].name}
                    className={cn(
                      "size-7 rounded-full border-2",
                      lineColor === k ? "border-foreground" : "border-transparent"
                    )}
                    style={{ background: LINE_COLORS[k].border }}
                  />
                ))}
              </div>
            </div>

            {sheetMode === "practice" ? (
              <>
                <Segment
                  label="Kiểu chữ"
                  value={font}
                  onChange={(v) => setFont(v as FontKey)}
                  options={(Object.keys(FONTS) as FontKey[]).map((k) => ({
                    k,
                    label: FONTS[k].name,
                  }))}
                />
                <Segment
                  label="Độ đậm chữ mờ"
                  value={trace}
                  onChange={(v) => setTrace(v as TraceShade)}
                  options={(Object.keys(TRACE_SHADES) as TraceShade[]).map((k) => ({
                    k,
                    label: TRACE_SHADES[k].name,
                  }))}
                />
              </>
            ) : null}

            <Stepper label="Số ô mỗi hàng" value={cols} set={setCols} min={6} max={16} />
            {sheetMode === "practice" ? (
              <Stepper label="Số hàng mỗi chữ" value={rows} set={setRows} min={1} max={6} />
            ) : (
              <Stepper label="Số hàng" value={blankRows} set={setBlankRows} min={1} max={30} />
            )}

            {sheetMode === "practice" ? (
              <>
                <Toggle label="Chữ mẫu đầu dòng" icon={<Type className="size-4" />} checked={showRef} onChange={setShowRef} />
                <Toggle label="Hiện pinyin" icon={<Type className="size-4" />} checked={showPinyin} onChange={setShowPinyin} />
                <Toggle label="Thứ tự nét (笔顺)" icon={<PenTool className="size-4" />} checked={strokeOrder} onChange={setStrokeOrder} />
              </>
            ) : null}
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
        <div className="lv-preview overflow-x-auto">
          <div
            id="print-sheet"
            style={sheetStyle}
            className="writing-sheet mx-auto w-fit rounded-lg bg-white p-6 text-black shadow-elevated"
          >
            {sheetMode === "blank" ? (
              <BlankSheet
                rows={blankRows}
                cols={cols}
                gridType={gridType}
                color={colorSet.guide}
                border={colorSet.border}
              />
            ) : chars.length === 0 ? (
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
                    color={colorSet.guide}
                    border={colorSet.border}
                    fontCls={fontCls}
                    traceColor={traceColor}
                    cols={cols}
                    rows={rows}
                    showPinyin={showPinyin}
                    showRef={showRef}
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

function BlankSheet({
  rows,
  cols,
  gridType,
  color,
  border,
}: {
  rows: number;
  cols: number;
  gridType: GridType;
  color: string;
  border: string;
}) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="writing-row char-block">
          {Array.from({ length: cols }).map((_, c) => (
            <Cell key={c} type={gridType} color={color} border={border} />
          ))}
        </div>
      ))}
    </div>
  );
}

function CharBlock({
  ch,
  gridType,
  color,
  border,
  fontCls,
  traceColor,
  cols,
  rows,
  showPinyin,
  showRef,
  strokeOrder,
  data,
  transform,
}: {
  ch: string;
  gridType: GridType;
  color: string;
  border: string;
  fontCls: string;
  traceColor: string;
  cols: number;
  rows: number;
  showPinyin: boolean;
  showRef: boolean;
  strokeOrder: boolean;
  data: StrokeData;
  transform: string;
}) {
  const hasStrokes = strokeOrder && data && transform;
  const strokeCount = hasStrokes ? data!.strokes.length : 0;
  const demoCount = (showRef ? 1 : 0) + (hasStrokes ? strokeCount : 0);
  const traceCount = Math.max(cols * rows - demoCount, cols - 1);

  return (
    <div className="char-block break-inside-avoid">
      {showPinyin ? (
        <div className="mb-0.5 pl-0.5 text-[13px] italic text-gray-500">{py(ch)}</div>
      ) : null}
      <div className="writing-row">
        {showRef ? (
          <Cell type={gridType} color={color} border={border}>
            <span className={cn(fontCls, "writing-char text-[#1a1a1a]")}>{ch}</span>
          </Cell>
        ) : null}
        {hasStrokes
          ? data!.strokes.map((_, i) => (
              <Cell key={`s${i}`} type={gridType} color={color} border={border}>
                <StrokeGlyph data={data} count={i + 1} transform={transform} />
              </Cell>
            ))
          : null}
        {Array.from({ length: traceCount }).map((_, i) => (
          <Cell key={`t${i}`} type={gridType} color={color} border={border}>
            <span className={cn(fontCls, "writing-char")} style={{ color: traceColor }}>
              {ch}
            </span>
          </Cell>
        ))}
      </div>
    </div>
  );
}

// ── presets ────────────────────────────────────────────────────────────────
interface Preset {
  name: string;
  sheetMode?: SheetMode;
  gridType?: GridType;
  lineColor?: LineColor;
  font?: FontKey;
  trace?: TraceShade;
  rows?: number;
  strokeOrder?: boolean;
  showPinyin?: boolean;
}
const PRESETS: Preset[] = [
  { name: "Cơ bản", sheetMode: "practice", gridType: "tian", lineColor: "red", font: "kaiti", strokeOrder: true, showPinyin: true, rows: 2 },
  { name: "Luyện nét 米", sheetMode: "practice", gridType: "mi", lineColor: "green", strokeOrder: true, rows: 2 },
  { name: "Chép mờ", sheetMode: "practice", gridType: "tian", strokeOrder: false, trace: "medium", rows: 3, showPinyin: true },
  { name: "回宫格", sheetMode: "practice", gridType: "hui", lineColor: "blue", strokeOrder: false, rows: 2 },
  { name: "Giấy ô trống", sheetMode: "blank", gridType: "tian", lineColor: "gray" },
];

// ── small controls ──────────────────────────────────────────────────────────
function Segment<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { k: T; label: string }[];
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex overflow-hidden rounded-lg border">
        {options.map((o, i) => (
          <button
            key={o.k}
            type="button"
            onClick={() => onChange(o.k)}
            className={cn(
              "flex-1 px-2 py-1.5 text-xs font-medium",
              i > 0 && "border-l",
              value === o.k ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
            )}
          >
            {o.label}
          </button>
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
        <button type="button" onClick={() => set(Math.max(min, value - 1))} className="size-7 rounded-md border text-sm hover:bg-secondary">−</button>
        <span className="w-7 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button type="button" onClick={() => set(Math.min(max, value + 1))} className="size-7 rounded-md border text-sm hover:bg-secondary">+</button>
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
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between">
      <span className="inline-flex items-center gap-1.5 text-sm">{icon}{label}</span>
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", checked ? "bg-primary" : "bg-secondary")}>
        <span className={cn("absolute top-0.5 size-4 rounded-full bg-white transition-transform", checked ? "translate-x-4" : "translate-x-0.5")} />
      </span>
    </button>
  );
}
