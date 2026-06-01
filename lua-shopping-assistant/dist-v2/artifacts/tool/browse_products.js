
// =============================================================================
// LUA RUNTIME WRAPPER - Tool: browse_products
// =============================================================================

"use strict";var d=Object.defineProperty;var m=Object.getOwnPropertyDescriptor;var u=Object.getOwnPropertyNames;var p=Object.prototype.hasOwnProperty;var l=(r,e)=>{for(var i in e)d(r,i,{get:e[i],enumerable:!0})},g=(r,e,i,o)=>{if(e&&typeof e=="object"||typeof e=="function")for(let t of u(e))!p.call(r,t)&&t!==i&&d(r,t,{get:()=>e[t],enumerable:!(o=m(e,t))||o.enumerable});return r};var f=r=>g(d({},"__esModule",{value:!0}),r);var h={};l(h,{BrowseProductsTool:()=>c,default:()=>b});module.exports=f(h);var s=require("lua-cli"),a=require("zod");var c=class{constructor(){this.name="browse_products";this.description="Browse products by category, price range, or availability. Use this for structured browsing instead of search.";this.inputSchema=a.z.object({category:a.z.string().optional().describe("Product category (e.g., 'Electronics', 'Clothing')"),minPrice:a.z.number().optional().describe("Minimum price"),maxPrice:a.z.number().optional().describe("Maximum price"),inStockOnly:a.z.boolean().optional().describe("Only show in-stock items"),page:a.z.number().optional().default(1).describe("Page number for pagination")})}async execute(e){let i={};e.category&&(i.category=e.category),(e.minPrice!==void 0||e.maxPrice!==void 0)&&(i.price={},e.minPrice!==void 0&&(i.price.$gte=e.minPrice),e.maxPrice!==void 0&&(i.price.$lte=e.maxPrice)),e.inStockOnly&&(i.inStock=!0);let o=await s.Products.get({page:e.page,limit:10,filter:i});return{products:o.data.map(t=>({id:t.id,name:t.name,price:`$${t.price.toFixed(2)}`,category:t.category,inStock:t.inStock?"\u2705 In Stock":"\u274C Out of Stock",description:t.description?.substring(0,100)+"..."})),pagination:{page:o.pagination.currentPage,totalPages:o.pagination.totalPages,totalProducts:o.pagination.totalCount,hasMore:o.pagination.hasNextPage}}}};var n=new c,y={version:"2.0.0",kind:"tool",name:"browse_products",description:"Browse products by category, price range, or availability. Use this for structured browsing instead of search.",exportName:"BrowseProductsTool",pattern:"class"},b={__lua_primitive__:y,primitive:{kind:"tool",name:n.name,description:n.description,inputSchema:n.inputSchema,execute:n.execute.bind(n),condition:n.condition?.bind(n)}};0&&(module.exports={BrowseProductsTool});


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
