# Security Specification for Birthday Surprise App

## Data Invariants
- A memory item must belong to a user.
- Memories can be photos, videos, or voices.
- Stories must have a valid title and content.
- Base64 strings should be limited in size to prevent resource exhaustion (Firestore limit is 1MB, we'll cap at 900KB).

## The Dirty Dozen Payloads (Targeting users/{userId}/memories/{memoryId})

1. **Identity Spoofing**: Attempt to write a memory with a `userId` that doesn't match the authenticated user.
2. **Path Poisoning**: Using a 2KB string as a `memoryId`.
3. **Invalid Type**: Setting `type` to "malware".
4. **Oversized URL**: Sending a 2MB Base64 string.
5. **No Auth**: Attempting to write without being signed in.
6. **Self-Promotion**: Authenticated user trying to write to another user's `users/{otherId}` path.
7. **Invalid Format**: `createdAt` as a number instead of a timestamp.
8. **Missing Fields**: Creating a memory without a `url`.
9. **Update Hijack**: Trying to change the `userId` or `type` of an existing memory.
10. **Resource Exhaustion**: Sending a payload with many "Ghost Fields".
11. **Spoofed Email**: Authenticated but email not verified (if mandated).
12. **Public Write**: Trying to write as an anonymous user (if restricted).

## Test Runner (Draft)
```typescript
// firestore.rules.test.ts
// Tests would go here verifying the above payloads return PERMISSION_DENIED
```
