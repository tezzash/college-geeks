# Game Constants

This document lists every configurable gameplay value currently defined for College Geeks. These constants should remain configurable and must not be hardcoded in business logic.

## Player Starting State

| Constant | Current Value | Description | Source |
| --- | ---: | --- | --- |
| `STARTING_CASH` | `1000` | Cash granted to a new player account. | `docs/ECONOMY.md` |
| `MAX_ENERGY` | `10` | Maximum energy a player can hold. | `docs/ECONOMY.md`, `docs/GAME_DESIGN_BIBLE.md` |

## Energy

| Constant | Current Value | Description | Source |
| --- | ---: | --- | --- |
| `ENERGY_REGEN_AMOUNT` | `1` | Energy restored per regeneration interval. | `docs/ECONOMY.md`, `docs/GAME_DESIGN_BIBLE.md` |
| `ENERGY_REGEN_INTERVAL_MINUTES` | `7` | Minutes required for each energy regeneration tick. | `docs/ECONOMY.md`, `docs/GAME_DESIGN_BIBLE.md` |
| `PVP_ENERGY_COST` | `1` | Energy consumed by each PvP action. | `docs/GAME_DESIGN_BIBLE.md` |

## Banking

| Constant | Current Value | Description | Source |
| --- | ---: | --- | --- |
| `BANK_FEE` | `15%` | Fee applied to bank deposits when banking is implemented. | `docs/ECONOMY.md` |

## PvP Economy

| Constant | Current Value | Description | Source |
| --- | ---: | --- | --- |
| `MAX_STEAL_PERCENT` | `5%` | Maximum percentage of a defender's unprotected cash that can be stolen after a successful attack. | `docs/ECONOMY.md` |
| `BATTLE_RATING` | `0.5` | Alpha multiplier applied to the maximum stealable cash to calculate final cash won. | `docs/ECONOMY.md` |

## PvP Actions

| Constant | Current Value | Description | Source |
| --- | --- | --- | --- |
| `PVP_ACTION_PUNCH_STAT` | `Power` | Stat used to resolve the Punch PvP action. | `docs/GAME_DESIGN_BIBLE.md` |
| `PVP_ACTION_FACE_OFF_STAT` | `Smartness` | Stat used to resolve the Face Off PvP action. | `docs/GAME_DESIGN_BIBLE.md` |

## Core Stats

| Constant | Current Value | Description | Source |
| --- | --- | --- | --- |
| `CORE_STAT_POWER` | `Power` | Core player stat used by allies and Punch combat. | `docs/GAME_DESIGN_BIBLE.md` |
| `CORE_STAT_SMARTNESS` | `Smartness` | Core player stat used by allies and Face Off combat. | `docs/GAME_DESIGN_BIBLE.md` |

## Progression Rules

| Constant | Current Value | Description | Source |
| --- | --- | --- | --- |
| `XP_ENABLED` | `false` | College Geeks does not use XP progression. | `docs/ECONOMY.md`, `docs/GAME_DESIGN_BIBLE.md` |
| `PLAYER_LEVELS_ENABLED` | `false` | College Geeks does not use player levels. | `docs/ECONOMY.md`, `docs/GAME_DESIGN_BIBLE.md` |
