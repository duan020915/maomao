// Guest data belongs to this browser or iOS WebView only. Account data uses Supabase.
const GUEST_KEY='maomao-guest-v1';
const GUEST_ID='local-guest';
let guestMode=false;
function guestRead(){
  try{return JSON.parse(localStorage.getItem(GUEST_KEY)||'null')}catch{return null}
}
function guestSave(){
  if(!guestMode)return;
  const value={profile:state.profile,groups:state.groups,groupId:state.group?.id,
    members:state.members,entries:state.entries,responses:state.responses,
    approvals:typeof approvalState==='undefined'?null:{requests:approvalState.requests,votes:approvalState.votes}};
  try{localStorage.setItem(GUEST_KEY,JSON.stringify(value))}
  catch{toast('本地空间不足，请删除一些游客照片后重试')}
}
function guestStart(){
  const saved=guestRead();
  guestMode=true;
  state.user={id:GUEST_ID,email:'游客 · 仅保存在这台设备'};
  state.profile=saved?.profile||{id:GUEST_ID,name:'游客',avatar:'🐱'};
  state.groups=Array.isArray(saved?.groups)?saved.groups:[{id:'local-circle',name:'我的小圈子',owner:GUEST_ID,code:'LOCAL'}];
  state.group=state.groups.find(g=>g.id===saved?.groupId)||state.groups[0];
  state.members=Array.isArray(saved?.members)?saved.members:[state.profile];
  state.entries=Array.isArray(saved?.entries)?saved.entries:[];
  state.responses=Array.isArray(saved?.responses)?saved.responses:[];
  if(typeof approvalState!=='undefined'){
    approvalState.requests=Array.isArray(saved?.approvals?.requests)?saved.approvals.requests:[];
    approvalState.votes=Array.isArray(saved?.approvals?.votes)?saved.approvals.votes:[];
  }
  state.demo=false;
  guestSave();render();
}
function guestLeave(){
  guestMode=false;
  state.user=null;state.profile=null;state.groups=[];state.group=null;
  state.members=[];state.entries=[];state.responses=[];state.filter=[];
  if(typeof approvalState!=='undefined'){approvalState.requests=[];approvalState.votes=[]}
  render();
}
