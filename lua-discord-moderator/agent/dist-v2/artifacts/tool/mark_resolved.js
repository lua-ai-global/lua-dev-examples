
// =============================================================================
// LUA RUNTIME WRAPPER - Tool: mark_resolved
// =============================================================================

"use strict";var f=Object.create;var u=Object.defineProperty;var I=Object.getOwnPropertyDescriptor;var p=Object.getOwnPropertyNames;var y=Object.getPrototypeOf,$=Object.prototype.hasOwnProperty;var w=(e,s)=>()=>(s||e((s={exports:{}}).exports,s),s.exports),b=(e,s)=>{for(var t in s)u(e,t,{get:s[t],enumerable:!0})},l=(e,s,t,o)=>{if(s&&typeof s=="object"||typeof s=="function")for(let r of p(s))!$.call(e,r)&&r!==t&&u(e,r,{get:()=>s[r],enumerable:!(o=I(s,r))||o.enumerable});return e};var v=(e,s,t)=>(t=e!=null?f(y(e)):{},l(s||!e||!e.__esModule?u(t,"default",{value:e,enumerable:!0}):t,e)),T=e=>l(u({},"__esModule",{value:!0}),e);var m=w((H,h)=>{var i=1e3,c=i*60,d=c*60,n=d*24,D=n*7,S=n*365.25;h.exports=function(e,s){s=s||{};var t=typeof e;if(t==="string"&&e.length>0)return x(e);if(t==="number"&&isFinite(e))return s.long?_(e):M(e);throw new Error("val is not a non-empty string or a valid number. val="+JSON.stringify(e))};function x(e){if(e=String(e),!(e.length>100)){var s=/^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(e);if(s){var t=parseFloat(s[1]),o=(s[2]||"ms").toLowerCase();switch(o){case"years":case"year":case"yrs":case"yr":case"y":return t*S;case"weeks":case"week":case"w":return t*D;case"days":case"day":case"d":return t*n;case"hours":case"hour":case"hrs":case"hr":case"h":return t*d;case"minutes":case"minute":case"mins":case"min":case"m":return t*c;case"seconds":case"second":case"secs":case"sec":case"s":return t*i;case"milliseconds":case"millisecond":case"msecs":case"msec":case"ms":return t;default:return}}}}function M(e){var s=Math.abs(e);return s>=n?Math.round(e/n)+"d":s>=d?Math.round(e/d)+"h":s>=c?Math.round(e/c)+"m":s>=i?Math.round(e/i)+"s":e+"ms"}function _(e){var s=Math.abs(e);return s>=n?g(e,s,n,"day"):s>=d?g(e,s,d,"hour"):s>=c?g(e,s,c,"minute"):s>=i?g(e,s,i,"second"):e+" ms"}function g(e,s,t,o){var r=s>=t*1.5;return Math.round(e/t)+" "+o+(r?"s":"")}});var F={};b(F,{default:()=>N});module.exports=T(F);var R=require("lua-cli"),A=require("zod");var k=v(m());var C=require("lua-cli");var a=new E,O={version:"2.0.0",kind:"tool",name:"mark_resolved",description:"Mark the current forum thread as resolved. Use when a user asks you to mark their issue as solved.",exportName:"MarkResolvedTool",pattern:"class"},N={__lua_primitive__:O,primitive:{kind:"tool",name:a.name,description:a.description,inputSchema:a.inputSchema,execute:a.execute.bind(a),condition:a.condition?.bind(a)}};


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
