Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force web\.git -ErrorAction SilentlyContinue

git init
git config user.name "Skyx Tecnologia"
git config user.email "skyxtecnologia@gmail.com"

git add .gitignore web/package.json web/package-lock.json web/next.config.mjs web/tsconfig.json web/tailwind.config.ts web/postcss.config.mjs web/components.json web/biome.json web/.biomeignore web/next-env.d.ts
git commit -m "chore: setup inicial do projeto, dependencias e configs"

git add web/prisma web/.env
git commit -m "feat: modelagem de dados do SME com Prisma Schema"

git add web/src/components web/src/lib web/src/app/globals.css web/src/app/layout.tsx web/src/app/page.tsx
git commit -m "feat: componentes base de UI e design system"

git add web/src/app/api/medidas web/src/app/api/telemetry web/src/app/api/stream
git commit -m "feat: core APIs de telemetria em tempo real e SSE"

git add web/src/app/dashboard/layout.tsx web/src/app/dashboard/page.tsx
git commit -m "feat: dashboard principal e kpis da operacao"

git add web/src/app/dashboard/map
git commit -m "feat: monitoramento tatico com geofencing turf.js e rastro historico"

git add web/src/app/api/export web/src/app/api/panico web/src/app/dashboard/alertas
git commit -m "feat: modulo de exportacao CSV, gerenciamento de alertas e botao de panico"

git add web/scripts web/src/app/dav-simulator
git commit -m "test: simulador de app da vitima e scripts de ataque"

git add .
git commit -m "chore: finalizacao de arquivos residuais e estaticos"
