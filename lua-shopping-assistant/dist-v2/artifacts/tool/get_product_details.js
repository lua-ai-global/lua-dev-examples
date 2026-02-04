
// =============================================================================
// LUA RUNTIME WRAPPER - Tool: get_product_details
// =============================================================================

"use strict";var c=Object.defineProperty;var m=Object.getOwnPropertyDescriptor;var u=Object.getOwnPropertyNames;var p=Object.prototype.hasOwnProperty;var l=(i,t)=>{for(var e in t)c(i,e,{get:t[e],enumerable:!0})},g=(i,t,e,d)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of u(t))!p.call(i,r)&&r!==e&&c(i,r,{get:()=>t[r],enumerable:!(d=m(t,r))||d.enumerable});return i};var f=i=>g(c({},"__esModule",{value:!0}),i);var h={};l(h,{GetProductDetailsTool:()=>a,default:()=>b});module.exports=f(h);var n=require("lua-cli"),s=require("zod");var a=class{constructor(){this.name="get_product_details";this.description="Get detailed information about a specific product";this.inputSchema=s.z.object({productId:s.z.string().describe("Product ID")})}async execute(t){let e=await n.Products.getById(t.productId);if(!e)throw new Error(`Product not found: ${t.productId}`);return{id:e.id,name:e.name,price:`$${e.price.toFixed(2)}`,description:e.description,category:e.category,sku:e.sku,inStock:e.inStock,availability:e.inStock?"\u2705 In stock - Ships within 24 hours":"\u274C Out of stock - Notify when available?"}}};var o=new a,y={version:"2.0.0",kind:"tool",name:"get_product_details",description:"Get detailed information about a specific product",exportName:"GetProductDetailsTool",pattern:"class"},b={__lua_primitive__:y,primitive:{kind:"tool",name:o.name,description:o.description,inputSchema:o.inputSchema,execute:o.execute.bind(o),condition:o.condition?.bind(o)}};0&&(module.exports={GetProductDetailsTool});


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
