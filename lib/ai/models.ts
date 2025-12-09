export const DEFAULT_CHAT_MODEL: string = "prime-intellect/intellect-3";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "prime-intellect/intellect-3",
    name: "Intellect-3",
    description: "Highly capable reasoning model by Prime Intellect",
  },
  {
    id: "anthropic/claude-opus-4.5",
    name: "Claude Opus 4.5",
    description: "Anthropic's most powerful model for complex tasks",
  },
  {
    id: "openai/gpt-5",
    name: "GPT-5",
    description: "OpenAI's latest flagship model",
  },
];
