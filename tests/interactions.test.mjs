import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as zod from "zod";

test("Les cinq types enregistrent uniquement leurs champs et valident le score", async () => {
  const saved = [];
  let databaseError = null;
  const context = {
    exports: {},
    console: { error() {} },
    require(name) {
      if (name === "zod") return zod;
      if (name === "next/cache") return { revalidatePath() {} };
      if (name === "next/navigation") return {};
      if (name === "@/lib/auth")
        return { requireProfile: async () => ({ id: "employee" }) };
      if (name === "@/lib/supabase/admin") return {};
      if (name === "@/lib/supabase/server")
        return {
          createClient: async () => ({
            from: () => ({
              insert: async (values) => {
                if (databaseError) return { error: databaseError };
                assert.equal(values.employee_id, "employee");
                saved.push(values);
                return { error: null };
              },
            }),
          }),
        };
      throw new Error(name);
    },
  };
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync("src/app/(dashboard)/actions.ts", "utf8"),
      { compilerOptions: { module: ts.ModuleKind.CommonJS } },
    ).outputText,
    context,
  );
  const initialState = { error: "", success: false };
  const submit = (data) =>
    context.exports.createInteraction(initialState, data);
  const create = async (data) => {
    const state = await submit(data);
    if (state.error) throw new Error(state.error);
    assert.equal(state.success, true);
  };
  function form(type, overrides = {}) {
    const data = new FormData();
    for (const [key, value] of Object.entries({
      client_id: "00000000-0000-4000-8000-000000000001",
      type,
      date: "2026-09-23T14:30",
      duration_minutes: "25",
      objective: "Présenter le devis",
      result: "Client intéressé",
      conclusion: "Attente de confirmation",
      interest_score: "8",
      next_action: "",
      ...overrides,
    }))
      if (value !== null) data.set(key, value);
    return data;
  }
  for (const type of [
    "Message",
    "Email",
    "Telephone",
    "Meeting en ligne",
    "Meeting face a face",
  ]) {
    const written = type === "Message" || type === "Email";
    await create(
      form(
        type,
        written
          ? { date: null, duration_minutes: "999" }
          : { conclusion: null },
      ),
    );
    const row = saved.at(-1);
    assert.equal(row.type, type);
    assert.equal(row.duration_minutes, written ? null : 25);
    assert.equal(row.conclusion, written ? "Attente de confirmation" : "");
    assert.equal(row.next_action, null);
    assert.equal(row.interest_score, 8);
    assert.ok(Number.isFinite(Date.parse(row.date)));
  }
  for (const interest_score of ["-1", "11", "2.5", "abc", "", null]) {
    await assert.rejects(() => create(form("Email", { interest_score })));
  }
  for (const override of [
    { duration_minutes: null },
    { duration_minutes: "-1" },
    { date: null },
    { date: "invalid" },
  ]) {
    await assert.rejects(() => create(form("Telephone", override)));
  }
  for (const type of ["Email", "Message"]) {
    await assert.rejects(() => create(form(type, { conclusion: "" })));
    await assert.rejects(() => create(form(type, { objective: "" })));
    await assert.rejects(() => create(form(type, { result: "" })));
  }
  await assert.rejects(() => create(form("WhatsApp")));
  assert.equal(saved.length, 5);
  for (const interest_score of ["0", "10"]) {
    await create(
      form("Email", { interest_score, next_action: "Relancer demain" }),
    );
    assert.equal(saved.at(-1).interest_score, Number(interest_score));
    assert.equal(saved.at(-1).next_action, "Relancer demain");
  }
  await create(form("Email", { employee_id: "someone-else" }));
  assert.equal(saved.at(-1).employee_id, "employee");
  const invalid = await submit(form("Email", { interest_score: "11" }));
  assert.equal(invalid.success, false);
  assert.ok(invalid.error);
  for (const [code, fragment] of [
    ["42501", "droits"],
    ["PGRST204", "mise à jour"],
    ["23503", "n’existe plus"],
    ["unknown", "Réessayez"],
  ]) {
    databaseError = { code, message: "Internal database details" };
    const state = await submit(form("Email"));
    assert.equal(state.success, false);
    assert.ok(state.error.includes(fragment));
    assert.ok(!state.error.includes(databaseError.message));
  }
});
