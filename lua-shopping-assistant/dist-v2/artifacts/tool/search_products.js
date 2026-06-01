
// =============================================================================
// LUA RUNTIME WRAPPER - Tool: search_products
// =============================================================================

"use strict";var d=Object.defineProperty;var m=Object.getOwnPropertyDescriptor;var u=Object.getOwnPropertyNames;var p=Object.prototype.hasOwnProperty;var l=(i,t)=>{for(var a in t)d(i,a,{get:t[a],enumerable:!0})},g=(i,t,a,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let e of u(t))!p.call(i,e)&&e!==a&&d(i,e,{get:()=>t[e],enumerable:!(r=m(t,e))||r.enumerable});return i};var f=i=>g(d({},"__esModule",{value:!0}),i);var b={};l(b,{SearchProductsTool:()=>n,default:()=>h});module.exports=f(b);var s=require("lua-cli"),c=require("zod"),n=class{constructor(){this.name="search_products";this.description="Search for products by name, category, or description";this.inputSchema=c.z.object({query:c.z.string().describe("Search query (e.g., 'laptop', 'running shoes')"),maxPrice:c.z.number().optional().describe("Maximum price filter")})}async execute(t){let r=(await s.Products.search(t.query)).data;return t.maxPrice&&(r=r.filter(e=>e.price<=t.maxPrice)),{products:r.slice(0,10).map(e=>({id:e.id,name:e.name,price:`$${e.price.toFixed(2)}`,category:e.category,inStock:e.inStock,description:e.description?.substring(0,100)+"..."})),total:r.length,showing:Math.min(r.length,10)}}};var o=new n,y={version:"2.0.0",kind:"tool",name:"search_products",description:"Search for products by name, category, or description",exportName:"SearchProductsTool",pattern:"class"},h={__lua_primitive__:y,primitive:{kind:"tool",name:o.name,description:o.description,inputSchema:o.inputSchema,execute:o.execute.bind(o),condition:o.condition?.bind(o)}};0&&(module.exports={SearchProductsTool});


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
