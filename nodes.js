import peers from './peers.js';
// const yargs = require('yargs')
// const net = require('net')
// const readline = require('readline')

import yargs from 'yargs';
import net from 'net';
import readline from 'readline';
import { hideBin } from 'yargs/helpers';


const argv = yargs(hideBin(process.argv)).option('u' , {alias: 'username' , type:'string' , demandOption:true}).argv;

const rl = readline.createInterface({
    input:process.stdin,
    output:process.stdout,
    prompt:"You: "
})


const nodeMessenger = net.createConnection({port:peers.port , host:peers.address},()=>{
    rl.prompt();
})

rl.on('line',(line)=>{
    nodeMessenger.write(line),
    rl.prompt();
})

nodeMessenger.on("end" , ()=>{
    rl.close()
})

const nodeListner = net.createServer((socket)=>{
    socket.on('data' , (data)=>{
        console.log(`${argv}: ` , data.toString().trim());
    })

    socket.on('end' , ()=>{
        console.log("disconnected");
            
    })
})

nodeListner.listen(0)