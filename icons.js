// SVG drawings adapted from the MIT-licensed Naive Icons collection.
const sketchIcons={
  '🐱':'cat','🐻':'bear','🐰':'rabbit','🐳':'fish','🐼':'bear','🦊':'fox',
  '🌱':'leaf','🌿':'leaf','🌷':'flower','🌼':'flower','🌻':'flower','☕':'coffee',
  '🕒':'clock','✨':'star','💌':'mail','💗':'heart','💬':'chat','♡':'heart',
  '✅':'check','❌':'x-circle','✓':'check','☁':'cloud','☁️':'cloud',
  '🧺':'shopping-bag','🌈':'sun','☺':'user','♧':'bell',
  '😊':'mood:okay','🥰':'mood:lovely','😌':'mood:calm','🤩':'mood:excited',
  '😵‍💫':'mood:tired','🥳':'mood:celebrate','🙂':'mood:okay'
};
const moodAssets={'😊':['okay','平静'],'🥰':['lovely','心动'],'😌':['calm','放松'],'🤩':['excited','兴奋'],'🌿':['fresh','清爽'],'😵‍💫':['tired','疲惫'],'🥳':['celebrate','雀跃'],'☁️':['quiet','低落']};
function sketchImage(name,label=''){
  const image=document.createElement('img');
  image.className='sketch-icon'+(name.startsWith('mood:')?' mood-icon':'');
  image.src=name.startsWith('mood:')?'assets/moods/'+name.slice(5)+'.svg':'assets/icons/'+name+'.svg';
  image.alt=label;
  if(!label)image.setAttribute('aria-hidden','true');
  return image;
}
function iconizeDom(root){
  const navIcons={calendar:'calendar',feed:'chat',events:'users',approvals:'shopping-bag',profile:'home'};
  root.querySelectorAll('nav [data-page]').forEach(button=>{
    const slot=button.querySelector('span');
    if(slot&&navIcons[button.dataset.page])slot.replaceChildren(sketchImage(navIcons[button.dataset.page]));
  });
  const utilityIcons=[['.topbar [data-action="refresh"]','refresh'],['.topbar [data-page="notifications"]','bell']];
  utilityIcons.forEach(([selector,name])=>root.querySelectorAll(selector).forEach(button=>button.replaceChildren(sketchImage(name))));
  root.querySelectorAll('[data-mood]').forEach(button=>{
    const entry=moodAssets[button.dataset.mood]||moodAssets['😊'];
    button.setAttribute('aria-label',entry[1]);
    button.replaceChildren(sketchImage('mood:'+entry[0]));
  });
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  const segmenter=Intl.Segmenter?new Intl.Segmenter('zh',{granularity:'grapheme'}):null;
  for(const node of nodes){
    if(!node.parentElement||node.parentElement.closest('textarea,option,select,script,style,svg'))continue;
    const parts=segmenter?Array.from(segmenter.segment(node.nodeValue),part=>part.segment):Array.from(node.nodeValue);
    if(!parts.some(part=>/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u.test(part)||sketchIcons[part]))continue;
    const fragment=document.createDocumentFragment();let buffer='';
    const flush=()=>{if(buffer){fragment.append(document.createTextNode(buffer));buffer=''}};
    for(const part of parts){
      const key=part.replace(/\uFE0F/g,'');
      if(/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u.test(part)||sketchIcons[part]){
        flush();const icon=sketchIcons[part]||sketchIcons[key];if(icon)fragment.append(sketchImage(icon));
      }else buffer+=part;
    }
    flush();node.replaceWith(fragment);
  }
}
