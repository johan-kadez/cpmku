export const rupiah=(v)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(v)||0);
export const dateTime=(v)=>{if(!v)return '-';const d=v?.toDate?v.toDate():new Date(v);return Number.isNaN(d.getTime())?'-':new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(d)};
