// src/skills/hubspotCRM.skill.ts
import { z } from "zod";
import createContact from "./createContact";

/**
 * Do NOT import runtime classes from "lua-cli" at compile-time.
 * The CLI injects real runtime objects at bundling/execution time.
 *
 * Provide *type* aliases for compile-time only so `implements` works
 * without TS confusing a runtime value with a type.
 */
export type LuaToolType = any;
export type LuaSkillType = any;

/**
 * Top-level exported zod schema (stable name) so the bundler can extract it.
 * Must be an exported const with the exact name referenced below.
 */
export const createContactInputSchema = z.object({
  email: z.string().email().optional(),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
});

class CreateContactTool implements LuaToolType {
  name = "createContact";
  description = "Creates a new contact in HubSpot CRM";

  // Must reference the SAME top-level exported zod const name above.
  inputSchema = createContactInputSchema;

  async execute(input: any) {
    // zod parsing keeps runtime safe
    const parsed = input ? this.inputSchema.parse(input) : {};
    return await createContact(parsed);
  }
}

/**
 * NOTE: do NOT import `LuaSkill` from lua-cli at compile time.
 * Use the `LuaSkill` type alias above only for typing.
 *
 * The CLI will inject the real `LuaSkill` value at runtime.
 */
const hubspotCRM = new (((globalThis as any).LuaSkill) || (class {}))({
  // the CLI replaces this at runtime — but this way TypeScript compiles
  // If the runtime doesn't provide LuaSkill here, the CLI's bundling will
  // instantiate a real LuaSkill when running inside the Lua runtime.
  name: "hubspotCRM",
  description: "Skill for creating contacts in HubSpot CRM",
  context: "Use createContact to create a new contact in HubSpot. Provide email or firstname+lastname.",
  tools: [new CreateContactTool()],
}) as any;

/**
 * Export default must be a valid value the bundler can find.
 * If the runtime/cli will inject LuaSkill, the CLI will handle wiring.
 */
export default hubspotCRM;