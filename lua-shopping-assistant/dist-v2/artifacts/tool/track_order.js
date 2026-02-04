
// =============================================================================
// LUA RUNTIME WRAPPER - Tool: track_order
// =============================================================================

"use strict";var s=Object.defineProperty;var m=Object.getOwnPropertyDescriptor;var u=Object.getOwnPropertyNames;var p=Object.prototype.hasOwnProperty;var l=(i,t)=>{for(var e in t)s(i,e,{get:t[e],enumerable:!0})},g=(i,t,e,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of u(t))!p.call(i,o)&&o!==e&&s(i,o,{get:()=>t[o],enumerable:!(n=m(t,o))||n.enumerable});return i};var f=i=>g(s({},"__esModule",{value:!0}),i);var b={};l(b,{TrackOrderTool:()=>a,default:()=>h});module.exports=f(b);var c=require("lua-cli"),d=require("zod");var a=class{constructor(){this.name="track_order";this.description="Get order status and tracking information";this.inputSchema=d.z.object({orderId:d.z.string().describe("Order ID to track")})}async execute(t){let e=await c.Orders.getById(t.orderId);if(!e)throw new Error(`Order not found: ${t.orderId}`);let n={pending:"Your order is being processed",confirmed:"Order confirmed and being prepared for shipping",fulfilled:"Order delivered!",cancelled:"Order was cancelled"};return{orderId:e.id,status:e.common.status,statusMessage:n[e.common.status]||"Unknown status",total:`$${e.common.totalAmount.toFixed(2)}`,itemCount:e.common.itemCount,estimatedDelivery:e.data?.estimatedDelivery,trackingNumber:e.data?.trackingNumber}}};var r=new a,y={version:"2.0.0",kind:"tool",name:"track_order",description:"Get order status and tracking information",exportName:"TrackOrderTool",pattern:"class"},h={__lua_primitive__:y,primitive:{kind:"tool",name:r.name,description:r.description,inputSchema:r.inputSchema,execute:r.execute.bind(r),condition:r.condition?.bind(r)}};0&&(module.exports={TrackOrderTool});


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
