import yargs from 'yargs';
import net from 'net';
import readline from 'readline';
import { hideBin } from 'yargs/helpers';
import Discovery from './Discovery.js';
import HeartBeat from './heartbeat.js';
import { CONFIG } from './config.js';

// Wrap in async function for top-level await
async function startApp() {
    const argv = await yargs(hideBin(process.argv))
        .option('u', {
            alias: 'username',
            type: 'string',
            demandOption: true,
            describe: 'Your username'
        })
        .parse();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: "You: "
    });

    const knownPeers = new Map();
    const myID = argv.username;
    const activeClients = new Set();
    let myTcpPort;
    let discovery;
    let heartbeat;

    // Handle new peer discovery
    function handleNewPeer(peer) {
        if (peer.id === myID) return;
        if (!knownPeers.has(peer.id)) {
            console.log(`\n[System] ${peer.id} joined (${peer.address}:${peer.port})`);
            rl.prompt(true);
        }
        knownPeers.set(peer.id, peer);
    }

    // TCP Server - Listen for incoming messages and heartbeats
    const tcpServer = net.createServer((socket) => {
        let buffer = '';
        
        socket.on('data', (data) => {
            buffer += data.toString();
            let boundary = buffer.indexOf('\n');
            while (boundary !== -1) {
                const messageStr = buffer.slice(0, boundary);
                buffer = buffer.slice(boundary + 1);
                    const message = JSON.parse(messageStr);
                    if (message.type === 'chat') {
                        if (process.stdout.isTTY) {
                            readline.clearLine(process.stdout, 0);
                            readline.cursorTo(process.stdout, 0);
                        }
                        console.log(`[${message.id}] ${message.text}`);
                        rl.prompt(true);
                    } else if (message.type === 'ping' || message.type === 'pong') {
                        heartbeat.handleMessage(message, socket.remoteAddress, socket.remotePort);
                    }
                boundary = buffer.indexOf('\n');
            }
        });
    });

    // Handle user input
    rl.on('line', (line) => {
        const text = line.trim();
        if (text.length === 0) {
            rl.prompt();
            return;
        }
        if (text.startsWith('/')) {
            handleCommand(text);
        } else {
            broadcastMessage(text);
        }
        rl.prompt();
    });

    // Broadcast message to all peers
    function broadcastMessage(text) {
        for (const peer of knownPeers.values()) {
            if (peer.id === myID) continue;
            const client = net.createConnection({
                port: peer.port,
                host: peer.address,
                timeout: 3000
            }, () => {
                const message = JSON.stringify({
                    type: 'chat',
                    id: myID,
                    text: text
                }) + '\n';
                client.write(message, () => {
                    client.once('drain', () => {
                        console.log(`[Chat] Message sent to ${peer.id}`);
                        client.end();
                    });
                });
            });

            client.on('error', (err) => {
                client.destroy();
            });

            client.on('timeout', () => {
                client.destroy();
            });
        }
    }

    // Start the application
    tcpServer.listen(0, () => {
        myTcpPort = tcpServer.address().port;
        console.log(`[System] Listening on port ${myTcpPort}`);

        // Start discovery 
        discovery = new Discovery(myID, myTcpPort, handleNewPeer, knownPeers);
        discovery.start();
        
        // Start heartbeat 
        heartbeat = new HeartBeat(myID, knownPeers, (peerID) => {
            console.log(`\n[System] ${peerID} disconnected`);
            rl.prompt(true);
        });
        heartbeat.start();
        
        rl.prompt();
    });

    // Handle Ctrl+C
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
