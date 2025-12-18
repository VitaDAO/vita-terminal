export const DEFAULT_CHAT_MODEL: string = "vita-assistant";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "vita-assistant",
    name: "Vita Assistant",
    description: "VitaDAO's specialized knowledge assistant",
  },
];
