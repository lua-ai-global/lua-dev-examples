// src/types/lua-cli.d.ts
declare module "lua-cli" {
  // runtime objects provided by the lua CLI - typed as `any` for compile-time safety
  export const LuaAgent: any;
  export const LuaSkill: any;
  export const LuaTool: any;

  // if you import a default or named, add them too:
  const _default: any;
  export default _default;
}