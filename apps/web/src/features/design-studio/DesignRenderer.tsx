import type { CSSProperties } from "react";
import type { DesignNode, DesignNodeStyle } from "@believe-ai/shared";
import { ICONS } from "./icons.js";

/** The actual "Design Engine" for v1 — a small recursive component that turns
 * a DesignNode tree into real DOM elements with inline styles. An unknown
 * node type (or an icon name outside the curated set) renders nothing rather
 * than throwing, so a slightly malformed or partial DSL degrades gracefully
 * instead of crashing the whole screen. */
function toCssStyle(style: DesignNodeStyle | undefined): CSSProperties {
  if (!style) return {};
  return {
    background: style.background,
    color: style.color,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    padding: style.padding,
    gap: style.gap,
    borderRadius: style.borderRadius,
    boxShadow: style.boxShadow,
    border: style.border,
    opacity: style.opacity,
    letterSpacing: style.letterSpacing,
    textAlign: style.textAlign,
    objectFit: style.objectFit,
    width: style.width,
    height: style.height,
    flexDirection: style.flexDirection,
    alignItems: style.alignItems,
    justifyContent: style.justifyContent,
  };
}

function iconSizePx(style: DesignNodeStyle | undefined): number {
  const raw = style?.fontSize ?? style?.width;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : 24;
}

export function DesignRenderer({ node }: { node: DesignNode }) {
  const style = toCssStyle(node.style);

  switch (node.type) {
    case "screen":
    case "container":
      return (
        <div style={{ display: "flex", flexDirection: "column", ...style }}>
          {(node.children ?? []).map((child, i) => (
            <DesignRenderer key={i} node={child} />
          ))}
        </div>
      );
    case "heading":
      return <h2 style={style}>{node.content}</h2>;
    case "text":
      return <p style={style}>{node.content}</p>;
    case "button":
      return <button style={style}>{node.content}</button>;
    case "image":
      return <img src={node.src} alt="" style={style} />;
    case "input":
      return <input placeholder={node.placeholder} style={style} readOnly />;
    case "icon": {
      const Icon = node.icon ? ICONS[node.icon] : undefined;
      if (!Icon) return null;
      return <Icon size={iconSizePx(node.style)} color={node.style?.color} strokeWidth={2} style={{ flexShrink: 0 }} />;
    }
    default:
      return null;
  }
}
