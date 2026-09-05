import { execSync } from 'node:child_process';
 import { readdirSync, statSync } from 'node:fs';
 import { join } from 'node:path';
function walk(d){return readdirSync(d).flatMap(n=>{const p=join(d,n);
return statSync(p).isDirectory()?walk(p):[p]}).filter(p=>/\.(js|jsx)$/.test(p));
}
for(const f of walk('backend')) if(f.endsWith('.js')) execSync(`node --check ${JSON.stringify(f)}`,{stdio:'inherit'});
console.log('Backend syntax OK. JSX is validated by Vite build.');
