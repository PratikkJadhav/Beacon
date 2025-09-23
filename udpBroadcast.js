import peers from './peers.js'

// const dgram = require('dgram')

import dgram from 'dgram'

const server = dgram.createSocket('udp4')

server.on('listening' , ()=>{
    const address = server.address()
})

server.on('message' , (msg , rfinfo)=>{
    peers(rfinfo)
})

server.bind(4000 , ()=>{
    server.setBroadcast(true)
})


const client = dgram.createSocket('udp4')
client.bind(()=>{
    client.setBroadcast(true)

    const message = Buffer.from("hello")

    client.send(message , 0 , message.length , 4000 ,'255.255.255.255' , (err)=>{
        if(err){
            console.log(err);
        }else{
            client.close()
        }
    } )
})