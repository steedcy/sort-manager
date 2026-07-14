# v1.2 CI, Environment, and Item Pagination Design

## Goal

Ship v1.2.0 as a maintainable development baseline: GitHub CI verifies every push, local configuration is portable across machines, and the item list supports server-side pagination, sorting, and richer filtering.

## Scope

- Add GitHub Actions CI for backend tests and frontend lint/build.
- Move local database and upload settings behind environment variables with safe defaults.
- Add `.env.example` and document setup for new machines.
- Add a paged item search response while preserving the current item CRUD behavior.
- Update the item management UI to request pages from the backend and show accessible pagination controls.

## Architecture

The backend will expose `GET /api/items` as a paginated endpoint using Spring Data `Pageable`. The response will be wrapped in the existing `ApiResponse` shape and will include content plus page metadata in a new `PageResponse<T>` DTO. Filtering will support keyword, category, location, status, page, size, sort, and direction. Keyword will match item name and description.

Existing list consumers in the frontend will move to the new paginated shape. The item page will keep categories and locations loaded in parallel with item data, then render the paginated `content`. UI state will include `page`, `size`, filters, total count, total pages, and loading states. Pagination buttons will use real `button` elements, disabled states, and visible text labels for accessibility.

## API Contract

`GET /api/items`

Query parameters:

- `keyword`: optional string, matches item name or description.
- `categoryId`: optional number.
- `locationId`: optional number.
- `status`: optional `normal`, `expired`, or `expiring`.
- `page`: zero-based page number, default `0`.
- `size`: page size, default `12`, maximum `100`.
- `sort`: one of `createdAt`, `updatedAt`, `name`, `quantity`, `price`, `purchaseDate`, `expiryDate`, default `createdAt`.
- `direction`: `asc` or `desc`, default `desc`.

Response data:

```json
{
  "content": [],
  "page": 0,
  "size": 12,
  "totalElements": 0,
  "totalPages": 0,
  "first": true,
  "last": true,
  "empty": true
}
```

## Environment Configuration

`application.yml` will use environment placeholders:

- `SERVER_PORT`, default `8080`
- `DB_URL`, default local MySQL `sort_manager`
- `DB_USERNAME`, default `root`
- `DB_PASSWORD`, default `root123`
- `JPA_DDL_AUTO`, default `update`
- `APP_UPLOAD_PATH`, default `uploads/`
- `APP_UPLOAD_URL_PREFIX`, default `/uploads/`

CI will run tests without a real MySQL server by using an H2 test profile. Production deployment can override values through environment variables.

## UI/UX Quality

The item page remains a dense operational tool, not a marketing page. Controls must be scan-friendly, touch targets should be at least 44px where practical, disabled buttons must be visually distinct, and pagination state must be clear without relying on color alone. Loading and empty states remain visible.

## Testing

- Backend TDD tests cover default pagination, keyword filtering, category/location filtering, status filtering, and sort allowlisting.
- Frontend verification uses existing `npm run lint` and `npm run build`.
- Final verification runs backend `mvn clean test`, frontend `npm run lint`, frontend `npm run build`, and git status checks.

## Release Criteria

- CI workflow exists and uses repeatable commands.
- New machine setup is documented through README and `.env.example`.
- Backend pagination tests pass.
- Frontend works with the new paginated API shape.
- Branch is merged to `main`, tagged `v1.2.0`, and pushed to GitHub.
