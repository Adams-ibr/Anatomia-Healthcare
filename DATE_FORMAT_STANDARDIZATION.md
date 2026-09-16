# Date Formatting Standardization

## Overview
This document describes the standardized date formatting utility introduced to provide consistent date display across the Anatomia-Healthcare codebase.

## Utility Location
`client/src/lib/dateUtils.ts`

## Available Functions

### 1. `formatFullDate(date: string | Date): string`
**Format:** `"MMM d, yyyy"` (e.g., "Jan 15, 2025")
**Use Cases:**
- Membership expiration dates in tables
- User creation dates
- Article/blog publication dates
- Event dates in admin panels
**Example:**
```typescript
formatFullDate(member.membershipExpiresAt) // "Jan 15, 2025"
```

### 2. `formatShortDate(date: string | Date): string`
**Format:** `"MMM d"` (e.g., "Jan 15")
**Use Cases:**
- Compact date display when year is obvious
- Timeline views
- Recent activity logs
**Example:**
```typescript
formatShortDate(article.createdAt) // "Jan 15"
```

### 3. `formatRelativeDate(date: string | Date): string`
**Format:** Relative time with suffix (e.g., "2 hours ago", "3 days from now")
**Use Cases:**
- Discussion board posts
- Comment timestamps
- Chat messages
- Recent activity indicators
**Example:**
```typescript
formatRelativeDate(comment.createdAt) // "2 hours ago"
```

### 4. `formatRelativeDateShort(date: string | Date): string`
**Format:** Relative time without suffix (e.g., "2 hours", "3 days")
**Use Cases:**
- Conversation lists
- Brief time indicators
- Sidebar timestamps
**Example:**
```typescript
formatRelativeDateShort(message.createdAt) // "2 hours"
```

### 5. `formatISODate(date: string | Date): string`
**Format:** ISO date string (e.g., "2025-01-15")
**Use Cases:**
- Form input values (date fields)
- Data export/CSV generation
- API requests
**Example:**
```typescript
formatISODate(member.membershipExpiresAt) // "2025-01-15"
```

### 6. `formatFullDateTime(date: string | Date): string`
**Format:** Full datetime (e.g., "Jan 15, 2025 at 2:30 PM")
**Use Cases:**
- Detailed timestamps
- Logs and debugging
- Complete audit trails
**Example:**
```typescript
formatFullDateTime(log.timestamp) // "Jan 15, 2025 at 2:30 PM"
```

### 7. `isPast(date: string | Date): boolean`
**Returns:** `true` if date is in the past
**Use Cases:**
- Subscription expiry checks
- Event status determination
- UI conditional rendering

### 8. `isFuture(date: string | Date): boolean`
**Returns:** `true` if date is in the future
**Use Cases:**
- Upcoming event checks
- Future expiry date validation
- Scheduled content display

### 9. `isSameDay(date1: string | Date, date2: string | Date): boolean`
**Returns:** `true` if both dates fall on the same day
**Use Cases:**
- Grouping messages by day
- Highlighting "today" vs other dates
- Date comparison logic

## Files Updated

### Phase 1 (Completed)
1. **client/src/lib/dateUtils.ts** - Created centralized utility
2. **client/src/pages/admin/AdminMembers.tsx** - Updated to use `formatFullDate` and `formatISODate`
3. **client/src/pages/admin/AdminUserManagement.tsx** - Updated to use `formatFullDate` and `formatISODate`
4. **client/src/pages/Blog.tsx** - Updated to use `formatFullDate`
5. **client/src/pages/SingleBlog.tsx** - Updated to use `formatFullDate`

### Phase 2 (Recommended for Future)
- AdminUsers.tsx - Replace manual formatDate function
- AdminApplications.tsx - Use `formatFullDate`
- AdminContacts.tsx - Use `formatFullDate`
- AdminNewsletter.tsx - Use `formatFullDate`
- ChatWidget.tsx - Use `formatRelativeDateShort`
- CommentSection.tsx - Use `formatRelativeDate`
- DiscussionBoard.tsx - Use `formatRelativeDate`

## Benefits

1. **Consistency:** All dates display in the same format across the application
2. **Maintainability:** Single location to modify date formatting globally
3. **Type Safety:** Accepts both string and Date objects with error handling
4. **Performance:** Memoization opportunities for frequently formatted dates
5. **Accessibility:** Consistent date formats aid screen reader users
6. **Internationalization:** Easy to extend for multiple language support

## Migration Guide

### Before (Inconsistent)
```typescript
// Different patterns throughout codebase
new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
new Date(date).toISOString().split("T")[0]
formatDistanceToNow(new Date(date), { addSuffix: true })
format(new Date(date), "MMM d, yyyy")
```

### After (Consistent)
```typescript
import { formatFullDate, formatISODate, formatRelativeDate } from "@/lib/dateUtils";

formatFullDate(date)        // "Jan 15, 2025"
formatISODate(date)         // "2025-01-15"
formatRelativeDate(date)    // "2 hours ago"
```

## Future Enhancements

1. **Timezone Support:** Add timezone parameter to functions
2. **Localization:** Support multiple languages and locales
3. **Custom Formats:** Allow custom format strings
4. **Formatting Cache:** Memoize frequently formatted dates for performance
5. **Validation:** Enhanced date validation and error handling

## Dependencies

- `date-fns` - Used for all date formatting operations

## Error Handling

All functions include try-catch blocks and return "Invalid Date" for invalid inputs:

```typescript
formatFullDate("not-a-date") // "Invalid Date"
formatFullDate(null)          // "Invalid Date"
```
