const Database = require("better-sqlite3");
const path = require("node:path");

const dbPath = path.join(__dirname, "../dev.db");
const db = new Database(dbPath);

console.log("Populando banco de dados usando SQLite nativo...");

try {
	// Limpa o banco atual
	db.prepare("DELETE FROM Telemetria").run();
	db.prepare("DELETE FROM Alerta").run();
	db.prepare("DELETE FROM Zona").run();
	db.prepare("DELETE FROM MedidaProtetiva").run();
	db.prepare("DELETE FROM Monitorado").run();
	db.prepare("DELETE FROM Dispositivo").run();

	const now = new Date().toISOString();

	// Cria Dispositivos
	db.prepare(`
    INSERT INTO Dispositivo (id, imei, serial, tipo, status, bateriaAtual, criadoEm, atualizadoEm)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
		"disp-tornozeleira-1",
		"888888888888",
		"TRNZ-001",
		"TORNOZELEIRA",
		"ATIVO",
		85,
		now,
		now,
	);

	db.prepare(`
    INSERT INTO Dispositivo (id, imei, serial, tipo, status, bateriaAtual, criadoEm, atualizadoEm)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run("disp-dav-1", "999999999999", "DAV-001", "DAV", "ATIVO", 90, now, now);

	// Cria Pessoas
	db.prepare(`
    INSERT INTO Monitorado (id, nome, cpf, tipo, dispositivoId, criadoEm, atualizadoEm)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
		"agressor-1",
		"João Pedro Silva (Mock)",
		"111.111.111-11",
		"AGRESSOR",
		"disp-tornozeleira-1",
		now,
		now,
	);

	db.prepare(`
    INSERT INTO Monitorado (id, nome, cpf, tipo, dispositivoId, criadoEm, atualizadoEm)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
		"vitima-1",
		"Maria Souza (Mock)",
		"222.222.222-22",
		"VITIMA",
		"disp-dav-1",
		now,
		now,
	);

	// Cria Medida Protetiva (Raio de 500 metros)
	db.prepare(`
    INSERT INTO MedidaProtetiva (id, numeroProcesso, agressorId, vitimaId, raioProtecaoMetros, dataInicio, status, criadoEm, atualizadoEm)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
		"medida-1",
		"001/2026",
		"agressor-1",
		"vitima-1",
		500,
		now,
		"ATIVA",
		now,
		now,
	);

	console.log(
		"✅ Seed executado com sucesso! Agressor e Vítima de teste criados.",
	);
} catch (error) {
	console.error("Erro ao popular banco:", error);
} finally {
	db.close();
}
