/**
 * Gemini model resolution — no stale hardcoded defaults.
 * Models are validated against the live API list for the configured key.
 */

const TEXT_BLOCKLIST = /(?:tts|lyria|image|robotics|deep-research|antigravity|nano-banana|computer-use)/i;

/** Eval baselines — VERTEX_BASELINE_MODEL only (never voice VERTEX_TEXT_MODEL / VERTEX_REALTIME_MODEL). */
export function baselineModelId() {
  return process.env.VERTEX_BASELINE_MODEL ?? null;
}

export function judgeModelId() {
  return process.env.VERTEX_JUDGE_MODEL ?? null;
}

export function assertTextModel(modelId, role = 'vertex') {
  if (!modelId) {
    throw new Error(
      `${role} model unset — set VERTEX_BASELINE_MODEL or VERTEX_TEXT_MODEL in .env (run: pnpm gemini:models)`,
    );
  }
  if (TEXT_BLOCKLIST.test(modelId)) {
    throw new Error(
      `${modelId} is not a text baseline model (TTS/audio/image). Pick a text model via pnpm gemini:models`,
    );
  }
  return modelId;
}

export async function listGenerateContentModels(apiKey) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  if (!res.ok) throw new Error(`ListModels ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => ({
      id: m.name.replace('models/', ''),
      displayName: m.displayName,
      textSafe: !TEXT_BLOCKLIST.test(m.name),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function generateContent(prompt, { model, apiKey, extra = {} } = {}) {
  const key = apiKey ?? process.env.GEMINI_API_KEY;
  const modelId = assertTextModel(model ?? baselineModelId(), 'vertex');
  if (!key) throw new Error('GEMINI_API_KEY not set');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048, ...extra },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${modelId} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return {
    modelId,
    output: data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '',
  };
}

export function baselineSourceLabel(modelId) {
  const slug = modelId.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  return `vertex-${slug}`;
}