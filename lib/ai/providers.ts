// import { createXai } from "@ai-sdk/xai";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";
import { n8n } from "./n8n/provider";

/* const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
}); */

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
        "title-model": n8n("prime-intellect/intellect-3"),
        "artifact-model": n8n("prime-intellect/intellect-3"),
      },
    });
