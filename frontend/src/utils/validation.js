export const required=(value,label)=>{if(!String(value??'').trim())throw new Error(`${label} wajib diisi.`)};
export const validUrl=(value,label)=>{required(value,label);
try{new URL(value)}catch{throw new Error(`${label} harus berupa URL yang valid.`)}};
