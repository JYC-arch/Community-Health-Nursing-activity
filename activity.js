(function (root) {
  'use strict';
  const groups = [
    {id:1,title:'整體評估',short:'掌握全貌',description:'建立需要評估的優先順序，分清楚已知事實與資訊缺口。',questions:['最優先補問哪3件事？','這些資料會改變哪些照顧安排？'],hint:'可從健康與功能、認知情緒、個案意願、環境和家庭支持思考。不要只列量表名稱。',reference:['先釐清移位需要何種協助、跌倒或疼痛情形，並了解目前醫療與照護需求。','確認王女士的生活目標、認知與理解能力，以及丈夫實際可承擔的工作和替代人力。','了解家中動線、廁所與浴室，以及外籍看護是否已聘僱。正式整合評估後才確認CMS與服務資格。']},
    {id:2,title:'功能與安全',short:'兼顧自主',description:'從生活活動辨認風險，讓安全安排支持自主，而不只是限制活動。',questions:['優先處理哪2項風險？','如何讓王女士參與，而不是全部代勞？'],hint:'區別基本生活自理與較複雜的生活能力。列出需進一步觀察的動作與環境。',reference:['已知移位與沐浴需協助、浴室濕滑且無扶手；需進一步觀察平衡、承重、理解與協助程度。','討論合適的移位協助、輔具與防滑環境；扶手等改善須經適當評估，不直接指定規格。','保留自行進食及可參與的動作，與本人共同設定安全如廁等生活目標；不可由ADLs直接推定CMS。']},
    {id:3,title:'家庭照顧者',short:'支持照顧者',description:'了解家庭意願與能力的落差，回應身體、心理、時間與支持需要。',questions:['丈夫與女兒可能有哪些負荷？','除了教技巧，還需要哪2項支持？'],hint:'願意照顧不等於體力足夠。思考夜間照顧、腰痛、工作、替代人力與休息。',reference:['評估丈夫腰痛、移位能力、睡眠、情緒與可休息時段，並了解女兒的安排與負荷。','依需要討論喘息、居家或社區服務、適當輔具與輪替人力；心理支持與喘息不能完全互相替代。','用實際休息、負荷感受和安全照顧能力追蹤；不能只以家屬表示願意就認定足以照顧。']},
    {id:4,title:'服務選擇',short:'連結生活',description:'依本人意願、功能與家庭條件，比較可行的服務組合。',questions:['現階段優先討論哪些服務？','居家、社區與機構各有哪些適配條件？'],hint:'先說明需要，再談服務；考量接送、可用人力、時段、資格和費用。',reference:['居家照顧可能回應沐浴與生活協助，專業服務可依評估回應功能與照顧技巧需要。','社區式服務需評估活動適配、接送及本人意願；住宿式服務也應依持續照顧需要與家庭條件討論。','同時考慮交通、輔具或環境改善、喘息等，避免把一種服務當成所有問題的解答。']},
    {id:5,title:'申請與給付',short:'說清楚規則',description:'以案家能理解的方式，說明申請入口、給付與待確認條件。',questions:['如何回答外籍看護與免費的問題？','哪些資格、服務類別與規則還需確認？'],hint:'可從1966、地方照管中心、出院準備窗口開始。分開理解CMS、四包錢與部分負擔。',reference:['先確認是否已聘僱外籍看護；聘有外籍看護不等於完全不能用，也不等於所有服務均可用，仍依各服務現行規範確認。','可透過1966、地方照管中心或出院準備窗口申請；完成正式評估後連結照顧計畫與服務。','長照不是全部免費；身分別、服務類別、額度和使用量影響負擔。照顧及專業服務0%、5%、16%的比例不能套用所有項目。']},
    {id:6,title:'護理與復能',short:'設定生活目標',description:'把生活願望轉成可觀察的目標，並確認家庭能安全執行照顧。',questions:['提出1個具體、可觀察的生活目標。','誰協助、如何介入？怎麼確認家屬學會？'],hint:'目標要在評估後共同設定。用回覆示教確認技巧，不只問「懂了嗎」。',reference:['目標可圍繞安全床椅移位或如廁參與；協助程度與達成時間需依評估協商，不憑案例承諾。','護理人員辨識風險、教導與協調，並依需要與相關專業合作；照顧者體力不足時需調整方法或人力。','示範後請家屬回覆示教，觀察安全步驟並修正，再追蹤本人參與和所需協助，而非只記錄已衛教。']},
    {id:7,title:'追蹤與整合',short:'確認改變',description:'用個案與家庭的結果檢視照顧計畫，辨識需要重新評估的變化。',questions:['兩週後追蹤哪3項結果？','哪些變化需要回報、調整或轉介？'],hint:'回到生活目標，區分服務次數與照顧成效。想想功能、風險和照顧者負荷。',reference:['可追蹤移位所需協助與跌倒或近跌倒、如廁等生活目標，以及丈夫負荷和休息情形。','確認服務是否實際接上、時間是否合用、個案是否接受；服務次數不是唯一成效。','功能惡化、急性異常或照顧人力中斷時，依緊急程度尋求醫療或通報協調，並重新檢視計畫。']}
  ];
  const fields = ['problem','evidence','action','outcome'];
  const labels = ['優先問題','依據與待確認資料','建議行動與理由','成效與追蹤'];
  const review = ['我們的判斷有案例依據，並區分已知與未知。','建議符合王女士意願，也考慮家庭能力與服務條件。','行動有具體分工，不把所有工作交給家屬。','成效可以觀察，並有追蹤時間與調整條件。'];
  function complete(answers) {return fields.every(k=>typeof answers?.[k]==='string' && answers[k].trim().length>0);}
  function validateRecord(r) {
    if (!r || r.schema!=='ltc-team-v1' || !Number.isInteger(r.group) || r.group<1 || r.group>7 || !complete(r.answers)) throw Error('不是有效的長照小組成果檔');
    if (fields.some(k=>r.answers[k].length>1500) || typeof r.savedAt!=='string' || !Number.isFinite(Date.parse(r.savedAt))) throw Error('成果資料或時間格式不正確');
    return {schema:'ltc-team-v1',group:r.group,answers:Object.fromEntries(fields.map(k=>[k,r.answers[k].trim()])),review:review.map((_,i)=>r.review?.[i]===true),savedAt:new Date(r.savedAt).toISOString()};
  }
  function toMarkdown(r) {
    const g=groups[r.group-1];
    return `# 第${r.group}組｜${g.title}\n\n長照團隊會議：王女士返家照顧計畫\n\n完成時間：${new Date(r.savedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})}\n\n`+fields.map((k,i)=>`## ${labels[i]}\n\n${r.answers[k]}\n\n`).join('')+'## 自我檢視\n\n'+review.map((s,i)=>`- [${r.review?.[i]?'x':' '}] ${s}`).join('\n')+'\n';
  }
  root.LTC={groups,fields,labels,review,complete,validateRecord,toMarkdown};
})(typeof globalThis!=='undefined'?globalThis:window);
