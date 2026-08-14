import { UserModel } from "@believe-ai/server";

export interface CreateUserRecord {
  firebaseUid: string;
  email: string;
  name: string;
  avatar?: string | null;
}

export const userRepository = {
  findByFirebaseUid(firebaseUid: string) {
    return UserModel.findOne({ firebaseUid });
  },

  findById(id: string) {
    return UserModel.findById(id);
  },

  create(data: CreateUserRecord) {
    return UserModel.create(data);
  },

  updateProfile(
    id: string,
    updates: Partial<{
      name: string;
      company: string | null;
      jobTitle: string | null;
      timezone: string;
      avatar: string | null;
      onboardingCompleted: boolean;
      role: "user" | "recruiter";
    }>,
  ) {
    return UserModel.findByIdAndUpdate(id, updates, { new: true });
  },
};
