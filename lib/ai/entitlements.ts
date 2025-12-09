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
    availableChatModelIds: [
      "chat-model",
      "chat-model-reasoning",
      "n8n",
      "prime-intellect/intellect-3",
      "anthropic/claude-opus-4.5",
      "openai/gpt-5",
    ],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: Number.POSITIVE_INFINITY,
    availableChatModelIds: [
      "chat-model",
      "chat-model-reasoning",
      "n8n",
      "prime-intellect/intellect-3",
      "anthropic/claude-opus-4.5",
      "openai/gpt-5",
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
