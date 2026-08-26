"""Design Studio — Gemini never writes final UI directly. It generates a
structured DesignNode tree (the DSL below); the frontend's DesignRenderer
is the only thing that turns that tree into real pixels. Both prompts spell
out the exact fixed vocabulary so the model targets a schema it's been told
about rather than inventing node/style shapes of its own."""

from __future__ import annotations

from prompts.base import json_schema, log_prompt_version, untrusted_text
from schemas.ai import DesignEditRequest, DesignGenerateRequest

PROMPT_VERSION = "1.1.0"

# Must exactly match apps/web/src/features/design-studio/icons.ts's ICON_NAMES —
# an icon name outside this set simply renders nothing on the frontend, so the
# model is only ever told about names that are guaranteed to actually exist.
_ICON_NAMES = [
    "Home", "Search", "Menu", "ChevronRight", "ChevronLeft", "ChevronDown", "ChevronUp",
    "ArrowRight", "ArrowLeft", "X", "Plus", "Minus", "Edit", "Trash2", "Share2", "Download",
    "Upload", "Copy", "Check", "Filter", "Bell", "Mail", "MessageCircle", "Phone", "Send",
    "User", "Users", "Heart", "Star", "ThumbsUp", "ShoppingCart", "ShoppingBag", "CreditCard",
    "DollarSign", "Tag", "Package", "Play", "Pause", "Camera", "Image", "Mic", "Video",
    "AlertCircle", "Info", "CheckCircle", "XCircle", "Settings", "LogOut", "Lock", "Unlock",
    "Eye", "EyeOff", "Calendar", "Clock", "MapPin", "Globe", "Wifi", "Battery", "TrendingUp",
    "TrendingDown", "BarChart3", "PieChart", "Zap", "Sun", "Moon", "Bookmark", "Folder", "File",
    "Link", "ExternalLink", "RefreshCw", "Grid", "List",
]

_DSL_VOCABULARY = [
    "A DesignNode has: type, and depending on type, other fields.",
    "Allowed types: 'screen', 'container', 'text', 'heading', 'button', 'image', 'input', 'icon'.",
    "Every node may have a 'style' object using only these keys (all optional): "
    "background, color, fontSize, fontWeight, padding, gap, borderRadius, boxShadow, border, "
    "opacity, letterSpacing, textAlign ('left'|'center'|'right'), objectFit ('cover'|'contain'), "
    "width, height, flexDirection, alignItems, justifyContent (use real CSS values, e.g. "
    "fontSize: '16px', flexDirection: 'row'|'column', padding: '16px', "
    "boxShadow: '0 4px 12px rgba(0,0,0,0.08)').",
    "'screen' and 'container' nodes may have a 'children' array of more DesignNodes — use "
    "flexDirection/alignItems/justifyContent/gap on containers to build genuine 2D layouts "
    "(rows, columns, grids of cards), not everything stacked in a single column.",
    "'text' and 'heading' nodes have a 'content' string (the text to display).",
    "'button' nodes have a 'content' string (the button label).",
    "'input' nodes have a 'placeholder' string.",
    "'icon' nodes have an 'icon' string that MUST be exactly one of this fixed set (any other "
    "name renders as nothing, so never invent one): " + ", ".join(_ICON_NAMES) + ". "
    "Size the icon via style.fontSize (e.g. '20px') and tint it via style.color. Use icons for "
    "nav items, action buttons, list-row leading marks, status indicators — anywhere a real app "
    "would use one, not decoratively.",
    "'image' nodes have a 'src' string. For real photographic content (hero images, product shots, "
    "avatars, background imagery) use https://picsum.photos/seed/{keyword}/{width}/{height} with a "
    "short lowercase keyword related to the content (e.g. seed/coffee-shop/400/300) so it looks like "
    "an actual photo, not a gray box. Only use https://placehold.co/WxH?text=... for things that are "
    "genuinely placeholder labels in a real product too, like a company logo mark.",
    "The root node is always type 'screen' with a 'style' and a 'children' array.",
]

_QUALITY_BAR = [
    "This must read as a real, shippable product screen — the kind a professional product designer "
    "would hand to an engineer — not a grayscale wireframe or a rough sketch. Concretely:",
    "- Use a real color system: one primary brand color plus a neutral palette (near-white surfaces, "
    "soft gray backgrounds, near-black text) and one accent for success/warning states where relevant — "
    "never leave everything flat white/black/gray with no color at all.",
    "- Give surfaces depth: cards and elevated panels get a subtle boxShadow and borderRadius (8-20px), "
    "not a flat outline sitting directly on the background.",
    "- Use icon nodes for every place a real app would have one (navigation, buttons, list rows, status), "
    "and real photographic image nodes (picsum.photos) for any hero/content imagery instead of blank boxes.",
    "- Vary type scale and weight deliberately: a clear heading, readable body text, and de-emphasized "
    "secondary/caption text (via smaller fontSize and a lighter color) — not one uniform text style "
    "everywhere.",
    "- Add believable, specific content (names, numbers, short labels) consistent with the request — "
    "generic placeholder text like 'Lorem ipsum' or 'Item 1' reads as a wireframe and must be avoided.",
]


def build_design_generate_prompt(req: DesignGenerateRequest) -> str:
    log_prompt_version("design_generate", PROMPT_VERSION)
    lines = [
        f"Design a single {req.platform} UI screen as a DesignNode tree (JSON), based on the request below.",
        "Produce a real, polished, production-quality layout: proper spacing, visual hierarchy, a coherent",
        "color scheme, and genuine 2D structure (rows/columns/grids via flex containers) — not a plain",
        "single-column stack of elements.",
        *_QUALITY_BAR,
        *_DSL_VOCABULARY,
        "Only include copy, labels, and data that are reasonable for the request — never invent a specific",
        "real brand, person, or statistic that wasn't implied by it.",
        "Also produce a short, human-readable title for this screen (a few words, e.g. 'Fintech Dashboard').",
        *untrusted_text("Screen request", req.prompt),
        json_schema("{title: string, dsl: DesignNode}"),
    ]
    return "\n".join(lines)


def build_design_edit_prompt(req: DesignEditRequest) -> str:
    log_prompt_version("design_edit", PROMPT_VERSION)
    lines = [
        "Below is the current DSL (JSON) for a UI screen, followed by an edit instruction.",
        "Return the ENTIRE updated DesignNode tree with the instruction applied. Keep every node, style, and",
        "piece of content that the instruction doesn't relate to exactly as it was — this is an edit, not a",
        "regeneration from scratch.",
        *_DSL_VOCABULARY,
        f"Current DSL (JSON): {req.currentDsl}",
        *untrusted_text("Edit instruction", req.instruction),
        json_schema("{dsl: DesignNode}"),
    ]
    return "\n".join(lines)
