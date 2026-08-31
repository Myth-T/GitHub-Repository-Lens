import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import type { GhContent, RepoBundle } from "../lib/github";
import { absDate, fmt, fmtBytes, fmtSize, langColor, relTime } from "../lib/github";
import Sparkline from "./Sparkline";
import { CopyBtn, CountUp, Reveal, SectionTitle } from "./shared";
import {
  BookIcon, BranchIcon, ClockIcon, ExternalIcon, EyeIcon, FileIcon, FolderIcon,
  ForkIcon, GlobeIcon, IssueIcon, PinIcon, PulseIcon, ScaleIcon, StarIcon, TagIcon, UsersIcon,
} from "./icons";

marked.setOptions({ gfm: true, breaks: false, async: false });

function StatTile({
  icon, label, value, tone, delay,
}: {
  icon: React.ReactNode; label: string; value: number; tone: string; delay: number;
}) {
  return (
    <Reveal delay={delay} className="group relative overflow-hidden rounded border border-line bg-deep/50 px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-line2">
      <span className="pointer-events-none absolute -right-3 -top-3 opacity-[0.07] transition-opacity duration-200 group-hover:opacity-[0.16]" style={{ color: tone }}>
        {icon}
      </span>
      <div className="flex items-center gap-1.5" style={{ color: tone }}>
        {icon}
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-faint">{label}</span>
      </div>
      <div className="mt-1.5 font-disp text-[1.65rem] font-bold leading-none text-ink">
        <CountUp value={value} format={fmt} />
      </div>
    </Reveal>
  );
}

export default function RepoView({
  bundle,
  onOpenOwner,
}: {
  bundle: RepoBundle;
  onOpenOwner: (owner: string) => void;
}) {
  const { repo, languages, commits, contributors, contents, readme, activity } = bundle;
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 80);
    return () => window.clearTimeout(t);
  }, [repo.id]);

  const langEntries = useMemo(() => {
    if (!languages) return [];
    const total = Object.values(languages).reduce((s, n) => s + n, 0);
    if (total === 0) return [];
    return Object.entries(languages)
      .map(([name, bytes]) => ({ name, bytes, pct: (bytes / total) * 100 }))
      .sort((a, b) => b.bytes - a.bytes);
  }, [languages]);

  const html = useMemo(() => {
    if (!readme) return null;
    return DOMPurify.sanitize(marked.parse(readme) as string, { USE_PROFILES: { html: true } });
  }, [readme]);

  const sortedContents = useMemo(() => {
    if (!contents) return null;
    const dirs = contents.filter((c) => c.type === "dir").sort((a, b) => a.name.localeCompare(b.name));
    const files = contents.filter((c) => c.type === "file").sort((a, b) => a.name.localeCompare(b.name));
    return [...dirs, ...files];
  }, [contents]);

  const people = useMemo(
    () => (contributors ? contributors.filter((c) => c.type === "User") : null),
    [contributors]
  );

  const readmeLong = (html?.length ?? 0) > 1400;

  return (
    <div className="space-y-5">
      {/* ============ 档案头 ============ */}
      <Reveal>
        <section className="panel frame overflow-hidden">
          <div className="border-b border-line bg-deep/40 px-5 py-2 font-mono text-[0.65rem] uppercase tracking-[0.24em] text-faint">
            repository dossier · 仓库档案
          </div>
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-4">
                <img
                  src={repo.owner.avatar_url}
                  alt={repo.owner.login}
                  className="h-14 w-14 rounded border-2 border-line2 shadow-[0_0_0_4px_rgba(86,211,100,0.08)]"
                />
                <div className="min-w-0">
                  <h1 className="font-disp text-[clamp(1.5rem,4vw,2.6rem)] font-bold leading-[1.08] text-ink">
                    <button
                      onClick={() => onOpenOwner(repo.owner.login)}
                      className="text-faint transition-colors hover:text-moss"
                      title={`查看 ${repo.owner.login} 的主页`}
                    >
                      {repo.owner.login}
                      <span className="mx-1.5 text-line2">/</span>
                    </button>
                    <span className="relative">
                      {repo.name}
                      <span className="absolute -bottom-1 left-0 h-[3px] w-full bg-gradient-to-r from-moss via-moss/50 to-transparent" />
                    </span>
                  </h1>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 font-mono text-[0.68rem] text-faint">
                    {repo.archived && <span className="chip border-coral/40 text-coral">已归档</span>}
                    {repo.fork && <span className="chip">fork</span>}
                    <span className="chip border-moss/35 text-moss">{repo.visibility ?? "public"}</span>
                    <span className="chip"><BranchIcon size={11} /> {repo.default_branch}</span>
                    {repo.license && <span className="chip"><ScaleIcon size={11} /> {repo.license.spdx_id}</span>}
                    <span className="chip"><ClockIcon size={11} /> 创建于 {absDate(repo.created_at)}</span>
                  </div>
                </div>
              </div>

              {repo.description && (
                <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-dim">{repo.description}</p>
              )}

              {repo.topics.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <TagIcon size={13} />
                  {repo.topics.map((t) => (
                    <span key={t} className="chip cursor-default !text-skyx !border-skyx/30 hover:!border-skyx/70">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* 克隆行 */}
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <code className="flex min-w-0 items-center gap-2 rounded border border-line bg-deep px-3 py-1.5 font-mono text-[0.72rem] text-dim">
                  <span className="select-none text-moss">$</span>
                  <span className="truncate">git clone https://github.com/{repo.full_name}.git</span>
                </code>
                <CopyBtn text={`https://github.com/${repo.full_name}.git`} label="克隆地址" />
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded border border-line2 px-2.5 py-1 font-mono text-[0.7rem] text-dim transition-all hover:border-cyanx/50 hover:text-cyanx"
                >
                  <ExternalIcon size={12} /> 在 GitHub 打开
                </a>
                {repo.homepage && (
                  <a
                    href={repo.homepage.startsWith("http") ? repo.homepage : `https://${repo.homepage}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded border border-line2 px-2.5 py-1 font-mono text-[0.7rem] text-dim transition-all hover:border-amber/50 hover:text-amber"
                  >
                    <GlobeIcon size={12} /> 官网
                  </a>
                )}
              </div>
            </div>

            {/* 统计块 */}
            <div className="grid w-full grid-cols-2 gap-2.5 lg:w-[19rem]">
              <StatTile icon={<StarIcon size={15} />} label="Stars" value={repo.stargazers_count} tone="#ffc266" delay={0} />
              <StatTile icon={<ForkIcon size={15} />} label="Forks" value={repo.forks_count} tone="#56d4dd" delay={70} />
              <StatTile icon={<EyeIcon size={15} />} label="Watchers" value={repo.subscribers_count} tone="#79c0ff" delay={140} />
              <StatTile icon={<IssueIcon size={15} />} label="Open Issues" value={repo.open_issues_count} tone="#ff7b72" delay={210} />
            </div>
          </div>
        </section>
      </Reveal>

      {/* ============ 语言构成 ============ */}
      {langEntries.length > 0 && (
        <Reveal delay={60}>
          <section className="panel p-5 sm:p-6">
            <SectionTitle icon={<PulseIcon size={17} />} zh="语言构成" en="languages" />
            <div className="flex h-3 w-full overflow-hidden rounded-full border border-line bg-deep">
              {langEntries.map((l, i) => (
                <div
                  key={l.name}
                  title={`${l.name} ${l.pct.toFixed(1)}%`}
                  className="h-full transition-[width] duration-700 ease-out"
                  style={{
                    width: mounted ? `${l.pct}%` : "0%",
                    background: langColor(l.name),
                    transitionDelay: `${i * 70}ms`,
                  }}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {langEntries.slice(0, 8).map((l, i) => (
                <span
                  key={l.name}
                  className="flex items-center gap-1.5 font-mono text-[0.72rem] text-dim transition-opacity duration-500"
                  style={{ opacity: mounted ? 1 : 0, transitionDelay: `${200 + i * 70}ms` }}
                >
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: langColor(l.name) }} />
                  {l.name}
                  <span className="text-faint">{l.pct.toFixed(1)}%</span>
                </span>
              ))}
              {langEntries.length > 8 && (
                <span className="font-mono text-[0.72rem] text-faint">+{langEntries.length - 8} 种更多</span>
              )}
            </div>
          </section>
        </Reveal>
      )}

      {/* ============ 活跃度 + 目录结构 ============ */}
      <div className="grid gap-5 lg:grid-cols-5">
        <Reveal delay={40} className="lg:col-span-3">
          <section className="panel h-full p-5 sm:p-6">
            <SectionTitle
              icon={<PulseIcon size={17} />}
              zh="提交活跃度"
              en="commit activity"
              extra={
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-faint">
                  最近推送 {relTime(repo.pushed_at)}
                </span>
              }
            />
            {activity ? (
              <Sparkline activity={activity} />
            ) : (
              <p className="py-6 font-mono text-[0.75rem] text-faint">// 统计接口暂不可用（GitHub 后台计算中）</p>
            )}
          </section>
        </Reveal>

        <Reveal delay={110} className="lg:col-span-2">
          <section className="panel h-full p-5 sm:p-6">
            <SectionTitle
              icon={<FolderIcon size={17} />}
              zh="目录结构"
              en="/ root"
              extra={<span className="font-mono text-[0.62rem] text-faint">体积 {fmtSize(repo.size)}</span>}
            />
            {sortedContents ? (
              <ul className="space-y-0.5">
                {sortedContents.slice(0, 13).map((c: GhContent, i) => (
                  <li key={c.path}>
                    <a
                      href={c.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-2.5 rounded px-2 py-[0.42rem] transition-colors hover:bg-raise/70"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      {c.type === "dir" ? (
                        <FolderIcon size={14} className="shrink-0 text-amber" />
                      ) : (
                        <FileIcon size={14} className="shrink-0 text-faint" />
                      )}
                      <span
                        className={`truncate font-mono text-[0.78rem] ${
                          c.type === "dir" ? "font-medium text-ink" : "text-dim"
                        } group-hover:text-moss`}
                      >
                        {c.name}
                        {c.type === "dir" && <span className="text-faint">/</span>}
                      </span>
                      <span className="ml-auto shrink-0 font-mono text-[0.62rem] text-faint">
                        {c.type === "file" ? fmtBytes(c.size) : "dir"}
                      </span>
                    </a>
                  </li>
                ))}
                {sortedContents.length > 13 && (
                  <li className="px-2 pt-1.5 font-mono text-[0.65rem] text-faint">
                    … 还有 {sortedContents.length - 13} 项，
                    <a className="text-cyanx hover:underline" href={`${repo.html_url}/tree/${repo.default_branch}`} target="_blank" rel="noreferrer">
                      在 GitHub 查看
                    </a>
                  </li>
                )}
              </ul>
            ) : (
              <p className="py-6 font-mono text-[0.75rem] text-faint">// 无法读取根目录</p>
            )}
          </section>
        </Reveal>
      </div>

      {/* ============ 最近提交 + 贡献者 ============ */}
      <div className="grid gap-5 lg:grid-cols-5">
        <Reveal delay={40} className="lg:col-span-3">
          <section className="panel p-5 sm:p-6">
            <SectionTitle icon={<BranchIcon size={17} />} zh="最近提交" en="recent commits" />
            {commits && commits.length > 0 ? (
              <ul className="space-y-1">
                {commits.map((c) => (
                  <li key={c.sha}>
                    <a
                      href={c.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 rounded border border-transparent px-2 py-2.5 transition-all hover:border-line hover:bg-raise/60"
                    >
                      <img
                        src={c.author?.avatar_url ?? `https://github.com/identicons/${c.commit.author.name.replace(/\s+/g, "")}.png`}
                        alt=""
                        className="h-7 w-7 shrink-0 rounded border border-line2 bg-raise"
                        loading="lazy"
                        onError={(ev) => {
                          (ev.target as HTMLImageElement).style.visibility = "hidden";
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.82rem] font-medium text-ink transition-colors group-hover:text-moss">
                          {c.commit.message.split("\n")[0]}
                        </p>
                        <p className="mt-0.5 truncate font-mono text-[0.62rem] text-faint">
                          {c.author?.login ?? c.commit.author.name} · {relTime(c.commit.author.date)}
                        </p>
                      </div>
                      <code className="shrink-0 rounded border border-line bg-deep px-1.5 py-0.5 font-mono text-[0.62rem] text-cyanx">
                        {c.sha.slice(0, 7)}
                      </code>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 font-mono text-[0.75rem] text-faint">// 提交历史为空或不可读</p>
            )}
          </section>
        </Reveal>

        <Reveal delay={110} className="lg:col-span-2">
          <section className="panel h-full p-5 sm:p-6">
            <SectionTitle icon={<UsersIcon size={17} />} zh="贡献者" en="contributors" />
            {people && people.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2.5">
                  {people.slice(0, 10).map((p, i) => (
                    <a
                      key={p.login}
                      href={p.html_url}
                      target="_blank"
                      rel="noreferrer"
                      title={`${p.login} · ${p.contributions.toLocaleString("en-US")} 次提交`}
                      className="group relative transition-transform duration-200 hover:-translate-y-1"
                      style={{ zIndex: 10 - i }}
                    >
                      <img
                        src={p.avatar_url}
                        alt={p.login}
                        loading="lazy"
                        className={`h-10 w-10 rounded-full border-2 transition-all group-hover:border-moss ${
                          i === 0 ? "border-amber shadow-[0_0_14px_-2px_rgba(255,194,102,0.45)]" : "border-line2"
                        }`}
                      />
                      {i === 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber font-mono text-[0.5rem] font-bold text-deep">
                          1
                        </span>
                      )}
                    </a>
                  ))}
                </div>
                <div className="mt-4 space-y-1.5 border-t border-line pt-3.5">
                  {people.slice(0, 3).map((p) => {
                    const maxC = people[0]?.contributions || 1;
                    return (
                      <div key={p.login} className="flex items-center gap-2.5">
                        <span className="w-24 truncate font-mono text-[0.68rem] text-dim">{p.login}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-deep">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-moss/60 to-moss transition-[width] duration-700"
                            style={{ width: `${Math.max(3, (p.contributions / maxC) * 100)}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-mono text-[0.62rem] text-faint">
                          {fmt(p.contributions)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {people.length > 10 && (
                  <p className="mt-3 font-mono text-[0.65rem] text-faint">… 共 {people.length}+ 位贡献者</p>
                )}
              </>
            ) : (
              <p className="py-6 font-mono text-[0.75rem] text-faint">// 贡献者数据不可读（超大仓库常见）</p>
            )}
          </section>
        </Reveal>
      </div>

      {/* ============ README ============ */}
      <Reveal delay={40}>
        <section className="panel frame overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-line bg-deep/40 px-5 py-2.5">
            <BookIcon size={15} className="text-moss" />
            <span className="font-mono text-[0.72rem] font-medium text-ink">
              README<span className="text-faint">.md</span>
            </span>
            <span className="ml-auto font-mono text-[0.62rem] uppercase tracking-[0.2em] text-faint">
              {readme ? `${(readme.length / 1024).toFixed(1)} KB` : "missing"}
            </span>
          </div>
          {html ? (
            <div className="relative">
              <div
                className={`px-5 py-6 transition-[max-height] duration-500 sm:px-8 ${
                  !expanded && readmeLong ? "max-h-[430px] overflow-hidden" : ""
                }`}
                dangerouslySetInnerHTML={{ __html: html }}
              />
              {!expanded && readmeLong && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#101a15] via-[#101a15]/80 to-transparent" />
              )}
              {readmeLong && (
                <div className="relative z-10 flex justify-center border-t border-line/70 bg-deep/30 py-2.5">
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="chip cursor-pointer !border-moss/40 !text-moss hover:!bg-moss/10"
                  >
                    {expanded ? "▲ 收起全文" : "▼ 展开全文"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="px-6 py-8 font-mono text-[0.78rem] text-faint">// 该仓库没有 README 文件</p>
          )}
        </section>
      </Reveal>

      {/* ============ 附加信息行 ============ */}
      <Reveal delay={60}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1 font-mono text-[0.68rem] text-faint">
          <span className="flex items-center gap-1.5"><PinIcon size={12} /> 仓库体积 {fmtSize(repo.size)}</span>
          <span className="flex items-center gap-1.5"><StarIcon size={12} /> {repo.watchers_count.toLocaleString("en-US")} watchers</span>
          <span className="flex items-center gap-1.5"><ClockIcon size={12} /> 最后更新 {absDate(repo.updated_at)}</span>
          <a href={`${repo.html_url}/issues`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-coral">
            <IssueIcon size={12} /> {repo.open_issues_count.toLocaleString("en-US")} 个待处理议题 →
          </a>
        </div>
      </Reveal>
    </div>
  );
}
