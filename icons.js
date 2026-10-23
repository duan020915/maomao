// SVG drawings adapted from the MIT-licensed Naive Icons collection.
const sketchIcons={
  '🐱':'cat','🐻':'bear','🐰':'rabbit','🐳':'fish','🐼':'bear','🦊':'fox',
  '🌱':'leaf','🌿':'leaf','🌷':'flower','🌼':'flower','🌻':'flower',
  '✨':'star','💗':'crayon:like-filled','💬':'chat','♡':'crayon:like-outline',
  '☁':'cloud','☁️':'cloud','💌':'crayon:notification',
  '☺':'crayon:nav-profile','♧':'bell',
  '😊':'mood:okay','🥰':'mood:lovely','😌':'mood:calm','🤩':'mood:excited',
  '😵‍💫':'mood:tired','🥳':'mood:celebrate','🙂':'mood:okay'
};
const moodAssets={'😊':['okay','平静'],'🥰':['lovely','心动'],'😌':['calm','放松'],'🤩':['excited','兴奋'],'🌿':['fresh','清爽'],'😵‍💫':['tired','疲惫'],'🥳':['celebrate','雀跃'],'☁️':['quiet','低落']};
function sketchImage(name,label=''){
  const image=document.createElement('img');
  const supplied={leaf:'doodle-leaf',flower:'doodle-flower',star:'doodle-star',heart:'sticker-heart',chat:'comment',bell:'notification',cloud:'mood-cloud'};
  const crayon=name.startsWith('crayon:')?name.slice(7):supplied[name];
  image.className='sketch-icon'+(name.startsWith('mood:')?' mood-icon':'')+(crayon?' crayon-icon':'');
  image.src=crayon?'assets/crayon/'+crayon+'.png':name.startsWith('mood:')?'assets/moods/'+name.slice(5)+'.svg':'assets/icons/'+name+'.svg';
  image.alt=label;
  if(!label)image.setAttribute('aria-hidden','true');
  return image;
}
function iconizeDom(root){
  const navIcons={calendar:'crayon:nav-calendar',feed:'crayon:nav-home',events:'crayon:nav-meet',approvals:'crayon:nav-approval',profile:'crayon:nav-profile'};
  root.querySelectorAll('nav [data-page]').forEach(button=>{
    const slot=button.querySelector('span');
    if(slot&&navIcons[button.dataset.page])slot.replaceChildren(sketchImage(navIcons[button.dataset.page]));
  });
  const utilityIcons=[['.topbar [data-page="notifications"]','crayon:notification']];
  utilityIcons.forEach(([selector,name])=>root.querySelectorAll(selector).forEach(button=>button.replaceChildren(sketchImage(name))));
  root.querySelectorAll('.topbar-login').forEach(button=>button.replaceChildren(sketchImage('crayon:nav-profile')));
  root.querySelectorAll('[data-action="compose"]').forEach(button=>{
    if(button.querySelector('.crayon-icon'))return;
    const first=button.firstChild;
    if(first?.nodeType===Node.TEXT_NODE)first.nodeValue=first.nodeValue.replace(/^\s*＋\s*/, '');
    button.prepend(sketchImage('crayon:compose'));
  });
  root.querySelectorAll('[data-approval-action="new"]').forEach(button=>{
    button.firstChild?.nodeType===Node.TEXT_NODE&&(button.firstChild.nodeValue=button.firstChild.nodeValue.replace(/^\s*＋\s*/,''));
    button.prepend(sketchImage('crayon:compose'));
  });
  root.querySelectorAll('.approval-photo-add span').forEach(slot=>slot.replaceChildren(sketchImage('crayon:add-photo')));
  root.querySelectorAll('[data-mood]').forEach(button=>{
    // Preserve the custom hand-drawn PNG sticker and label in the new mood picker.
    if(button.querySelector('.mood-sticker'))return;
    const entry=moodAssets[button.dataset.mood];
    if(!entry)return;
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
        flush();const icon=sketchIcons[part]||sketchIcons[key];fragment.append(icon?sketchImage(icon):document.createTextNode(part));
      }else buffer+=part;
    }
    flush();node.replaceWith(fragment);
  }
}
