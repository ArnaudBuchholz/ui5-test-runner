agent: dist/ui/agent.js

dist/ui/agent.js: src/agent/*.ts
	npm run build:agent

lib: dist/ui/lib.js

dist/ui/lib.js: src/ui/lib/*
	npm run build:ui:lib

html-report: dist/ui/html-report.js

dist/ui/html-report.js: src/ui/report/* src/ui/vite.config.shared.mjs
	npm run build:ui:report

log-viewer: dist/ui/log-viewer.js

dist/ui/log-viewer.js: src/ui/log/* src/ui/vite.config.shared.mjs
	npm run build:ui:log

precli: agent lib html-report log-viewer
