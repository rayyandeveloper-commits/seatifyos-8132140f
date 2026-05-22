/**
 * Vercel Build Output API v3 assembler for TanStack Start (Node.js SSR).
 *
 * The Vite SSR build externalises every npm package, so the dist/server
 * assets reference bare specifiers like "h3-v2", "@tanstack/router-core",
 * "react-dom/server", etc.  Those packages aren't in the lambda directory,
 * so we re-bundle the server with esbuild (platform: node) which inlines
 * all npm deps and leaves only Node.js built-ins (node:*) as externals —
 * the Node.js 20 runtime provides those automatically.
 *
 * Output structure:
 *   .vercel/output/
 *     config.json
 *     static/            ← dist/client/ (CDN)
 *     functions/ssr.func/
 *       .vc-config.json  ← { runtime: "nodejs20.x" }
 *       index.js         ← fully self-contained bundle (adapter + SSR)
 */

import { execSync } from "node:child_process";
import { cpSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { build } from "../node_modules/esbuild/lib/main.js";

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
      {
        src: "^/assets/(.+)$",
        headers: { "cache-control": "public, max-age=31536000, immutable" },
        continue: true,
      },
      { handle: "filesystem" },
      { src: "/(.*)", dest: "/ssr" },
    ],
  })
);

// ── 4. Static assets ──────────────────────────────────────────────────────────
console.log("▶  Copying client assets…");
mkdirSync(`${out}/static`, { recursive: true });
cpSync("dist/client", `${out}/static`, { recursive: true });

// ── 5. Node.js serverless function ───────────────────────────────────────────
const funcDir = `${out}/functions/ssr.func`;
mkdirSync(funcDir, { recursive: true });

writeFileSync(
  `${funcDir}/.vc-config.json`,
  JSON.stringify({ runtime: "nodejs20.x", handler: "index.js", maxDuration: 30 })
);

// Override root "type":"module" so Node.js treats the CJS bundle as CommonJS
writeFileSync(`${funcDir}/package.json`, JSON.stringify({ type: "commonjs" }));

// Temporary adapter entry — esbuild resolves its `import app from …`
// relative to this file's location (dist/), so the path works.
const adapterSrc = "dist/_vercel_adapter.mjs";
writeFileSync(
  adapterSrc,
  /* js */ `
import app from "./server/server.js";

export default async function handler(req, res) {
  const proto =
    (req.headers["x-forwarded-proto"] ?? "https").split(",")[0].trim();
  const host =
    req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
  const url = \`\${proto}://\${host}\${req.url}\`;

  let body;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (chunks.length > 0) body = Buffer.concat(chunks);
  }

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

// ── 6. Bundle: inline all npm deps, externalize node:* built-ins ─────────────
console.log("▶  Bundling server (platform: node)…");
await build({
  entryPoints: [adapterSrc],
  bundle: true,
  format: "cjs",      // CJS so that react-dom's internal require("util") works
  platform: "node",   // marks node:* built-ins as external
  target: "node20",
  outfile: `${funcDir}/index.js`,
  logLevel: "warning",
});

// Clean up temp entry
rmSync(adapterSrc);

console.log("✅  .vercel/output/ ready — bundle size:");
execSync(`du -sh ${funcDir}/index.js`, { stdio: "inherit" });
