'use strict';
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
class MemoryRepository{
 constructor(){this.docs=new Map();this.tail=Promise.resolve();}
 async transact(fn){let release;const before=this.tail;this.tail=new Promise(r=>release=r);await before;const docs=new Map([...this.docs].map(([k,v])=>[k,clone(v)]));
  const t={get:async path=>clone(docs.get(path)),set:(path,v)=>docs.set(path,clone(v)),remove:path=>docs.delete(path),query:async(collection,field,value,op='==')=>[...docs].filter(([p,v])=>p.startsWith(collection+'/')&&p.split('/').length===collection.split('/').length+1&&(op==='includes'?v[field]?.includes(value):v[field]===value)).map(([path,v])=>({...clone(v),_path:path}))};
  try{const out=await fn(t);this.docs=docs;return clone(out);}finally{release();}
 }
}
// Firestore forbids arrays directly inside arrays. Battle teams and slots use
// those structures in memory; encode at the database boundary, then restore.
// Ordinary field name: Firestore reserves names matching __.*__.
const nestedArrayKey='pokemonNestedArrayV1';
const legacyArrayKey='__pokemon_nested_array_v1__';
function encodeFirestore(value){
 if(Array.isArray(value))return value.map(x=>Array.isArray(x)?{[nestedArrayKey]:encodeFirestore(x)}:encodeFirestore(x));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,encodeFirestore(v)]));
 return value;
}
function decodeFirestore(value){
 if(Array.isArray(value))return value.map(decodeFirestore);
 if(value&&typeof value==='object'){
  if(Object.keys(value).length===1){for(const key of [nestedArrayKey,legacyArrayKey])if(Array.isArray(value[key]))return decodeFirestore(value[key]);}
  return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,decodeFirestore(v)]));
 }
 return value;
}
class FirestoreRepository{
 constructor(db){this.db=db;}
 transact(fn){return this.db.runTransaction(async tx=>{const pending=new Map();const t={get:async p=>{if(pending.has(p))return clone(pending.get(p));const d=await tx.get(this.db.doc(p));return d.exists?decodeFirestore(d.data()):undefined;},set:(p,v)=>pending.set(p,clone(v)),remove:p=>pending.set(p,undefined),query:async(c,f,v,op='==')=>{const s=await tx.get(this.db.collection(c).where(f,op==='includes'?'array-contains':'==',v));const rows=new Map(s.docs.map(d=>[d.ref.path,decodeFirestore(d.data())]));for(const [p,x]of pending)if(p.startsWith(c+'/')&&p.split('/').length===c.split('/').length+1){if(x&&(op==='includes'?x[f]?.includes(v):x[f]===v))rows.set(p,x);else rows.delete(p);}return [...rows].map(([p,x])=>({...x,_path:p}));}};const out=await fn(t);for(const [p,v]of pending)v===undefined?tx.delete(this.db.doc(p)):tx.set(this.db.doc(p),encodeFirestore(v));return out;});}
}
module.exports={MemoryRepository,FirestoreRepository,encodeFirestore,decodeFirestore};
