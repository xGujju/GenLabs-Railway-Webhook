Root cause note

Replit startup screenshot showed app still listening on port 3000 even after config fallback changed to 5000.
That means runtime env was still supplying PORT=3000 or Replit was running older code.
Because Replit deployment uses npm run start:all -> ./run.sh, the safest fix is to force PORT=5000 inside run.sh so the combined deployment path binds to the expected Replit port regardless of inherited env.
