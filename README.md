# Atlas Learn: System Design Playground

[Atlas Learn](https://atlas-learn.vercel.app) is an interactive educational laboratory for learning system design concepts. It allows students to visually build architectures, run live simulations, and understand the "cause and effect" of system failures.

> "Systems intuition, not just memorization."

## 🚀 Features

### 1. The Workbench (Sandbox Mode)
A drag-and-drop interface where you can experiment freely.
- **Node Types**: Client, API, Database, Cache, Queue, Worker.
- **Live Simulation**: Watch requests flow, queues build up, and latencies spike in real-time.
- **Metrics**: Monitor p95 latency, throughput, and error rates.
- **AI Code Generation**: Select a node, describe its logic (e.g., "Rate limited API"), and generate production-ready Express.js code using OpenAI.

### 2. Live Execution Engine
Turn your visual graph into a real, running backend.
- **Live Server**: Clicking "Run" spawns a real Node.js/Express server (`http://localhost:4000`) based on your graph.
- **Swagger UI**: Auto-generated API documentation for your live server. Test endpoints directly from the browser.
- **File Explorer**: Browse and view the generated code files (`server.js`, `package.json`, `database.sqlite`) in the side panel.

### 3. Tutorial Mode
Structured lessons designed to teach specific concepts through hands-on debugging.
- **Level 1: The Bottleneck**: Identify and fix database saturation.
- **Level 2: The Cache**: Learn when (and when not) to use caching.
- **Level 3: Async Processing**: Handle traffic spikes with queues and workers.

### 4. Themes & UX
- **Stranger Things Mode**: A fully immersive "Upside Down" theme with CRT effects, glowing edges, and retro aesthetics.
- **Sidebar**: Collapsible navigation for focused work.

## 🛠️ Tech Stack
- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **State**: React Context + Custom Graph Store
- **AI**: OpenAI API (GPT-4o)
- **Backend Sim**: Node.js `child_process` spawning

## 🚦 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Environment Setup
To use AI generation features, create a `.env.local` file:

```env
OPENAI_API_KEY=sk-...
ATLAS_SECRET=atlas-local-dev-secret
```

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch.
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

## 📄 License

MIT
