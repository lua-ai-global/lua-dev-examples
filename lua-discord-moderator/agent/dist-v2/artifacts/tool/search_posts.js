
// =============================================================================
// LUA RUNTIME WRAPPER - Tool: search_posts
// =============================================================================

"use strict";var n=Object.defineProperty;var r=Object.getOwnPropertyDescriptor;var u=Object.getOwnPropertyNames;var m=Object.prototype.hasOwnProperty;var c=(o,e)=>{for(var i in e)n(o,i,{get:e[i],enumerable:!0})},l=(o,e,i,a)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of u(e))!m.call(o,s)&&s!==i&&n(o,s,{get:()=>e[s],enumerable:!(a=r(e,s))||a.enumerable});return o};var p=o=>l(n({},"__esModule",{value:!0}),o);var x={};c(x,{default:()=>g});module.exports=p(x);var d=require("lua-cli"),f=require("zod");var t=new h,b={version:"2.0.0",kind:"tool",name:"search_posts",description:"Search the community knowledge base for similar questions and solutions from past forum posts",exportName:"SearchPostsTool",pattern:"class"},g={__lua_primitive__:b,primitive:{kind:"tool",name:t.name,description:t.description,inputSchema:t.inputSchema,execute:t.execute.bind(t),condition:t.condition?.bind(t)}};


// Validation check
(function() {
  const mod = typeof exports !== 'undefined' ? exports : {};
  const primitive = mod.default;
  
  if (!primitive || !primitive.__lua_primitive__) {
    throw new Error('[Lua] Invalid tool artifact: missing __lua_primitive__ marker');
  }
  
  if (primitive.__lua_primitive__.kind !== 'tool') {
    throw new Error('[Lua] Invalid tool artifact: expected kind "tool", got "' + primitive.__lua_primitive__.kind + '"');
  }
  
  if (typeof primitive.primitive?.execute !== 'function') {
    throw new Error('[Lua] Invalid tool artifact: execute is not a function');
  }
})();
