import { EventEmitter } from "node:events";

// Garantir que temos apenas uma instância global do EventEmitter
// para que a rota SSE e a rota POST compartilhem o mesmo objeto no ambiente Serverless/Edge do Next.js
const globalForEvents = global as unknown as { eventEmitter: EventEmitter };

export const systemEmitter = globalForEvents.eventEmitter || new EventEmitter();

if (process.env.NODE_ENV !== "production") {
	globalForEvents.eventEmitter = systemEmitter;
}
