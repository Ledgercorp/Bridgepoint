export const OPENAI_CHAT_COMPLETIONS_URL =
  "https://api.openai.com/v1/chat/completions";
export const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export function openAIHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export function buildChatCompletionBody(input: {
  messages: unknown[];
  stream?: boolean;
  temperature?: number;
  tools?: unknown[];
  toolChoice?: unknown;
}): Record<string, unknown> {
  return {
    model: DEFAULT_OPENAI_MODEL,
    messages: input.messages,
    ...(input.stream === undefined ? {} : { stream: input.stream }),
    ...(input.temperature === undefined ? {} : { temperature: input.temperature }),
    ...(input.tools === undefined ? {} : { tools: input.tools }),
    ...(input.toolChoice === undefined ? {} : { tool_choice: input.toolChoice }),
  };
}

function documentMimeType(filename: string, mimeType: string): string {
  const suppliedMime = mimeType.trim().toLowerCase();
  if (suppliedMime) return suppliedMime;

  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.endsWith(".pdf")) return "application/pdf";
  if (lowerFilename.endsWith(".jpg") || lowerFilename.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (lowerFilename.endsWith(".png")) return "image/png";
  return "";
}

export function buildDocumentInputPart(input: {
  filename: string;
  mimeType: string;
  base64: string;
}):
  | { type: "input_file"; filename: string; file_data: string }
  | { type: "input_image"; image_url: string; detail: "auto" } {
  const mimeType = documentMimeType(input.filename, input.mimeType);

  if (mimeType === "application/pdf") {
    return {
      type: "input_file",
      filename: input.filename,
      file_data: `data:application/pdf;base64,${input.base64}`,
    };
  }

  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return {
      type: "input_image",
      image_url: `data:image/jpeg;base64,${input.base64}`,
      detail: "auto",
    };
  }

  if (mimeType === "image/png") {
    return {
      type: "input_image",
      image_url: `data:image/png;base64,${input.base64}`,
      detail: "auto",
    };
  }

  throw new Error("Unsupported document type");
}

export function extractResponsesText(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    throw new Error("No text response from OpenAI");
  }

  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    throw new Error("No text response from OpenAI");
  }

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const candidate = part as { type?: unknown; text?: unknown };
      if (candidate.type === "output_text" && typeof candidate.text === "string") {
        return candidate.text;
      }
    }
  }

  throw new Error("No text response from OpenAI");
}

export async function requestChatCompletion(input: {
  apiKey: string;
  messages: unknown[];
  stream?: boolean;
  temperature?: number;
  tools?: unknown[];
  toolChoice?: unknown;
  fetchImpl?: typeof fetch;
}): Promise<Response> {
  const fetchImpl = input.fetchImpl ?? fetch;
  return fetchImpl(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: openAIHeaders(input.apiKey),
    body: JSON.stringify(
      buildChatCompletionBody({
        messages: input.messages,
        stream: input.stream,
        temperature: input.temperature,
        tools: input.tools,
        toolChoice: input.toolChoice,
      }),
    ),
  });
}
