import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckIcon, CopyIcon } from "./icons";

/* ---------- 滚动显现 ---------- */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "is-in" : ""} ${className}`}
      style={{ ["--rv-delay" as string]: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------- 数字滚动 ---------- */
export function CountUp({
  value,
  format,
  duration = 900,
  className = "",
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(Math.round(value * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  const f = format ?? ((n: number) => n.toLocaleString("en-US"));
  return (
    <span ref={ref} className={className}>
      {f(display)}
    </span>
  );
}

/* ---------- 复制按钮 ---------- */
export function CopyBtn({ text, label = "复制" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-[0.7rem] transition-all duration-200 ${
        copied
          ? "border-moss/60 bg-moss/15 text-moss"
          : "border-line2 bg-raise/60 text-dim hover:border-moss/50 hover:text-ink"
      }`}
    >
      {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
      {copied ? "已复制" : label}
    </button>
  );
}

/* ---------- 段落标题 ---------- */
export function SectionTitle({
  icon,
  zh,
  en,
  extra,
}: {
  icon: ReactNode;
  zh: string;
  en: string;
  extra?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="text-moss">{icon}</span>
        <h2 className="font-disp text-[1.02rem] font-bold tracking-wide text-ink">{zh}</h2>
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-faint">{en}</span>
      </div>
      {extra}
    </div>
  );
}
