/**
 * Vercel Build Output API v3 assembler for TanStack Start (Node.js SSR).
 *
 * TanStack Start uses node:async_hooks / node:stream so edge runtime is
 * not viable. We use a Node.js serverless function instead.
 *
 * Output structure:
 *   .vercel/output/
 *     config.json            ← routing rules
 *     static/                ← dist/client/ (CDN-served assets)
 *     functions/ssr.func/    ← Node.js lambda
 *       .vc-config.json
 *       index.js             ← thin req→fetch adapter
 *       server.js            ← TanStack Start fetch handler
 *       assets/              ← dynamic imports referenced by server.js
 *
 * Docs: https://vercel.com/docs/build-output-api/v3
 */

import { execSync } from "node:child_process";
import { cpSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";

// ── 1. TanStack Start production build ────────────────────────────────────────
console.log("▶  Building TanStack Start…");
execSync("npm run build", { stdio: "inherit" });

// ── 2. Reset output directory ─────────────────────────────────────────────────
const out = ".vercel/output";
if (existsSync(out)) rmSync(out, { recursive: true });
mkdirSync(out, { recursive: true });

// ── 3. Routing config ─────────────────────────────────────────────────────────
writeFileSync(
  `${out}/config.json`,
  JSON.stringify({
    version: 3,
    routes: [
      // Immutable cache headers for hashed asset files
      {
        src: "^/assets/(.+)$",
        headers: { "cache-control": "public, max-age=31536000, immutable" },
        continue: true,
      },
      // Serve static files first; fall through for SSR
      { handle: "filesystem" },
      // Everything else → SSR function
      { src: "/(.*)", dest: "/ssr" },
    ],
  })
);

// ── 4. Static assets (client bundle) ─────────────────────────────────────────
console.log("▶  Copying client assets…");
mkdirSync(`${out}/static`, { recursive: true });
cpSync("dist/client", `${out}/static`, { recursive: true });

// ── 5. Node.js serverless function ───────────────────────────────────────────
const funcDir = `${out}/functions/ssr.func`;
mkdirSync(funcDir, { recursive: true });

// Runtime configuration (Node.js 20 lambda)
writeFileSync(
  `${funcDir}/.vc-config.json`,
  JSON.stringify({ runtime: "nodejs20.x", handler: "index.js", maxDuration: 30 })
);

// Copy the full dist/server/ tree (server.js + assets/*).
// Node.js handles the dynamic `import("./assets/…")` inside server.js natively
// as long as the assets directory is co-located — which it is after this copy.
cpSync("dist/server", funcDir, { recursive: true });

// ── 6. Adapter: IncomingMessage → Web Request → ServerResponse ───────────────
// TanStack Start exposes { default: { fetch(request, env, ctx) } }.
// Vercel Node.js lambdas receive a Node.js IncomingMessage + ServerResponse.
writeFileSync(
  `${funcDir}/index.js`,
  /* js */ `
import app from "./server.js";

export default async function handler(req, res) {
  // Build full URL from forwarded headers
  const proto =
    (req.headers["x-forwarded-proto"] ?? "https").split(",")[0].trim();
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
  const url = \`\${proto}://\${host}\${req.url}\`;

  // Collect body for non-idempotent methods
  let body = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (chunks.length > 0) body = Buffer.concat(chunks);
  }

  // Build Web-standard Request
  const webReq = new Request(url, {
    method: req.method,
    headers: new Headers(
      Object.entries(req.headers).flatMap(([k, v]) =>
        Array.isArray(v) ? v.map((val) => [k, val]) : [[k, String(v ?? "")]]
      )
    ),
    body,
  });

  try {
    const webRes = await app.fetch(webReq, {}, {});
    res.statusCode = webRes.status;
    webRes.headers.forEach((v, k) => res.setHeader(k, v));
    res.end(Buffer.from(await webRes.arrayBuffer()));
  } catch (err) {
    console.error("[SSR error]", err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
}
`.trimStart()
);

console.log("✅  .vercel/output/ is ready — deploy with `vercel --prebuilt`.");
