# API Testing Guide - BlueBolt Management System

## Base URL
```
http://localhost:5000/api
```

## Authentication

### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "ceo@bluebolt.vn",
  "password": "ceo123"
}
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "ceo@bluebolt.vn",
    "name": "Nguyễn Văn CEO",
    "role": "CEO",
    "buId": null,
    "buName": null
  }
}
```

**Save the token** for subsequent requests!

---

## Test Endpoints (Use JWT Token)

### 2. Get Current User
```http
GET /api/auth/me
Authorization: Bearer <your_token>
```

### 3. Get Business Units
```http
GET /api/business-units
Authorization: Bearer <your_token>
```

**Expected (for CEO/Admin):**
```json
[
  { "id": "all", "name": "Tất cả BU" },
  { "id": "uuid1", "name": "BlueBolt Software" },
  { "id": "uuid2", "name": "BlueBolt Academy" },
  ...
]
```

### 4. Get Categories
```http
GET /api/categories
Authorization: Bearer <your_token>
```

**With filters:**
```http
GET /api/categories?type=chi&status=active
Authorization: Bearer <your_token>
```

### 5. Get Employees
```http
GET /api/employees
Authorization: Bearer <your_token>
```

**With filters:**
```http
GET /api/employees?buId=<bu_id>&specialization=Developer&status=WORKING
Authorization: Bearer <your_token>
```

### 6. Create Category
```http
POST /api/categories
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "code": "C99",
  "name": "Test Category",
  "type": "chi",
  "description": "Test description",
  "status": "active"
}
```

### 7. Update Category
```http
PUT /api/categories/<category_id>
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "code": "C99",
  "name": "Updated Category",
  "type": "chi",
  "description": "Updated description",
  "status": "active"
}
```

### 8. Delete Category
```http
DELETE /api/categories/<category_id>
Authorization: Bearer <your_token>
```

---

## Role-Based Testing

### Test as CEO (sees all BUs)
```http
POST /api/auth/login
{
  "email": "ceo@bluebolt.vn",
  "password": "ceo123"
}
```

Then:
```http
GET /api/employees
Authorization: Bearer <token>
```
Should return all 15 employees.

### Test as BU Manager (sees only their BU)
```http
POST /api/auth/login
{
  "email": "manager.software@bluebolt.vn",
  "password": "manager123"
}
```

Then:
```http
GET /api/employees
Authorization: Bearer <token>
```
Should return only employees from BlueBolt Software.

---

## Expected Results

✅ **Login**: Returns JWT token
✅ **Get BUs**: CEO/Admin see all + "Tất cả BU", others see only their BU
✅ **Get Categories**: Returns 16 categories
✅ **Get Employees**: Returns 15 employees (filtered by role)
✅ **CRUD Operations**: Create, update, delete work correctly
✅ **401 Error**: Without token or with invalid token

---

## Testing Tools

### Option 1: Postman
1. Import collection or create requests manually
2. Set Authorization header: `Bearer <token>`
3. Test all endpoints

### Option 2: Thunder Client (VS Code Extension)
1. Install Thunder Client extension
2. Create new request
3. Set method, URL, headers, body
4. Send request

### Option 3: curl (Command Line)
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ceo@bluebolt.vn","password":"ceo123"}'

# Get categories (replace TOKEN)
curl -X GET http://localhost:5000/api/categories \
  -H "Authorization: Bearer TOKEN"
```

### Option 4: Browser (for GET requests)
Open browser console and run:
```javascript
// Login first
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'ceo@bluebolt.vn', password: 'ceo123' })
});
const { token } = await response.json();
console.log('Token:', token);

// Then use token for other requests
const categories = await fetch('http://localhost:5000/api/categories', {
  headers: { 'Authorization': `Bearer ${token}` }
});
console.log(await categories.json());
```

---

## Common Issues

### 401 Unauthorized
- Check if token is included in Authorization header
- Check if token is valid (not expired)
- Try logging in again

### 500 Internal Server Error
- Check backend console for error logs
- Verify database connection
- Check if all required fields are provided

### CORS Error
- Backend should have CORS enabled (already configured)
- Check if frontend is running on correct port
