import admin from 'firebase-admin';
import {env} from '../config/env.js';
if(!admin.apps.length){admin.initializeApp({credential:admin.credential.cert({projectId:env.projectId,clientEmail:env.clientEmail,privateKey:env.privateKey})})}export const db=admin.firestore();
export const auth=admin.auth();
export const FieldValue=admin.firestore.FieldValue;
