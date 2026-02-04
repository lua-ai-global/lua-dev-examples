
// =============================================================================
// LUA RUNTIME WRAPPER - Tool: add_to_cart
// =============================================================================

"use strict";var d=Object.defineProperty;var m=Object.getOwnPropertyDescriptor;var u=Object.getOwnPropertyNames;var p=Object.prototype.hasOwnProperty;var l=(o,e)=>{for(var t in e)d(o,t,{get:e[t],enumerable:!0})},g=(o,e,t,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of u(e))!p.call(o,i)&&i!==t&&d(o,i,{get:()=>e[i],enumerable:!(n=m(e,i))||n.enumerable});return o};var f=o=>g(d({},"__esModule",{value:!0}),o);var b={};l(b,{AddToCartTool:()=>s,default:()=>h});module.exports=f(b);var r=require("lua-cli"),c=require("zod");var s=class{constructor(){this.name="add_to_cart";this.description="Add a product to the shopping cart";this.inputSchema=c.z.object({productId:c.z.string().describe("Product ID to add"),quantity:c.z.number().min(1).default(1).describe("Quantity to add"),basketId:c.z.string().optional().describe("Existing basket ID (creates new if not provided)")})}async execute(e){let t=await r.Products.getById(e.productId);if(!t)throw new Error(`Product not found: ${e.productId}`);if(!t.inStock)return{success:!1,message:`Sorry, ${t.name} is currently out of stock`};let n;e.basketId?n=await r.Baskets.getById(e.basketId):n=await r.Baskets.create({currency:"USD",metadata:{source:"ai_chat"}});let i=await r.Baskets.addItem(n.id,{id:e.productId,price:t.price,quantity:e.quantity,SKU:t.sku});return{success:!0,basketId:i.id,itemCount:i.common.itemCount,subtotal:`$${i.common.totalAmount.toFixed(2)}`,message:`Added ${e.quantity}x ${t.name} to your cart`}}};var a=new s,y={version:"2.0.0",kind:"tool",name:"add_to_cart",description:"Add a product to the shopping cart",exportName:"AddToCartTool",pattern:"class"},h={__lua_primitive__:y,primitive:{kind:"tool",name:a.name,description:a.description,inputSchema:a.inputSchema,execute:a.execute.bind(a),condition:a.condition?.bind(a)}};0&&(module.exports={AddToCartTool});


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
