/** Design Studio v1 — a DesignNode tree is the DSL Gemini generates; the
 * frontend's DesignRenderer is the only thing that turns it into real DOM. */
export type DesignNodeType = "screen" | "container" | "text" | "heading" | "button" | "image" | "input" | "icon";

export interface DesignNodeStyle {
  background?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  padding?: string;
  gap?: string;
  borderRadius?: string;
  boxShadow?: string;
  border?: string;
  opacity?: string;
  letterSpacing?: string;
  textAlign?: "left" | "center" | "right";
  objectFit?: "cover" | "contain";
  width?: string;
  height?: string;
  flexDirection?: "row" | "column";
  alignItems?: string;
  justifyContent?: string;
}

export interface DesignNode {
  type: DesignNodeType;
  style?: DesignNodeStyle;
  children?: DesignNode[];
  content?: string;
  src?: string;
  placeholder?: string;
  /** Icon name for type "icon" — must match one of the curated lucide-react
   * icons DesignRenderer knows how to render (see design-studio/icons.ts). */
  icon?: string;
}

export type DesignPlatform = "web" | "mobile";

export interface DesignProject {
  id: string;
  name: string;
  screenCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDesignProjectInput {
  name?: string;
}

/** A screen's position on its project's infinite canvas. */
export interface DesignScreenPosition {
  x: number;
  y: number;
}

export interface DesignScreen {
  id: string;
  title: string;
  prompt: string;
  platform: DesignPlatform;
  dsl: DesignNode;
  canvasPosition: DesignScreenPosition;
  createdAt: string;
  updatedAt: string;
}

/** Canvas-view shape — includes dsl so every visible screen can render a live thumbnail preview. */
export interface DesignScreenSummary {
  id: string;
  title: string;
  platform: DesignPlatform;
  dsl: DesignNode;
  canvasPosition: DesignScreenPosition;
  updatedAt: string;
}

export interface CreateDesignScreenInput {
  prompt: string;
  platform: DesignPlatform;
}

export interface EditDesignScreenInput {
  instruction: string;
}

export interface UpdateDesignScreenPositionInput {
  x: number;
  y: number;
}
