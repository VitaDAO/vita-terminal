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
        "vita-assistant": n8n("vita-assistant"),
        "title-model": n8n("vita-assistant"),
        "artifact-model": n8n("vita-assistant"),
      },
    });
