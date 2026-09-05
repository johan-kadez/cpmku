const req=['FIREBASE_PROJECT_ID','FIREBASE_CLIENT_EMAIL','FIREBASE_PRIVATE_KEY'];
export const env={projectId:process.env.FIREBASE_PROJECT_ID||'',clientEmail:process.env.FIREBASE_CLIENT_EMAIL||'',privateKey:(process.env.FIREBASE_PRIVATE_KEY||'').replace(/\\n/g,'\n'),adminEmails:(process.env.ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean),origin:process.env.PUBLIC_APP_ORIGIN||'*'};
export function assertEnv(){const missing=req.filter(k=>!process.env[k]);
if(missing.length)throw new Error(`Missing environment variables: ${missing.join(', ')}`)}
