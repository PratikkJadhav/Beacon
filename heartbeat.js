import dgram from "dgram"

const HeartBeatPort = 4001
const HeartBeatInterval = 5000
const timeOut = 10000

export default class HeartBeat{
    constructor(peerID , knownPeers){
        this.peerID = peerID;
        this.knownPeers = knownPeers;

        this.pendingPongs = new Map();

        this.socket = dgram.createSocket({type:'udp4' , reuseAddr:true});
    }

    start(){
        this.socket.bind(HeartBeatPort , ()=>{
            console.log(`Listning on port: ${HeartBeatPort}`);
        });

        this.socket.on("message" , (msg , rfinfo)=>{
            const message = JSON.parse(msg.toString())

            if(message.id == this.peerID){
                return
            }
            if(message.type == "ping"){
                const pongMessage = Buffer.from(JSON.stringify({type:"pong" , id:this.peerID}))
                console.log(`${this.peerID} received PING from ${message.id}`);
                console.log(`[${this.peerID}] Sending PONG to ${message.id} at ${rfinfo.address}:${HeartBeatPort}`);
                this.socket.send(pongMessage , HeartBeatPort , rfinfo.address)
            }else if(message.type == "pong"){
                console.log(`[${this.peerID}] Received PONG from ${message.id}`);
                const senderID = message.id
                if(this.pendingPongs.has(senderID)){
                    const timeoutID = this.pendingPongs.get(senderID)
                    clearTimeout(timeoutID)
                    this.pendingPongs.delete(senderID)
                }
            }
        })

        setInterval(() => {
            this.sendPings();
        }, HeartBeatInterval);
    }


    sendPings(){
        for(const peer of this.knownPeers.values()){
            


            if(peer.id == this.peerID) continue;


            if(this.pendingPongs.has(peer.id)){
                continue; 
            };
            const pingMessage = Buffer.from(JSON.stringify({type:"ping" , id:this.peerID}))
            this.socket.send(pingMessage , HeartBeatPort , peer.address)

            const newTimeoutID = setTimeout(()=>{
                console.log(`${peer.id} disconnected`);
                this.knownPeers.delete(peer.id)
                this.pendingPongs.delete(peer.id)
                
            }, timeOut)
            this.pendingPongs.set(peer.id , newTimeoutID)
        }
    }
    
}
