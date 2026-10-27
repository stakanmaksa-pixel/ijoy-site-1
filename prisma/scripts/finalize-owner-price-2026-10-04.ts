/** Complete the already approved October feed; original per-step guards and backups remain active. */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { runApprovedOwnerPriceSteps } from "../../src/lib/ownerPriceDeployment";

function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== "--apply") || args.length > 1) throw new Error("Разрешён только --apply. Без него — проверка без записи.");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL не задан; база не изменена.");
  const input = readFileSync(path.resolve("prisma/data/owner-price-2026-10-04.txt"), "utf8");
  const apply = args.includes("--apply");
  console.log(apply ? "Применение согласованного прайса 04.10.2026 с резервными копиями. При любой ошибке — остановка." : "DRY RUN: только проверка. Отсутствующие варианты будут подготовлены лишь при --apply; поэтому промежуточное сопоставление цен может быть неполным.");
  runApprovedOwnerPriceSteps(input, apply, (script, flags) => {
    console.log(`\nЭТАП ${script}${flags.length ? ` ${flags.join(" ")}` : " — проверка"}`);
    const result = spawnSync(process.execPath, ["--import", "tsx", path.resolve("prisma/scripts", script), ...flags], {
      cwd: process.cwd(), env: process.env, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: 180_000,
    });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.error) throw result.error;
    return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
  });
  console.log(apply ? "ГОТОВО: подготовлены согласованные варианты S12, разделены SIM iPhone 18, цены и наличие записаны и повторно проверены." : "ПРОВЕРКА ЗАВЕРШЕНА: записей в базу не было. Для завершения — --apply.");
}

main();
