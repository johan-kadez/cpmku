import {Link} from 'react-router-dom';
import Avatar from '../common/Avatar';
export default function SellerMini({seller}){if(!seller)return null;
return <Link className="seller-mini" to={`/seller/${seller.uid}`}><Avatar src={seller.photoUrl} name={seller.name}/><span><b>{seller.name}</b><small>Penjual</small></span></Link>}
