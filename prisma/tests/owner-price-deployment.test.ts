import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { assertApprovedOwnerFeed, OWNER_PRICE_STEPS, runApprovedOwnerPriceSteps, type OwnerPriceRunner } from "../../src/lib/ownerPriceDeployment";
import { assertWatchBundleSnapshot } from "../../src/lib/ownerPriceUpdate";

const input = readFileSync("prisma/data/owner-price-2026-10-04.txt", "utf8");
const hash = "0123456789abcdef";
const plan = (script: string) => `${OWNER_PRICE_STEPS.find(step => step.script === script)!.hashLabel}: ${hash}\n`;

test("only the approved feed is accepted, with platform-independent newlines", () => {
  assert.doesNotThrow(() => assertApprovedOwnerFeed(input.replace(/\r\n/g, "\n")));
  assert.doesNotThrow(() => assertApprovedOwnerFeed(input.replace(/\r?\n/g, "\r\n")));
  let calls = 0;
  assert.throws(() => runApprovedOwnerPriceSteps(input.replace("68.400", "60.000"), true, () => { calls++; return { status: 0, stdout: "" }; }), /Прайс изменился/);
  assert.equal(calls, 0);
});

test("dry-run never invokes writes, even when it finds preparation plans", () => {
  const calls: string[][] = [];
  runApprovedOwnerPriceSteps(input, false, (script, args) => {
    calls.push([script, ...args]); return { status: 0, stdout: plan(script) };
  });
  assert.deepEqual(calls, OWNER_PRICE_STEPS.map(step => [step.script]));
});

test("apply prepares approved watches and SIM before pricing, then verifies the database", () => {
  const calls: string[][] = [];
  runApprovedOwnerPriceSteps(input, true, (script, args) => {
    calls.push([script, ...args]);
    return { status: 0, stdout: args.length ? "OK" : plan(script) };
  });
  assert.deepEqual(calls, [
    ...OWNER_PRICE_STEPS.flatMap(step => [[step.script], [step.script, "--apply", `--approve=${hash}`]]),
    ["apply-owner-price-2026-10-04.ts", "--verify"],
  ]);
  assert.equal(calls.flat().includes("--allow-partial"), false);
});

test("known watch no-ops can be safely repeated without a new write", () => {
  const calls: string[][] = [];
  runApprovedOwnerPriceSteps(input, true, (script, args) => {
    calls.push([script, ...args]);
    const step = OWNER_PRICE_STEPS.find(item => item.script === script)!;
    return { status: 0, stdout: !args.length ? step.noOp ?? plan(script) : "OK" };
  });
  assert.equal(calls.length, 7);
  assert.equal(calls.filter(call => call[0].startsWith("add-") && call.length > 1).length, 0);
});

for (const failure of [
  { status: 1, stdout: "database failure" },
  { status: null, stdout: "" },
  { status: 0, stdout: `СТОП: общий вариант уже использован\nКонтрольный код разделения: ${hash}` },
]) test(`a failed stage stops all later stages (${JSON.stringify(failure)})`, () => {
  const calls: string[] = [];
  const run: OwnerPriceRunner = (script, args) => {
    calls.push(script);
    if (script === "split-iphone18-sim-variants.ts") return failure;
    return { status: 0, stdout: args.length ? "OK" : plan(script) };
  };
  assert.throws(() => runApprovedOwnerPriceSteps(input, true, run), /Остановлено/);
  assert.equal(calls.includes("apply-owner-price-2026-10-04.ts"), false);
});

test("missing, duplicated or malformed approval codes cannot start a write", () => {
  for (const stdout of ["OK", "Контрольный код добавления: wrong", `Контрольный код добавления: ${hash}\nКонтрольный код добавления: ${hash}`]) {
    let calls = 0;
    assert.throws(() => runApprovedOwnerPriceSteps(input, true, () => { calls++; return { status: 0, stdout }; }), /контрольн/);
    assert.equal(calls, 1);
  }
});

test("a failed final price verification is not reported as success", () => {
  assert.throws(() => runApprovedOwnerPriceSteps(input, true, (script, args) => ({
    status: args.includes("--verify") ? 1 : 0,
    stdout: args.length ? "OK" : plan(script),
  })), /Остановлено/);
});

test("new approved watch options pass the transaction guard; concurrent changes fail it", () => {
  const newOption = { sku: "MJEN4", existingId: null, currentSku: null };
  assert.doesNotThrow(() => assertWatchBundleSnapshot([], newOption));
  assert.throws(() => assertWatchBundleSnapshot([{ id: "new", sku: null }], newOption), /изменилась/);
  const existing = { sku: "MJEU4", existingId: "old", currentSku: null };
  assert.doesNotThrow(() => assertWatchBundleSnapshot([{ id: "old", sku: null }], existing));
  assert.throws(() => assertWatchBundleSnapshot([], existing), /изменилась/);
  assert.throws(() => assertWatchBundleSnapshot([{ id: "old", sku: "other" }], existing), /изменилась/);
  assert.throws(() => assertWatchBundleSnapshot([{ id: "old", sku: null }, { id: "duplicate", sku: null }], existing), /изменилась/);
});
