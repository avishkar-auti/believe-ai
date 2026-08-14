/**
 * @types/pdf-parse only declares the package root ("pdf-parse"). We import
 * the internal "pdf-parse/lib/pdf-parse.js" module directly to dodge a
 * debug-mode footgun in the package root's index.js (see resume.service.ts)
 * — this re-declares that subpath with the same shape.
 */
declare module "pdf-parse/lib/pdf-parse.js" {
  export { default } from "pdf-parse";
}
