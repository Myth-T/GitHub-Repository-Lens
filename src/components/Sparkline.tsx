import { useMemo, useState } from "react";
import type { WeekActivity } from "../lib/github";
import { absDate } from "../lib/github";

export default function Sparkline({ activity }: { activity: WeekActivity[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = useMemo(() => Math.max(1, ...activity.map((w) => w.total)), [activity]);
  const yearTotal = useMemo(() => activity.reduce((s, w) => s + w.total, 0), [activity]);

  return (
    <div>
      <div className="relative">
        {/* 悬停提示 */}
        {hover !== null && activity[hover] && (
          <div
            className="pointer-events-none absolute -top-10 z-10 -translate-x-1/2 whitespace-nowrap rounded border border-line2 bg-deep px-2.5 py-1.5 font-mono text-[0.65rem] text-ink shadow-xl"
            style={{ left: `${((hover + 0.5) / activity.length) * 100}%` }}
          >
            <span className="text-moss">{activity[hover].total}</span> 次提交 · 周始于{" "}
            <span className="text-dim">{absDate(new Date(activity[hover].week * 1000).toISOString())}</span>
          </div>
        )}
        <div className="flex h-20 items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
          {activity.map((w, i) => {
            const ratio = w.total / max;
            return (
              <div
                key={w.week}
                onMouseEnter={() => setHover(i)}
                className="group flex-1 cursor-crosshair rounded-[1.5px] transition-all duration-150"
                style={{
                  height: `${Math.max(4, ratio * 100)}%`,
                  background:
                    w.total === 0
                      ? "rgba(49,73,58,0.55)"
                      : `rgba(86,211,100,${0.28 + ratio * 0.72})`,
                  boxShadow: hover === i ? "0 0 10px rgba(86,211,100,0.45)" : undefined,
                }}
              />
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-[0.65rem] text-faint">
        <span>52 周前</span>
        <span className="flex items-center gap-1.5">
          少
          {[0.15, 0.35, 0.6, 1].map((o) => (
            <span key={o} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: `rgba(86,211,100,${o})` }} />
          ))}
          多
        </span>
        <span>
          今年共 <span className="font-bold text-moss">{yearTotal.toLocaleString("en-US")}</span> 次
        </span>
      </div>
    </div>
  );
}
