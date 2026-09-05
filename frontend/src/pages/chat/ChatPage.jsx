import {Link,useParams} from 'react-router-dom';
import {useRooms} from '../../hooks/useChat';
import ChatRoom from '../../components/chat/ChatRoom';
export default function ChatPage(){const {roomId}=useParams();
const rooms=useRooms();
const room=rooms.find(r=>r.id===roomId)||rooms[0];
return <div className="chat-layout"><aside><h2>Transaksi</h2>{rooms.map(r=><Link className="room-item" to={`/chat/${r.id}`} key={r.id}>#{r.productId}<small>{r.status}</small></Link>)}{!rooms.length&&<p>Belum ada transaksi.</p>}</aside><ChatRoom room={room}/></div>}
