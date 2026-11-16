(function(){
  'use strict';
  const $=id=>document.getElementById(id),{groups,fields,labels,review,validateRecord,toMarkdown}=LTC;
  const KEY='ltc-teacher-v2';let records={},storageOK=true;
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');for(const value of Object.values(saved)){try{const r=validateRecord(value);records[r.group]=r;}catch{}}}catch{storageOK=false;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(records));}catch{storageOK=false;}}
  function render(){const count=Object.keys(records).length;$('classCount').textContent=`${count} / 7組`;$('missingGroups').textContent=count===7?'七組成果已齊全。':'尚缺：'+groups.filter(g=>!records[g.id]).map(g=>`第${g.id}組`).join('、');for(const id of ['downloadClass','backupClass','printClass'])$(id).disabled=!count;const focus=$('focusField').value;
    $('classResults').replaceChildren(...groups.map(g=>{const r=records[g.id],c=el('article',undefined,'card class-card'+(r?'':' empty'));c.append(el('span',`第${g.id}組`,'tag'),el('h3',g.title));if(!r){c.append(el('p','尚未匯入本組成果','muted'));return c;}c.append(el('p',`完成時間：${new Date(r.savedAt).toLocaleString('zh-TW')}`,'muted'));fields.forEach((k,i)=>{if(focus==='all'||focus===k)c.append(el('h4',labels[i]),el('p',r.answers[k],'class-answer'));});if(focus==='all'){const detail=el('details');detail.append(el('summary',`學生自我檢視：${r.review.filter(Boolean).length} / 4項`));const list=el('ul');review.forEach((s,i)=>list.append(el('li',(r.review[i]?'已確認：':'未勾選：')+s)));detail.append(list);c.append(detail);}return c;}));
  }
  $('importFiles').addEventListener('change',async e=>{let updated=0,skipped=0;const failures=[];for(const file of e.target.files){try{if(file.size>250000)throw Error('檔案過大');const parsed=JSON.parse(await file.text());const incoming=parsed?.schema==='ltc-class-v1'?parsed.records:[parsed];if(!Array.isArray(incoming)||incoming.length>7)throw Error('全班備份格式不正確');const validated=incoming.map(validateRecord);for(const r of validated){const old=records[r.group];if(!old||Date.parse(r.savedAt)>Date.parse(old.savedAt)){records[r.group]=r;updated++;}else skipped++;}}catch(err){failures.push(`${file.name}：${err.message}`);}}save();render();$('importStatus').textContent=`已更新${updated}份成果；${skipped}份為相同或較舊版本，未覆蓋。`+(failures.length?' 未匯入：'+failures.join('；'):'')+(!storageOK?' 瀏覽器無法保存，請立即下載全班備份。':' 已儲存在此瀏覽器，建議另下載備份。');e.target.value='';});
  function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('focusField').onchange=render;
  $('downloadClass').onclick=()=>download('長照活動_全班成果.md','# 長照團隊會議｜全班成果\n\n'+groups.map(g=>records[g.id]?toMarkdown(records[g.id]):`## 第${g.id}組｜${g.title}\n\n尚未匯入\n`).join('\n---\n\n'),'text/markdown;charset=utf-8');
  $('backupClass').onclick=()=>download('長照活動_全班備份.json',JSON.stringify({schema:'ltc-class-v1',records:groups.filter(g=>records[g.id]).map(g=>records[g.id])},null,2),'application/json');
  $('printClass').onclick=()=>window.print();render();if(Object.keys(records).length)$('importStatus').textContent='已載入這台裝置先前匯入的成果。';if(!storageOK)$('importStatus').textContent='瀏覽器無法保存資料，匯入後請下載備份。';
})();
