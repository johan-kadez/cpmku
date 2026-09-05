export function productId(){const c='abcdefghijklmnopqrstuvwxyz';const p=()=>Array.from({length:5},()=>c[Math.floor(Math.random()*c.length)]).join('');return `${p()}-${p()}`}
