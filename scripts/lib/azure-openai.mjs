/**
 * Azure OpenAI chat completions — credit-funded deployments API.
 * Prefers classic /openai/deployments/{id}/chat/completions over /openai/v1.
 */

function deploymentConfig(apiKey, endpoint, deployment, apiVersion) {
  return {
    url: `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`,
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: (messages, extra = {}) => ({ messages, ...extra }),
    mode: 'deployments',
  };
}

function openAiV1Config(apiKey, base, deployment) {
  return {
    url: `${base}/chat/completions`,
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: (messages, extra = {}) => ({ model: deployment, messages, ...extra }),
    mode: 'openai-v1',
  };
}

export function azureChatConfigs() {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, '');
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? '2024-10-21';
  if (!apiKey || !deployment) return [];

  const configs = [];
  if (endpoint) configs.push(deploymentConfig(apiKey, endpoint, deployment, apiVersion));
  if (process.env.AZURE_OPENAI_URL) {
    configs.push(openAiV1Config(apiKey, process.env.AZURE_OPENAI_URL.replace(/\/$/, ''), deployment));
  }
  return configs;
}

export async function azureChat(messages, extra = {}) {
  const configs = azureChatConfigs();
  if (!configs.length) throw new Error('Azure OpenAI not configured');

  let lastError = null;
  for (const cfg of configs) {
    try {
      const res = await fetch(cfg.url, {
        method: 'POST',
        headers: cfg.headers,
        body: JSON.stringify(cfg.body(messages, extra)),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`${cfg.mode} ${res.status}: ${text.slice(0, 300)}`);
      const data = JSON.parse(text);
      return data.choices?.[0]?.message?.content ?? '';
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError ?? new Error('Azure OpenAI request failed');
}