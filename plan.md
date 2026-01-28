# API Implementation Plan

## Assumptions

- The `daisy-tw-worker-d1-drizzle` template provides working auth middleware via better-auth
- Related events stored as JSON array of IDs (placeholder for now)
- Reference URLs stored as JSON array of strings

---

## Step 1: Define the Event Schema (Drizzle)

Create `src/db/schema/events.ts`:

```ts
export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  name: text('name').notNull(),
  basicDescription: text('basic_description').notNull(),
  longerDescription: text('longer_description'),
  referenceUrls: text('reference_urls').notNull(), // JSON array
  relatedEventIds: text('related_event_ids'), // JSON array (placeholder)
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})
```

Run migration to create the table.

---

## Step 2: Create API Routes

Create `src/routes/time-info/events.ts` with Hono router:

| Endpoint                       | Auth Required | Logic                                    |
| ------------------------------ | ------------- | ---------------------------------------- |
| `GET /time-info/events`        | No            | Return all events, ordered by start date |
| `GET /time-info/events/:id`    | No            | Return single event by ID, or 404        |
| `POST /time-info/events`       | Yes           | Validate input, insert, return created   |
| `PUT /time-info/events/:id`    | Yes           | Validate input, update, return updated   |
| `DELETE /time-info/events/:id` | Yes           | Delete by ID, return success             |

---

## Step 3: Input Validation

Create `src/validators/event-validator.ts`:

**Required fields:**

- `startDate` — non-empty string (ISO date)
- `name` — non-empty string
- `basicDescription` — non-empty string
- `referenceUrls` — array with at least one non-empty URL

**Optional fields:**

- `endDate` — string or null
- `longerDescription` — string or null
- `relatedEventIds` — array of strings or null

Return 400 with error details on validation failure.

---

## Step 4: Auth Middleware for Protected Routes

Use better-auth's session middleware on POST/PUT/DELETE routes:

```ts
eventsRouter.post('/', authMiddleware, createEventHandler)
eventsRouter.put('/:id', authMiddleware, updateEventHandler)
eventsRouter.delete('/:id', authMiddleware, deleteEventHandler)
```

Return 401 if not authenticated.

---

## Step 5: Wire Up Routes

In `src/index.ts` (or main app file), mount the events router:

```ts
app.route('/time-info', eventsRouter)
```

---

## Pitfalls

- **Date format consistency** — Decide on ISO 8601 strings for dates; validate format on input
- **JSON parsing** — `referenceUrls` and `relatedEventIds` stored as JSON text; parse on read, stringify on write
- **404 vs 400** — Return 404 for missing resources, 400 for bad input (architecture says 400 for failure, but 404 is more RESTful for "not found")
- **ID generation** — Use `crypto.randomUUID()` or similar for new event IDs
- **Migration timing** — Run Drizzle migrations before deploying new code
