import type {
  LanguageModelV2,
  LanguageModelV2CallOptions,
  LanguageModelV2CallWarning,
  LanguageModelV2Content,
  LanguageModelV2StreamPart,
} from "@ai-sdk/provider";

type N8nChatConfig = {
  provider: string;
  webhookUrl: string;
  generateId: () => string;
};

type N8nChatSettings = Record<string, unknown>;

export class N8nChatLanguageModel implements LanguageModelV2 {
  readonly specificationVersion = "v2";
  readonly provider: string;
  readonly modelId: string;
  readonly config: N8nChatConfig;

  constructor(
    modelId: string,
    settings: N8nChatSettings,
    config: N8nChatConfig
  ) {
    this.provider = config.provider;
    this.modelId = modelId;
    this.config = config;
  }

  get supportedUrls() {
    return {};
  }

  private getArgs(options: LanguageModelV2CallOptions) {
    const warnings: LanguageModelV2CallWarning[] = [];

    // Simple mapping: just take the last user message as chatInput
    const messages = options.prompt.map((msg: any) => ({
      role: msg.role,
      content: Array.isArray(msg.content)
        ? msg.content
            .filter((c: any) => c.type === "text")
            .map((c: any) => c.text)
            .join("") || ""
        : msg.content,
    }));

    // Find the last user message for chatInput
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    const chatInput = lastUserMessage ? lastUserMessage.content : "";

    const sessionId = this.config.generateId();

    const body = {
      sessionId,
      chatInput,
      messages,
      model: this.modelId,
    };

    return { args: body, warnings };
  }

  async doGenerate(options: LanguageModelV2CallOptions) {
    const { args, warnings } = this.getArgs(options);

    const response = await fetch(this.config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      signal: options.abortSignal,
    });

    if (!response.ok) {
      throw new Error(`N8n webhook failed with status ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split("\n").filter((line) => line.trim() !== "");
    let fullContent = "";

    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.type === "item" && json.content) {
          fullContent += json.content;
        } else if (json.output) {
          // Handle simple object response format { output: "..." }
          fullContent += json.output;
        }
      } catch (_e) {
        // ignore parse errors
      }
    }

    return {
      content: [{ type: "text", text: fullContent } as LanguageModelV2Content],
      finishReason: "stop" as const,
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      warnings,
    };
  }

  async doStream(options: LanguageModelV2CallOptions) {
    const { args, warnings } = this.getArgs(options);

    const response = await fetch(this.config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      signal: options.abortSignal,
    });

    if (!response.ok) {
      throw new Error(`N8n webhook failed with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const stream = new ReadableStream<LanguageModelV2StreamPart>({
      async start(controller) {
        // Fix: Vercel AI SDK V2 crashes if no text-start is sent before text-delta
        controller.enqueue({
          type: "text-start",
          id: "0",
        } as any);

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let isThinking = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim()) {
                continue;
              }
              try {
                const json = JSON.parse(line);
                console.log("N8n Chunk:", json); // Debug incoming stream
                let content = "";
                let reasoning = "";

                if (json.reasoning || json.thinking) {
                  reasoning = json.reasoning || json.thinking;
                }

                if (json.type === "item" && json.content) {
                  content = json.content;
                } else if (json.output) {
                  content = json.output;
                }

                if (reasoning) {
                  controller.enqueue({
                    type: "reasoning-delta",
                    textDelta: reasoning,
                  } as any);
                }

                if (content) {
                  let remainingContent = content;

                  // Handle thinking tag start
                  if (!isThinking) {
                    const startTagIndex = remainingContent.indexOf("<think>");
                    if (startTagIndex !== -1) {
                      const textBefore = remainingContent.substring(
                        0,
                        startTagIndex
                      );
                      if (textBefore) {
                        controller.enqueue({
                          type: "text-delta",
                          textDelta: textBefore,
                          delta: textBefore,
                        } as any);
                      }
                      isThinking = true;
                      remainingContent = remainingContent.substring(
                        startTagIndex + 7
                      ); // 7 is length of <think>
                    }
                  }

                  // Handle thinking tag end
                  if (isThinking) {
                    const endTagIndex = remainingContent.indexOf("</think>");
                    if (endTagIndex !== -1) {
                      const reasoningContent = remainingContent.substring(
                        0,
                        endTagIndex
                      );
                      if (reasoningContent) {
                        controller.enqueue({
                          type: "reasoning-delta",
                          textDelta: reasoningContent,
                        } as any);
                      }
                      isThinking = false;
                      remainingContent = remainingContent.substring(
                        endTagIndex + 8
                      ); // 8 is length of </think>
                    } else {
                      // Whole chunk is reasoning
                      controller.enqueue({
                        type: "reasoning-delta",
                        textDelta: remainingContent,
                      } as any);
                      remainingContent = "";
                    }
                  }

                  // Handle remaining normal text
                  if (remainingContent && !isThinking) {
                    controller.enqueue({
                      type: "text-delta",
                      textDelta: remainingContent,
                      delta: remainingContent,
                      id: "0",
                    } as any);
                  }
                }
              } catch (_e) {
                // ignore
              }
            }
          }
          // Process any remaining buffer
          if (buffer.trim()) {
            try {
              const json = JSON.parse(buffer);
              let content = "";
              let reasoning = "";

              if (json.reasoning || json.thinking) {
                reasoning = json.reasoning || json.thinking;
              }

              if (json.type === "item" && json.content) {
                content = json.content;
              } else if (json.output) {
                content = json.output;
              }

              if (reasoning) {
                controller.enqueue({
                  type: "reasoning-delta",
                  textDelta: reasoning,
                } as any);
              }

              if (content) {
                // Simple processing for buffer end, assuming no split tags for now to keep it safe
                if (isThinking) {
                  controller.enqueue({
                    type: "reasoning-delta",
                    textDelta: content,
                  } as any);
                } else {
                  controller.enqueue({
                    type: "text-delta",
                    textDelta: content,
                    delta: content,
                    id: "0",
                  } as any);
                }
              }
            } catch (_e) {
              /* ignore */
            }
          }

          controller.enqueue({
            type: "finish",
            finishReason: "stop",
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          });
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return { stream, warnings };
  }
}
