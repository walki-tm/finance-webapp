export const nice = (n)=> (n??0).toLocaleString('it-IT',{style:'currency',currency:'EUR'})
export const alpha = (hex,a=1)=>{const h=hex.replace('#','');const b=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16);const r=(b>>16)&255,g=(b>>8)&255,u=b&255;return `rgba(${r}, ${g}, ${u}, ${a})`}
export const storageKey='fm_state_v1'
export const loadState=()=>{ try{ return JSON.parse(localStorage.getItem(storageKey)) || null }catch{ return null } }
export const saveState=(s)=> localStorage.setItem(storageKey, JSON.stringify(s))
export const uuid=()=> (typeof crypto!=='undefined' && crypto.randomUUID? crypto.randomUUID(): Math.random().toString(36).slice(2))
