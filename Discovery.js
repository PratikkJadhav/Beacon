
import dgram from 'dgram'
const BROADCAST_PORT = 4000

export default class Discovery{
    constructor(peerID , peerport , onPeerFound){
        this.peerID = peerID,
        this.peerport = peerport,
        this.onPeerFound = onPeerFound


        this.socket = dgram.createSocket({type:'udp4' , reuseAddr:true});
    }


    start(){
        this.socket.bind(BROADCAST_PORT  , ()=>{
            this.socket.setBroadcast(true),
            console.log(`Discovery port listening on port:${BROADCAST_PORT}`);
            
            setInterval(()=>{
                this.sendBroadcast();
            } , 3000)
        })

        this.socket.on('message' , (message , rfinfo)=>{
            const discoveredPeer = JSON.parse(message.toString());

            if(discoveredPeer.id === this.peerID) return;


            this.onPeerFound({
                id:discoveredPeer.id,
                port:discoveredPeer.port,
                address:rfinfo.address
            })
        })
    }


    sendBroadcast(){
        const message = Buffer.from(JSON.stringify({
            id:this.peerID,
            port:this.peerport
        }))

        this.socket.send(message , 0 , message.length , BROADCAST_PORT , '255.255.255.255');
    }
}