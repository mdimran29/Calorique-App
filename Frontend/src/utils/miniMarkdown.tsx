// utils/miniMarkdown.tsx — Lightweight markdown → JSX renderer for chat bubbles.
// Aria's replies use a narrow markdown subset (bold, italics, bullet/numbered lists,
// headers, inline code, line breaks) — not worth pulling in a full markdown dependency for.
import type { ReactNode } from "react";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Split on **bold**, *italic*, and `code` while keeping the delimiters for re-matching
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  parts.forEach((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      nodes.push(<strong key={key} style={{ fontWeight: 700, color: "#fff" }}>{part.slice(2, -2)}</strong>);
    } else if (part.startsWith("`") && part.endsWith("`")) {
      nodes.push(
        <code key={key} style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: "4px", fontSize: "0.9em" }}>
          {part.slice(1, -1)}
        </code>
      );
    } else if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      nodes.push(<em key={key}>{part.slice(1, -1)}</em>);
    } else if (part) {
      nodes.push(part);
    }
  });
  return nodes;
}

export function renderMarkdown(text: string): ReactNode {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let listBuffer: { ordered: boolean; items: string[] } | null = null;

  const flushList = (key: string) => {
    if (!listBuffer) return;
    const Tag = listBuffer.ordered ? "ol" : "ul";
    blocks.push(
      <Tag key={key} style={{ margin: "4px 0", paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "3px" }}>
        {listBuffer.items.map((item, i) => (
          <li key={i} style={{ lineHeight: 1.55 }}>{renderInline(item, `${key}-li-${i}`)}</li>
        ))}
      </Tag>
    );
    listBuffer = null;
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trimEnd();
    const bulletMatch = line.match(/^\s*[-•]\s+(.*)/);
    const orderedMatch = line.match(/^\s*\d+[.)]\s+(.*)/);
    const headerMatch = line.match(/^(#{1,3})\s+(.*)/);

    if (bulletMatch) {
      if (!listBuffer || listBuffer.ordered) { flushList(`blk-${idx}`); listBuffer = { ordered: false, items: [] }; }
      listBuffer.items.push(bulletMatch[1]);
      return;
    }
    if (orderedMatch) {
      if (!listBuffer || !listBuffer.ordered) { flushList(`blk-${idx}`); listBuffer = { ordered: true, items: [] }; }
      listBuffer.items.push(orderedMatch[1]);
      return;
    }

    flushList(`blk-${idx}`);

    if (headerMatch) {
      const level = headerMatch[1].length;
      const size = level === 1 ? "15px" : level === 2 ? "14px" : "13px";
      blocks.push(
        <p key={`blk-${idx}`} style={{ fontWeight: 800, fontSize: size, color: "#fff", margin: "6px 0 2px" }}>
          {renderInline(headerMatch[2], `blk-${idx}`)}
        </p>
      );
    } else if (line.trim() === "") {
      blocks.push(<div key={`blk-${idx}`} style={{ height: "4px" }} />);
    } else {
      blocks.push(
        <p key={`blk-${idx}`} style={{ margin: "2px 0", lineHeight: 1.65 }}>
          {renderInline(line, `blk-${idx}`)}
        </p>
      );
    }
  });

  flushList("blk-final");
  return <>{blocks}</>;
}
