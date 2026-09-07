# Events and News API contract

This is the backend contract for the future Events and News frontend pages.
Do not redesign these endpoints when those pages are added; consume them as documented.

All URLs are relative to the site origin. Browser clients should call `/api/...` with
`credentials: "include"` so the httpOnly session cookie is sent. JSON request and
response bodies use camelCase. Pagination defaults to `page=1` and `pageSize=20`
(maximum 50).

Authentication:

- **Public** — no session required.
- **Admin** — signed-in user whose server-side `role` is `admin`. Ordinary members
  receive `403`. Signed-out callers receive `401`.

---

## Events API

### List published events

- **Endpoint:** `GET /api/events`
- **Method:** `GET`
- **Authentication:** Public
- **Request:** query `page`, `pageSize`
- **Response `200`:**

```json
{
  "events": [
    {
      "id": 1,
      "title": "Community Gathering",
      "slug": "community-gathering",
      "description": "An evening for members in London.",
      "eventDate": "2026-10-01",
      "startTime": "18:00",
      "endTime": "21:00",
      "location": "London",
      "eventUrl": "https://example.org/events/community-gathering",
      "publishedAt": "2026-09-07T12:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

Draft and archived events are omitted. `eventUrl` is `null` when empty.

### Get a published event

- **Endpoint:** `GET /api/events/:slug`
- **Method:** `GET`
- **Authentication:** Public
- **Request:** path `slug`
- **Response `200`:** `{ "event": { ...public event } }`
- **Response `404`:** `{ "error": "Event not found." }` for unknown, draft or archived slugs.

### Create event

- **Endpoint:** `POST /api/admin/events`
- **Method:** `POST`
- **Authentication:** Admin
- **Request:**

```json
{
  "title": "Community Gathering",
  "slug": "community-gathering",
  "description": "An evening for members in London.",
  "eventDate": "2026-10-01",
  "startTime": "18:00",
  "endTime": "21:00",
  "location": "London",
  "eventUrl": "https://example.org/events/community-gathering"
}
```

`slug` is optional; the server generates a unique slug from the title when omitted.
`endTime` and `eventUrl` are optional. New events are always created as `draft`.
`status` in the body is ignored.

- **Response `201`:** `{ "event": { ...admin event } }`

Admin event fields add `status`, `createdAt`, `updatedAt`, `createdBy`, `notifiedAt`.

### List events (admin)

- **Endpoint:** `GET /api/admin/events`
- **Method:** `GET`
- **Authentication:** Admin
- **Request:** query `status=draft|published|archived`, `page`, `pageSize`
- **Response `200`:** `{ "events": [...], "page", "pageSize", "total" }`

### Get event (admin)

- **Endpoint:** `GET /api/admin/events/:id`
- **Method:** `GET`
- **Authentication:** Admin
- **Response `200`:** `{ "event": { ...admin event } }`

### Update event

- **Endpoint:** `PATCH /api/admin/events/:id`
- **Method:** `PATCH`
- **Authentication:** Admin
- **Request:** same body as create. Does not change `status` and does not notify members.
- **Response `200`:** `{ "event": { ...admin event } }`

### Publish event

- **Endpoint:** `POST /api/admin/events/:id/publish`
- **Method:** `POST`
- **Authentication:** Admin
- **Request:** empty body
- **Response `200`:**

```json
{
  "event": { "id": 1, "status": "published", "publishedAt": "2026-09-07T12:00:00.000Z" },
  "notified": { "attempted": 4, "sent": 4, "failed": 0, "inserted": 4 }
}
```

The first publish notifies eligible members (active membership and verified email).
Later publishes and edits do not send mail again.

### Archive event

- **Endpoint:** `POST /api/admin/events/:id/archive`
- **Method:** `POST`
- **Authentication:** Admin
- **Response `200`:** `{ "event": { ...admin event, "status": "archived" } }`

### Notify members

- **Endpoint:** `POST /api/admin/events/:id/notify`
- **Method:** `POST`
- **Authentication:** Admin
- **Request:** empty body. Event must already be published.
- **Response `200`:** `{ "event": { ... }, "notified": { "attempted", "sent", "failed", "inserted" } }`

Creates missing notification rows, retries previous failures, and never resends a
successful notification for the same event and member.

### Notification history

- **Endpoint:** `GET /api/admin/events/:id/notifications`
- **Method:** `GET`
- **Authentication:** Admin
- **Response `200`:**

```json
{
  "notifications": [
    {
      "id": 1,
      "eventId": 1,
      "userId": 2,
      "email": "member@example.org",
      "status": "sent",
      "sentAt": "2026-09-07T12:00:00.000Z",
      "errorMessage": null,
      "createdAt": "2026-09-07T12:00:00.000Z"
    }
  ]
}
```

---

## News API

News, updates and announcements share `news_items` and are distinguished by `kind`:
`news` | `update` | `announcement`.

### List published items

- **Endpoint:** `GET /api/news`
- **Method:** `GET`
- **Authentication:** Public
- **Request:** query `kind`, `page`, `pageSize`
- **Response `200`:**

```json
{
  "items": [
    {
      "id": 1,
      "kind": "news",
      "title": "AGM Notice",
      "slug": "agm-notice",
      "summary": "The annual general meeting will be held in October.",
      "content": "Members are invited to attend the annual general meeting.",
      "publishedAt": "2026-09-07T12:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

### Get a published item

- **Endpoint:** `GET /api/news/:slug`
- **Method:** `GET`
- **Authentication:** Public
- **Response `200`:** `{ "item": { ...public news item } }`
- **Response `404`:** `{ "error": "News item not found." }`

### Create item

- **Endpoint:** `POST /api/admin/news`
- **Method:** `POST`
- **Authentication:** Admin
- **Request:**

```json
{
  "kind": "news",
  "title": "AGM Notice",
  "slug": "agm-notice",
  "summary": "The annual general meeting will be held in October.",
  "content": "Members are invited to attend the annual general meeting."
}
```

`kind` defaults to `news`. `slug` is optional. Items are created as `draft`.

- **Response `201`:** `{ "item": { ...admin news item } }`

Admin fields add `status`, `createdAt`, `updatedAt`, `createdBy`.

### List items (admin)

- **Endpoint:** `GET /api/admin/news`
- **Method:** `GET`
- **Authentication:** Admin
- **Request:** query `kind`, `status`, `page`, `pageSize`
- **Response `200`:** `{ "items": [...], "page", "pageSize", "total" }`

### Get item (admin)

- **Endpoint:** `GET /api/admin/news/:id`
- **Method:** `GET`
- **Authentication:** Admin
- **Response `200`:** `{ "item": { ...admin news item } }`

### Update item

- **Endpoint:** `PATCH /api/admin/news/:id`
- **Method:** `PATCH`
- **Authentication:** Admin
- **Request:** same body as create. Does not change `status`.
- **Response `200`:** `{ "item": { ...admin news item } }`

### Publish item

- **Endpoint:** `POST /api/admin/news/:id/publish`
- **Method:** `POST`
- **Authentication:** Admin
- **Response `200`:** `{ "item": { ...admin news item, "status": "published" } }`

### Archive item

- **Endpoint:** `POST /api/admin/news/:id/archive`
- **Method:** `POST`
- **Authentication:** Admin
- **Response `200`:** `{ "item": { ...admin news item, "status": "archived" } }`
