import { describe, expect, it } from "vitest";

import {
  buildDocumentInputPart,
  extractResponsesText,
  requestChatCompletion,
} from "../../supabase/functions/_shared/openai-provider";

describe("OpenAI provider adapter", () => {
  it("sends a streaming chat request directly to OpenAI", async () => {
    let captured: Request | undefined;
    const fetchImpl: typeof fetch = async (input, init) => {
      captured = new Request(input, init);
      return new Response("data: done", { status: 200 });
    };

    await requestChatCompletion({
      apiKey: "server-key",
      messages: [{ role: "user", content: "hi" }],
      stream: true,
      fetchImpl,
    });

    expect(captured?.url).toBe("https://api.openai.com/v1/chat/completions");
    expect(captured?.headers.get("Authorization")).toBe("Bearer server-key");
    expect(await captured?.json()).toEqual({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "hi" }],
      stream: true,
    });
  });

  it("forwards tool definitions and the selected tool without changing their schema", async () => {
    const tools = [
      {
        type: "function",
        function: {
          name: "moderate_message",
          parameters: {
            type: "object",
            properties: { safe: { type: "boolean" } },
          },
        },
      },
    ];
    const toolChoice = {
      type: "function",
      function: { name: "moderate_message" },
    };
    let captured: Request | undefined;
    const fetchImpl: typeof fetch = async (input, init) => {
      captured = new Request(input, init);
      return Response.json({ choices: [] });
    };

    await requestChatCompletion({
      apiKey: "server-key",
      messages: [{ role: "user", content: "check this" }],
      tools,
      toolChoice,
      fetchImpl,
    });

    expect(await captured?.json()).toEqual({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "check this" }],
      tools,
      tool_choice: toolChoice,
    });
  });

  it("preserves an explicit temperature setting", async () => {
    let captured: Request | undefined;
    const fetchImpl: typeof fetch = async (input, init) => {
      captured = new Request(input, init);
      return Response.json({ choices: [] });
    };

    await requestChatCompletion({
      apiKey: "server-key",
      messages: [{ role: "user", content: "navigate" }],
      temperature: 0.7,
      fetchImpl,
    });

    expect(await captured?.json()).toEqual({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "navigate" }],
      temperature: 0.7,
    });
  });

  it("builds a PDF as Responses file input", () => {
    expect(
      buildDocumentInputPart({
        filename: "benefits.pdf",
        mimeType: "application/pdf",
        base64: "AAAA",
      }),
    ).toEqual({
      type: "input_file",
      filename: "benefits.pdf",
      file_data: "data:application/pdf;base64,AAAA",
    });
  });

  it("builds a JPEG as Responses image input", () => {
    expect(
      buildDocumentInputPart({
        filename: "form.jpg",
        mimeType: "image/jpeg",
        base64: "BBBB",
      }),
    ).toEqual({
      type: "input_image",
      image_url: "data:image/jpeg;base64,BBBB",
      detail: "auto",
    });
  });

  it("rejects document types outside the existing PDF and image contract", () => {
    expect(() =>
      buildDocumentInputPart({
        filename: "notes.txt",
        mimeType: "text/plain",
        base64: "CCCC",
      }),
    ).toThrow("Unsupported document type");
  });

  it.each([
    {
      filename: "scan.png",
      expected: {
        type: "input_image",
        image_url: "data:image/png;base64,DDDD",
        detail: "auto",
      },
    },
    {
      filename: "scan.jpeg",
      expected: {
        type: "input_image",
        image_url: "data:image/jpeg;base64,DDDD",
        detail: "auto",
      },
    },
    {
      filename: "benefits.pdf",
      expected: {
        type: "input_file",
        filename: "benefits.pdf",
        file_data: "data:application/pdf;base64,DDDD",
      },
    },
  ])("infers the supported MIME for $filename when the browser omits it", ({ filename, expected }) => {
    expect(
      buildDocumentInputPart({ filename, mimeType: "", base64: "DDDD" }),
    ).toEqual(expected);
  });

  it("extracts output text from a raw Responses API payload", () => {
    const payload = {
      output: [
        {
          type: "message",
          content: [
            { type: "output_text", text: '{"description":"Form"}' },
          ],
        },
      ],
    };

    expect(extractResponsesText(payload)).toBe('{"description":"Form"}');
  });

  it("rejects a Responses payload without output text", () => {
    expect(() => extractResponsesText({ output: [] })).toThrow(
      "No text response from OpenAI",
    );
  });
});
