// The public preview uses sample data; connected builds load requests from Supabase.
const approvalState={
  requests:PREVIEW_MODE?[{
    id:'sample-purchase',user_id:'demo2',item:'猫爬架',currency:'CNY',price:299,
    reason:'两只猫最近总爱往高处跑，想给它们准备一个稳当的活动空间。',
    alternative:'看过纸箱和小型猫抓板，空间不够，也不太稳。',
    images:[],mode:'multi',group_id:'demo',created_at:new Date().toISOString()
  },{
    id:'sample-hair',user_id:'demo3',item:'想去染头发！',currency:'CNY',price:199,
    reason:'想染一个红棕色，大家觉得适合我吗？还是再等等冬天再染？',
    alternative:'也在考虑先用一次性染发膏试试颜色。',
    images:['assets/approvals/hair-sticker.webp'],mode:'multi',group_id:'demo',
    created_at:new Date(Date.now()-86400000).toISOString()
  }]:[],
  votes:[]
};
async function loadApprovalState(){
  approvalState.requests=[];
  approvalState.votes=[];
  if(!state.group)return;
  approvalState.requests=await query(db.from('mm_approval_requests').select('*').eq('group_id',state.group.id).order('created_at',{ascending:false}));
  if(approvalState.requests.length){
    approvalState.votes=await query(db.from('mm_approval_votes').select('*').in('request_id',approvalState.requests.map(request=>request.id)).order('created_at'));
  }
}
const approvalCurrency={CNY:'¥',USD:'$',EUR:'€'};
const approvalChoice={approve:'通过',reject:'驳回'};
const approvalDate=value=>new Intl.DateTimeFormat('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));
const approvalMoney=request=>`${approvalCurrency[request.currency]||'¥'} ${Number(request.price).toFixed(2).replace(/\.00$/,'')}`;
function approvalStatus(request){
  const votes=approvalState.votes.filter(v=>v.request_id===request.id);
  const required=request.mode==='single'?1:Math.max(1,state.members.length-1);
  if(votes.some(v=>v.choice==='reject'))return {label:'已驳回',tone:'rejected',votes,required};
  if(votes.filter(v=>v.choice==='approve').length>=required)return {label:'已通过',tone:'approved',votes,required};
  return {label:'待审批',tone:'pending',votes,required};
}
function approvalImages(request){
  return request.images?.length?`<div class="approval-images">${request.images.map((src,i)=>`<img src="${esc(src)}" alt="${esc(request.item)}的参考图片 ${i+1}">`).join('')}</div>`:'';
}
function approvalsPage(){
  const requests=approvalState.requests.filter(r=>r.group_id===state.group?.id).sort((a,b)=>b.created_at.localeCompare(a.created_at));
  return `<section class="approval-page"><p class="approval-intro">🧾 把想买的东西、价格和理由写清楚。朋友的意见不会产生付款。</p><div class="approval-list">${requests.map(request=>{
    const status=approvalStatus(request),author=member(request.user_id);
    const yes=status.votes.filter(v=>v.choice==='approve').length,no=status.votes.filter(v=>v.choice==='reject').length;
    const latest=status.votes.at(-1);
    const pictures=request.images?.length?request.images:[];
    return `<article class="approval-card" data-approval-card="${esc(request.id)}" tabindex="0" aria-label="查看${esc(request.item)}的审批申请"><div class="approval-card-head"><span class="avatar">${esc(author.avatar)}</span><div class="approval-author"><b>${esc(author.name)}</b><time datetime="${esc(request.created_at)}">${approvalDate(request.created_at)} · ${request.mode==='single'?'单人审批':'多人审批'}</time></div><button class="approval-card-more" type="button" data-approval-comment="${esc(request.id)}" aria-label="查看${esc(request.item)}的详情">•••</button></div><div class="approval-card-body"><div class="approval-card-copy"><div class="approval-item"><strong>${esc(request.item)}</strong><b>${approvalMoney(request)}</b></div><p class="approval-reason">${esc(request.reason)}</p></div><div class="approval-card-art">${pictures.length?`<img src="${esc(pictures[0])}" alt="${esc(request.item)}的参考图片 1" loading="lazy">`:`<img src="assets/approvals/shopping-sticker.webp" alt="" aria-hidden="true">`}</div></div>${pictures.length>1?`<div class="approval-card-images">${pictures.slice(1).map((src,i)=>`<img src="${esc(src)}" alt="${esc(request.item)}的参考图片 ${i+2}" loading="lazy">`).join('')}</div>`:''}<div class="approval-card-footer"><div class="approval-card-actions"><button type="button" data-approval-vote="approve" data-id="${esc(request.id)}"><img class="approval-vote-mark" src="assets/approvals/check-crayon.svg" alt="" aria-hidden="true"> 建议买 <span>${yes}</span></button><button type="button" data-approval-vote="reject" data-id="${esc(request.id)}"><img class="approval-vote-mark" src="assets/approvals/cross-crayon.svg" alt="" aria-hidden="true"> 再想想 <span>${no}</span></button></div><div class="approval-card-social"><button type="button" data-approval-comment="${esc(request.id)}" aria-label="查看评论，共${status.votes.length}条"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 7Q2 12 5 21q2 4 7 4l-5 4 9-4q9 0 11-8 2-9-7-12Q11 2 6 7Z"/></svg><span>${status.votes.length}</span></button><button type="button" data-approval-vote="approve" data-id="${esc(request.id)}" aria-label="赞成，共${yes}票"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 27Q2 17 4 10q2-8 9-5l3 4 3-4q7-3 9 5 2 7-12 17Z"/></svg><span>${yes}</span></button></div></div>${latest?`<p class="approval-card-comment"><b>${esc(member(latest.user_id).name)}：</b>${esc(latest.reason)}</p>`:''}<div class="approval-progress"><span class="approval-badge ${status.tone}">${status.label}</span><span>${status.votes.length} / ${status.required} 人已回复</span></div></article>`;
  }).join('')||'<div class="empty">还没有购买申请，来发起第一条吧。</div>'}</div></section>`;
}
function approvalForm(){
  return `<section class="approval-page approval-compose"><button class="approval-back" type="button" data-approval-action="back">← 返回审批列表</button><form id="approvalrequestform"><label for="approval-item">想买什么 <em>*</em></label><input id="approval-item" name="item" maxlength="80" required placeholder="例如：无线降噪耳机、机械键盘…"><label for="approval-price">价格 <em>*</em></label><div class="approval-price-row"><select name="currency" aria-label="币种"><option value="CNY">¥ 人民币</option><option value="USD">$ 美元</option><option value="EUR">€ 欧元</option></select><input id="approval-price" name="price" type="number" min="0.01" max="9999999" step="0.01" inputmode="decimal" required placeholder="0.00"></div><label for="approval-reason">为什么想买？ <em>*</em></label><textarea id="approval-reason" name="reason" maxlength="300" required placeholder="说说你为什么需要它…"></textarea><label for="approval-alternative">有没有更便宜的替代品？</label><textarea id="approval-alternative" name="alternative" maxlength="300" placeholder="有 / 没有，简单说明"></textarea><label for="approval-images">上传图片（选填，最多 3 张）</label><div class="approval-photo-picker"><label class="approval-photo-add" for="approval-images"><span>＋</span>添加图片</label><input id="approval-images" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden><div id="approval-photo-preview" class="approval-photo-preview"></div></div><h3>审批方式</h3><div class="approval-methods"><label><input type="radio" name="mode" value="single"><span><b>单人审批</b><small>一人回复后结束</small></span></label><label><input type="radio" name="mode" value="multi" checked><span><b>多人审批</b><small>汇总圈里朋友的意见</small></span></label></div><h3>发送到哪里</h3><div class="approval-destination"><span class="avatar">🌱</span><div><b>${esc(state.group?.name||'小圈子')}</b><small>${state.members.length} 位朋友${PREVIEW_MODE?' · 演示审批群':' · 我的圈子'}</small></div></div><p id="formerror" class="error"></p><button class="primary approval-submit" type="submit">提交审批</button></form></section>`;
}
function approvalDialog(id,selectedChoice){
  const request=approvalState.requests.find(r=>r.id===id);
  if(!request)return toast('找不到这条申请');
  const status=approvalStatus(request),author=member(request.user_id);
  const mine=status.votes.find(v=>v.user_id===((PREVIEW_MODE?'demo1':state.user?.id)));
  const canVote=PREVIEW_MODE||request.user_id!==state.user?.id;
  const voteForm=canVote?`<form id="approvalvoteform" data-id="${esc(id)}"><div class="approval-vote-options"><label><input type="radio" name="choice" value="approve" ${mine?.choice==='approve'?'checked':''} required><span>通过</span></label><label><input type="radio" name="choice" value="reject" ${mine?.choice==='reject'?'checked':''} required><span>驳回</span></label></div><label for="approval-vote-reason">回复理由 <em>*</em></label><textarea id="approval-vote-reason" name="reason" maxlength="300" required placeholder="说说你为什么这样决定…">${esc(mine?.reason||'')}</textarea><p id="formerror" class="error"></p><button class="primary approval-submit" type="submit">提交回复</button></form>`:'<p class="approval-detail-status">这是你发起的申请，等朋友来回复吧。</p>';
  modal('看看这笔想买买',`<div class="approval-detail-head"><span class="avatar">${esc(author.avatar)}</span><div><b>${esc(author.name)}发起的审批</b><small>${approvalDate(request.created_at)} · ${request.mode==='single'?'单人审批':'多人审批'}</small></div></div><div class="approval-detail-item"><strong>${esc(request.item)}</strong><b>${approvalMoney(request)}</b></div><div class="approval-detail-row"><small>购买理由</small><p>${esc(request.reason)}</p></div><div class="approval-detail-row"><small>替代品</small><p>${esc(request.alternative||'暂未填写')}</p></div>${approvalImages(request)}<p class="approval-detail-status">${status.label} · 已有 ${status.votes.length} / ${status.required} 人回复</p>${voteForm}${status.votes.length?`<div class="approval-replies"><h3>大家的回复</h3>${status.votes.map(v=>`<p><b>${esc(member(v.user_id).name)} · ${approvalChoice[v.choice]}</b>：${esc(v.reason)}</p>`).join('')}</div>`:''}`);
  $('#modal').classList.add('approval-dialog');
  if(selectedChoice){const input=$('#modal input[name="choice"][value="'+selectedChoice+'"]');if(input)input.checked=true}
}
document.addEventListener('click',event=>{
  const vote=event.target.closest('[data-approval-vote]');
  if(vote){approvalDialog(vote.dataset.id,vote.dataset.approvalVote);return}
  const comment=event.target.closest('[data-approval-comment]');
  if(comment){approvalDialog(comment.dataset.approvalComment);return}
  const button=event.target.closest('[data-approval-action]');
  if(button){
    if(button.dataset.approvalAction==='new'){if(!requireUser())return;if(!state.group){groupsDialog();return}state.page='approval-form';render()}
    if(button.dataset.approvalAction==='back'){state.page='approvals';render()}
    return;
  }
  const card=event.target.closest('[data-approval-card]');
  if(card&&!event.target.closest('button,a,input,textarea,select'))approvalDialog(card.dataset.approvalCard);
});
document.addEventListener('keydown',event=>{
  if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-approval-card]')){
    event.preventDefault();approvalDialog(event.target.dataset.approvalCard);
  }
});
let approvalPhotoUrls=[];
document.addEventListener('change',event=>{
  if(event.target.id!=='approval-images')return;
  approvalPhotoUrls.forEach(url=>URL.revokeObjectURL(url));
  approvalPhotoUrls=[];
  const input=event.target,files=Array.from(input.files||[]),preview=$('#approval-photo-preview');
  preview.replaceChildren();
  if(files.length>3){input.value='';error('最多上传 3 张图片');return}
  for(const file of files){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024){
      input.value='';preview.replaceChildren();error('请选择不超过 8 MB 的 JPG、PNG 或 WebP 图片');return;
    }
    const url=URL.createObjectURL(file);approvalPhotoUrls.push(url);
    const image=document.createElement('img');image.src=url;image.alt=file.name;
    preview.append(image);
  }
});
document.addEventListener('submit',async event=>{
  const form=event.target;
  if(!['approvalrequestform','approvalvoteform'].includes(form.id))return;
  event.preventDefault();
  const button=event.submitter;
  button.disabled=true;
  try{
    const data=new FormData(form);
    if(form.id==='approvalrequestform'){
      const item=String(data.get('item')||'').trim();
      const price=Number(data.get('price'));
      const reason=String(data.get('reason')||'').trim();
      const alternative=String(data.get('alternative')||'').trim();
      const currency=String(data.get('currency')||'');
      const mode=String(data.get('mode')||'');
      const files=data.getAll('images').filter(file=>file?.size);
      if(!item||!reason)throw Error('请填写想买的东西和购买理由');
      if(!Number.isFinite(price)||price<0.01||price>9999999)throw Error('请填写正确的价格');
      if(!approvalCurrency[currency]||!['single','multi'].includes(mode))throw Error('请检查币种和审批方式');
      if(files.length>3)throw Error('最多上传 3 张图片');
      const images=[];
      for(const file of files)images.push(await compress(file));
      if(PREVIEW_MODE||guestMode){
        approvalState.requests.unshift({id:'approval-'+Date.now(),user_id:guestMode?GUEST_ID:'demo1',item,price,currency,reason,alternative,images,mode,group_id:state.group.id,created_at:new Date().toISOString()});
      }else{
        await query(db.from('mm_approval_requests').insert({user_id:state.user.id,item,price,currency,reason,alternative,images,mode,group_id:state.group.id}));
        await loadApprovalState();
      }
      state.page='approvals';guestSave();render();toast(guestMode?'已保存在这台设备':PREVIEW_MODE?'模拟审批已发起，朋友可以来回复啦':'审批已发给圈里的朋友');
    }else{
      const choice=String(data.get('choice')||'');
      const reason=String(data.get('reason')||'').trim();
      if(!approvalChoice[choice])throw Error('请选择通过或驳回');
      if(!reason)throw Error('请写下回复理由');
      if(PREVIEW_MODE||guestMode){
        approvalState.votes=approvalState.votes.filter(v=>!(v.request_id===form.dataset.id&&v.user_id===(guestMode?GUEST_ID:'demo1')));
        approvalState.votes.push({request_id:form.dataset.id,user_id:guestMode?GUEST_ID:'demo1',choice,reason,created_at:new Date().toISOString()});
      }else{
        await query(db.from('mm_approval_votes').upsert({request_id:form.dataset.id,user_id:state.user.id,choice,reason,created_at:new Date().toISOString()},{onConflict:'request_id,user_id'}));
        await loadApprovalState();
      }
      $('#modal').close();guestSave();render();toast(guestMode?'已保存在这台设备':PREVIEW_MODE?'模拟审批回复已记录':'审批回复已保存');
    }
  }catch(err){error(err.message)}
  finally{if(button.isConnected)button.disabled=false}
});
