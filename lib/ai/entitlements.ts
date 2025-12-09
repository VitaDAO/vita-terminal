import type { UserType } from "@/app/(auth)/auth";
import type { ChatModel } from "./models";

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: ChatModel["id"][];
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 50,
    availableChatModelIds: ["chat-model", "chat-model-reasoning", "n8n"],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: Number.POSITIVE_INFINITY,
    availableChatModelIds: ["chat-model", "chat-model-reasoning", "n8n"],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
