import type { ProviderV2 } from "@ai-sdk/provider";
import { generateId } from "@ai-sdk/provider-utils";
import { N8nChatLanguageModel } from "./n8n-chat-language-model";

interface N8nProvider extends ProviderV2 {
  (modelId: string, settings?: Record<string, unknown>): N8nChatLanguageModel;
  languageModel(
    modelId: string,
    settings?: Record<string, unknown>
  ): N8nChatLanguageModel;
}

interface N8nProviderSettings {
  webhookUrl?: string;
  generateId?: () => string;
}

export function createN8n(options: N8nProviderSettings = {}): N8nProvider {
  const createChatModel = (
    modelId: string,
    settings: Record<string, unknown> = {}
  ) => {
    return new N8nChatLanguageModel(modelId, settings, {
      provider: "n8n",
      webhookUrl: options.webhookUrl ?? "https://n8n.vitadao.com/webhook/chat",
      generateId: options.generateId ?? generateId,
    });
  };

  const provider = function (
    modelId: string,
    settings?: Record<string, unknown>
  ) {
    if (new.target) {
      throw new Error(
        "The model factory function cannot be called with the new keyword."
      );
    }
    return createChatModel(modelId, settings);
  };

  provider.languageModel = createChatModel;
  provider.textEmbeddingModel = (_modelId: string) => {
    throw new Error("Text embedding not supported");
  };
  provider.imageModel = (_modelId: string) => {
    throw new Error("Image generation not supported");
  };

  return provider as N8nProvider;
}

export const n8n = createN8n();
