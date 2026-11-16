const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
class Element{
  constructor(tag='div'){this.tagName=tag;this.children=[];this.value='';this.textContent='';this.hidden=false;this.checked=false;this.dataset={};this.listeners={};this.classList={toggle(){}};}
  append(...n){this.children.push(...n);} replaceChildren(...n){this.children=[...n];}setAttribute(){}remove(){}focus(){}scrollIntoView(){}click(){this.onclick?.();}addEventListener(k,f){this.listeners[k]=f;}async fire(k,event={}){return this.listeners[k]?.(event);}get text(){return this.textContent+this.children.map(n=>n.text||n.textContent||'').join('');}
}
function page(htmlFile,scriptFile,storage=new Map()){
  const html=fs.readFileSync(path.join(root,htmlFile),'utf8'),nodes={};for(const m of html.matchAll(/id="([^"]+)"/g))nodes[m[1]]=new Element();if(nodes.focusField)nodes.focusField.value='all';
  const document={getElementById:id=>{assert(nodes[id],`Missing DOM id ${id}`);return nodes[id];},createElement:t=>new Element(t),body:new Element(),querySelectorAll:()=>nodes.groupPicker?.children||[]};
  const context={document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},window:{print(){}},URL:{createObjectURL:()=>'',revokeObjectURL(){}},Blob,Date,setTimeout:()=>0,clearTimeout(){}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'activity.js'),'utf8'),context);vm.runInContext(fs.readFileSync(path.join(root,scriptFile),'utf8'),context);return {nodes,storage,context};
}
const makeRecord=(group,problem='安全移位',savedAt='2026-11-16T01:00:00Z')=>({schema:'ltc-team-v1',group,answers:{problem,evidence:'案例已知及待評估資料',action:'依評估與家人共同安排',outcome:'兩週後追蹤功能和負荷'},review:[false,false,false,false],savedAt});
const file=(name,value)=>({name,size:JSON.stringify(value).length,text:async()=>JSON.stringify(value)});
(async()=>{
  const sharedStorage=new Map(),student=page('index.html','app.js',sharedStorage),n=student.nodes;
  assert.equal(n.groupPicker.children.length,7);assert.equal(n.liveCards.children.length,4);
  for(const [k,v] of Object.entries(makeRecord(1).answers)){n[k].value=v;await n[k].fire('input');}
  assert(n.liveCards.text.includes('安全移位'));assert.equal(n.progress.value,4);
  await n.decisionForm.fire('submit',{preventDefault(){}});assert.equal(n.result.hidden,false);assert(n.resultCards.text.includes('安全移位'));assert(n.resultTitle.textContent.includes('第1組'));
  const saved=JSON.parse(sharedStorage.get('ltc-student-v2')).records[1];student.context.LTC.validateRecord(saved);
  const teacher=page('teacher.html','teacher.js',sharedStorage),t=teacher.nodes;
  assert.equal(t.classCount.textContent,'0 / 7組','Teacher must not automatically read student storage');
  const batch=Array.from({length:7},(_,i)=>file(`組${i+1}.json`,makeRecord(i+1)));
  await t.importFiles.fire('change',{target:{files:batch,value:''}});assert.equal(t.classCount.textContent,'7 / 7組');assert.equal(t.classResults.children.length,7);assert.equal(t.backupClass.disabled,false);
  await t.importFiles.fire('change',{target:{files:[file('舊版.json',makeRecord(1,'舊內容','2026-11-15T01:00:00Z'))],value:''}});
  assert(!t.classResults.text.includes('舊內容'));assert(t.importStatus.textContent.includes('1份為相同或較舊版本'));
  await t.importFiles.fire('change',{target:{files:[file('新版.json',makeRecord(1,'新版內容','2026-11-17T01:00:00Z'))],value:''}});assert(t.classResults.text.includes('新版內容'));
  await t.importFiles.fire('change',{target:{files:[file('異常.json',{...makeRecord(1),group:99})],value:''}});assert(t.importStatus.textContent.includes('未匯入'));
  const backup={schema:'ltc-class-v1',records:Object.values(JSON.parse(sharedStorage.get('ltc-teacher-v2')))};
  const restored=page('teacher.html','teacher.js');await restored.nodes.importFiles.fire('change',{target:{files:[file('備份.json',backup)],value:''}});assert.equal(restored.nodes.classCount.textContent,'7 / 7組');
  const freshStudent=page('index.html','app.js',sharedStorage);assert(!freshStudent.nodes.resultCards.text.includes('新版內容'),'Student must not read teacher imports');
  t.focusField.value='outcome';t.focusField.onchange();assert(!t.classResults.text.includes('新版內容'));assert(t.classResults.text.includes('兩週後'));
  for(const f of ['app.js','teacher.js','activity.js']){const code=fs.readFileSync(path.join(root,f),'utf8');new vm.Script(code);assert(!/fetch\(|script\.google\.com|jsonp\(/.test(code));}
  const studentHTML=fs.readFileSync(path.join(root,'index.html'),'utf8');assert(!/teacherView|teacherTab|teacher\.js/.test(studentHTML));
  for(const htmlFile of ['index.html','teacher.html']){const html=fs.readFileSync(path.join(root,htmlFile),'utf8');for(const m of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g))assert(fs.existsSync(path.join(root,m[1])));}
  console.log('PASS: live preview, completion, seven-group import, version protection, invalid files, backup restore, field comparison, student/teacher storage isolation, no backend requests, assets.');
})().catch(e=>{console.error(e);process.exitCode=1;});
