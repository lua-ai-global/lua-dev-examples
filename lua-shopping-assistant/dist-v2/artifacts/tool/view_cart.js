
// =============================================================================
// LUA RUNTIME WRAPPER - Tool: view_cart
// =============================================================================

"use strict";var s=Object.defineProperty;var m=Object.getOwnPropertyDescriptor;var u=Object.getOwnPropertyNames;var p=Object.prototype.hasOwnProperty;var l=(r,e)=>{for(var t in e)s(r,t,{get:e[t],enumerable:!0})},g=(r,e,t,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let a of u(e))!p.call(r,a)&&a!==t&&s(r,a,{get:()=>e[a],enumerable:!(i=m(e,a))||i.enumerable});return r};var f=r=>g(s({},"__esModule",{value:!0}),r);var b={};l(b,{ViewCartTool:()=>n,default:()=>h});module.exports=f(b);var c=require("lua-cli"),d=require("zod");var n=class{constructor(){this.name="view_cart";this.description="View items in the shopping cart";this.inputSchema=d.z.object({basketId:d.z.string().describe("Basket ID")})}async execute(e){let t=await c.Baskets.getById(e.basketId);if(!t)throw new Error("Cart not found");return{items:t.common.items.map(i=>({productId:i.id,quantity:i.quantity,price:`$${i.price.toFixed(2)}`,subtotal:`$${(i.price*i.quantity).toFixed(2)}`,sku:i.SKU})),itemCount:t.common.itemCount,total:`$${t.common.totalAmount.toFixed(2)}`,basketId:t.id}}};var o=new n,y={version:"2.0.0",kind:"tool",name:"view_cart",description:"View items in the shopping cart",exportName:"ViewCartTool",pattern:"class"},h={__lua_primitive__:y,primitive:{kind:"tool",name:o.name,description:o.description,inputSchema:o.inputSchema,execute:o.execute.bind(o),condition:o.condition?.bind(o)}};0&&(module.exports={ViewCartTool});


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
