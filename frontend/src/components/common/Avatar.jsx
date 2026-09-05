export default function Avatar({src,name}){return src?<img className="avatar" src={src} alt={name||'avatar'}/>:<div className="avatar fallback">{(name||'?').slice(0,1).toUpperCase()}</div>}
