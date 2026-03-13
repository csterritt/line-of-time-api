# Bulk Event Upload Implementation Plan

## Overview
Add POST `/api/time-info/bulk-events` endpoint to upload multiple events in one request.

## Implementation Steps

1. **Create bulk event validator** (`src/validators/bulk-event-validator.ts`)
   - Validate array structure
   - Validate each event using existing `validateEventInput`
   - Check for duplicate `referenceUrl` within batch
   - Return detailed error messages with event indices

2. **Create bulk insert DB function** (`src/lib/db-access.ts`)
   - Add `insertBulkEvents` function with transaction support
   - Check for existing `referenceUrl` conflicts in DB
   - Insert all events atomically (all-or-nothing)

3. **Create bulk events route** (`src/routes/time-info/bulk-events.ts`)
   - POST endpoint requiring authentication
   - Accept array of events with snake_case fields
   - Transform to camelCase for validation
   - Call bulk insert
   - Return success with count or detailed errors

4. **Register route** in main router

5. **Write tests**
   - Valid bulk upload
   - Invalid events in batch
   - Duplicate referenceUrl within batch
   - Duplicate referenceUrl in DB
   - Empty array
   - Non-array input
   - Batch size limits

## Assumptions
- All-or-nothing transaction (if any event fails, none are inserted)
- Max batch size: 1000 events
- Duplicate `referenceUrl` fails entire batch
- Input uses snake_case (as shown in example), output uses camelCase
