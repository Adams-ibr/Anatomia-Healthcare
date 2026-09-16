# Admin Endpoint Pagination Guide

## Overview
This document explains the pagination pattern that has been applied to admin GET endpoints to prevent large dataset fetches from causing performance issues.

## Pattern Applied

All paginated admin endpoints now support:
- `page` query parameter (default: 1, min: 1)
- `limit` query parameter (default: 50, min: 1, max: 100)

Example: `/api/admin/articles?page=1&limit=50`

## Response Format

All paginated endpoints return responses in this format:

```json
{
  "data": [/* array of records */],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

## Endpoints Updated ✅

- ✅ `/api/admin/contacts` - Contact messages with pagination
- ✅ `/api/admin/newsletter` - Newsletter subscriptions with pagination
- ✅ `/api/admin/articles` - Blog articles with pagination

## Endpoints Remaining (Pattern to apply)

The following endpoints should follow the same pagination pattern:

### 1. `/api/admin/team`
```typescript
const page = Math.max(1, parseInt(req.query.page as string) || 1);
const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
const offset = (page - 1) * limit;

const { data: team, error, count } = await supabase
  .from("team_members")
  .select("*", { count: "exact" })
  .order("order", { ascending: true })
  .range(offset, offset + limit - 1);

res.json({ data: team, pagination: { page, limit, total: count, pages: Math.ceil((count || 0) / limit) } });
```

### 2. `/api/admin/products`
Same pattern as above, using "products" table

### 3. `/api/admin/faq`
Same pattern as above, using "faq_items" table

### 4. `/api/admin/careers`
Same pattern as above, using "careers" table

### 5. `/api/admin/applications`
Same pattern, using "job_applications" table

### 6. `/api/admin/departments`
Same pattern, using "departments" table

### 7. `/api/admin/partners`
Same pattern, using "partners" table

## Implementation Checklist

- [x] Contact messages pagination added
- [x] Newsletter subscriptions pagination added
- [x] Articles pagination added
- [ ] Team members pagination to add
- [ ] Products pagination to add
- [ ] FAQ items pagination to add
- [ ] Careers pagination to add
- [ ] Job applications pagination to add
- [ ] Departments pagination to add
- [ ] Partners pagination to add

## Benefits

1. **Reduced Payload**: Only sends necessary data instead of entire dataset
2. **Better Performance**: Faster response times for large datasets
3. **Reduced Memory**: Less data held in memory on both client and server
4. **Scalability**: Works efficiently as data grows
5. **UX Improvement**: Enables pagination UI in admin interfaces

## Testing

Test pagination with:
```bash
# First page
curl "http://localhost:5000/api/admin/articles?page=1&limit=10"

# Second page
curl "http://localhost:5000/api/admin/articles?page=2&limit=10"

# Custom limit
curl "http://localhost:5000/api/admin/articles?page=1&limit=100"
```

## Frontend Integration

Frontend should use the pagination data to:
1. Display current page number
2. Show total number of pages
3. Implement next/previous buttons
4. Allow users to jump to specific pages
5. Cache data with page as key in React Query

Example React Query usage:
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['admin/articles', page, limit],
  queryFn: () => fetch(`/api/admin/articles?page=${page}&limit=${limit}`).then(r => r.json()),
});

// Access data and pagination info
const articles = data?.data;
const { total, pages } = data?.pagination;
```
