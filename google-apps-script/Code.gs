/** 綁定在教師的 Google 試算表。先執行 setupClassroom，再部署為網頁應用程式。 */
const TAB = '長照成果';
const FIELDS = ['problem', 'evidence', 'action', 'outcome'];

function setupClassroom() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt('建立長照課堂', '輸入至少6字元的課堂代碼，提供給本班學生即可。請勿使用您的帳號密碼。', ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() !== ui.Button.OK) return;
  const code = result.getResponseText().trim();
  if (code.length < 6 || code.length > 80) throw new Error('課堂代碼需6至80字元。');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(TAB);
  if (!sheet) sheet = ss.insertSheet(TAB);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['課堂雜湊', '組別', '編輯權雜湊', '成果JSON', '更新時間']);
    sheet.setFrozenRows(1);
  }
  PropertiesService.getScriptProperties().setProperties({SPREADSHEET_ID:ss.getId(),ROOM_HASH:hash_(code)});
  ui.alert('課堂已建立。接著部署為「網頁應用程式」，執行身分選自己，誰可以存取選「任何人」。不需要公開或分享試算表。');
}

function hash_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(s),Utilities.Charset.UTF_8).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');
}
function auth_(room) {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SPREADSHEET_ID') || !props.getProperty('ROOM_HASH')) throw new Error('教師尚未執行setupClassroom。');
  if (typeof room !== 'string' || room.length<6 || room.length>80 || hash_(room)!==props.getProperty('ROOM_HASH')) throw new Error('課堂代碼不正確。');
  return {sheet:SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID')).getSheetByName(TAB),roomHash:hash_(room)};
}
function response_(data,callback) {
  const text=JSON.stringify(data).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  if (callback && /^ltc_cb_[a-f0-9]{32}$/.test(callback)) return ContentService.createTextOutput(callback+'('+text+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}
function doGet(e) {
  const p=e.parameter||{};
  try {
    const ctx=auth_(p.room);
    if(p.action==='status') {
      if(!/^[a-f0-9]{32}$/.test(p.requestId||'')||!/^[a-f0-9]{32}$/.test(p.token||'')) throw new Error('確認請求格式不正確。');
      const raw=CacheService.getScriptCache().get('req:'+ctx.roomHash+':'+p.requestId);
      const status=raw?JSON.parse(raw):null;
      if(status && status.owner!==hash_(p.token)) throw new Error('無法查詢此請求。');
      return response_({ok:true,status:status?status.status:'pending',message:status?status.message:''},p.callback);
    }
    if(p.action!=='list') throw new Error('不支援的操作。');
    const rows=ctx.sheet.getDataRange().getValues();
    const records=rows.slice(1).filter(row=>row[0]===ctx.roomHash).map(row=>JSON.parse(row[3]));
    return response_({ok:true,records},p.callback);
  } catch(err) {return response_({ok:false,error:err.message},p.callback);}
}
function validate_(r) {
  if(!r||r.schema!=='ltc-team-v1'||!Number.isInteger(r.group)||r.group<1||r.group>7) throw new Error('組別或成果格式不正確。');
  if(!FIELDS.every(k=>typeof r.answers?.[k]==='string'&&r.answers[k].trim().length>0&&r.answers[k].length<=1500)) throw new Error('請完成四格內容，每格最多1500字元。');
  return {schema:'ltc-team-v1',group:r.group,answers:Object.fromEntries(FIELDS.map(k=>[k,r.answers[k].trim()])),review:[0,1,2,3].map(i=>r.review?.[i]===true),savedAt:new Date().toISOString()};
}
function doPost(e) {
  let request,ctx,owner,lock;
  try {
    if(!e.postData||e.postData.contents.length>25000) throw new Error('資料過大或沒有內容。');
    request=JSON.parse(e.postData.contents);ctx=auth_(request.room);
    if(!/^[a-f0-9]{32}$/.test(request.token||'')||!/^[a-f0-9]{32}$/.test(request.requestId||'')) throw new Error('送出識別碼不正確。');
    owner=hash_(request.token);
    const record=validate_(request.record);
    lock=LockService.getScriptLock();lock.waitLock(10000);
    const rows=ctx.sheet.getDataRange().getValues();
    const index=rows.findIndex((row,i)=>i>0&&row[0]===ctx.roomHash&&Number(row[1])===record.group);
    if(index>=0 && rows[index][2] && rows[index][2]!==owner) throw new Error('本組已由另一台裝置送出。請用原裝置修改；需要更換裝置時，請教師執行unlockGroup。');
    const values=[[ctx.roomHash,record.group,owner,JSON.stringify(record),record.savedAt]];
    ctx.sheet.getRange(index>=0?index+1:ctx.sheet.getLastRow()+1,1,1,5).setValues(values);
    SpreadsheetApp.flush();
    CacheService.getScriptCache().put('req:'+ctx.roomHash+':'+request.requestId,JSON.stringify({owner,status:'saved',message:''}),600);
    return response_({ok:true});
  } catch(err) {
    if(ctx&&owner&&request?.requestId) CacheService.getScriptCache().put('req:'+ctx.roomHash+':'+request.requestId,JSON.stringify({owner,status:'error',message:err.message}),600);
    return response_({ok:false,error:err.message});
  } finally {if(lock&&lock.hasLock()) lock.releaseLock();}
}
/** 僅教師能從Apps Script編輯器執行；不對外提供。保留成果，允許下一台裝置接手本組。 */
function unlockGroup() {
  const ui=SpreadsheetApp.getUi(),r=ui.prompt('更換填寫裝置','輸入要解鎖的組別（1–7）',ui.ButtonSet.OK_CANCEL);
  if(r.getSelectedButton()!==ui.Button.OK)return;
  const group=Number(r.getResponseText());if(!Number.isInteger(group)||group<1||group>7)throw new Error('組別須為1–7。');
  const props=PropertiesService.getScriptProperties(),sheet=SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID')).getSheetByName(TAB);
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{const rows=sheet.getDataRange().getValues(),index=rows.findIndex((row,i)=>i>0&&row[0]===props.getProperty('ROOM_HASH')&&Number(row[1])===group);if(index>=0)sheet.getRange(index+1,3).clearContent();ui.alert('已允許第'+group+'組由下一台裝置送出。');}finally{lock.releaseLock();}
}
