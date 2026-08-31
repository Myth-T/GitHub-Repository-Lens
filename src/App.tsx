import { useCallback, useEffect, useRef, useState } from "react";
import CommandBar from "./components/CommandBar";
import RepoView from "./components/RepoView";
import UserView from "./components/UserView";
import { Reveal } from "./components/shared";
import { LogoMark, WarnIcon } from "./components/icons";
import type { GhRepo, GhUser, RepoBundle } from "./lib/github";
import {
  fetchRepoBundle, fetchUser, getQuota, parseTarget, sleep, targetLabel, GhError,
} from "./lib/github";

type View =
  | { kind: "user"; user: GhUser; repos: GhRepo[] }
  | { kind: "repo"; bundle: RepoBundle };

type Phase = "loading" | "done";

const LS_KEY = "repolens-history";

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, 5) : [];
  } catch {
    return [];
  }
}

/* 漂浮的代码字符（环境装饰） */
const GLYPHS = [
  { ch: "{", top: "16%", left: "6%", d: "0s", c: "text-moss/25", s: "2rem", r: "-8deg" },
  { ch: "}", top: "26%", left: "90%", d: "1.2s", c: "text-amber/20", s: "2.6rem", r: "10deg" },
  { ch: "=>", top: "64%", left: "4%", d: "2s", c: "text-cyanx/15", s: "1.6rem", r: "0deg" },
  { ch: "</>", top: "78%", left: "93%", d: "0.6s", c: "text-moss/15", s: "1.4rem", r: "6deg" },
  { ch: "::", top: "44%", left: "96%", d: "1.7s", c: "text-coral/15", s: "1.8rem", r: "-4deg" },
  { ch: "$", top: "86%", left: "10%", d: "2.4s", c: "text-skyx/15", s: "1.7rem", r: "8deg" },
  { ch: ";", top: "8%", left: "70%", d: "1s", c: "text-faint/30", s: "2rem", r: "0deg" },
];

export default function App() {
  const [input, setInput] = useState("facebook/react");
  const [phase, setPhase] = useState<Phase>("loading");
  const [view, setView] = useState<View | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentTarget, setCurrentTarget] = useState("facebook/react");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>(loadHistory);
  const [quota, setQuota] = useState<{ remaining: number | null; limit: number | null }>({ remaining: null, limit: null });
  const runId = useRef(0);
  const busy = phase === "loading";

  const run = useCallback(async (raw: string) => {
    const target = parseTarget(raw);
    const id = ++runId.current;
    const label = target ? targetLabel(target) : raw.trim();
    setInput(target ? label : raw.trim());
    setCurrentTarget(label);
    setPhase("loading");
    setError(null);
    setView(null);
    setElapsed(null);

    if (!target) {
      await sleep(350);
      if (runId.current !== id) return;
      setLogs([`$ repolens read ${raw.trim()}`, `✘ 无法解析输入 —— 需要 "owner" 或 "owner/repo" 格式`]);
      setError(`无法解析 "${raw.trim()}"。请试试 owner（如 octocat）或 owner/repo（如 vuejs/core），也可以直接粘贴 GitHub 链接。`);
      setPhase("done");
      return;
    }

    const t0 = performance.now();
    const isRepo = !!target.repo;
    const lines = isRepo
      ? [
          `$ repolens read ${label}`,
          `→ 解析目标 …… 仓库 ${label}`,
          `→ GET /repos/${label}`,
          `→ GET …/languages · 语言构成`,
          `→ GET …/commits · 最近提交`,
          `→ GET …/contributors · 贡献者`,
          `→ GET …/contents/ · 目录结构`,
          `→ GET …/readme · README.md`,
          `→ GET …/stats/commit_activity · 52 周活跃度`,
        ]
      : [
          `$ repolens read ${label}`,
          `→ 解析目标 …… 用户 ${label}`,
          `→ GET /users/${label}`,
          `→ GET /users/${label}/repos · 仓库列表`,
        ];

    /* 日志逐行流出，与请求并行 */
    const drain = (async () => {
      for (let i = 0; i < lines.length; i++) {
        await sleep(i === 0 ? 80 : 145);
        if (runId.current !== id) return;
        setLogs((prev) => [...prev, lines[i]]);
      }
    })();

    const fetchP = isRepo
      ? fetchRepoBundle(target.owner, target.repo!).then((bundle) => ({ kind: "repo" as const, bundle }))
      : fetchUser(target.owner).then(({ user, repos }) => ({ kind: "user" as const, user, repos }));

    await drain;

    try {
      const result = await fetchP;
      if (runId.current !== id) return;
      const secs = (performance.now() - t0) / 1000;
      setElapsed(secs);
      if (result.kind === "repo") setView({ kind: "repo", bundle: result.bundle });
      else setView({ kind: "user", user: result.user, repos: result.repos });
      setLogs((prev) => [...prev, `✔ 完成 · ${isRepo ? 7 : 2} 次 API 调用 · 用时 ${secs.toFixed(2)}s`]);
      setHistory((prev) => {
        const next = [label, ...prev.filter((h) => h !== label)].slice(0, 5);
        try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* 忽略 */ }
        return next;
      });
    } catch (e) {
      if (runId.current !== id) return;
      let msg: string;
      if (e instanceof GhError && e.status === 404) {
        msg = `GitHub 上没有找到 "${label}"（404）。请检查拼写，或确认它是公开的仓库 / 用户。`;
      } else if (e instanceof GhError && e.status === 403 && getQuota().remaining === 0) {
        msg = `API 配额已耗尽（未认证访问限 60 次/小时）。请稍后再试 —— 配额约在一小时后刷新。`;
      } else if (e instanceof GhError) {
        msg = `请求被拒绝（HTTP ${e.status}）。大型仓库的部分接口可能受限，稍后重试通常可以解决。`;
      } else {
        msg = `网络请求失败。请检查网络连接后重试。`;
      }
      setLogs((prev) => [...prev, `✘ ${msg}`]);
      setError(msg);
    }
    setQuota({ ...getQuota() });
    setPhase("done");
  }, []);

  /* 首次加载自动读取一个示例仓库，页面即刻“活”起来 */
  useEffect(() => {
    void run("facebook/react");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quotaTone =
    quota.remaining === null ? "text-faint" : quota.remaining > 20 ? "text-moss" : quota.remaining > 8 ? "text-amber" : "text-coral";

  return (
    <div className="relative min-h-screen">
      {/* ===== 环境背景 ===== */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="bg-glow absolute inset-0" />
        <div className="bg-grid absolute inset-0" />
        <div className="bg-noise absolute inset-0" />
        <div className="scanline" />
        {GLYPHS.map((g) => (
          <span
            key={g.ch + g.top}
            className={`absolute select-none font-mono font-bold ${g.c}`}
            style={{ top: g.top, left: g.left, fontSize: g.s, ["--r" as string]: g.r, animation: `floaty 7s ease-in-out ${g.d} infinite` }}
            aria-hidden
          >
            {g.ch}
          </span>
        ))}
      </div>

      {/* ===== 顶栏 ===== */}
      <header className="sticky top-0 z-40 border-b border-line/80 bg-bg/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <LogoMark />
          <div className="leading-none">
            <span className="font-disp text-[1.05rem] font-bold tracking-wide text-ink">
              Repo<span className="text-moss">Lens</span>
            </span>
            <span className="ml-2 hidden text-[0.68rem] font-medium text-faint sm:inline">仓库透镜</span>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            {quota.remaining !== null && (
              <span className={`flex items-center gap-1.5 rounded border border-line bg-panel px-2.5 py-1 font-mono text-[0.65rem] ${quotaTone}`}>
                <span className={`h-1.5 w-1.5 rounded-full bg-current ${quota.remaining > 8 ? "dot-live" : ""}`} />
                剩余配额 {quota.remaining}/{quota.limit ?? 60}
              </span>
            )}
            <a
              href="https://docs.github.com/zh/rest"
              target="_blank"
              rel="noreferrer"
              className="hidden rounded border border-line bg-panel px-2.5 py-1 font-mono text-[0.65rem] text-faint transition-colors hover:border-line2 hover:text-dim sm:block"
            >
              API 文档 ↗
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        {/* ===== 开场：主张 + 终端 ===== */}
        <div className="mb-7 grid items-end gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="anim-rise font-mono text-[0.68rem] uppercase tracking-[0.28em] text-moss" style={{ animationDelay: "60ms" }}>
              {"// GitHub REST API v3 · 无需登录 · 浏览器直连"}
            </p>
            <h1
              className="anim-rise mt-3 font-disp text-[clamp(2rem,5.2vw,3.6rem)] font-bold leading-[1.06] tracking-tight text-ink"
              style={{ animationDelay: "140ms" }}
            >
              把任意公开仓库
              <br />
              读成一份
              <span className="relative ml-2 inline-block text-moss">
                档案
                <svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 120 8" fill="none" aria-hidden>
                  <path d="M2 5.5C30 2 60 2 118 5.5" stroke="#ffc266" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </span>
              。
            </h1>
          </div>
          <ul
            className="anim-rise hidden shrink-0 space-y-1.5 border-l-2 border-line pl-4 font-mono text-[0.7rem] text-faint lg:block"
            style={{ animationDelay: "220ms" }}
          >
            <li><span className="text-amber">7</span> 路 API 并行读取</li>
            <li><span className="text-amber">0</span> 行后端代码</li>
            <li>语言 · 提交 · 目录 · README</li>
          </ul>
        </div>

        <div className="anim-rise" style={{ animationDelay: "280ms" }}>
          <CommandBar busy={busy} initial={input} history={history} onSubmit={run} />
        </div>

        {/* ===== 读取中：终端日志 ===== */}
        {busy && (
          <div className="panel frame mt-5 overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-deep/50 px-4 py-2 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-faint">
              <span>output · 实时日志</span>
              <span className="text-amber">reading {currentTarget}…</span>
            </div>
            <div className="min-h-[9rem] space-y-1.5 px-4 py-4 font-mono text-[0.78rem] sm:px-5">
              {logs.map((l, i) => (
                <p
                  key={i}
                  className={`logline ${
                    l.startsWith("$")
                      ? "font-bold text-ink"
                      : l.startsWith("✔")
                        ? "text-moss"
                        : l.startsWith("✘")
                          ? "text-coral"
                          : "text-dim"
                  }`}
                >
                  {l}
                </p>
              ))}
              {logs.length > 0 && <span className="caret-block" />}
            </div>
          </div>
        )}

        {/* ===== 错误 ===== */}
        {!busy && error && (
          <div className="panel mt-5 border-coral/40 p-6">
            <div className="flex items-start gap-3.5">
              <span className="mt-0.5 text-coral"><WarnIcon size={22} /></span>
              <div>
                <h2 className="font-disp text-[1.05rem] font-bold text-coral">读取失败</h2>
                <p className="mt-1.5 max-w-2xl text-[0.88rem] leading-relaxed text-dim">{error}</p>
                <button
                  onClick={() => run(currentTarget)}
                  className="mt-4 rounded border border-coral/50 bg-coral/10 px-4 py-1.5 font-mono text-[0.72rem] text-coral transition-all hover:bg-coral/20"
                >
                  ↻ 重试 {currentTarget}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== 完成摘要条 ===== */}
        {!busy && !error && view && elapsed !== null && (
          <div className="anim-rise mb-4 mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded border border-line bg-panel/70 px-4 py-2.5 font-mono text-[0.68rem] text-faint">
            <span className="text-moss">✔ {currentTarget}</span>
            <span>用时 <span className="text-ink">{elapsed.toFixed(2)}s</span></span>
            <span>调用 <span className="text-ink">{view.kind === "repo" ? 7 : 2}</span> 次</span>
            {quota.remaining !== null && <span>配额剩余 <span className={quotaTone}>{quota.remaining}</span></span>}
          </div>
        )}

        {/* ===== 档案内容 ===== */}
        {!busy && !error && view?.kind === "repo" && (
          <>
            <RepoView bundle={view.bundle} onOpenOwner={(o) => run(o)} />

            {/* 读取来源账本 */}
            <Reveal delay={80}>
              <section className="mt-8">
                <div className="mb-3 flex items-baseline gap-3">
                  <h2 className="font-disp text-[1.05rem] font-bold text-ink">这份档案是如何被读取的</h2>
                  <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-faint">api ledger</span>
                </div>
                <div className="panel divide-y divide-line/70 overflow-hidden">
                  {[
                    { p: `/repos/${view.bundle.repo.full_name}`, n: "仓库元信息 · stars / forks / license / topics", ok: true },
                    { p: "…/languages", n: "各语言字节数 → 构成比例", ok: !!view.bundle.languages },
                    { p: "…/commits?per_page=8", n: "最近提交记录与作者", ok: !!view.bundle.commits },
                    { p: "…/contributors", n: "贡献者及提交次数", ok: !!view.bundle.contributors },
                    { p: "…/contents/", n: "根目录文件树", ok: !!view.bundle.contents },
                    { p: "…/readme", n: "README 原始 Markdown", ok: !!view.bundle.readme },
                    { p: "…/stats/commit_activity", n: "52 周提交活跃度", ok: !!view.bundle.activity },
                  ].map((row, i) => (
                    <div key={row.p} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-raise/50 sm:px-5">
                      <span className="w-6 shrink-0 font-mono text-[0.62rem] text-faint">{String(i + 1).padStart(2, "0")}</span>
                      <span className="shrink-0 rounded border border-moss/40 bg-moss/10 px-1.5 py-0.5 font-mono text-[0.58rem] font-bold text-moss">GET</span>
                      <code className="min-w-0 flex-1 truncate font-mono text-[0.72rem] text-dim">{row.p}</code>
                      <span className="hidden shrink-0 text-[0.7rem] text-faint md:block">{row.n}</span>
                      <span className={`shrink-0 font-mono text-[0.68rem] ${row.ok ? "text-moss" : "text-faint"}`}>{row.ok ? "200 ✓" : "—"}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 px-1 font-mono text-[0.65rem] leading-relaxed text-faint">
                  所有请求由你的浏览器直接发往 api.github.com，不经过任何第三方服务器。未认证访问限 60 次/小时。
                </p>
              </section>
            </Reveal>
          </>
        )}

        {!busy && !error && view?.kind === "user" && (
          <UserView user={view.user} repos={view.repos} busy={busy} onOpenRepo={(full) => run(full)} />
        )}
      </main>

      {/* ===== 页脚 ===== */}
      <footer className="relative z-10 border-t border-line/70 bg-deep/40">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 py-6 font-mono text-[0.65rem] text-faint sm:flex-row sm:items-center sm:px-6">
          <span className="flex items-center gap-2">
            <LogoMark size={16} /> RepoLens 仓库透镜 —— 数据来自 GitHub REST API v3
          </span>
          <span>
            未认证限额 60 次/小时 · 仅读取公开数据 · <span className="text-moss">crafted with React + Tailwind</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
