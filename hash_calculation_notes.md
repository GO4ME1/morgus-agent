# Cloudflare Pages Hash Calculation

## Key Finding from Hunter Shaw's Article

According to the reverse-engineered API documentation:

> `hash` – A hash of the `(body + path)` from above using a hashing algorithm (I used MD5, Cloudflare uses blake3)

**CRITICAL**: The hash should be calculated from `body + path`, where:
- `body` = base64 encoded string of the file contents
- `path` = the pathname of the file

## Current Implementation Issue

Our current implementation calculates the hash from the **raw content bytes** before base64 encoding:

```typescript
// Current (WRONG):
const data = encoder.encode(file.content);
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
```

## Correct Implementation

The hash should be calculated from the **base64 encoded content + path**:

```typescript
// Correct approach:
const base64Content = btoa(String.fromCharCode(...data));
const hashInput = base64Content + file.path;
const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(hashInput));
```

Or potentially just from the base64 content alone (need to verify).

## Alternative from Cloudflare Community

From the Cloudflare community forum:
> "From the content and type hash. Essentially we take the content and add the file extension, hash that and get a unique key."

This suggests the hash might be: `content + file extension` (not the full path).
