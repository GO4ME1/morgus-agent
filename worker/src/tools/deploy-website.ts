/**
 * Deploy Website Tool - Direct Cloudflare Pages deployment
 * Based on: https://hunterashaw.com/reverse-engineering-the-cloudflare-pages-deployment-api/
 */

// Using Web Crypto API (built into Cloudflare Workers)

export interface DeploymentFile {
  path: string;
  content: string;
  contentType?: string;
}

export async function deployToCloudflarePages(
  projectName: string,
  files: DeploymentFile[],
  apiToken: string,
  accountId: string
): Promise<string> {
  if (!apiToken || !accountId) {
    throw new Error('Cloudflare credentials not configured');
  }

  console.log('[DEPLOY] Starting deployment for project:', projectName);
  console.log('[DEPLOY] Files to deploy:', files.length);

  // Step 1: Create project if it doesn't exist
  try {
    const projectResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!projectResponse.ok && projectResponse.status === 404) {
      console.log('[DEPLOY] Project not found, creating new project');
      const createResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: projectName,
            production_branch: 'main',
          }),
        }
      );

      if (!createResponse.ok) {
        const error = await createResponse.text();
        console.error('[DEPLOY] Failed to create project:', error);
        throw new Error(`Failed to create project: ${error}`);
      }

      console.log('[DEPLOY] Project created successfully');
    }
  } catch (error: any) {
    console.error('[DEPLOY] Error checking/creating project:', error.message);
    throw error;
  }

  // Step 2: Get upload JWT token
  console.log('[DEPLOY] Getting upload token...');
  const tokenResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/upload-token`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    }
  );

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get upload token: ${error}`);
  }

  const tokenData: any = await tokenResponse.json();
  const uploadToken = tokenData.result.jwt;
  console.log('[DEPLOY] Upload token obtained');

  // Step 3: Prepare files with hashes
  const fileData: Array<{
    path: string;
    hash: string;
    content: string;
    contentType: string;
    length: number;
  }> = [];

  for (const file of files) {
    // Determine content type
    let contentType = file.contentType || 'text/html';
    if (file.path.endsWith('.css')) contentType = 'text/css';
    if (file.path.endsWith('.js')) contentType = 'application/javascript';
    if (file.path.endsWith('.json')) contentType = 'application/json';

    // Encode content to bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(file.content);
    
    // Base64 encode content for upload
    const base64Content = btoa(String.fromCharCode(...data));
    
    // Calculate hash from (base64 content + path) as per Cloudflare Pages API
    // Reference: https://hunterashaw.com/reverse-engineering-the-cloudflare-pages-deployment-api/
    const filePath = file.path.startsWith('/') ? file.path : `/${file.path}`;
    const hashInput = base64Content + filePath;
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(hashInput));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    fileData.push({
      path: filePath,
      hash,
      content: base64Content,
      contentType,
      length: file.content.length,
    });
  }

  console.log('[DEPLOY] Prepared', fileData.length, 'files for upload');

  // Step 4: Upload files in batches (max 50MB per batch)
  const uploadBatch = fileData.map(f => ({
    key: f.hash,
    value: f.content,
    metadata: { contentType: f.contentType },
    base64: true,
  }));

  console.log('[DEPLOY] Uploading files...');
  const uploadResponse = await fetch(
    'https://api.cloudflare.com/client/v4/pages/assets/upload',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${uploadToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uploadBatch),
    }
  );

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    console.error('[DEPLOY] File upload failed:', error);
    console.error('[DEPLOY] Upload status:', uploadResponse.status);
    console.error('[DEPLOY] Upload headers:', JSON.stringify(Object.fromEntries(uploadResponse.headers)));
    throw new Error(`File upload failed (${uploadResponse.status}): ${error}`);
  }

  const uploadResult = await uploadResponse.json();
  console.log('[DEPLOY] Upload response:', JSON.stringify(uploadResult, null, 2));

  console.log('[DEPLOY] Files uploaded successfully');

  // Step 5: Register file hashes
  const hashes = fileData.map(f => f.hash);
  console.log('[DEPLOY] Registering', hashes.length, 'file hashes...');
  
  const hashResponse = await fetch(
    'https://api.cloudflare.com/client/v4/pages/assets/upsert-hashes',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${uploadToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hashes }),
    }
  );

  if (!hashResponse.ok) {
    const error = await hashResponse.text();
    console.error('[DEPLOY] Hash registration failed:', error);
    console.error('[DEPLOY] Hash status:', hashResponse.status);
    throw new Error(`Hash registration failed (${hashResponse.status}): ${error}`);
  }

  const hashResult = await hashResponse.json();
  console.log('[DEPLOY] Hash response:', JSON.stringify(hashResult, null, 2));

  console.log('[DEPLOY] Hashes registered successfully');

  // Step 6: Create manifest mapping paths to hashes
  const manifest: Record<string, string> = {};
  for (const file of fileData) {
    manifest[file.path] = file.hash;
  }

  console.log('[DEPLOY] Creating deployment with manifest...');

  // Step 7: Create deployment with multipart form data
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const parts: string[] = [];

  parts.push(`--${boundary}\r\n`);
  parts.push(`Content-Disposition: form-data; name="manifest"\r\n\r\n`);
  parts.push(`${JSON.stringify(manifest)}\r\n`);
  parts.push(`--${boundary}--\r\n`);

  const body = parts.join('');

  const deployResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    }
  );

  if (!deployResponse.ok) {
    const error = await deployResponse.text();
    console.error('[DEPLOY] Deployment creation failed:', error);
    throw new Error(`Deployment creation failed: ${error}`);
  }

  const result: any = await deployResponse.json();
  console.log('[DEPLOY] Deployment created successfully!');
  console.log('[DEPLOY] API Response:', JSON.stringify(result, null, 2));

  // Extract URLs
  const deploymentUrl = result.result?.url;
  const productionUrl = `https://${projectName}.pages.dev`;
  
  console.log('[DEPLOY] Deployment URL:', deploymentUrl);
  console.log('[DEPLOY] Production URL:', productionUrl);
  
  // Return the production URL (main domain)
  return productionUrl;
}
