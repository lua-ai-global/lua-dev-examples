
// =============================================================================
// LUA RUNTIME WRAPPER - Tool: save_post
// =============================================================================

"use strict";var r=Object.defineProperty;var a=Object.getOwnPropertyDescriptor;var l=Object.getOwnPropertyNames;var c=Object.prototype.hasOwnProperty;var d=(t,e)=>{for(var n in e)r(t,n,{get:e[n],enumerable:!0})},u=(t,e,n,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of l(e))!c.call(t,s)&&s!==n&&r(t,s,{get:()=>e[s],enumerable:!(i=a(e,s))||i.enumerable});return t};var m=t=>u(r({},"__esModule",{value:!0}),t);var S={};d(S,{default:()=>x});module.exports=m(S);var p=require("lua-cli"),h=require("zod");var g=require("lua-cli");var o=new f,T={version:"2.0.0",kind:"tool",name:"save_post",description:"Save a resolved forum post (question + solution) to the community knowledge base for future reference",exportName:"SavePostTool",pattern:"class"},x={__lua_primitive__:T,primitive:{kind:"tool",name:o.name,description:o.description,inputSchema:o.inputSchema,execute:o.execute.bind(o),condition:o.condition?.bind(o)}};


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
