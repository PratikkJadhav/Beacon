# Beacon 

A fully decentralized, offline P2P chat application built completely from scratch. Built to get hands dirty with low-level networking, and seeing exactly how far local network protocols can be pushed — without a central server acting as a middleman.

---

## How It Works

Instead of relying on a central database, Beacon operates as a **full mesh network**:

- **Discovery (UDP):** Nodes broadcast their presence across the local network using UDP on port `4000`.
- **Messaging & Heartbeats (TCP):** Once a peer is found, reliable TCP connections are established for chat messages and a custom ping/pong heartbeat protocol to track node health.

---

## Features

- **Zero Config / Serverless** — Just spin it up on the same network and it automatically discovers peers.
- **Custom Heartbeat Protocol** — Built-in fault tolerance. Actively tracks active peers and gracefully cleans up the UI when someone drops off.
- **Resilient Message Parsing** — Handles stream chunking and boundaries over TCP seamlessly.

---

## Getting Started

**1. Install dependencies:**

```bash
npm install
```

**2. Start your node with a username:**

```bash
node nodes.js -u YourName
```

**3. Connect with others:**

Open another terminal (or tell a friend on the same WiFi) and run it with a different name. Start chatting!

---

## Performance Benchmarks

A custom benchmark script was written to stress-test the mesh network locally and find where the TCP stack would choke.

| Metric | Result |
|---|---|
| Node Capacity | Scaled to **50 concurrent nodes** on a single machine |
| Throughput | Handled **2,450+ simultaneous TCP connections** during mesh initialization without crashing |
| Discovery Latency (small, ~10 nodes) | ~**1.2 seconds** |
| Discovery Latency (heavy load, 50 nodes) | **6–12 seconds** with 100% discovery success rate |
| Reliability | **Zero** dropped connections or false disconnects under heavy CPU load |
