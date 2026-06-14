/**
 * Утилиты для работы с деревом треков.
 * Все функции работают с плоским списком — обходят без обращений к БД.
 */

export type FlatSeries = {
  id: string;
  parent_id: string | null;
  depth: number;
  title: string;
  artifactsCount: number;
};

export type SeriesNode = FlatSeries & { children: SeriesNode[] };

/**
 * Поднимается от трека до корня. Возвращает цепочку от корня к узлу включительно.
 */
export function getAncestors(flat: FlatSeries[], id: string): FlatSeries[] {
  const byId = new Map(flat.map((s) => [s.id, s]));
  const chain: FlatSeries[] = [];
  let cur: FlatSeries | undefined = byId.get(id);
  while (cur) {
    chain.unshift(cur);
    cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
  }
  return chain;
}

/**
 * Возвращает дерево, начинающееся с указанного узла (узел в корне поддерева).
 */
export function getSubtree(flat: FlatSeries[], rootId: string): SeriesNode | null {
  const byId = new Map(flat.map((s) => [s.id, { ...s, children: [] as SeriesNode[] }]));
  for (const s of flat) {
    if (s.parent_id && byId.has(s.parent_id)) {
      byId.get(s.parent_id)!.children.push(byId.get(s.id)!);
    }
  }
  return byId.get(rootId) ?? null;
}

/**
 * Прямые дети узла, отсортированные по дате создания (приходят в исходном порядке).
 */
export function getChildren(flat: FlatSeries[], id: string): FlatSeries[] {
  return flat.filter((s) => s.parent_id === id);
}

// ============================================================
//   Раскладка дерева для SVG-визуализации
// ============================================================

export type LayoutNode = {
  id: string;
  title: string;
  depth: number;
  artifactsCount: number;
  x: number; // условные единицы (1 = ширина одной ячейки)
  y: number; // глубина (0 = корень рендеримой карты)
  children: LayoutNode[];
};

/**
 * Алгоритм «накопительного смещения»: каждый лист занимает 1 ячейку,
 * родитель ставится по центру своих детей. Простая раскладка для дерева
 * глубины до 3 — для академических деревьев этого хватит с запасом.
 */
export function layoutTree(node: SeriesNode, y = 0, xOffset = 0): LayoutNode {
  if (node.children.length === 0) {
    return {
      id: node.id,
      title: node.title,
      depth: node.depth,
      artifactsCount: node.artifactsCount,
      x: xOffset + 0.5, // центр единичной ячейки
      y,
      children: [],
    };
  }

  let cursor = xOffset;
  const laid: LayoutNode[] = [];
  for (const c of node.children) {
    const laidChild = layoutTree(c, y + 1, cursor);
    laid.push(laidChild);
    cursor += subtreeWidth(c);
  }

  const firstX = laid[0].x;
  const lastX = laid[laid.length - 1].x;
  return {
    id: node.id,
    title: node.title,
    depth: node.depth,
    artifactsCount: node.artifactsCount,
    x: (firstX + lastX) / 2,
    y,
    children: laid,
  };
}

/**
 * Сколько условных «колонок» занимает поддерево.
 */
export function subtreeWidth(node: SeriesNode): number {
  if (node.children.length === 0) return 1;
  return node.children.reduce((s, c) => s + subtreeWidth(c), 0);
}

/**
 * Максимальная глубина поддерева (0 для листа).
 */
export function subtreeHeight(node: LayoutNode): number {
  if (node.children.length === 0) return 0;
  return 1 + Math.max(...node.children.map(subtreeHeight));
}

/**
 * Плоский список всех узлов в раскладке — для рендера.
 */
export function flattenLayout(node: LayoutNode): LayoutNode[] {
  const out: LayoutNode[] = [node];
  for (const c of node.children) out.push(...flattenLayout(c));
  return out;
}
