---
title: "The QDevice That Wouldn't Vote"
description: "How I built real quorum into a 2-node Proxmox cluster with a Raspberry Pi — and the leftover Tor firewall rule that almost stopped it."
pubDate: 2026-06-07
tags: ['proxmox', 'homelab', 'raspberry-pi', 'linux', 'self-hosted']
lang: 'en'
draft: false
---

## The two-node problem

Clustered systems make decisions by majority vote. With two nodes, the majority threshold is two votes. Lose one node, and the survivor is left holding a single vote — not enough for quorum — so the cluster drops into read-only mode. A two-node cluster, on its own, gives you zero actual fault tolerance.

There are two ways out of this: add a third full node, or introduce a lightweight arbiter known as a **QDevice**.

## Why two nodes, not three

My lab runs on two machines with very different jobs:

- A low-power i3 with 24GB of RAM, on continuously for the services that need to stay up.
- A beefier i5 with an RTX 3060, powered on only when I actually need the compute.

Buying a third full server just to satisfy quorum math felt wasteful for what it would actually be used for.

## The QDevice solution

A corosync QDevice is not a Proxmox node. It runs `corosync-qnetd` — a lightweight daemon that needs almost no resources and hosts no virtual machines at all.

I deliberately didn't install Proxmox on the Raspberry Pi for this. Proxmox VE needs x86 and more RAM than a Pi 3 has to offer (ARM, 1GB). Instead, the Pi runs plain Linux with nothing but the `qnetd` daemon on top.

With three votes spread across the cluster — one per real node, one for the QDevice — losing the i5 still leaves the i3 plus the Pi with two votes out of three. Quorum holds.

## The build

Initial setup, on both cluster nodes:

- Deploy Proxmox VE 9.2.
- Switch the repositories from enterprise to no-subscription.
- Create the cluster on one node, join it from the other.

QDevice installation comes down to three commands.

On the Raspberry Pi:

```bash
apt install corosync-qnetd
```

On each cluster node:

```bash
apt install corosync-qdevice
```

From one of the nodes:

```bash
pvecm qdevice setup 192.168.10.103
```

That last command handles the certificates, enables the daemons, and reloads the corosync configuration — in theory, that's the whole setup.

## The arbiter that wouldn't vote

`pvecm status` showed:

```text
Expected votes: 3
Total votes:    2
Qdevice (votes: 0): A,NV,NMW
```

The QDevice was registered — alive, even — but casting zero votes instead of one. `A,NV,NMW` reads as Alive, Not Voting, Not-Master-Wins. The cluster was exactly as fragile as before: lose either real node, and quorum is gone.

## False lead: the clock

First thing I checked was the Pi's clock — its timezone was off (UTC+5 instead of UTC), which looked like a plausible cause for a TLS certificate validation failure. It wasn't: TLS validates against UTC, not local wall-clock time, so a timezone misconfiguration on the Pi couldn't have been breaking the handshake. Wrong rabbit hole.

## The real cause: firewall rules

`corosync-qdevice`'s logs told a more useful story — repeated "Connect timeout" messages. That's a specific signal: a timeout means packets are being silently dropped, not actively rejected. "Connection refused" would have meant nothing was listening on the other end; "Connect timeout" means something in between is eating the packets.

SSH (port 22) worked fine from the cluster nodes to the Pi. The QDevice port, 5403, just timed out. The Pi was running UFW with rules left over from when it used to run a Tor relay:

- Port 9001 (Tor ORPort): blocked.
- The old relay's custom port: allowed.
- SSH: allowed.
- Everything else, including 5403: dropped by the default policy.

The fix:

```bash
ufw allow from 192.168.10.0/24 to any port 5403 proto tcp
```

Within eight seconds the QDevice reconnected:

```text
Expected votes: 3
Total votes:    3
Qdevice (votes: 1): A,V
```

`A,V` — Alive, Voting. The cluster finally had genuine fault tolerance.

## Key takeaways

- Two-node clusters need external quorum arbitration; a QDevice is the cleanest way to get it without a third full node.
- A QDevice is not a Proxmox node — install only `corosync-qnetd` on the arbiter, nothing else.
- "Connect timeout" usually means a firewall is dropping packets; "Connection refused" means nothing is listening.
- Firewall rules inherited from a machine's previous job can silently break a new configuration months later.
- Timezone misconfiguration is not the same thing as clock skew — TLS validates against UTC.
- Don't trust that a QDevice is working just because it's listed. Check that it's actually voting (`V` flag, total votes matching expected) — presence alone is false security.

## What's next

This two-node cluster, with the Pi keeping it honest, is the foundation the rest of the lab sits on — VLAN segmentation, honeypots, and SIEM included. All of the commands and architecture here reproduce unchanged on Proxmox VE 9.x, as long as you understand why a single remaining node doesn't have enough votes on its own.
