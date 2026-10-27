import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createRequire } from "node:module";
import { test } from "node:test";
import config from "../../next.config";

const require = createRequire(import.meta.url);
const { pipeToNodeResponse } = require("next/dist/server/pipe-readable") as {
  pipeToNodeResponse: (stream: ReadableStream<Uint8Array>, response: ServerResponse) => Promise<void>;
};
const compression = require("next/dist/compiled/compression") as () =>
  (request: IncomingMessage, response: ServerResponse, next: () => void) => void;

test("large Next HTML/RSC streams finish for gzip-capable clients and after an aborted request", { timeout: 15000 }, async () => {
  const body = Buffer.from(`<html>${Array.from({ length: 4096 }, (_, i) => `<script>/* component ${i} ${"x".repeat(80)} */</script>`).join("")}</html>`);
  const compress = config.compress === false ? null : compression();
  const server = createServer((req, res) => {
    compress?.(req, res, () => {});
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let start = 0; start < body.length; start += 32768) controller.enqueue(body.subarray(start, start + 32768));
        controller.close();
      },
    });
    void pipeToNodeResponse(stream, res).catch(() => res.destroy());
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const url = `http://127.0.0.1:${address.port}/product/streaming-regression`;
  try {
    const abort = new AbortController();
    const interrupted = await fetch(url, { headers: { "Accept-Encoding": "gzip, deflate, br" }, signal: AbortSignal.any([abort.signal, AbortSignal.timeout(4000)]) });
    abort.abort();
    await interrupted.body?.cancel().catch(() => {});
    for (const encoding of ["gzip, deflate, br", "gzip", "identity"]) {
      const response = await fetch(url, { headers: { "Accept-Encoding": encoding }, signal: AbortSignal.timeout(4000) });
      assert.equal(response.status, 200);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), body);
    }
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
