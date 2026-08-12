const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Haversine para saber se já chegamos
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
	const R = 6371e3;
	const φ1 = (lat1 * Math.PI) / 180;
	const φ2 = (lat2 * Math.PI) / 180;
	const Δφ = ((lat2 - lat1) * Math.PI) / 180;
	const Δλ = ((lon2 - lon1) * Math.PI) / 180;

	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c;
}

// Move o agressor "passo" metros em direção à vítima
function moveTowards(currentLat, currentLng, targetLat, targetLng, stepMeters) {
	const latDiff = targetLat - currentLat;
	const lngDiff = targetLng - currentLng;
	const distance = calculateDistanceMeters(
		currentLat,
		currentLng,
		targetLat,
		targetLng,
	);

	if (distance <= stepMeters) {
		return { lat: targetLat, lng: targetLng };
	}

	const ratio = stepMeters / distance;
	return {
		lat: currentLat + latDiff * ratio,
		lng: currentLng + lngDiff * ratio,
	};
}

async function run() {
	console.log("🔥 Iniciando Simulador de Ataque...");

	// Encontra a Medida Protetiva Ativa
	const medida = await prisma.medidaProtetiva.findFirst({
		where: { status: "ATIVA" },
		include: {
			vitima: { include: { dispositivo: true } },
			agressor: { include: { dispositivo: true } },
		},
	});

	if (!medida?.vitima?.dispositivo || !medida.agressor?.dispositivo) {
		console.error("Nenhuma medida protetiva completa encontrada no banco.");
		console.error(
			"Certifique-se de cadastrar uma Vítima, Agressor, vincular Dispositivos a eles, e criar a Medida.",
		);
		process.exit(1);
	}

	console.log(`Medida encontrada: ${medida.numeroProcesso}`);
	console.log(
		`Vítima: ${medida.vitima.nome} (Raio de Proteção: ${medida.raioProtecaoMetros}m)`,
	);
	console.log(`Agressor: ${medida.agressor.nome}`);

	// Posições base em Macaé/RJ
	const vitimaPos = { lat: -22.3789, lng: -41.7766 };

	// Agressor começa a certa distância
	let agressorPos = { lat: -22.3700, lng: -41.7650 };

	// Registra a vítima parada
	await fetch("http://localhost:3000/api/telemetry", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			imei: medida.vitima.dispositivo.imei,
			lat: vitimaPos.lat,
			lng: vitimaPos.lng,
			velocidadeKmh: 0,
			bateria: 80,
			offline: false,
		}),
	});
	console.log(`📍 Vítima ancorada em ${vitimaPos.lat}, ${vitimaPos.lng}`);

	// Loop de movimento
	setInterval(async () => {
		const dist = calculateDistanceMeters(
			agressorPos.lat,
			agressorPos.lng,
			vitimaPos.lat,
			vitimaPos.lng,
		);
		console.log(
			`🚶 Agressor se movendo. Distância para vítima: ${Math.round(dist)}m`,
		);

		// Move 20 metros a cada tick
		agressorPos = moveTowards(
			agressorPos.lat,
			agressorPos.lng,
			vitimaPos.lat,
			vitimaPos.lng,
			20,
		);

		try {
			await fetch("http://localhost:3000/api/telemetry", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					imei: medida.agressor.dispositivo.imei,
					lat: agressorPos.lat,
					lng: agressorPos.lng,
					velocidadeKmh: 5,
					bateria: 95,
					offline: false,
				}),
			});
		} catch (error) {
			console.error("Erro ao enviar telemetria:", error.message);
		}
	}, 2000); // Ticks a cada 2 segundos para ficar rápido de visualizar
}

run();
