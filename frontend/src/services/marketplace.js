import {collection,doc,onSnapshot,query,where,orderBy} from 'firebase/firestore';
import {db} from './firebase';
export const listenProducts=(cb)=>onSnapshot(query(collection(db,'products'),where('visibility','==','public'),where('status','==','available')),s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))),e=>cb([],e));
export const listenSeller=(uid,cb)=>onSnapshot(doc(db,'sellers',uid),s=>cb(s.exists()?{uid:s.id,...s.data()}:null));
export const listenRooms=(uid,cb)=>onSnapshot(query(collection(db,'rooms'),where('participantUids','array-contains',uid),orderBy('updatedAt','desc')),s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))),e=>cb([],e));
export const listenMessages=(roomId,cb)=>onSnapshot(query(collection(db,'rooms',roomId,'messages'),orderBy('createdAt','asc')),s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))),e=>cb([],e));
