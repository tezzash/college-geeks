# Database Design v1.0

## Core Tables

### players
- id
- username
- email
- password_hash
- cash
- energy
- last_energy_update
- created_at
- updated_at

### tower_rooms
- id
- player_id
- room_number
- unlock_cost
- unlocked

### allies
- id
- name
- tier
- power
- smartness
- hire_cost

### room_occupants
- id
- tower_room_id
- ally_id
- hired_at

### jobs
- id
- name
- duration_seconds
- reward_cash

### active_jobs
- id
- player_id
- job_id
- started_at
- finishes_at
- collected

### battles
- id
- attacker_id
- defender_id
- action
- success
- cash_stolen
- created_at

### cash_transactions
- id
- player_id
- type
- amount
- reference
- created_at

Relationships:
Player -> Tower Rooms -> Room Occupants -> Allies
Player -> Active Jobs -> Jobs
Player -> Battles
Player -> Cash Transactions
