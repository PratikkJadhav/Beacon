import dgram from 'dgram';
import { CONFIG } from './config.js';

export default class Discovery {
    constructor(peerID, peerPort, onPeerFound, knownPeers) {
        this.peerID = peerID;
        this.peerPort = peerPort;
        this.onPeerFound = onPeerFound;
        this.knownPeers = knownPeers;
        this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        this.intervalID = null;
    }

    start() {
        this.socket.bind(CONFIG.BROADCAST_PORT, '0.0.0.0', () => {
            this.socket.setBroadcast(true);
            console.log(`[Discovery] ${this.peerID} listening on port ${CONFIG.BROADCAST_PORT}`);
            this.sendBroadcast();
            this.intervalID = setInterval(() => {
                this.sendBroadcast();
            }, CONFIG.BROADCAST_INTERVAL);
        });

        this.socket.on('message', (message, rinfo) => {
                const discoveredPeer = JSON.parse(message.toString());
                if (discoveredPeer.id === this.peerID) return;
                if (!discoveredPeer.id || !discoveredPeer.port) return;


                const existingPeer = this.knownPeers.get(discoveredPeer.id);
                if (!existingPeer || existingPeer.port !== discoveredPeer.port || existingPeer.address !== rinfo.address) {
                    console.log(`[Discovery] ${this.peerID} discovered ${discoveredPeer.id} at ${rinfo.address}:${discoveredPeer.port}`);
                }

                this.onPeerFound({
                    id: discoveredPeer.id,
                    port: discoveredPeer.port,
                    address: rinfo.address
                });
        });

        this.socket.on('error', (err) => {
            console.error('Discovery Socket error:', err.message);
        });
    }

    sendBroadcast() {
        const message = Buffer.from(JSON.stringify({
            id: this.peerID,
            port: this.peerPort
        }));

        this.socket.send(message, CONFIG.BROADCAST_PORT, '255.255.255.255', (err) => {
            if (err) {
                console.error('Discovery Broadcast failed:', err.message);
            }
        });
    }

}