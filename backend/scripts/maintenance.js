import {db} from '../src/firebase/admin.js';const snap=await db.collection('rooms').get();console.log(`Rooms: ${snap.size}`);await db.terminate();
