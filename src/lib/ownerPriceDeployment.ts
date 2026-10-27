import { createHash } from "node:crypto";

// This workflow is authorization for this exact feed, not for future supplier lists.
export const APPROVED_OWNER_FEED_SHA256 = "58b8ad117117f393752b42dae3503fc5d59eb59e4cbcab572e8c09ad71748321";
export function assertApprovedOwnerFeed(input: string) {
  const hash = createHash("sha256").update(input.replace(/\r\n/g, "\n")).digest("hex");
  if (hash !== APPROVED_OWNER_FEED_SHA256) throw new Error("Прайс изменился. Этот запуск разрешён только для согласованного прайса 04.10.2026.");
}

export const OWNER_PRICE_STEPS = [
  { script: "add-apple-watch-series12-space-gray-42-ml.ts", hashLabel: "Контрольный код добавления", noOp: "Вариант уже есть; база не изменена." },
  { script: "add-approved-apple-watch-series12-bundles.ts", hashLabel: "Контрольный код", noOp: "Все шесть точных вариантов уже есть с правильными артикулами. База не изменена." },
  { script: "split-iphone18-sim-variants.ts", hashLabel: "Контрольный код разделения", noOp: null },
  { script: "apply-owner-price-2026-10-04.ts", hashLabel: "Контрольный код плана", noOp: null },
] as const;

type CommandResult = { status: number | null; stdout: string; stderr?: string };
export type OwnerPriceRunner = (script: string, args: string[]) => CommandResult;

export function runApprovedOwnerPriceSteps(input: string, apply: boolean, run: OwnerPriceRunner) {
  assertApprovedOwnerFeed(input);
  function checked(script: string, args: string[]) {
    const result = run(script, args);
    if (result.status !== 0 || /^СТОП:/m.test(result.stdout)) {
      throw new Error(`Остановлено на ${script}. Последующие этапы не запускались. Проверьте вывод выше; завершённые этапы можно безопасно повторить.`);
    }
    return result.stdout;
  }
  for (const step of OWNER_PRICE_STEPS) {
    const stdout = checked(step.script, []);
    const codes = stdout.split(/\r?\n/).filter(line => line.startsWith(`${step.hashLabel}: `));
    if (!codes.length && step.noOp && stdout.split(/\r?\n/).includes(step.noOp)) continue;
    if (codes.length !== 1) throw new Error(`${step.script}: нет единственного контрольного кода; применение остановлено.`);
    const hash = codes[0].slice(step.hashLabel.length + 2);
    if (!/^[a-f0-9]{16}$/.test(hash)) throw new Error(`${step.script}: неверный контрольный код; применение остановлено.`);
    if (apply) checked(step.script, ["--apply", `--approve=${hash}`]);
  }
  if (apply) checked("apply-owner-price-2026-10-04.ts", ["--verify"]);
}
