# API Specification v1.0

## Authentication
POST /auth/register
POST /auth/login
GET /auth/me

## Player
GET /player/profile
GET /player/stats

## Tower
GET /tower
POST /tower/unlock-room
POST /tower/hire-ally

## Jobs
GET /jobs
POST /jobs/start
POST /jobs/collect

## PvP
GET /pvp/opponents
POST /pvp/punch
POST /pvp/face-off
GET /pvp/history

## Leaderboard
GET /leaderboard

## Chat
GET /chat/messages
POST /chat/send

All responses follow:
{
  "success": true,
  "data": {}
}
