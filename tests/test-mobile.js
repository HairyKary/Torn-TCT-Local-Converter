'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const script = fs.readFileSync(__dirname + '/../torn-tct-local-converter.user.js', 'utf8');
let listeners = Object.create(null);
let timers = new Map();
let timerId = 0;
let fakeTime = new Date('2026-10-12T12:00:00Z').getTime();
class FakeText {
  constructor(text) {this.nodeType=3;this.textContent=text;}
}
class FakeElement {
  constructor(tagName='div') {
    this.nodeType=1; this.tagName=tagName.toUpperCase(); this.children=[]; this.childNodes=[];
    this.parentElement=null;this.style={display:'none'};this.attrs={};this.eventListeners={};this._text='';
    this.offsetWidth=250; this.offsetHeight=72; this._classes=new Set();
    this.classList={add:v=>this._classes.add(v),remove:v=>this._classes.delete(v),toggle:(v,t)=>t?this._classes.add(v):this._classes.delete(v),contains:v=>this._classes.has(v)};
  }
  append(...kids){for(const kid of kids){this.children.push(kid); this.childNodes.push(kid);kid.parentElement=this;} }
  appendChild(kid){this.append(kid);return kid;}
  setAttribute(k,v){this.attrs[k]=v; if(k==='id')this.id=v;}
  getAttribute(k){return this.attrs[k]??null;}
  get textContent(){return this.childNodes.map(x=>x.textContent).join('');}
  set textContent(t){this._text='';this.children=[];this.childNodes=[new FakeText(t)];}
  addEventListener(k,fn){(this.eventListeners[k]||=[]).push(fn);}
  contains(el){for(let e=el;e;e=e.parentElement)if(e===this)return true;return false;}
  closest(selector){for(let e=this;e;e=e.parentElement){for(const q of selector.split(/,\s*/)){if(q==='input'||q==='textarea'||q==='select'||q==='button'||q==='summary'||q==='label'){if(e.tagName.toLowerCase()===q)return e;}else if(q==='a[href]' && e.tagName==='A' && e.attrs.href)return e;else if(q==='[onclick]' && e.attrs.onclick)return e;else if(q==='[role="button"]'&&e.attrs.role==='button')return e;else if(q==='[role="link"]'&&e.attrs.role==='link')return e;else if(q==='[contenteditable]'&&e.attrs.contenteditable)return e;else if(q.startsWith('#')&&e.id===q.slice(1))return e;}} return null;}
}
const document = {
  body:new FakeElement('body'),head:new FakeElement('head'),documentElement:new FakeElement('html'),
  createElement:t=>new FakeElement(t),addEventListener(k,fn){(listeners[k]||=[]).push(fn)},
  getElementById(id){function scan(root){if(root.id===id)return root;for(const child of root.children){const found=scan(child);if(found)return found;}return null;}return scan(this.body)||scan(this.head);}
};
function now(){return fakeTime;}
class ClockDate extends Date{constructor(...args){if(!args.length)super(fakeTime);else super(...args);}static now(){return fakeTime;}}
const window = {innerWidth:390,innerHeight:720,addEventListener(k,fn){(listeners['window:'+k]||=[]).push(fn)},setTimeout(fn,delay){const id=++timerId;timers.set(id,{fn,at:now()+delay});return id},clearTimeout(id){timers.delete(id)}};
const ctx = vm.createContext({document,window,Element:FakeElement,Node:{TEXT_NODE:3},Date:ClockDate,Intl,Math,Number,String,Array,RegExp});
vm.runInContext(script,ctx);
const tooltip=document.getElementById('tct-local-hover-tooltip');
const [close,tct,local,note]=tooltip.children;
assert(tooltip);
function el(tag,text,attributes={}){const e=new FakeElement(tag);e.textContent=text;Object.entries(attributes).forEach(([k,v])=>e.setAttribute(k,v));document.body.appendChild(e);return e;}
function fire(type,props={}) {const event={target:props.target||document.body,touches:props.touches||[],changedTouches:props.changedTouches||[],clientX:props.clientX||0,clientY:props.clientY||0,relatedTarget:props.relatedTarget,prevented:false,stopped:false,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true},...props};for(const fn of listeners[type]||[])fn(event);return event;}
function touch(x=60,y=180){return {clientX:x,clientY:y};}
function touchStart(target, t=touch()){fire('touchstart',{target,touches:[t]});}
function touchEnd(target,t=touch()){return fire('touchend',{target,changedTouches:[t],touches:[]});}
function advance(ms){fakeTime+=ms;for(const [id,t] of Array.from(timers)){if(t.at<=fakeTime){timers.delete(id);t.fn();}}}
const stamp=el('span','20:00:00 - 12/10/26');
fire('mouseover',{target:stamp,clientX:350,clientY:705});
assert.equal(tooltip.style.display,'block','desktop hover appears');
assert.match(tct.textContent,/20:00/);assert.match(local.textContent,/16:00 EDT/);
assert(Number.parseFloat(tooltip.style.left)<=130,'clamps near right edge');
assert(Number.parseFloat(tooltip.style.top)<=630,'clamps near bottom edge');
fire('mouseover',{target:document.body});assert.equal(tooltip.style.display,'none','hides for non time');
const winter=el('span','2026-12-31 01:30');fire('mouseover',{target:winter});
assert.match(local.textContent,/30 Dec 2026, 20:30 EST/,'midnight day crossover and DST');
const invalid=el('span','32/11/2026 20:00');fire('mouseover',{target:invalid});assert.equal(tooltip.style.display,'none');
const label=el('span','20:00');touchStart(label);touchEnd(label);
assert.equal(tooltip.style.display,'block','mobile quick tap');assert(tooltip.classList.contains('tct-touch'));
assert.match(note.textContent,/today in TCT/);
fire('mouseover',{target:document.body});assert.equal(tooltip.style.display,'block','ignore emulated mouseover');
touchStart(document.body);assert.equal(tooltip.style.display,'none','tap outside hides');
const anchor=el('a','2026-10-12 20:00',{href:'/forums.php'});const href=new FakeElement('span');anchor.append(href); // nested timestamp target can climb
const linked=el('a','2026-10-12 20:00',{href:'/forum'});
touchStart(linked);advance(200);touchEnd(linked);assert.equal(tooltip.style.display,'none','link quick tap not intercepted');
touchStart(linked);advance(500);assert.equal(tooltip.style.display,'block','long press link opens tooltip');
assert.match(local.textContent,/16:00 EDT/);
touchEnd(linked);const click=fire('click',{target:linked});assert(click.prevented&&click.stopped,'swallow one synthetic click');
const click2=fire('click',{target:linked});assert(!click2.prevented,'subsequent click works');
touchStart(document.body);assert.equal(tooltip.style.display,'none');
touchStart(label);fire('touchmove',{target:label,touches:[touch(61,230)]});advance(600);touchEnd(label,touch(61,230));assert.equal(tooltip.style.display,'none','scroll gesture ignored');
touchStart(label);fire('touchcancel',{target:label});advance(550);assert.equal(tooltip.style.display,'none','cancelled touch');
touchStart(label);touchEnd(label);assert.equal(tooltip.style.display,'block');close.eventListeners.click[0]();assert.equal(tooltip.style.display,'none','close button');
assert.equal(document.getElementById('tct-local-hover-tooltip'),tooltip,'singleton');

advance(2000); // Let synthesized mouse suppression expire after touch tests.
const flightPanel = el('div', 'Johannesburg to Torn. ');
const countdownBox = new FakeElement('div');
countdownBox.textContent = 'Remaining Flight Time - ';
flightPanel.append(countdownBox);
const countdownClock = new FakeElement('span');
countdownClock.textContent = '03:14:38';
countdownBox.append(countdownClock);
const arrivalBox = new FakeElement('div');
arrivalBox.textContent = 'Landing at ';
flightPanel.append(arrivalBox);
const arrivalClock = new FakeElement('span');
arrivalClock.textContent = '23:45:50';
arrivalBox.append(arrivalClock);
fire('mouseover', { target: countdownClock });
assert.equal(tooltip.style.display, 'none', 'flight countdown must not display converted time');
fire('mouseover', { target: arrivalClock });
assert.equal(tooltip.style.display, 'block', 'landing clock must convert');
assert.match(tct.textContent, /23:45/);
assert.match(local.textContent, /19:45 EDT/);
assert.match(note.textContent, /next occurrence/);
const inlineCountdown = el('span', 'Remaining Flight Time - 03:14:38');
fire('mouseover', { target: inlineCountdown });
assert.equal(tooltip.style.display, 'none', 'inline countdown must not convert');
const inlineLanding = el('span', 'Landing at 23:45:50');
fire('mouseover', { target: inlineLanding });
assert.equal(tooltip.style.display, 'block', 'inline landing must convert');
const midnightLanding = el('span', 'Landing at 00:05:00');
fire('mouseover', { target: midnightLanding });
assert.match(tct.textContent, /13 Oct 2026, 00:05/, 'landing rolls to next TCT date');
assert.match(local.textContent, /12 Oct 2026, 20:05 EDT/, 'local date converts correctly');


function makeResourceRow(name, value, countdown) {
  const row = el('div', name + ': ' + value + ' ');
  const timer = new FakeElement('span');
  timer.textContent = countdown;
  row.append(timer);
  return timer;
}
for (const [name, value, countdown] of [
  ['Energy', '0/150', '03:13'],
  ['Nerve', '45/65', '03:13'],
  ['Happy', '4810/5025', '13:13'],
  ['Life', '500/500', '03:13']
]) {
  const timer = makeResourceRow(name, value, countdown);
  fire('mouseover', {target:timer});
  assert.equal(tooltip.style.display, 'none', name + ' resource bar must not convert');
  touchStart(timer);touchEnd(timer);
  assert.equal(tooltip.style.display, 'none', name + ' resource bar touch must not convert');
}
advance(2000); // let synthesized mouse-event suppression expire
const regenTooltip = el('div', 'Energy increased by 5 every 10 minutes. Full energy in ');
const regenTimer = new FakeElement('span');
regenTimer.textContent = '04:53:13';
regenTooltip.append(regenTimer);
fire('mouseover', {target:regenTimer});
assert.equal(tooltip.style.display, 'none', 'Full energy in countdown must be ignored');
const nerveTooltip = el('div', 'Full nerve in ');
const nerveTimer = new FakeElement('span');
nerveTimer.textContent = '00:15:00';
nerveTooltip.append(nerveTimer);
fire('mouseover', {target:nerveTimer});
assert.equal(tooltip.style.display, 'none', 'Full nerve in countdown must be ignored');
const attributeResource = el('div', 'Energy: 0/150');
const titleTimer = new FakeElement('span');
titleTimer.setAttribute('title', '03:13');
attributeResource.append(titleTimer);
fire('mouseover', {target:titleTimer});
assert.equal(tooltip.style.display, 'none', 'attribute-only timer in a resource row must be ignored');
const explicitClock = el('span','23:00 TCT');
fire('mouseover',{target:explicitClock});
assert.equal(tooltip.style.display,'block','explicit TCT times still convert');
const datedClock = el('span','2026-10-12 20:00');
fire('mouseover',{target:datedClock});
assert.equal(tooltip.style.display,'block','dated timestamps still convert');

advance(2000); // Avoid mouse suppression immediately after touch-based tests.
const chainRow = el('div','Chain: ');
const chainCountdown = new FakeElement('span');
chainCountdown.textContent='04:59';chainRow.append(chainCountdown);
fire('mouseover',{target:chainCountdown});
assert.equal(tooltip.style.display,'none','chain timer with adjacent Chain label must not convert');
touchStart(chainCountdown);touchEnd(chainCountdown);
assert.equal(tooltip.style.display,'none','touch on chain countdown must not convert');
advance(2000);
const chainHits = el('div','Chain 200/250 ');
const chainHitsTimer = new FakeElement('span');
chainHitsTimer.textContent='04:58';chainHits.append(chainHitsTimer);
fire('mouseover',{target:chainHitsTimer});
assert.equal(tooltip.style.display,'none','chain count plus timer must be ignored');
const classContainer = el('div','');
const timeleftClass = new FakeElement('span');
timeleftClass.setAttribute('class','bar-timeleft___B9RGV');
timeleftClass.textContent='04:57';classContainer.append(timeleftClass);
fire('mouseover',{target:timeleftClass});
assert.equal(tooltip.style.display,'none','Torn bar-timeleft class must be ignored');
const chainAttrRow = el('div','Chain: 230');
const chainAttrClock = new FakeElement('span');
chainAttrClock.setAttribute('title','04:56');chainAttrRow.append(chainAttrClock);
fire('mouseover',{target:chainAttrClock});
assert.equal(tooltip.style.display,'none','attribute-only chain timer must not convert');
const labeledCountdown = el('div','Chain timer - ');
const labeledClock = new FakeElement('span');
labeledClock.textContent='04:55';labeledCountdown.append(labeledClock);
fire('mouseover',{target:labeledClock});
assert.equal(tooltip.style.display,'none','labeled chain timer must not convert');
const scheduledChain = el('span','Chain starts at 23:00 TCT');
fire('mouseover',{target:scheduledChain});
assert.equal(tooltip.style.display,'block','real TCT-labeled chain start still converts');
const fullDateAfter=el('span','2026-10-17 23:00');
fire('mouseover',{target:fullDateAfter});
assert.equal(tooltip.style.display,'block','dated TCT remains convertible');
const landingAfter=el('span','Landing at 23:45:50');
fire('mouseover',{target:landingAfter});
assert.equal(tooltip.style.display,'block','flight landing conversion retained');
console.log('PASS: v1.4.3 chain, resource, flight, desktop and mobile regressions.');

