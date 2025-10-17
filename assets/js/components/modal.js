export function openModal(contentHtml){
  const root = document.getElementById('modal-root');
  if(!root) return;
  const wrap = document.createElement('div');
  wrap.className = 'modal';
  wrap.innerHTML = `<div class="card">${contentHtml}</div>`;
  function close(){ wrap.remove(); document.removeEventListener('keydown', onKey); }
  function onKey(e){ if(e.key === 'Escape') close(); }
  wrap.addEventListener('click', (e) => { if(e.target === wrap) close(); });
  document.addEventListener('keydown', onKey);
  root.appendChild(wrap);
  return { close };
}


