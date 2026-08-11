import type { NextRequest } from "next/server";
import { systemEmitter } from "@/lib/eventEmitter";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();

			// Envia uma mensagem inicial para conectar
			controller.enqueue(encoder.encode("event: connected\ndata: ok\n\n"));

			// Função de callback para quando a telemetria for recebida
			const onTelemetria = (data: any) => {
				const message = `event: telemetria\ndata: ${JSON.stringify(data)}\n\n`;
				controller.enqueue(encoder.encode(message));
			};

			const onAlerta = (data: any) => {
				const message = `event: alerta\ndata: ${JSON.stringify(data)}\n\n`;
				controller.enqueue(encoder.encode(message));
			};

			// Registra os listeners
			systemEmitter.on("nova_telemetria", onTelemetria);
			systemEmitter.on("novo_alerta", onAlerta);

			// Ping a cada 15s para manter a conexão ativa (evitar timeout do Nginx/Vercel)
			const intervalId = setInterval(() => {
				controller.enqueue(encoder.encode("event: ping\ndata: ping\n\n"));
			}, 15000);

			// Limpeza caso o cliente feche a conexão
			request.signal.addEventListener("abort", () => {
				systemEmitter.off("nova_telemetria", onTelemetria);
				systemEmitter.off("novo_alerta", onAlerta);
				clearInterval(intervalId);
				controller.close();
			});
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
		},
	});
}
