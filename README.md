# Flash Merchant Signup Portal

A Next.js application for merchant onboarding to the Flash payment platform.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template and configure
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Environment Variables

Required variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## Tech Stack

- **Framework:** Next.js 14 (static export)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Forms:** React Hook Form + Zod
- **Database:** Supabase
- **Maps:** Google Maps API

## Testing

```bash
npm test              # Unit tests
npm run test:e2e      # E2E tests (requires dev server)
```

## Documentation

Additional documentation is available in the [docs/](docs/) folder:

- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment instructions
- [DEVELOPMENT.md](docs/DEVELOPMENT.md) - Development guide
- [ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) - All environment variables
- [GOOGLE_MAPS_SETUP.md](docs/GOOGLE_MAPS_SETUP.md) - Google Maps configuration

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -am 'Add my feature'`
6. Push: `git push origin feature/my-feature`
7. Open a Pull Request

## License

MIT
