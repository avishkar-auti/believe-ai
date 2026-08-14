import { TemplateModel } from "@believe-ai/server";

export interface TemplateRecord {
  userId: string;
  name: string;
  subject: string;
  body: string;
}

export const templateRepository = {
  list(userId: string) {
    return TemplateModel.find({ userId }).sort({ createdAt: -1 });
  },

  findById(id: string, userId: string) {
    return TemplateModel.findOne({ _id: id, userId });
  },

  create(data: TemplateRecord) {
    return TemplateModel.create(data);
  },

  update(id: string, userId: string, updates: Partial<TemplateRecord>) {
    return TemplateModel.findOneAndUpdate({ _id: id, userId }, updates, { new: true });
  },

  delete(id: string, userId: string) {
    return TemplateModel.findOneAndDelete({ _id: id, userId });
  },
};
