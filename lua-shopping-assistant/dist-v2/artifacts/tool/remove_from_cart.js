
// =============================================================================
// LUA RUNTIME WRAPPER - Tool: remove_from_cart
// =============================================================================

"use strict";var s=Object.defineProperty;var m=Object.getOwnPropertyDescriptor;var u=Object.getOwnPropertyNames;var p=Object.prototype.hasOwnProperty;var l=(t,e)=>{for(var i in e)s(t,i,{get:e[i],enumerable:!0})},g=(t,e,i,d)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of u(e))!p.call(t,r)&&r!==i&&s(t,r,{get:()=>e[r],enumerable:!(d=m(e,r))||d.enumerable});return t};var f=t=>g(s({},"__esModule",{value:!0}),t);var b={};l(b,{RemoveFromCartTool:()=>n,default:()=>h});module.exports=f(b);var a=require("lua-cli"),c=require("zod");var n=class{constructor(){this.name="remove_from_cart";this.description="Remove an item from the shopping cart";this.inputSchema=c.z.object({basketId:c.z.string(),itemId:c.z.string().describe("Item/Product ID to remove")})}async execute(e){await a.Baskets.removeItem(e.basketId,e.itemId);let i=await a.Baskets.getById(e.basketId);return{success:!0,itemCount:i.common.itemCount,total:`$${i.common.totalAmount.toFixed(2)}`,message:"Item removed from cart"}}};var o=new n,y={version:"2.0.0",kind:"tool",name:"remove_from_cart",description:"Remove an item from the shopping cart",exportName:"RemoveFromCartTool",pattern:"class"},h={__lua_primitive__:y,primitive:{kind:"tool",name:o.name,description:o.description,inputSchema:o.inputSchema,execute:o.execute.bind(o),condition:o.condition?.bind(o)}};0&&(module.exports={RemoveFromCartTool});


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
