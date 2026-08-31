import { useEffect, useRef, useState, type FormEvent } from "react";
import { TerminalIcon } from "./icons";

const PRESETS = ["facebook/react", "vuejs/core", "rust-lang/rust", "tauri-apps/tauri", "ggerganov/llama.cpp"];

export default function CommandBar({
  busy,
  initial = "",
  history,
  onSubmit,
}: {
  busy: boolean;
  initial?: string;
  history: string[];
  onSubmit: (input: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setValue(initial), [initial]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v || busy) return;
    onSubmit(v);
  };

  const pick = (v: string) => {
    setValue(v);
    inputRef.current?.focus();
    if (!busy) onSubmit(v);
  };

  return (
    <div className="panel frame overflow-hidden shadow-[0_18px_50px_-18px_rgba(0,0,0,0.65)]">
      {/* 终端标题栏 */}
      <div className="flex items-center gap-2 border-b border-line bg-deep/60 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-coral/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-moss/80" />
        <span className="ml-3 flex items-center gap-2 font-mono text-[0.7rem] text-faint">
          <TerminalIcon size={13} />
          ~/github — repolens 读取器
        </span>
        <span className="ml-auto hidden items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-faint sm:flex">
          <span className={`h-1.5 w-1.5 rounded-full ${busy ? "bg-amber" : "bg-moss dot-live"}`} />
          {busy ? "reading" : "online"}
        </span>
      </div>

      {/* 输入行 */}
      <form onSubmit={submit} className="flex items-center gap-3 px-4 py-4 sm:px-5">
        <span className="select-none font-mono text-sm font-bold text-moss">❯</span>
        <span className="hidden select-none font-mono text-sm text-faint md:inline">repolens read</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="owner 或 owner/repo —— 例如 vuejs/core"
          spellCheck={false}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent font-mono text-[0.95rem] text-ink placeholder:text-faint/70"
          style={{ caretColor: "#56d364" }}
          aria-label="GitHub 仓库地址"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="group relative shrink-0 overflow-hidden rounded border border-moss/50 bg-moss/10 px-4 py-2 font-disp text-[0.8rem] font-bold tracking-wider text-moss transition-all duration-200 hover:bg-moss/20 hover:shadow-[0_0_22px_-4px_rgba(86,211,100,0.5)] disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
        >
          <span className="relative z-10">{busy ? "读取中…" : "读取 ⏎"}</span>
        </button>
      </form>

      {/* 快捷入口 + 历史 */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-line/70 bg-deep/40 px-4 py-3 sm:px-5">
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-faint">示例</span>
        {PRESETS.map((p) => (
          <button key={p} onClick={() => pick(p)} className="chip cursor-pointer">
            {p}
          </button>
        ))}
        {history.length > 0 && (
          <>
            <span className="ml-1 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-faint/80 sm:ml-3">历史</span>
            {history.map((h) => (
              <button key={`h-${h}`} onClick={() => pick(h)} className="chip cursor-pointer border-amber/30 text-amber/90 hover:border-amber hover:text-amber">
                {h}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
