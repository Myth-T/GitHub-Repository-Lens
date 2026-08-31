import { useMemo, useState } from "react";
import type { GhRepo, GhUser } from "../lib/github";
import { absDate, fmt, langColor, relTime } from "../lib/github";
import { CopyBtn, CountUp, Reveal, SectionTitle } from "./shared";
import { BranchIcon, ClockIcon, ExternalIcon, FolderIcon, GlobeIcon, PinIcon, StarIcon, UsersIcon } from "./icons";

type SortKey = "pushed" | "stars";

export default function UserView({
  user,
  repos,
  onOpenRepo,
  busy,
}: {
  user: GhUser;
  repos: GhRepo[];
  onOpenRepo: (fullName: string) => void;
  busy: boolean;
}) {
  const [sort, setSort] = useState<SortKey>("pushed");

  const sorted = useMemo(() => {
    const list = [...repos];
    if (sort === "stars") list.sort((a, b) => b.stargazers_count - a.stargazers_count);
    else list.sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());
    return list;
  }, [repos, sort]);

  const totalStars = useMemo(() => repos.reduce((s, r) => s + r.stargazers_count, 0), [repos]);

  return (
    <div className="space-y-5">
      {/* ============ 用户档案 ============ */}
      <Reveal>
        <section className="panel frame overflow-hidden">
          <div className="border-b border-line bg-deep/40 px-5 py-2 font-mono text-[0.65rem] uppercase tracking-[0.24em] text-faint">
            user profile · 用户档案
          </div>
          <div className="flex flex-col gap-6 p-5 sm:flex-row sm:p-7">
            <div className="relative shrink-0 self-start">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="h-24 w-24 rounded border-2 border-line2 shadow-[0_0_0_5px_rgba(86,211,100,0.07)] sm:h-28 sm:w-28"
              />
              <span className="absolute -bottom-1.5 -right-1.5 h-4 w-4 rounded-full border-2 border-panel bg-moss dot-live" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="font-disp text-[clamp(1.5rem,3.5vw,2.3rem)] font-bold leading-tight text-ink">
                  {user.name ?? user.login}
                </h1>
                <a
                  href={user.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 font-mono text-[0.82rem] text-moss transition-colors hover:text-amber"
                >
                  @{user.login} <ExternalIcon size={11} />
                </a>
              </div>
              {user.bio && <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-dim">{user.bio}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                {user.location && <span className="chip"><PinIcon size={11} /> {user.location}</span>}
                {user.company && <span className="chip"><UsersIcon size={11} /> {user.company}</span>}
                {user.blog && (
                  <a
                    className="chip hover:!text-cyanx"
                    href={user.blog.startsWith("http") ? user.blog : `https://${user.blog}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <GlobeIcon size={11} /> {user.blog.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {user.twitter_username && (
                  <a className="chip hover:!text-skyx" href={`https://x.com/${user.twitter_username}`} target="_blank" rel="noreferrer">
                    @{user.twitter_username}
                  </a>
                )}
                <span className="chip"><ClockIcon size={11} /> {absDate(user.created_at)} 加入</span>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
                {[
                  { label: "公开仓库", value: user.public_repos, tone: "text-moss" },
                  { label: "跟随者", value: user.followers, tone: "text-amber" },
                  { label: "跟随中", value: user.following, tone: "text-skyx" },
                  { label: "收获 Star", value: totalStars, tone: "text-coral" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className={`font-disp text-[1.45rem] font-bold leading-none ${s.tone}`}>
                      <CountUp value={s.value} format={fmt} />
                    </div>
                    <div className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-faint">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ============ 仓库列表 ============ */}
      <section>
        <SectionTitle
          icon={<FolderIcon size={17} />}
          zh={`仓库列表`}
          en={`${repos.length} repos`}
          extra={
            <div className="flex overflow-hidden rounded border border-line2 font-mono text-[0.65rem]">
              {(["pushed", "stars"] as SortKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setSort(k)}
                  className={`px-3 py-1.5 transition-all duration-200 ${
                    sort === k ? "bg-moss/15 text-moss" : "text-faint hover:bg-raise hover:text-dim"
                  }`}
                >
                  {k === "pushed" ? "最近更新" : "最多 Star"}
                </button>
              ))}
            </div>
          }
        />

        {sorted.length === 0 ? (
          <div className="panel p-8 text-center font-mono text-[0.8rem] text-faint">// 该用户没有公开仓库</div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((r, i) => (
              <Reveal key={r.id} delay={Math.min(i, 8) * 50}>
                <button
                  onClick={() => !busy && onOpenRepo(r.full_name)}
                  disabled={busy}
                  className="group relative flex h-full w-full flex-col rounded-md border border-line bg-gradient-to-b from-panel2 to-panel p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:border-moss/45 hover:shadow-[0_14px_36px_-14px_rgba(86,211,100,0.28)] disabled:opacity-50"
                >
                  <span className="pointer-events-none absolute right-3 top-3 h-2 w-2 rounded-full bg-moss opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-[0.85rem] font-bold text-moss transition-colors group-hover:text-ink">
                      {r.name}
                    </span>
                    {r.fork && <span className="chip !py-0 !text-[0.58rem]">fork</span>}
                    {r.archived && <span className="chip !py-0 !text-[0.58rem] !border-coral/40 !text-coral">archived</span>}
                  </div>
                  <p className="mt-1.5 line-clamp-2 min-h-[2.4em] text-[0.78rem] leading-relaxed text-dim">
                    {r.description ?? "（暂无描述）"}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center gap-x-3.5 gap-y-1 pt-3 font-mono text-[0.65rem] text-faint">
                    {r.language && (
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: langColor(r.language) }} />
                        {r.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-amber/90"><StarIcon size={11} /> {fmt(r.stargazers_count)}</span>
                    <span className="flex items-center gap-1"><BranchIcon size={11} /> {fmt(r.forks_count)}</span>
                    <span className="ml-auto">{relTime(r.pushed_at)}</span>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center justify-between px-1 font-mono text-[0.68rem] text-faint">
        <span>点击任意仓库卡片，读取其完整档案</span>
        <CopyBtn text={user.html_url} label="复制主页链接" />
      </div>
    </div>
  );
}
