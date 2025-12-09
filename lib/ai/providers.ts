import { gateway } from "@ai-sdk/gateway";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";
import { n8n } from "./n8n/provider";

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        "prime-intellect/intellect-3": n8n("prime-intellect/intellect-3"),
        "anthropic/claude-opus-4.5": n8n("anthropic/claude-opus-4.5"),
        "openai/gpt-5": n8n("openai/gpt-5"),
        "title-model": gateway.languageModel("xai/grok-2-1212"),
        "artifact-model": gateway.languageModel("xai/grok-2-1212"),
      },
    });
