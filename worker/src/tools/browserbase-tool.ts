/**
 * BrowserBase integration for full browser automation
 */

export interface BrowserBaseSession {
  id: string;
  status: string;
  debuggerUrl?: string;
}

export async function createBrowserSession(
  apiKey: string,
  projectId: string
): Promise<BrowserBaseSession> {
  const response = await fetch('https://api.browserbase.com/v1/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-BB-API-Key': apiKey,
    },
    body: JSON.stringify({
      projectId,
    }),
  });

  if (!response.ok) {
    throw new Error(`BrowserBase API error: ${response.statusText}`);
  }

  return await response.json();
}

export async function executeBrowserAction(
  sessionId: string,
  action: string,
  params: Record<string, any>,
  apiKey: string
): Promise<any> {
  const response = await fetch(`https://api.browserbase.com/v1/sessions/${sessionId}/actions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-BB-API-Key': apiKey,
    },
    body: JSON.stringify({
      action,
      ...params,
    }),
  });

  if (!response.ok) {
    throw new Error(`BrowserBase action error: ${response.statusText}`);
  }

  return await response.json();
}

export async function closeBrowserSession(
  sessionId: string,
  apiKey: string
): Promise<void> {
  await fetch(`https://api.browserbase.com/v1/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      'X-BB-API-Key': apiKey,
    },
  });
}
