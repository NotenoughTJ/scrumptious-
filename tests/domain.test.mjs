import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildSync } from "esbuild";
const built = buildSync({ stdin: { contents: 'export {generateRfi} from "./features/rfi-generator/generator.ts"; export {parseFrlst} from "./features/frlst-import/parser.ts"; export {validationErrors} from "./features/student-decisions/validation.ts"; export {reduceWorkspace} from "./features/shared/actions.ts"; export {zipTexts} from "./features/rfi-generator/zip.ts";', resolveDir: process.cwd(), loader: "ts" }, bundle:true, format:"cjs", platform:"node", write:false });
const mod={exports:{}};new Function("module","exports",built.outputFiles[0].text)(mod,mod.exports);
const { generateRfi,parseFrlst,validationErrors,reduceWorkspace,zipTexts }=mod.exports;
const decisions=JSON.parse(fs.readFileSync("tests/fixtures/decisions.json","utf8"));
const seed=JSON.parse(fs.readFileSync("data/seed.json","utf8"));
const report=q=>fs.readFileSync("public/samples/q"+q+"/FR.LST","utf8");

for(const d of decisions) test("RFI Q"+d.roundNumber+" firm "+d.teamId+" reproduces original bytes",()=>{
  assert.deepEqual(validationErrors(d),{});
  const original=fs.readFileSync("public/samples/q"+d.roundNumber+"/RFI"+d.teamId+"ME.TXT","utf8");
  assert.equal(generateRfi(d,original),original);
});
for(const q of [1,2,3,4,5,7]) test("FR.LST Q"+q+" imports five complete firms",()=>{
  const r=parseFrlst(report(q),q);
  assert.deepEqual(r.map(v=>v.teamId),[1,2,3,4,5]);
  assert.ok(r.every(v=>v.menu.length>=1&&v.menu.length<=8));
});
test("Known Q2 financial values and duplicate STEAK selections survive",()=>{
  const r=parseFrlst(report(2),2);
  assert.equal(r[0].foodSales+r[0].beverageSales,1074566);assert.equal(r[0].netIncome,43678);
  assert.equal(r[4].netIncome,-16438);
  assert.equal(r[1].menu.filter(v=>v.itemName==="STEAK").length,2);
  assert.equal(decisions.find(v=>v.teamId===2&&v.roundNumber===2).menu.filter(v=>v.itemName==="STEAK").length,2);
});
test("Invalid file, wrong period, duplicate income statements and truncated report fail",()=>{
  assert.throws(()=>parseFrlst("invalid",3));
  assert.throws(()=>parseFrlst(report(2),3),/not Q3/);
  assert.throws(()=>parseFrlst(report(3)+report(3),3),/duplicate/);
  assert.throws(()=>parseFrlst(report(3).slice(0,8000),3));
});
test("Unreadable menu row rejects the full import",()=>{
  assert.throws(()=>parseFrlst(report(2).replace("29.7 %","**** %"),2),/unreadable/);
});
test("RFI changes mapped values, keeps reserved fields, and preserves CRLF",()=>{
  const d=structuredClone(decisions[0]),template=fs.readFileSync("public/samples/q2/RFI1ME.TXT","utf8");
  d.menu[0].salesPrice=26.95;d.staffPerDay=30.5;d.timeDepositChange=-2500;
  const result=generateRfi(d,template),lines=result.split("\r\n"),old=template.split("\r\n");
  assert.equal(Number(lines[4].slice(73,83)),26.95);assert.equal(lines[4].slice(83),old[4].slice(83));
  const op=lines.find(v=>v.startsWith("Operations"));assert.equal(Number(op.slice(43,53)),30.5);assert.equal(op.slice(123),old.find(v=>v.startsWith("Operations")).slice(123));
  assert.equal(Number(lines.find(v=>v.startsWith("Finance")).slice(43,53)),-2500);
  assert.ok(!result.replaceAll("\r\n","").includes("\n"));
});
test("Draft validation catches missing, negative, over-precision, and duplicate line keys",()=>{
  const d=structuredClone(decisions[0]);d.staffPerDay=null;d.menu[0].salesPrice=-1;d.menu[1].orderSize=1.23;d.menu[1].lineNumber=d.menu[0].lineNumber;
  const errors=validationErrors(d);assert.ok(errors.staffPerDay);assert.ok(errors["menu.0.salesPrice"]);assert.ok(errors["menu.1.orderSize"]);assert.ok(errors["menu.1.lineNumber"]);
});
async function readyState(){let s=structuredClone(seed);for(const teamId of [1,5])s=(await reduceWorkspace(s,{kind:"submit",teamId,roundNumber:3})).state;return s;}
test("Round cannot lock while teams have drafts",async()=>{
  await assert.rejects(()=>reduceWorkspace(seed,{kind:"lock",roundNumber:3}),/five teams/);
});
test("Submission validates draft and prevents edits until reopened",async()=>{
  const initial=structuredClone(seed);initial.decisions.find(d=>d.teamId===1&&d.roundNumber===3).staffPerDay=null;
  await assert.rejects(()=>reduceWorkspace(initial,{kind:"submit",teamId:1,roundNumber:3}),/required/);
  const s=(await reduceWorkspace(seed,{kind:"submit",teamId:1,roundNumber:3})).state;
  await assert.rejects(()=>reduceWorkspace(s,{kind:"saveDecision",decision:s.decisions.find(d=>d.teamId===1&&d.roundNumber===3)}),/Reopen/);
  assert.ok((await reduceWorkspace(s,{kind:"reopen",teamId:1,roundNumber:3})).state.decisions.find(d=>d.teamId===1&&d.roundNumber===3).submittedAt===null);
});
test("Lock, import, preview, duplicate detection and release work in sequence",async()=>{
  const ready=await readyState(),locked=(await reduceWorkspace(ready,{kind:"lock",roundNumber:3})).state;
  assert.equal(locked.rounds.at(-1).status,"locked");
  await assert.rejects(()=>reduceWorkspace(locked,{kind:"saveDecision",decision:locked.decisions.at(-1)}),/locked/);
  const imported=(await reduceWorkspace(locked,{kind:"import",roundNumber:3,text:report(3)})).state;
  assert.equal(imported.rounds.at(-1).status,"imported");assert.equal(imported.rounds.at(-1).releasedAt,null);
  assert.equal(imported.results.filter(r=>r.roundNumber===3).length,5);
  assert.equal((await reduceWorkspace(imported,{kind:"import",roundNumber:3,text:report(3)})).unchanged,true);
  const released=(await reduceWorkspace(imported,{kind:"release",roundNumber:3})).state;
  assert.equal(released.rounds.at(-1).status,"released");assert.ok(released.rounds.at(-1).releasedAt);
});
test("Failed import leaves the original workspace unchanged",async()=>{
  const s=(await reduceWorkspace(await readyState(),{kind:"lock",roundNumber:3})).state,before=JSON.stringify(s);
  await assert.rejects(()=>reduceWorkspace(s,{kind:"import",roundNumber:3,text:report(2)}),/not Q3/);
  assert.equal(JSON.stringify(s),before);
});
test("Studio changes remain part of the shared workspace",async()=>{
  const studio=structuredClone(seed.studio);studio.projectNote="A reviewed team note";
  const s=(await reduceWorkspace(seed,{kind:"saveStudio",studio})).state;
  assert.equal(s.studio.projectNote,studio.projectNote);assert.equal(seed.studio.projectNote.includes("One shared app"),true);
});
test("ZIP package contains the five exact text payloads",async()=>{
  const files=Array.from({length:5},(_,i)=>({name:"RFI"+(i+1)+"ME.TXT",content:"firm "+(i+1)+"\r\n"}));
  const bytes=new Uint8Array(await zipTexts(files).arrayBuffer()),v=new DataView(bytes.buffer);
  let offset=0;
  for(const file of files){assert.equal(v.getUint32(offset,true),0x04034b50);const size=v.getUint32(offset+18,true),length=v.getUint16(offset+26,true);assert.equal(new TextDecoder().decode(bytes.slice(offset+30,offset+30+length)),file.name);assert.equal(new TextDecoder().decode(bytes.slice(offset+30+length,offset+30+length+size)),file.content);offset+=30+length+size;}
  assert.equal(v.getUint32(offset,true),0x02014b50);assert.equal(v.getUint32(bytes.length-22,true),0x06054b50);assert.equal(v.getUint16(bytes.length-14,true),5);
});
