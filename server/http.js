// Shared wrapper for the /api functions (Vercel Web-standard handlers; also mounted by
// vite.config.js in dev). Accepts JSON POSTs only and turns thrown errors into { error }.
const MAX_BODY = 16 * 1024;

export function postHandler(run) {
  return async function POST(request) {
    const text = await request.text();
    if (text.length > MAX_BODY) return Response.json({ error: 'Request too large.' }, { status: 413 });
    let body;
    try { body = JSON.parse(text || '{}'); } catch { return Response.json({ error: 'Invalid JSON.' }, { status: 400 }); }
    try {
      return Response.json(await run(body));
    } catch (err) {
      console.error(`[api] ${new URL(request.url).pathname}:`, err.message);
      return Response.json({ error: err.message || 'Something went wrong.' }, { status: 502 });
    }
  };
}
