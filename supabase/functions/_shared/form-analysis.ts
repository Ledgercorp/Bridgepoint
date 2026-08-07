import {
  DEFAULT_OPENAI_MODEL,
  OPENAI_RESPONSES_URL,
  buildDocumentInputPart,
  extractResponsesText,
  openAIHeaders,
} from "./openai-provider.ts";

const FORM_SYSTEM_INSTRUCTION =
  "You are a helpful assistant that analyzes forms and documents. Provide clear, structured analysis in plain language that anyone can understand.";

const FORM_ANALYSIS_PROMPT = `Please analyze this form and provide:
1. A brief description of what this form is for
2. Which fields are required vs optional
3. Plain language explanations of any complex questions
4. A list of documents you'll likely need to complete this form
5. Any important deadlines or time-sensitive information

Format your response as JSON with these keys: description, requiredFields (array), optionalFields (array), explanations (object with field names as keys), documentsNeeded (array), deadlines (array)`;

export class FormAnalysisServiceError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`AI API error: ${status}`);
    this.name = "FormAnalysisServiceError";
    this.status = status;
  }
}

function parseAnalysis(aiResponse: string): unknown {
  try {
    const jsonMatch =
      aiResponse.match(/```json\n([\s\S]*?)\n```/) ||
      aiResponse.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }

    return JSON.parse(aiResponse);
  } catch {
    return {
      description: "Form analysis",
      rawAnalysis: aiResponse,
      requiredFields: [],
      optionalFields: [],
      explanations: {},
      documentsNeeded: [],
      deadlines: [],
    };
  }
}

export async function analyzeDocument(input: {
  apiKey: string;
  filename: string;
  mimeType: string;
  base64: string;
  fetchImpl?: typeof fetch;
}): Promise<unknown> {
  const documentPart = buildDocumentInputPart({
    filename: input.filename,
    mimeType: input.mimeType,
    base64: input.base64,
  });
  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: openAIHeaders(input.apiKey),
    body: JSON.stringify({
      model: DEFAULT_OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: FORM_SYSTEM_INSTRUCTION }],
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: FORM_ANALYSIS_PROMPT },
            documentPart,
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    await response.text();
    throw new FormAnalysisServiceError(response.status);
  }

  return parseAnalysis(extractResponsesText(await response.json()));
}
