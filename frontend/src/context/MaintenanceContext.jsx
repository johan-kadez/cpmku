import {createContext,useContext,useEffect,useState} from 'react';
import {doc,onSnapshot} from 'firebase/firestore';
import {db,firebaseReady} from '../services/firebase';
const C=createContext({loading:true,settings:{maintenanceMode:false}});
export function MaintenanceProvider({children}){const [state,setState]=useState({loading:true,settings:{maintenanceMode:false}});useEffect(()=>{if(!firebaseReady){setState({loading:false,settings:{maintenanceMode:false}});return}return onSnapshot(doc(db,'settings','main'),s=>setState({loading:false,settings:s.exists()?s.data():{maintenanceMode:false}}),()=>setState({loading:false,settings:{maintenanceMode:false}}))},[]);return <C.Provider value={state}>{children}</C.Provider>};export const useMaintenance=()=>useContext(C);
