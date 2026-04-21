Replit port fix follow-up

Evidence showed two separate startup paths:
1. npm run start:all -> run.sh (already forced PORT=5000)
2. npm start -> package.json start script (still allowed injected PORT=3000)

To make Replit startup consistent regardless of whether it runs npm start or npm run start:all, the start and dev scripts now force PORT=5000 too.
