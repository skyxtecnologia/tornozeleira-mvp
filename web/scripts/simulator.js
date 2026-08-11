const API_URL = "http://localhost:3000/api/telemetry";

const VITIMA_IMEI = "999999999999";
const AGRESSOR_IMEI = "888888888888";

// Porto Alegre - Praça da Alfândega (Centro Histórico)
const vitimaLat = -30.0298;
const vitimaLng = -51.2325;

// Porto Alegre - Gasômetro (Aproximadamente 1.5km de distância)
let agressorLat = -30.035;
let agressorLng = -51.241;

let bateriaVitima = 90;
let bateriaAgressor = 85;

async function enviarTelemetria(imei, lat, lng, bateria) {
	try {
		const response = await fetch(API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				imei,
				lat,
				lng,
				bateria,
				velocidadeKmh: Math.floor(Math.random() * 5) + 3, // andando 3-8 km/h
				offline: false,
				timestamp: new Date().toISOString(),
			}),
		});

		const data = await response.json();
		if (response.ok) {
			console.log(
				`[${imei === VITIMA_IMEI ? "VÍTIMA" : "AGRESSOR"}] Telemetria enviada: ${lat}, ${lng} (Bat: ${bateria}%)`,
			);
		} else {
			console.error("Erro na API:", data);
		}
	} catch (error) {
		console.error("Falha de conexão com a API:", error.message);
	}
}

async function startSimulation() {
	console.log("🚀 Iniciando Simulação do Sistema de Monitoramento (SME/DAV)");
	console.log(
		"A Vítima está no Centro Histórico. O Agressor está vindo do Gasômetro na direção dela.",
	);
	console.log("A medida protetiva define 500m de distanciamento.");

	setInterval(async () => {
		// A vítima se move muito pouco (flutuação de GPS)
		const vLat = vitimaLat + (Math.random() * 0.0001 - 0.00005);
		const vLng = vitimaLng + (Math.random() * 0.0001 - 0.00005);

		// O Agressor caminha deliberadamente na direção da vítima
		agressorLat += 0.0002; // Sobe em direção ao norte
		agressorLng += 0.0003; // Vai em direção ao leste

		// Drena a bateria lentamente
		if (Math.random() > 0.8) bateriaVitima -= 1;
		if (Math.random() > 0.7) bateriaAgressor -= 1;

		await enviarTelemetria(VITIMA_IMEI, vLat, vLng, bateriaVitima);
		await enviarTelemetria(
			AGRESSOR_IMEI,
			agressorLat,
			agressorLng,
			bateriaAgressor,
		);

		console.log("---");
	}, 3000); // Dispara a cada 3 segundos para a demonstração
}

startSimulation();
