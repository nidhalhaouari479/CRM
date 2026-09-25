import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as zod from "zod";

test("Les doublons sont expliqués et les créations valides aboutissent", async () => {
  let databaseError = null;
  let inserts = 0;
  let refreshed = false;
  const database = {
    from: () => ({
      insert: () => {
        inserts++;
        return {
          select: () => ({
            single: async () => ({
              data: { id: "exemple" },
              error: databaseError,
            }),
          }),
        };
      },
    }),
  };
  const context = {
    exports: {},
    console: { error() {} },
    require(name) {
      if (name === "zod") return zod;
      if (name === "next/cache")
        return {
          revalidatePath() {
            refreshed = true;
          },
        };
      if (name === "next/navigation")
        return {
          redirect(path) {
            throw new Error(`Redirection : ${path}`);
          },
        };
      if (name === "@/lib/auth")
        return { requireProfile: async () => ({ id: "responsable" }) };
      if (name === "@/lib/supabase/server")
        return { createClient: async () => database };
      if (name === "@/lib/supabase/admin") return {};
      throw new Error(name);
    },
  };
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync("src/app/(dashboard)/actions.ts", "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText,
    context,
  );

  const form = (phone = "+216 20 123 456") => {
    const data = new FormData();
    for (const [key, value] of Object.entries({
      company_name: "Agence exemple",
      phone,
      service_type: "CRM",
    }))
      data.set(key, value);
    return data;
  };
  for (const [index, expected] of [
    ["clients_phone_unique", "téléphone"],
    ["clients_email_unique", "courriel"],
  ]) {
    databaseError = {
      code: "23505",
      message: `duplicate key violates unique constraint "${index}"`,
    };
    const result = await context.exports.createClient({ error: "" }, form());
    assert.ok(result.error.includes(expected));
  }
  const before = inserts;
  assert.ok(
    (await context.exports.createClient({ error: "" }, form("----"))).error,
  );
  assert.equal(inserts, before);
  databaseError = null;
  await assert.rejects(
    context.exports.createClient({ error: "" }, form()),
    /Redirection : \/clients\/exemple/,
  );
  assert.equal(refreshed, true);
});
