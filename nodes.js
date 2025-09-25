import yargs from 'yargs';
import net from 'net';
import dgram from 'dgram';
import readline from 'readline';
import { hideBin } from 'yargs/helpers';
import Discovery from './Discovery.js';





//Taking username from terminal using yargs
const argv = yargs(hideBin(process.argv)).option('u' , {alias: 'username' , type:'string' , demandOption:true}).argv;

const rl = readline.createInterface({
    input:process.stdin,
    output:process.stdout,
    prompt:"You: "
})

const knownPeers = new Map()
const myID = argv.username
let myTcpPort;

//This function will be used when new peers are found
function handleNewPeer(peer){
    if(!knownPeers.has(peer.id)){
        console.log(`Discovered ${peer.id}: ${peer.address}:${peer.port}`);
    }
    knownPeers.set(peer.id , peer)
}


function heartbeat(){
    const heartbeatBroadcast = dgram.createSocket('udp4')
    

    for(peer in knownPeers.values()){
        if(peer.id == myTcpPort) continue;
        const message = Buffer.from(`${peer.id}`)
        const reply = Buffer.from(`${myID}`)
        

        heartbeatBroadcast.send(message ,  peer.port , peer.address)

        setTimeout(() , 5000);
        heartbeatBroadcast.on('message' , (msg , rfinfo)=>{
            if(msg.toString() == myID){
                heartbeatBroadcast.send(reply ,  peer.port , peer.address)
            }
            if(msg.toString() == peer.id){
                //
            }else{
                console.log(`${peer.id} disconnected`);
                knownPeers.delete(peer.id)
            }
        })  
    }

    setTimeout(heartbeat , 3000)
}

//Listner
const nodeListner = net.createServer((socket)=>{
    
    socket.on('data' , (data)=>{
        
        const message = JSON.parse(data.toString());
        console.log(`\n${message.id} : ${message.text}`);
        rl.prompt()
    })
})
rl.on('line' , (line)=>{
    BroadcastMessage(line.trim());
    rl.prompt()
})

nodeListner.listen(0 , ()=>{
    myTcpPort = nodeListner.address().port;
    console.log(`Node listening to port ${myTcpPort}`);

    const discovery = new Discovery(myID , myTcpPort , handleNewPeer)
    discovery.start()
    
})

//Broadcaster
function BroadcastMessage(messageText){
    
    for(const peer of knownPeers.values()){
        if(peer.id == myID) continue;

        const nodeMessenger = net.createConnection({port:peer.port , host:peer.address} , ()=>{
            
            const message = {id:myID , text:messageText};
            nodeMessenger.write(JSON.stringify(message))
        })

        nodeMessenger.on('error' , (err)=>{
            console.log(err);
            
        })
    }
}


