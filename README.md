# 🚀 Collaborative Workspace Hub

A real-time, full-stack Kanban task management platform engineered for sub-millisecond state synchronization, secure session handling, and fluid multi-theme rendering. Built with a decoupled client-server architecture using **Next.js 16**, **Express**, and **WebSockets**.

---

## 🛠️ System Tech Stack

* **Frontend Framework:** Next.js 16 (App Router) with asynchronous route parameterization.
* **Styling Engine:** Tailwind CSS v4 utilizing native inline CSS utility variable mapping.
* **Real-Time Layer:** Socket.io Client for continuous, low-latency client broadcast states.
* **Drag-and-Drop Lifecycle:** Powered by `@hello-pangea/dnd` for smooth, layout-preserving card migrations.
* **Backend Runtime:** Node.js + Express.js middleware server.
* **Database Layer:** MongoDB Atlas cloud instances managed via Mongoose ODM.
* **Authentication Engine:** JSON Web Token (JWT) asymmetric request signatures.

---

## ✨ Key Platform Architectural Capabilities

### ⚡ Bidirectional WebSocket Synchronization
The application completely removes heavy client polling loops. When a user creates columns or shifts a task card, the mutation payload is immediately broadcast across an active socket channel room (`join-board`). Shared view windows catch the payload instantly and execute clean, non-blocking UI redraws.

### 📐 O(1) Algorithmic Midpoint Position Engine
To minimize database writes, moving card items does not re-index the entire dataset. Dropped cards compute position parameters based on their localized structural neighbors:
* **Top Position Drop:** $Position = \frac{First}{2}$
* **Intermediary Drop:** $Position = \frac{Previous + Next}{2}$
* **Bottom Position Drop:** $Position = Last + 1000$

### 🎨 Tailwind v4 Selector Theme Control
Bypasses standard client component initialization flash delays. Implements a rapid direct DOM class mutation layer (`document.documentElement.classList.add('dark')`) that hooks directly into explicit Tailwind v4 variables inside `globals.css`, instantly overriding component utility layers.

---

## 🚀 Getting Started & Local Installation

### 1. Clone the Code Repository
```bash
git clone [https://github.com/swaommtripathy/collaborative-kanban-manager.git](https://github.com/swaommtripathy/collaborative-kanban-manager.git)
cd collaborative-kanban-manager
