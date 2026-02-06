# Atlas Learn: System Design Playground

[Atlas Learn](https://atlas-learn.vercel.app) is an interactive educational laboratory for learning system design concepts. It allows students to visually build architectures, run live simulations, and understand the "cause and effect" of system failures.

> "Systems intuition, not just memorization."

## Features

### 1. The Workbench (Sandbox Mode)
A drag-and-drop interface where you can experiment freely.
- **Node Types**: Client, API, Database, Cache, Queue, Worker.
- **Live Simulation**: Watch requests flow, queues build up, and latencies spike in real-time.
- **Metrics**: Monitor p95 latency, throughput, and error rates.

### 2. Tutorial Mode
Structured lessons designed to teach specific concepts through hands-on debugging.
- **Level 1: The Bottleneck**: Identify and fix database saturation.
- **Level 2: The Cache**: Learn when (and when not) to use caching.
- **Level 3: Async Processing**: Handle traffic spikes with queues and workers.

## Tech Stack
- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Context + Custom Graph Store

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Contributing

1.  Fork the repository.
2.  Create a feature branch.
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

## License

MIT
