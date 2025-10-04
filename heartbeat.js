import net from 'net';
import { CONFIG } from './config.js';

export default class HeartBeat {
    constructor(peerID, knownPeers, onPeerDisconnected) {
        this.peerID = peerID;
        this.knownPeers = knownPeers;
        this.onPeerDisconnected = onPeerDisconnected;
        this.pendingPongs = new Map();
        this.retryCounts = new Map();
        this.intervalID = null;
    }

    start() {
        setTimeout(() => {
            this.sendPings();
        }, 1000);

        this.intervalID = setInterval(() => {
            this.sendPings();
        }, CONFIG.HEARTBEAT_INTERVAL);
    }

    handleMessage(message, address, port) {
            if (message.type === 'ping') {
                if (message.id === this.peerID) return;

                const pongMessage = JSON.stringify({
                    type: 'pong',
                    id: this.peerID
                }) + '\n';

                const peer = this.knownPeers.get(message.id);
                if (peer) {
                    const client = net.createConnection({ port: peer.port, host: peer.address }, () => {
                        client.write(pongMessage, () => {
                            client.end();
                        });
                    });
                }
            } else if (message.type === 'pong') {
                if (message.id === this.peerID) return;
                const senderID = message.id;
                if (this.pendingPongs.has(senderID)) {
                    clearTimeout(this.pendingPongs.get(senderID));
                    this.pendingPongs.delete(senderID);
                    this.retryCounts.delete(senderID);
                }
            }
    }

    sendPings() {
        const activePeers = Array.from(this.knownPeers.values()).filter(p => p.id !== this.peerID);
        if (activePeers.length === 0) {
            return;
        }


        for (const peer of activePeers) {
            const retryCount = this.retryCounts.get(peer.id) || 0;
            if (this.pendingPongs.has(peer.id)) {
                if (retryCount >= CONFIG.HEARTBEAT_MAX_RETRIES) {
                    console.log(`[${peer.id} disconnected after ${retryCount} retries`);
                    clearTimeout(this.pendingPongs.get(peer.id));
                    this.knownPeers.delete(peer.id);
                    this.pendingPongs.delete(peer.id);
                    this.retryCounts.delete(peer.id);
                    if (this.onPeerDisconnected) {
                        this.onPeerDisconnected(peer.id);
                    }
                    continue;
                }
                this.retryCounts.set(peer.id, retryCount + 1);
            }

            const pingMessage = JSON.stringify({
                type: 'ping',
                id: this.peerID
            }) + '\n';

            const client = net.createConnection({
                port: peer.port,
                host: peer.address,
                timeout: 3000
            }, () => {
                client.write(pingMessage, () => {
                    client.end();
                });
            });

            client.on('timeout', () => {
                client.destroy();
            });

            if (!this.pendingPongs.has(peer.id)) {
                const timeoutID = setTimeout(() => {
                    if (this.pendingPongs.has(peer.id)) {
                        this.retryCounts.set(peer.id, (this.retryCounts.get(peer.id) || 0) + 1);
                    }
                }, CONFIG.HEARTBEAT_TIMEOUT);

                this.pendingPongs.set(peer.id, timeoutID);
            }
        }
    }

    stop() {
        if (this.intervalID) {
            clearInterval(this.intervalID);
            this.intervalID = null;
        }

        for (const timeoutID of this.pendingPongs.values()) {
            clearTimeout(timeoutID);
        }
        this.pendingPongs.clear();
        this.retryCounts.clear();
    }
}