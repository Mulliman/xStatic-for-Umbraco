# API Debugging Checks

## VA-1: 400 Error Investigation

**Common Symptom:** API calls failing, often silently or with generic errors

**ALWAYS check for 400 (Bad Request) errors first.** These indicate the data sent to the server is wrong.

**How to investigate:**

1. Open Chrome DevTools (F12)
2. Go to **Network** tab
3. Filter by **Fetch/XHR**
4. Look for requests with **red status** (400, 401, 403, 404, 500)
5. Click the failed request
6. Check **Response** tab for error details

**Before deep-diving into 400 errors:** Check all form selects/dropdowns first. Empty or broken selects are a common cause of 400 errors that leads to circular debugging. See **VF-1: Select/Combobox Behavior**.

**400 errors usually mean:**

| Error Pattern | Likely Cause |
|---------------|--------------|
| "Validation failed" | Required field missing or wrong type |
| "Invalid property" | Property name doesn't match backend model |
| "Cannot deserialize" | Wrong data structure (array vs object, string vs number) |
| Empty response body | Check Request payload - likely malformed |

**Debug checklist for 400 errors:**

- [ ] Check **Request** tab > **Payload** - is the data correct?
- [ ] Compare payload structure to backend model/DTO
- [ ] Check for `null` values where object expected
- [ ] Check for string where number expected (and vice versa)
- [ ] Verify enum values are strings (if using `JsonStringEnumConverter`)

---

## VA-2: Request Payload Validation

**Common Symptom:** Data appears correct in UI but API rejects it

**Check the actual payload being sent:**

1. Network tab > Click failed request > **Payload** tab
2. Compare against what the backend expects

**Common payload issues:**

| Issue | What to Look For |
|-------|------------------|
| Wrong property names | Backend uses `camelCase`, frontend sending `PascalCase` |
| Missing required fields | Check backend model for `[Required]` attributes |
| Wrong ID format | GUIDs should be lowercase with dashes |
| Enum as number | Should be string if backend uses `JsonStringEnumConverter` |
| Nested object null | Parent object exists but child is `null` |

**Example - verifying GUID format:**

```typescript
// WRONG - uppercase or no dashes
const id = "A1B2C3D4E5F6";

// CORRECT - lowercase with dashes
const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
```

**Example - verifying enum as string:**

```typescript
// WRONG - sending number
{ status: 0 }

// CORRECT - sending string (if backend has JsonStringEnumConverter)
{ status: "Draft" }
```

---

## VA-3: CORS and Auth Issues

**Common Symptom:** Requests blocked or returning 401/403

**401 Unauthorized:**

- Token expired - try refreshing the page
- API requires authentication but OpenAPI client not configured
- Check `umbraco-openapi-client` skill for proper setup

**403 Forbidden:**

- User doesn't have permission for this action
- Check user group permissions

**CORS errors (visible in Console):**

- API endpoint doesn't allow cross-origin requests
- Usually indicates wrong API URL or missing CORS configuration on backend

**Debug checklist:**

- [ ] Is there a CORS error in the Console?
- [ ] Check request headers - is Authorization header present?
- [ ] For custom APIs, verify OpenAPI client is configured
- [ ] Try refreshing the page to get new auth token
- [ ] Check if API endpoint is correct (no typos in URL)

**If using custom API controllers:**

Ensure the controller inherits from the correct base class and has proper authorization attributes. See `umbraco-openapi-client` skill for proper setup.
