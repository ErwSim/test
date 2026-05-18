import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildUserMessage } from "./prompts";
import type { GenerateInput } from "./schemas";

const apiKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

let cached: Anthropic | null = null;
function client(): Anthropic {
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY manquante (cf. .env.example)");
  }
  if (!cached) cached = new Anthropic({ apiKey });
  return cached;
}

export interface GenerateResult {
  raw: string;
  parsed: {
    results: Array<{
      format: string;
      title: string;
      body: string;
      hashtags: string[];
    }>;
    legal_checks: {
      dpe_mentioned: boolean;
      ges_mentioned: boolean;
      copro_disclosed: boolean;
      honoraires_disclosed: boolean;
      f_or_g_warning: boolean;
    };
  };
  usage: { input_tokens: number; output_tokens: number; cache_read?: number };
}

export async function generateAnnonces(input: GenerateInput): Promise<GenerateResult> {
  const c = client();

  // Le system prompt est marqué cache_control: permet ~90% de réduction sur les tokens
  // d'input à partir du 2e appel dans une fenêtre de 5min.
  const response = await c.messages.create({
    model,
    max_tokens: 2500,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: buildUserMessage(input) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Réponse Claude vide");
  }

  const raw = textBlock.text.trim();
  const jsonStr = extractJson(raw);
  let parsed: GenerateResult["parsed"];
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("Réponse Claude non-JSON : " + raw.slice(0, 200));
  }

  return {
    raw,
    parsed,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cache_read: response.usage.cache_read_input_tokens ?? undefined,
    },
  };
}

function extractJson(s: string): string {
  // Le system prompt interdit le markdown, mais on reste défensif.
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  return s;
}
