# Backend Foundation

This folder contains the dependency-light application foundation used until the NestJS package set can be installed in the environment.

## Boundaries

- `ConfigService` validates runtime environment values before the app starts.
- `HealthService` exposes a simple readiness report for smoke tests and future health endpoints.
- `AppModule` wires core services in one place so the project can migrate cleanly to a NestJS module structure when dependencies are available.

## Next Steps

1. Replace `AppModule` with a NestJS `@Module` once `@nestjs/*` packages can be installed.
2. Add an HTTP health controller.
3. Add Prisma and database connectivity.
4. Add Auth, Player, Wallet, Stat, Energy, Combat, Jobs, Tower, PvP, Leaderboard, and Chat modules.
