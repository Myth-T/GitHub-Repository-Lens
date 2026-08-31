/* GitHub REST API v3 数据层 —— 未认证访问公共数据 */

export interface GhUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  twitter_username: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GhLicense {
  spdx_id: string;
  name: string;
}

export interface GhRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  subscribers_count: number;
  open_issues_count: number;
  license: GhLicense | null;
  topics: string[];
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  archived: boolean;
  fork: boolean;
  visibility?: string;
  owner: GhUser;
}

export interface GhCommit {
  sha: string;
  html_url: string;
  commit: { message: string; author: { name: string; date: string } };
  author: GhUser | null;
}

export interface GhContributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
}

export interface GhContent {
  name: string;
  path: string;
  type: "file" | "dir";
  size: number;
  html_url: string;
}

export interface WeekActivity {
  days: number[];
  total: number;
  week: number;
}

export interface RepoBundle {
  repo: GhRepo;
  languages: Record<string, number> | null;
  commits: GhCommit[] | null;
  contributors: GhContributor[] | null;
  contents: GhContent[] | null;
  readme: string | null;
  activity: WeekActivity[] | null;
}

export class GhError extends Error {
  status: number;
  constructor(status: number, msg: string) {
    super(msg);
    this.status = status;
  }
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ---- 配额追踪（从响应头免费获取） ---- */
let remaining: number | null = null;
let limit: number | null = null;
export const getQuota = () => ({ remaining, limit });

const API = "https://api.github.com";

async function gh<T>(path: string, raw = false): Promise<T> {
  const res = await fetch(API + path, {
    headers: raw ? { Accept: "application/vnd.github.raw+json" } : { Accept: "application/vnd.github+json" },
  });
  const rem = res.headers.get("x-ratelimit-remaining");
  const lim = res.headers.get("x-ratelimit-limit");
  if (rem) remaining = parseInt(rem, 10);
  if (lim) limit = parseInt(lim, 10);
  if (res.status === 202) throw new GhError(202, "computing");
  if (!res.ok) throw new GhError(res.status, `HTTP ${res.status}`);
  return raw ? ((await res.text()) as unknown as T) : ((await res.json()) as T);
}

/* ---- 输入解析：支持 owner / owner/repo / 完整 URL ---- */
export function parseTarget(input: string): { owner: string; repo?: string } | null {
  let s = input.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\/+$/, "").replace(/\.git$/i, "");
  if (!s) return null;
  const m = s.match(/^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}[A-Za-z0-9])?)(?:\/([\w][\w.-]*))?$/);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

export function targetLabel(t: { owner: string; repo?: string }) {
  return t.repo ? `${t.owner}/${t.repo}` : t.owner;
}

/* ---- 抓取：用户档案 + 仓库列表 ---- */
export async function fetchUser(owner: string): Promise<{ user: GhUser; repos: GhRepo[] }> {
  const [user, repos] = await Promise.all([
    gh<GhUser>(`/users/${encodeURIComponent(owner)}`),
    gh<GhRepo[]>(`/users/${encodeURIComponent(owner)}/repos?per_page=100&sort=pushed`).catch(() => [] as GhRepo[]),
  ]);
  return { user, repos };
}

/* ---- 抓取：仓库完整档案（1 次主请求 + 6 路并行） ---- */
export async function fetchRepoBundle(owner: string, repo: string): Promise<RepoBundle> {
  const r = await gh<GhRepo>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
  const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const [languages, commits, contributors, contents, readme, activity] = await Promise.all([
    gh<Record<string, number>>(`${base}/languages`).catch(() => null),
    gh<GhCommit[]>(`${base}/commits?per_page=8`).catch(() => null),
    gh<GhContributor[]>(`${base}/contributors?per_page=14`).catch(() => null),
    gh<GhContent[]>(`${base}/contents/`).catch(() => null),
    gh<string>(`${base}/readme`, true).catch(() => null),
    fetchActivity(base),
  ]);
  return { repo: r, languages, commits, contributors, contents, readme, activity };
}

/* stats 接口首次可能返回 202（后台计算中），稍等重试一次 */
async function fetchActivity(base: string): Promise<WeekActivity[] | null> {
  for (let i = 0; i < 2; i++) {
    try {
      return await gh<WeekActivity[]>(`${base}/stats/commit_activity`);
    } catch (e) {
      if (e instanceof GhError && e.status === 202 && i === 0) {
        await sleep(1300);
        continue;
      }
      return null;
    }
  }
  return null;
}

/* ---- 格式化 ---- */
export function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e4) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toLocaleString("en-US");
}

export function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} 个月前`;
  return `${Math.floor(mo / 12)} 年前`;
}

export function absDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fmtSize(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${(kb / 1024 / 1024).toFixed(2)} GB`;
}

export function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

/* ---- 语言色板（取自 GitHub 官方语言色） ---- */
export const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#663399",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Lua: "#000080",
  Scala: "#c22d40",
  Haskell: "#5e5086",
  Elixir: "#6e4a7e",
  Erlang: "#B83998",
  Clojure: "#db5855",
  R: "#198CE7",
  Julia: "#a270ba",
  Perl: "#0298c3",
  "Objective-C": "#438eff",
  Zig: "#ec915c",
  Nix: "#7e7eff",
  Dockerfile: "#384d54",
  Makefile: "#427819",
  Jupyter: "#DA5B0B",
  "Jupyter Notebook": "#DA5B0B",
  MDX: "#fcb32c",
  Astro: "#ff5a03",
  Solidity: "#AA6746",
};

export const langColor = (l: string) => LANG_COLORS[l] ?? "#8b949e";
