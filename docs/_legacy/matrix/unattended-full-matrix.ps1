# Unattended full O1 matrix exhaust for 12 LLMs x presets (when GPU free, fans/coolerboost)
# Per system-profile (8GB serialize, one model at a time, unload --all between, lms load --estimate-only before new partials)
# Run: powershell -ExecutionPolicy Bypass -File unattended-full-matrix.ps1
# Will take hours for large (26B/31B first @ offload/partial); results pushed after.
cd C:\Users\james\projects\evals
pnpm capture:system:quick
lms unload --all
pnpm registry:export
pnpm verify
node scripts\run-matrix.mjs --full   # or pnpm matrix:full
pnpm summarize:matrix
pnpm compare:baseline
pnpm judge:queue
git add results/matrix-summary.json results/optimization-state.json results/*-report*.json docs/evals/ --ignore-errors
git commit -m "chore(O1): full matrix exhaust (unattended) + post steps; 12x2+partials per agent configs"
git push origin main
echo "Done. Check results/ and GitHub for new cells/data."