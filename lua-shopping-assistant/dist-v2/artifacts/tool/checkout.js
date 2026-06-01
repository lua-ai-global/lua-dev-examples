
// =============================================================================
// LUA RUNTIME WRAPPER - Tool: checkout
// =============================================================================

"use strict";var d=Object.defineProperty;var m=Object.getOwnPropertyDescriptor;var u=Object.getOwnPropertyNames;var p=Object.prototype.hasOwnProperty;var l=(i,e)=>{for(var o in e)d(i,o,{get:e[o],enumerable:!0})},g=(i,e,o,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let a of u(e))!p.call(i,a)&&a!==o&&d(i,a,{get:()=>e[a],enumerable:!(s=m(e,a))||s.enumerable});return i};var f=i=>g(d({},"__esModule",{value:!0}),i);var b={};l(b,{CheckoutTool:()=>c,default:()=>h});module.exports=f(b);var n=require("lua-cli"),t=require("zod");var c=class{constructor(){this.name="checkout";this.description="Complete purchase and create order";this.inputSchema=t.z.object({basketId:t.z.string(),shippingAddress:t.z.object({name:t.z.string(),street:t.z.string(),city:t.z.string(),state:t.z.string(),zip:t.z.string(),country:t.z.string().default("USA")}),email:t.z.string().email(),paymentMethod:t.z.string().default("stripe")})}async execute(e){let o=await n.Baskets.getById(e.basketId);return o.common.itemCount===0?{success:!1,message:"Cannot checkout with empty cart"}:{success:!0,orderId:(await n.Baskets.placeOrder({shippingAddress:e.shippingAddress,paymentMethod:e.paymentMethod,customerEmail:e.email},e.basketId)).id,total:`$${o.common.totalAmount.toFixed(2)}`,itemCount:o.common.itemCount,estimatedDelivery:this.calculateDeliveryDate(),message:`Order confirmed! You'll receive a confirmation email at ${e.email}`}}calculateDeliveryDate(){let e=new Date;return e.setDate(e.getDate()+5),e.toLocaleDateString()}};var r=new c,y={version:"2.0.0",kind:"tool",name:"checkout",description:"Complete purchase and create order",exportName:"CheckoutTool",pattern:"class"},h={__lua_primitive__:y,primitive:{kind:"tool",name:r.name,description:r.description,inputSchema:r.inputSchema,execute:r.execute.bind(r),condition:r.condition?.bind(r)}};0&&(module.exports={CheckoutTool});


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
