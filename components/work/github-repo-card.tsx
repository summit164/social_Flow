import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Star,
  GitFork,
  Eye,
  ExternalLink,
  Circle,
} from "lucide-react";
import { GithubIcon } from "@/components/ui/icons/github-icon";

type Props = {
  url: string;
};

type RepoInfo = {
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  subscribers_count?: number;
  watchers_count: number;
  language: string | null;
  topics?: string[];
  owner: {
    login: string;
    avatar_url: string;
  };
  default_branch: string;
};

// Базовые цвета для самых популярных языков. Если языка нет в карте —
// нарисуем нейтрально-серую точку.
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
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
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Jupyter: "#DA5B0B",
  "Jupyter Notebook": "#DA5B0B",
  TeX: "#3D6117",
  R: "#198CE7",
  MATLAB: "#e16737",
};

/**
 * Разбирает «https://github.com/owner/repo» (с трейлинг-слэшем или без) в пару.
 * Возвращает null, если URL не подходит.
 */
function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (!/(^|\.)github\.com$/i.test(u.hostname)) return null;
    const [owner, repo] = u.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (!owner || !repo) return null;
    return { owner, repo };
  } catch {
    return null;
  }
}

/** Достаёт RAW-README, перебирая main → master. */
async function fetchReadme(
  owner: string,
  repo: string,
  branch: string
): Promise<string | null> {
  const candidates = [
    branch,
    branch === "main" ? "master" : "main",
  ];
  for (const b of candidates) {
    for (const fname of ["README.md", "readme.md", "README.MD"]) {
      const res = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${b}/${fname}`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const text = await res.text();
        if (text.trim().length > 0) return text;
      }
    }
  }
  return null;
}

export async function GitHubRepoCard({ url }: Props) {
  const parsed = parseRepoUrl(url);
  if (!parsed) return null;

  const { owner, repo } = parsed;

  // Базовая инфа репозитория. Без токена API ограничен 60 запросов/час с IP —
  // на старте это ОК, кэшируем на час.
  const infoRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    }
  );

  // Если репозиторий приватный/удалённый — деградируем к минимальной карточке
  if (!infoRes.ok) {
    return <FallbackCard url={url} owner={owner} repo={repo} />;
  }

  const info = (await infoRes.json()) as RepoInfo;
  const readme = await fetchReadme(owner, repo, info.default_branch);
  const languageColor = info.language
    ? LANGUAGE_COLORS[info.language] ?? "#999"
    : null;

  // README обрезаем — первые ~2000 символов в превью, дальше пользователь идёт на GitHub
  const readmePreview = readme
    ? readme.length > 2000
      ? readme.slice(0, 2000) + "\n\n…"
      : readme
    : null;

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      {/* Шапка */}
      <div className="flex items-start gap-3 p-5 border-b border-border bg-secondary/30">
        <div className="flex size-10 items-center justify-center rounded-md bg-foreground text-background shrink-0">
          <GithubIcon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <a
            href={info.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-medium hover:underline break-all"
          >
            {info.full_name}
          </a>
          {info.description && (
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {info.description}
            </p>
          )}
          {info.topics && info.topics.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {info.topics.slice(0, 8).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {info.language && (
              <span className="inline-flex items-center gap-1.5">
                <Circle
                  className="size-2.5 shrink-0"
                  fill={languageColor ?? "currentColor"}
                  stroke="none"
                />
                {info.language}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5" />
              {formatCount(info.stargazers_count)}
            </span>
            <span className="inline-flex items-center gap-1">
              <GitFork className="size-3.5" />
              {formatCount(info.forks_count)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3.5" />
              {formatCount(info.watchers_count)}
            </span>
          </div>
        </div>
        <a
          href={info.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 self-start rounded-md border border-border bg-card px-3 h-8 text-xs hover:bg-secondary transition-colors shrink-0"
        >
          Открыть
          <ExternalLink className="size-3" />
        </a>
      </div>

      {/* README-превью */}
      {readmePreview && (
        <div className="p-5">
          <p className="text-xs text-muted-foreground mb-3">README</p>
          <article className="prose prose-sm prose-neutral max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-a:text-primary prose-code:rounded prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-secondary prose-pre:text-foreground prose-img:hidden">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {readmePreview}
            </ReactMarkdown>
          </article>
        </div>
      )}
    </section>
  );
}

function FallbackCard({
  url,
  owner,
  repo,
}: {
  url: string;
  owner: string;
  repo: string;
}) {
  return (
    <section className="flex items-center gap-3 rounded-lg border border-border bg-card p-5">
      <div className="flex size-10 items-center justify-center rounded-md bg-foreground text-background shrink-0">
        <GithubIcon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {owner}/{repo}
        </p>
        <p className="text-xs text-muted-foreground">
          Не удалось подтянуть данные — возможно, репозиторий приватный.
        </p>
      </div>
      <Link
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 h-8 text-xs hover:bg-secondary transition-colors shrink-0"
      >
        Открыть <ExternalLink className="size-3" />
      </Link>
    </section>
  );
}

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n / 1000)}k`;
}
