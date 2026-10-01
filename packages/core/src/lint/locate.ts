import { isMap, isNode, isScalar, isSeq, type Document, type LineCounter, type Node } from 'yaml';

export interface SourceSpan {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export type LocateTarget = 'value' | 'key';

function spanOf(node: Node | null | undefined, lineCounter: LineCounter): SourceSpan | undefined {
  const range = node?.range;
  if (!range) return undefined;
  const start = lineCounter.linePos(range[0]);
  const end = lineCounter.linePos(range[1]);
  return { line: start.line, column: start.col, endLine: end.line, endColumn: end.col };
}

/**
 * Finds the source span for a document path. Walks as deep as the path exists:
 * a missing key resolves to its parent mapping, so "missing field" issues still
 * point at the right object.
 */
export function locatePath(
  doc: Document,
  path: readonly (string | number)[],
  lineCounter: LineCounter,
  target: LocateTarget = 'value',
): SourceSpan {
  let node: unknown = doc.contents;
  let keyNode: Node | undefined;

  for (const [index, segment] of path.entries()) {
    const isLast = index === path.length - 1;
    if (isMap(node)) {
      const pair = node.items.find(
        (item) => isScalar(item.key) && String(item.key.value) === String(segment),
      );
      if (!pair) break;
      keyNode = isNode(pair.key) ? pair.key : undefined;
      if (isLast && target === 'key' && keyNode) {
        node = keyNode;
        break;
      }
      // Null values (`answer:`) have no node; fall back to the key.
      node = isNode(pair.value) ? pair.value : keyNode;
      if (!isNode(pair.value)) break;
    } else if (isSeq(node)) {
      const item = node.items[Number(segment)];
      if (!isNode(item)) break;
      node = item;
    } else {
      break;
    }
  }

  return (
    spanOf(isNode(node) ? node : undefined, lineCounter) ??
    spanOf(isNode(doc.contents) ? doc.contents : undefined, lineCounter) ?? { line: 1, column: 1 }
  );
}
