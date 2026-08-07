import { describe, expect, it, vi } from "vitest";

import { analyzeDocument } from "../../supabase/functions/_shared/form-analysis";

const structuredAnalysis = {
  description: "Benefits renewal form",
  requiredFields: ["Name"],
  optionalFields: ["Email"],
  explanations: { Name: "Your legal name" },
  documentsNeeded: ["Photo ID"],
  deadlines: [],
};

function responsesPayload(text: string) {
  return {
    output: [
      {
        type: "message",
        content: [{ type: "output_text", text }],
      },
    ],
  };
}

describe("form analysis", () => {
  it("sends a PDF to Responses as a file input", async () => {
    let captured: Request | undefined;
    const fetchImpl: typeof fetch = async (input, init) => {
      captured = new Request(input, init);
      return Response.json(responsesPayload(JSON.stringify(structuredAnalysis)));
    };

    await analyzeDocument({
      apiKey: "server-key",
      filename: "renewal.pdf",
      mimeType: "application/pdf",
      base64: "AAAA",
      fetchImpl,
    });

    expect(captured?.url).toBe("https://api.openai.com/v1/responses");
    const body = await captured?.json();
    expect(body.input[1].content[1]).toEqual({
      type: "input_file",
      filename: "renewal.pdf",
      file_data: "data:application/pdf;base64,AAAA",
    });
  });

  it.each([
    ["scan.jpg", "image/jpeg", "data:image/jpeg;base64,BBBB"],
    ["scan.png", "image/png", "data:image/png;base64,BBBB"],
  ])("sends %s to Responses as an image input", async (filename, mimeType, imageUrl) => {
    let captured: Request | undefined;
    const fetchImpl: typeof fetch = async (input, init) => {
      captured = new Request(input, init);
      return Response.json(responsesPayload(JSON.stringify(structuredAnalysis)));
    };

    await analyzeDocument({
      apiKey: "server-key",
      filename,
      mimeType,
      base64: "BBBB",
      fetchImpl,
    });

    const body = await captured?.json();
    expect(body.input[1].content[1]).toEqual({
      type: "input_image",
      image_url: imageUrl,
      detail: "auto",
    });
  });

  it("rejects unsupported files before making an upstream request", async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      analyzeDocument({
        apiKey: "server-key",
        filename: "notes.txt",
        mimeType: "text/plain",
        base64: "CCCC",
        fetchImpl,
      }),
    ).rejects.toThrow("Unsupported document type");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns the same structured analysis object from Responses output text", async () => {
    const fetchImpl: typeof fetch = async () =>
      Response.json(responsesPayload(JSON.stringify(structuredAnalysis)));

    await expect(
      analyzeDocument({
        apiKey: "server-key",
        filename: "renewal.pdf",
        mimeType: "application/pdf",
        base64: "AAAA",
        fetchImpl,
      }),
    ).resolves.toEqual(structuredAnalysis);
  });

  it("falls back to the existing structured shape when model JSON is malformed", async () => {
    const rawAnalysis = "The document appears to be a renewal form.";
    const fetchImpl: typeof fetch = async () =>
      Response.json(responsesPayload(rawAnalysis));

    await expect(
      analyzeDocument({
        apiKey: "server-key",
        filename: "renewal.pdf",
        mimeType: "application/pdf",
        base64: "AAAA",
        fetchImpl,
      }),
    ).resolves.toEqual({
      description: "Form analysis",
      rawAnalysis,
      requiredFields: [],
      optionalFields: [],
      explanations: {},
      documentsNeeded: [],
      deadlines: [],
    });
  });
});
