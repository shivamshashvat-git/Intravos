# Gotenberg PDF Service

Gotenberg is a stateless API for converting HTML/Markdown/Office documents to PDF. It is used in Intravos to offload expensive PDF generation from the main Node.js process, preventing OOM (Out of Memory) crashes and providing a reliable, platform-agnostic document engine.

## Local Development

To run the Gotenberg service locally:

```bash
docker run --rm -p 3001:3000 gotenberg/gotenberg:8
```

Then, set the environment variable in your `backend/.env`:

```env
GOTENBERG_URL=http://localhost:3001
```

## Deployment

In production, Gotenberg is deployed as a separate service alongside the API. 
- **Type**: Docker-based web service
- **Image**: `gotenberg/gotenberg:8`
- **Exposure**: Internal-only (preferred) or public with shared secret.

This architecture works seamlessly on Railway, Render, Fly.io, and DigitalOcean App Platform.
