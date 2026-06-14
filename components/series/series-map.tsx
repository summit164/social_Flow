import Link from "next/link";
import {
  layoutTree,
  flattenLayout,
  subtreeHeight,
  subtreeWidth,
  type SeriesNode,
} from "@/lib/series/tree";

const CELL_W = 200;
const CELL_H = 130;
const NODE_W = 170;
const NODE_H = 80;
const PADDING = 20;

type Props = {
  root: SeriesNode;
  highlightId: string;
};

/**
 * SVG-дерево треков. Корень — переданный узел, ниже — его потомки.
 * Каждый узел — кликабельный прямоугольник, ведущий на /tracks/{id}.
 */
export function SeriesMap({ root, highlightId }: Props) {
  const laid = layoutTree(root);
  const nodes = flattenLayout(laid);

  const width = Math.max(1, subtreeWidth(root)) * CELL_W + PADDING * 2;
  const height = (subtreeHeight(laid) + 1) * CELL_H + PADDING * 2;

  function nodeX(x: number) {
    return PADDING + x * CELL_W - NODE_W / 2;
  }
  function nodeY(y: number) {
    return PADDING + y * CELL_H;
  }
  function centerX(x: number) {
    return PADDING + x * CELL_W;
  }
  function centerYTop(y: number) {
    return PADDING + y * CELL_H;
  }
  function centerYBottom(y: number) {
    return PADDING + y * CELL_H + NODE_H;
  }

  // Линии: от низа родителя к верху ребёнка, кривой Безье
  const edges: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> = [];
  function collectEdges(parent: ReturnType<typeof layoutTree>) {
    for (const child of parent.children) {
      edges.push({
        x1: centerX(parent.x),
        y1: centerYBottom(parent.y),
        x2: centerX(child.x),
        y2: centerYTop(child.y),
        key: `${parent.id}->${child.id}`,
      });
      collectEdges(child);
    }
  }
  collectEdges(laid);

  return (
    <div className="overflow-auto rounded-lg border border-border bg-card">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="block"
        role="img"
        aria-label="Карта треков"
      >
        {/* Связи между родителем и детьми */}
        {edges.map((e) => {
          const midY = (e.y1 + e.y2) / 2;
          const d = `M ${e.x1} ${e.y1} C ${e.x1} ${midY}, ${e.x2} ${midY}, ${e.x2} ${e.y2}`;
          return (
            <path
              key={e.key}
              d={d}
              fill="none"
              stroke="var(--border)"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Узлы */}
        {nodes.map((n) => {
          const isCurrent = n.id === highlightId;
          return (
            <g key={n.id}>
              <Link href={`/tracks/${n.id}`}>
                <rect
                  x={nodeX(n.x)}
                  y={nodeY(n.y)}
                  width={NODE_W}
                  height={NODE_H}
                  rx={10}
                  ry={10}
                  fill={isCurrent ? "var(--primary)" : "var(--card)"}
                  stroke={isCurrent ? "var(--primary)" : "var(--border)"}
                  strokeWidth={isCurrent ? 2 : 1}
                />
                <text
                  x={centerX(n.x)}
                  y={nodeY(n.y) + 30}
                  textAnchor="middle"
                  fontSize={13}
                  fontWeight={600}
                  fill={
                    isCurrent ? "var(--primary-foreground)" : "var(--foreground)"
                  }
                >
                  {truncate(n.title, 22)}
                </text>
                <text
                  x={centerX(n.x)}
                  y={nodeY(n.y) + 54}
                  textAnchor="middle"
                  fontSize={11}
                  fill={
                    isCurrent
                      ? "var(--primary-foreground)"
                      : "var(--muted-foreground)"
                  }
                >
                  {n.artifactsCount} артефакт
                  {pluralEnding(n.artifactsCount)}
                </text>
              </Link>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function truncate(s: string, max: number) {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

function pluralEnding(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "ов";
  if (mod10 === 1) return "";
  if (mod10 >= 2 && mod10 <= 4) return "а";
  return "ов";
}
