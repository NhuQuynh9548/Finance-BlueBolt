# BlueBolt API - Swagger Documentation

## 🎯 Truy cập Swagger UI

Sau khi backend chạy, mở browser và truy cập:

```
http://localhost:5000/api-docs
```

Bạn sẽ thấy giao diện Swagger UI với tất cả API endpoints!

---

## 📚 Tất Cả API Endpoints

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Login và nhận JWT token | ❌ No |
| GET | `/api/auth/me` | Lấy thông tin user hiện tại | ✅ Yes |
| POST | `/api/auth/logout` | Logout (client-side) | ✅ Yes |

**Test Login:**
```json
POST /api/auth/login
{
  "email": "ceo@bluebolt.vn",
  "password": "ceo123"
}
```

---

### 🏢 Business Units (`/api/business-units`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/business-units` | Lấy danh sách BUs (filtered by role) | ✅ Yes |
| GET | `/api/business-units/:id` | Lấy chi tiết BU | ✅ Yes |

---

### 👥 Employees (`/api/employees`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/employees` | Lấy danh sách nhân viên | ✅ Yes |
| GET | `/api/employees/:id` | Lấy chi tiết nhân viên | ✅ Yes |
| POST | `/api/employees` | Tạo nhân viên mới | ✅ Yes |
| PUT | `/api/employees/:id` | Cập nhật nhân viên | ✅ Yes |
| DELETE | `/api/employees/:id` | Xóa nhân viên (soft delete) | ✅ Yes |

**Query Parameters:**
- `buId` - Filter by Business Unit
- `specialization` - Filter by specialization
- `status` - Filter by work status (WORKING, PROBATION, RESIGNED)
- `search` - Search by name, email, phone

---

### 📋 Categories (`/api/categories`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/categories` | Lấy danh sách danh mục | ✅ Yes |
| POST | `/api/categories` | Tạo danh mục mới | ✅ Yes |
| PUT | `/api/categories/:id` | Cập nhật danh mục | ✅ Yes |
| DELETE | `/api/categories/:id` | Xóa danh mục | ✅ Yes |

**Query Parameters:**
- `type` - Filter by type (THU, CHI, VAY, HOAN_UNG)
- `status` - Filter by status (ACTIVE, INACTIVE)

---

### 🤝 Partners (`/api/partners`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/partners` | Lấy danh sách đối tác | ✅ Yes |
| GET | `/api/partners/:id` | Lấy chi tiết đối tác (360° view) | ✅ Yes |
| POST | `/api/partners` | Tạo đối tác mới | ✅ Yes |
| PUT | `/api/partners/:id` | Cập nhật đối tác | ✅ Yes |
| PUT | `/api/partners/:id/deactivate` | Vô hiệu hóa đối tác | ✅ Yes |
| POST | `/api/partners/:id/bank-accounts` | Thêm tài khoản ngân hàng | ✅ Yes |
| POST | `/api/partners/:id/contracts` | Thêm hợp đồng | ✅ Yes |

**Query Parameters:**
- `type` - Filter by type (CUSTOMER, SUPPLIER, BOTH)
- `status` - Filter by status (ACTIVE, INACTIVE)
- `search` - Search by name, ID, tax code

---

### 💰 Transactions (`/api/transactions`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/transactions` | Lấy danh sách giao dịch | ✅ Yes |
| GET | `/api/transactions/:id` | Lấy chi tiết giao dịch | ✅ Yes |
| POST | `/api/transactions` | Tạo giao dịch mới | ✅ Yes |
| PUT | `/api/transactions/:id` | Cập nhật giao dịch | ✅ Yes |
| DELETE | `/api/transactions/:id` | Xóa giao dịch | ✅ Yes |
| PUT | `/api/transactions/:id/approve` | Phê duyệt giao dịch | ✅ Yes (Manager+) |
| PUT | `/api/transactions/:id/reject` | Từ chối giao dịch | ✅ Yes (Manager+) |

**Query Parameters:**
- `buId` - Filter by Business Unit
- `type` - Filter by type (INCOME, EXPENSE, LOAN)
- `status` - Filter by approval status
- `dateFrom` - Filter from date
- `dateTo` - Filter to date

---

### 📊 Projects (`/api/projects`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/projects` | Lấy danh sách dự án | ✅ Yes |
| GET | `/api/projects/:id` | Lấy chi tiết dự án | ✅ Yes |
| POST | `/api/projects` | Tạo dự án mới | ✅ Yes |
| PUT | `/api/projects/:id` | Cập nhật dự án | ✅ Yes |
| DELETE | `/api/projects/:id` | Xóa dự án | ✅ Yes |

---

### 🎓 Master Data

#### Specializations (`/api/specializations`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/specializations` | Lấy danh sách chuyên môn |
| POST | `/api/specializations` | Tạo chuyên môn mới |

#### Employee Levels (`/api/employee-levels`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employee-levels` | Lấy danh sách cấp bậc |
| POST | `/api/employee-levels` | Tạo cấp bậc mới |

#### Payment Methods (`/api/payment-methods`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payment-methods` | Lấy danh sách phương thức thanh toán |
| POST | `/api/payment-methods` | Tạo phương thức mới |

---

### 📈 Dashboard (`/api/dashboard`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/dashboard/stats` | Lấy thống kê tổng quan | ✅ Yes |

**Query Parameters:**
- `buId` - Filter by Business Unit

---

## 🧪 Cách Sử Dụng Swagger UI

### Bước 1: Mở Swagger UI
```
http://localhost:5000/api-docs
```

### Bước 2: Login để lấy Token
1. Tìm endpoint `POST /api/auth/login`
2. Click "Try it out"
3. Nhập:
```json
{
  "email": "ceo@bluebolt.vn",
  "password": "ceo123"
}
```
4. Click "Execute"
5. Copy `token` từ response

### Bước 3: Authorize
1. Click nút "Authorize" ở góc trên bên phải
2. Paste token vào field "Value"
3. Click "Authorize"
4. Click "Close"

### Bước 4: Test API
Bây giờ bạn có thể test bất kỳ endpoint nào:
1. Chọn endpoint muốn test
2. Click "Try it out"
3. Nhập parameters (nếu có)
4. Click "Execute"
5. Xem response

---

## 🎨 Swagger UI Features

✅ **Interactive Testing** - Test API trực tiếp trên browser
✅ **Auto Documentation** - Tự động generate docs từ code
✅ **Request/Response Examples** - Xem ví dụ request và response
✅ **Schema Validation** - Validate request body theo schema
✅ **Authorization** - Dễ dàng test với JWT token
✅ **Try It Out** - Execute API calls ngay lập tức

---

## 📝 Response Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request thành công |
| 201 | Created - Tạo mới thành công |
| 400 | Bad Request - Request không hợp lệ |
| 401 | Unauthorized - Chưa đăng nhập hoặc token không hợp lệ |
| 403 | Forbidden - Không có quyền truy cập |
| 404 | Not Found - Không tìm thấy resource |
| 500 | Internal Server Error - Lỗi server |

---

## 🔒 Authentication

Tất cả endpoints (trừ `/api/auth/login`) đều yêu cầu JWT token trong header:

```
Authorization: Bearer <your_jwt_token>
```

Token có hiệu lực 24 giờ (configurable trong `.env`).

---

## 💡 Tips

1. **Save Token**: Copy token sau khi login để dùng cho các request khác
2. **Use Swagger UI**: Dễ dàng test hơn so với Postman
3. **Check Schema**: Xem schema để biết format data cần gửi
4. **Role-Based**: Test với các role khác nhau để verify RBAC
5. **Error Messages**: Đọc error messages để debug

---

## 🚀 Quick Start

```bash
# 1. Start backend
cd d:/Sidebar_Menu_Structure_Design/src/backend
npm run dev

# 2. Open Swagger UI
# Browser: http://localhost:5000/api-docs

# 3. Login và test!
```

Enjoy testing! 🎉
