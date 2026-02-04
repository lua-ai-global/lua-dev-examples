
// =============================================================================
// LUA RUNTIME WRAPPER - Tool: set_reminder
// =============================================================================

"use strict";var $=Object.create;var u=Object.defineProperty;var I=Object.getOwnPropertyDescriptor;var p=Object.getOwnPropertyNames;var b=Object.getPrototypeOf,w=Object.prototype.hasOwnProperty;var D=(e,s)=>()=>(s||e((s={exports:{}}).exports,s),s.exports),S=(e,s)=>{for(var t in s)u(e,t,{get:s[t],enumerable:!0})},h=(e,s,t,o)=>{if(s&&typeof s=="object"||typeof s=="function")for(let r of p(s))!w.call(e,r)&&r!==t&&u(e,r,{get:()=>s[r],enumerable:!(o=I(s,r))||o.enumerable});return e};var f=(e,s,t)=>(t=e!=null?$(b(e)):{},h(s||!e||!e.__esModule?u(t,"default",{value:e,enumerable:!0}):t,e)),v=e=>h(u({},"__esModule",{value:!0}),e);var g=D((N,y)=>{var i=1e3,d=i*60,c=d*60,n=c*24,T=n*7,M=n*365.25;y.exports=function(e,s){s=s||{};var t=typeof e;if(t==="string"&&e.length>0)return x(e);if(t==="number"&&isFinite(e))return s.long?_(e):A(e);throw new Error("val is not a non-empty string or a valid number. val="+JSON.stringify(e))};function x(e){if(e=String(e),!(e.length>100)){var s=/^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(e);if(s){var t=parseFloat(s[1]),o=(s[2]||"ms").toLowerCase();switch(o){case"years":case"year":case"yrs":case"yr":case"y":return t*M;case"weeks":case"week":case"w":return t*T;case"days":case"day":case"d":return t*n;case"hours":case"hour":case"hrs":case"hr":case"h":return t*c;case"minutes":case"minute":case"mins":case"min":case"m":return t*d;case"seconds":case"second":case"secs":case"sec":case"s":return t*i;case"milliseconds":case"millisecond":case"msecs":case"msec":case"ms":return t;default:return}}}}function A(e){var s=Math.abs(e);return s>=n?Math.round(e/n)+"d":s>=c?Math.round(e/c)+"h":s>=d?Math.round(e/d)+"m":s>=i?Math.round(e/i)+"s":e+"ms"}function _(e){var s=Math.abs(e);return s>=n?m(e,s,n,"day"):s>=c?m(e,s,c,"hour"):s>=d?m(e,s,d,"minute"):s>=i?m(e,s,i,"second"):e+" ms"}function m(e,s,t,o){var r=s>=t*1.5;return Math.round(e/t)+" "+o+(r?"s":"")}});var P={};S(P,{default:()=>F});module.exports=v(P);var l=require("lua-cli"),k=require("zod"),O=f(g());var R=f(g());var a=new C,E={version:"2.0.0",kind:"tool",name:"set_reminder",description:"Set a reminder for the user. Example: 'remind me in 30 minutes to check my deployment'",exportName:"SetReminderTool",pattern:"class"},F={__lua_primitive__:E,primitive:{kind:"tool",name:a.name,description:a.description,inputSchema:a.inputSchema,execute:a.execute.bind(a),condition:a.condition?.bind(a)}};


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
