import type { HydratedDocument } from "mongoose";
import { interpolateTemplate, type CreateTemplateInput, type Template, type UpdateTemplateInput } from "@believe-ai/shared";
import sanitizeHtml from "sanitize-html";
import type { TemplateDocument } from "@believe-ai/server";
import { templateRepository } from "../repositories/template.repository.js";
import { NotFoundError } from "../errors/AppError.js";

function toDto(doc: HydratedDocument<TemplateDocument>): Template {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    subject: doc.subject,
    body: doc.body,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/** Templates and AI output are treated as untrusted content — strip anything beyond basic formatting. */
function sanitizeBody(body: string): string {
  return sanitizeHtml(body, {
    allowedTags: ["p", "br", "b", "strong", "i", "em", "u", "a", "ul", "ol", "li", "span", "div"],
    allowedAttributes: { a: ["href", "target", "rel"] },
  });
}

export const templateService = {
  toDto,

  async list(userId: string): Promise<Template[]> {
    const docs = await templateRepository.list(userId);
    return docs.map(toDto);
  },

  async getById(id: string, userId: string): Promise<Template> {
    const doc = await templateRepository.findById(id, userId);
    if (!doc) throw new NotFoundError("Template not found");
    return toDto(doc);
  },

  async create(userId: string, input: CreateTemplateInput): Promise<Template> {
    const doc = await templateRepository.create({
      userId,
      name: input.name,
      subject: input.subject,
      body: sanitizeBody(input.body),
    });
    return toDto(doc);
  },

  async update(id: string, userId: string, input: UpdateTemplateInput): Promise<Template> {
    const updates = { ...input, body: input.body ? sanitizeBody(input.body) : undefined };
    const doc = await templateRepository.update(id, userId, updates);
    if (!doc) throw new NotFoundError("Template not found");
    return toDto(doc);
  },

  async delete(id: string, userId: string): Promise<void> {
    const deleted = await templateRepository.delete(id, userId);
    if (!deleted) throw new NotFoundError("Template not found");
  },

  async duplicate(id: string, userId: string): Promise<Template> {
    const original = await templateRepository.findById(id, userId);
    if (!original) throw new NotFoundError("Template not found");
    const copy = await templateRepository.create({
      userId,
      name: `${original.name} (copy)`,
      subject: original.subject,
      body: original.body,
    });
    return toDto(copy);
  },

  preview(subject: string, body: string, values: Record<string, string>) {
    return {
      subject: interpolateTemplate(subject, values),
      body: interpolateTemplate(body, values),
    };
  },
};
