// @ts-ignore – dist/ is produced by `npm run build` before this file is bundled
import app from "../dist/server/server.js";

export default function handler(req: Request): Promise<Response> {
  return app.fetch(req, {}, {});
}
