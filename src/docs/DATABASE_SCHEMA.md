# 📊 BLUEBOLT - DATABASE SCHEMA DOCUMENTATION

**Hệ thống Quản lý Thu Chi dành cho Công ty BLUEBOLT**

Version: 1.0  
Last Updated: 14/01/2026  
Database: PostgreSQL 14+

---

## 📑 MỤC LỤC

1. [Tổng quan Database](#1-tổng-quan-database)
2. [Database Diagram (ERD)](#2-database-diagram-erd)
3. [Chi tiết các Bảng](#3-chi-tiết-các-bảng)
4. [Mối quan hệ (Relationships)](#4-mối-quan-hệ-relationships)
5. [Indexes](#5-indexes)
6. [Triggers](#6-triggers)
7. [Functions & Stored Procedures](#7-functions--stored-procedures)
8. [Views](#8-views)
9. [Constraints & Validation](#9-constraints--validation)
10. [Security & Permissions](#10-security--permissions)
11. [Migration Scripts](#11-migration-scripts)

---

## 1. TỔNG QUAN DATABASE

### 1.1. Mục đích
Database được thiết kế để quản lý:
- ✅ Giao dịch tài chính (Thu/Chi/Vay)
- ✅ Phân quyền theo vai trò và Business Unit
- ✅ Quy trình phê duyệt
- ✅ Phân bổ chi phí (trực tiếp/gián tiếp)
- ✅ Báo cáo tài chính theo BU

### 1.2. Công nghệ
- **Database Engine:** PostgreSQL 14+
- **ORM (khuyến nghị):** Prisma / Sequelize / TypeORM
- **Backup:** Automatic daily backups
- **Encoding:** UTF-8

### 1.3. Naming Convention
- **Tables:** `snake_case`, số ít (ví dụ: `transaction`, `user`)
- **Columns:** `snake_case`
- **Primary Key:** `id` (UUID hoặc BIGSERIAL)
- **Foreign Key:** `{table}_id` (ví dụ: `user_id`, `business_unit_id`)
- **Indexes:** `idx_{table}_{column}`
- **Triggers:** `trg_{table}_{action}`
- **Functions:** `fn_{purpose}`

---

## 2. DATABASE DIAGRAM (ERD)

```
┌─────────────────────┐
│     business_unit   │
│─────────────────────│
│ id (PK)             │
│ name                │
│ code                │
│ description         │
│ is_active           │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │
           │ 1:N
           │
┌──────────▼──────────┐         ┌─────────────────────┐
│       user          │         │     user_role       │
│─────────────────────│◄────────│─────────────────────│
│ id (PK)             │  N:1    │ id (PK)             │
│ email               │         │ name                │
│ password_hash       │         │ code                │
│ full_name           │         │ permissions         │
│ phone               │         │ created_at          │
│ avatar_url          │         └─────────────────────┘
│ role_id (FK)        │
│ business_unit_id(FK)│
│ is_active           │
│ last_login_at       │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │
           │ 1:N (created_by)
           │
┌──────────▼──────────────────────────────────────────┐
│                  transaction                        │
│─────────────────────────────────────────────────────│
│ id (PK)                                             │
│ transaction_code (UNIQUE)                           │
│ transaction_type (income/expense/loan)              │
│ transaction_date                                    │
│ amount                                              │
│ category_id (FK)                                    │
│ business_unit_id (FK)                               │
│ object_type (employee/partner/project)              │
│ object_id (FK - polymorphic)                        │
│ object_name                                         │
│ payment_method_id (FK)                              │
│ cost_allocation (direct/indirect)                   │
│ allocation_rule                                     │
│ project_id (FK)                                     │
│ description                                         │
│ approval_status (draft/pending/approved/rejected)   │
│ approved_by (FK → user)                             │
│ approved_at                                         │
│ rejection_reason                                    │
│ attachment_count                                    │
│ created_by (FK → user)                              │
│ updated_by (FK → user)                              │
│ created_at                                          │
│ updated_at                                          │
└──────────┬──────────────────────────────────────────┘
           │
           │ 1:N
           │
┌──────────▼──────────────────┐
│  transaction_allocation     │
│─────────────────────────────│
│ id (PK)                     │
│ transaction_id (FK)         │
│ business_unit_id (FK)       │
│ percentage                  │
│ amount                      │
│ created_at                  │
└─────────────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│     category        │       │   payment_method    │
│─────────────────────│       │─────────────────────│
│ id (PK)             │       │ id (PK)             │
│ name                │       │ name                │
│ type (income/expense│       │ code                │
│ code                │       │ description         │
│ parent_id (FK)      │       │ is_active           │
│ is_active           │       │ created_at          │
│ created_at          │       └─────────────────────┘
└─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│      employee       │       │      partner        │
│─────────────────────│       │─────────────────────│
│ id (PK)             │       │ id (PK)             │
│ employee_code       │       │ partner_code        │
│ full_name           │       │ company_name        │
│ email               │       │ contact_person      │
│ phone               │       │ email               │
│ position            │       │ phone               │
│ business_unit_id(FK)│       │ address             │
│ hire_date           │       │ tax_code            │
│ is_active           │       │ partner_type        │
│ created_at          │       │ is_active           │
│ updated_at          │       │ created_at          │
└─────────────────────┘       └─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│      project        │       │   attachment        │
│─────────────────────│       │─────────────────────│
│ id (PK)             │       │ id (PK)             │
│ project_code        │       │ transaction_id (FK) │
│ project_name        │       │ file_name           │
│ business_unit_id(FK)│       │ file_url            │
│ start_date          │       │ file_size           │
│ end_date            │       │ file_type           │
│ status              │       │ uploaded_by (FK)    │
│ budget              │       │ uploaded_at         │
│ is_active           │       └─────────────────────┘
│ created_at          │
└─────────────────────┘

┌─────────────────────┐
│   approval_history  │
│─────────────────────│
│ id (PK)             │
│ transaction_id (FK) │
│ action (submit/     │
│   approve/reject)   │
│ from_status         │
│ to_status           │
│ performed_by (FK)   │
│ comment             │
│ performed_at        │
└─────────────────────┘

┌─────────────────────┐
│   audit_log         │
│─────────────────────│
│ id (PK)             │
│ table_name          │
│ record_id           │
│ action (INSERT/     │
│   UPDATE/DELETE)    │
│ old_data (JSONB)    │
│ new_data (JSONB)    │
│ changed_by (FK)     │
│ changed_at          │
│ ip_address          │
└─────────────────────┘
```

---

## 3. CHI TIẾT CÁC BẢNG

### 3.1. `business_unit` (Đơn vị kinh doanh)

```sql
CREATE TABLE business_unit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE business_unit IS 'Các đơn vị kinh doanh trong công ty (Software, Academy, Services, R&D, G&A)';
COMMENT ON COLUMN business_unit.code IS 'Mã viết tắt BU (VD: SW, AC, SV, RD, GA)';
```

**Dữ liệu mẫu:**
```sql
INSERT INTO business_unit (name, code, description) VALUES
('BlueBolt Software', 'SW', 'Đơn vị phát triển phần mềm'),
('BlueBolt Academy', 'AC', 'Đơn vị đào tạo'),
('BlueBolt Services', 'SV', 'Đơn vị dịch vụ'),
('BlueBolt R&D', 'RD', 'Đơn vị nghiên cứu và phát triển'),
('BlueBolt G&A', 'GA', 'Đơn vị hành chính tổng hợp');
```

---

### 3.2. `user_role` (Vai trò người dùng)

```sql
CREATE TABLE user_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    permissions JSONB NOT NULL DEFAULT '[]',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE user_role IS 'Vai trò và quyền hạn của người dùng';
COMMENT ON COLUMN user_role.permissions IS 'Mảng JSON chứa các quyền hạn';
```

**Dữ liệu mẫu:**
```sql
INSERT INTO user_role (name, code, permissions, description) VALUES
('CEO', 'CEO', '["view_all", "approve_all", "manage_all"]', 'Giám đốc điều hành - Full quyền'),
('Admin', 'ADMIN', '["view_all", "create", "edit", "delete", "approve"]', 'Quản trị hệ thống'),
('Trưởng BU', 'BU_MANAGER', '["view_bu", "approve_bu", "manage_bu"]', 'Trưởng đơn vị kinh doanh'),
('Kế toán', 'ACCOUNTANT', '["view_all", "create", "edit"]', 'Nhân viên kế toán'),
('Nhân viên', 'EMPLOYEE', '["view_own", "create_draft"]', 'Nhân viên thông thường');
```

---

### 3.3. `user` (Người dùng)

```sql
CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role_id UUID NOT NULL REFERENCES user_role(id),
    business_unit_id UUID REFERENCES business_unit(id),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "user" IS 'Người dùng hệ thống';
COMMENT ON COLUMN "user".password_hash IS 'Mật khẩu đã hash (bcrypt)';
COMMENT ON COLUMN "user".business_unit_id IS 'NULL nếu là CEO/Admin (xem tất cả BU)';
```

---

### 3.4. `category` (Danh mục thu chi)

```sql
CREATE TABLE category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'loan')),
    code VARCHAR(50) NOT NULL,
    parent_id UUID REFERENCES category(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(code, type)
);

COMMENT ON TABLE category IS 'Danh mục phân loại giao dịch (có thể có cấu trúc cây)';
COMMENT ON COLUMN category.parent_id IS 'NULL nếu là danh mục cha, có giá trị nếu là danh mục con';
```

**Dữ liệu mẫu:**
```sql
INSERT INTO category (name, type, code) VALUES
-- Thu
('Doanh thu dịch vụ', 'income', 'INCOME_SERVICE'),
('Doanh thu dự án', 'income', 'INCOME_PROJECT'),
('Doanh thu đào tạo', 'income', 'INCOME_TRAINING'),
('Doanh thu khác', 'income', 'INCOME_OTHER'),

-- Chi
('Lương, thưởng, phụ cấp', 'expense', 'EXP_SALARY'),
('Bảo hiểm xã hội', 'expense', 'EXP_INSURANCE'),
('Chi phí văn phòng', 'expense', 'EXP_OFFICE'),
('Chi phí marketing', 'expense', 'EXP_MARKETING'),
('Chi phí vận hành', 'expense', 'EXP_OPERATION'),
('Chi phí khác', 'expense', 'EXP_OTHER'),

-- Vay/Tạm ứng
('Tạm ứng nhân viên', 'loan', 'LOAN_EMPLOYEE'),
('Vay ngắn hạn', 'loan', 'LOAN_SHORT_TERM');
```

---

### 3.5. `payment_method` (Phương thức thanh toán)

```sql
CREATE TABLE payment_method (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE payment_method IS 'Phương thức thanh toán';
```

**Dữ liệu mẫu:**
```sql
INSERT INTO payment_method (name, code) VALUES
('Tiền mặt', 'CASH'),
('Chuyển khoản', 'BANK_TRANSFER'),
('Ví điện tử', 'E_WALLET'),
('Séc', 'CHEQUE');
```

---

### 3.6. `employee` (Nhân viên)

```sql
CREATE TABLE employee (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    position VARCHAR(100),
    business_unit_id UUID REFERENCES business_unit(id),
    hire_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE employee IS 'Danh sách nhân viên (khác với user - employee là đối tượng nhận lương/tạm ứng)';
```

---

### 3.7. `partner` (Đối tác)

```sql
CREATE TABLE partner (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_code VARCHAR(50) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    tax_code VARCHAR(50),
    partner_type VARCHAR(50) CHECK (partner_type IN ('customer', 'vendor', 'both')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE partner IS 'Đối tác (khách hàng/nhà cung cấp)';
```

---

### 3.8. `project` (Dự án)

```sql
CREATE TABLE project (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code VARCHAR(50) NOT NULL UNIQUE,
    project_name VARCHAR(255) NOT NULL,
    business_unit_id UUID REFERENCES business_unit(id),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) CHECK (status IN ('planning', 'in_progress', 'completed', 'cancelled')),
    budget DECIMAL(18, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE project IS 'Dự án của công ty';
```

---

### 3.9. `transaction` (Giao dịch - BẢNG CHÍNH)

```sql
CREATE TABLE transaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_code VARCHAR(50) NOT NULL UNIQUE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense', 'loan')),
    transaction_date DATE NOT NULL,
    amount DECIMAL(18, 2) NOT NULL CHECK (amount > 0),
    
    -- Phân loại
    category_id UUID NOT NULL REFERENCES category(id),
    business_unit_id UUID NOT NULL REFERENCES business_unit(id),
    
    -- Đối tượng (polymorphic)
    object_type VARCHAR(20) CHECK (object_type IN ('employee', 'partner', 'project')),
    object_id UUID,
    object_name VARCHAR(255) NOT NULL,
    
    -- Thanh toán
    payment_method_id UUID NOT NULL REFERENCES payment_method(id),
    
    -- Phân bổ chi phí
    cost_allocation VARCHAR(20) DEFAULT 'direct' CHECK (cost_allocation IN ('direct', 'indirect')),
    allocation_rule VARCHAR(255),
    
    -- Dự án
    project_id UUID REFERENCES project(id),
    
    -- Mô tả
    description TEXT,
    
    -- Phê duyệt
    approval_status VARCHAR(20) DEFAULT 'draft' CHECK (approval_status IN ('draft', 'pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES "user"(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- File đính kèm
    attachment_count INTEGER DEFAULT 0,
    
    -- Audit
    created_by UUID NOT NULL REFERENCES "user"(id),
    updated_by UUID REFERENCES "user"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE transaction IS 'Giao dịch tài chính (Thu/Chi/Vay)';
COMMENT ON COLUMN transaction.transaction_code IS 'Mã giao dịch tự động: T[MM][YY]_[Number] / C[MM][YY]_[Number] / V[MM][YY]_[Number]';
COMMENT ON COLUMN transaction.object_type IS 'Loại đối tượng: employee (nhân viên), partner (đối tác), project (dự án)';
COMMENT ON COLUMN transaction.object_id IS 'ID của employee/partner/project tương ứng';
COMMENT ON COLUMN transaction.cost_allocation IS 'direct: chi phí trực tiếp cho BU, indirect: phân bổ gián tiếp cho nhiều BU';
```

---

### 3.10. `transaction_allocation` (Phân bổ chi phí gián tiếp)

```sql
CREATE TABLE transaction_allocation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transaction(id) ON DELETE CASCADE,
    business_unit_id UUID NOT NULL REFERENCES business_unit(id),
    percentage DECIMAL(5, 2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
    amount DECIMAL(18, 2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(transaction_id, business_unit_id)
);

COMMENT ON TABLE transaction_allocation IS 'Phân bổ chi phí gián tiếp cho các BU';
COMMENT ON COLUMN transaction_allocation.percentage IS 'Tỷ lệ phân bổ (%)';
```

---

### 3.11. `attachment` (File đính kèm)

```sql
CREATE TABLE attachment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transaction(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_by UUID NOT NULL REFERENCES "user"(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE attachment IS 'File đính kèm của giao dịch';
```

---

### 3.12. `approval_history` (Lịch sử phê duyệt)

```sql
CREATE TABLE approval_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transaction(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('submit', 'approve', 'reject', 'cancel')),
    from_status VARCHAR(20),
    to_status VARCHAR(20),
    performed_by UUID NOT NULL REFERENCES "user"(id),
    comment TEXT,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE approval_history IS 'Lịch sử phê duyệt giao dịch';
```

---

### 3.13. `audit_log` (Nhật ký kiểm toán)

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES "user"(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET
);

COMMENT ON TABLE audit_log IS 'Nhật ký theo dõi mọi thay đổi trong hệ thống';
```

---

## 4. MỐI QUAN HỆ (RELATIONSHIPS)

### 4.1. Foreign Key Constraints

```sql
-- user → user_role (N:1)
ALTER TABLE "user" ADD CONSTRAINT fk_user_role 
    FOREIGN KEY (role_id) REFERENCES user_role(id);

-- user → business_unit (N:1)
ALTER TABLE "user" ADD CONSTRAINT fk_user_business_unit 
    FOREIGN KEY (business_unit_id) REFERENCES business_unit(id);

-- transaction → category (N:1)
ALTER TABLE transaction ADD CONSTRAINT fk_transaction_category 
    FOREIGN KEY (category_id) REFERENCES category(id);

-- transaction → business_unit (N:1)
ALTER TABLE transaction ADD CONSTRAINT fk_transaction_business_unit 
    FOREIGN KEY (business_unit_id) REFERENCES business_unit(id);

-- transaction → payment_method (N:1)
ALTER TABLE transaction ADD CONSTRAINT fk_transaction_payment_method 
    FOREIGN KEY (payment_method_id) REFERENCES payment_method(id);

-- transaction → project (N:1)
ALTER TABLE transaction ADD CONSTRAINT fk_transaction_project 
    FOREIGN KEY (project_id) REFERENCES project(id);

-- transaction → user (created_by)
ALTER TABLE transaction ADD CONSTRAINT fk_transaction_created_by 
    FOREIGN KEY (created_by) REFERENCES "user"(id);

-- transaction → user (approved_by)
ALTER TABLE transaction ADD CONSTRAINT fk_transaction_approved_by 
    FOREIGN KEY (approved_by) REFERENCES "user"(id);

-- transaction_allocation → transaction (N:1)
ALTER TABLE transaction_allocation ADD CONSTRAINT fk_allocation_transaction 
    FOREIGN KEY (transaction_id) REFERENCES transaction(id) ON DELETE CASCADE;

-- transaction_allocation → business_unit (N:1)
ALTER TABLE transaction_allocation ADD CONSTRAINT fk_allocation_business_unit 
    FOREIGN KEY (business_unit_id) REFERENCES business_unit(id);

-- attachment → transaction (N:1)
ALTER TABLE attachment ADD CONSTRAINT fk_attachment_transaction 
    FOREIGN KEY (transaction_id) REFERENCES transaction(id) ON DELETE CASCADE;

-- approval_history → transaction (N:1)
ALTER TABLE approval_history ADD CONSTRAINT fk_approval_transaction 
    FOREIGN KEY (transaction_id) REFERENCES transaction(id) ON DELETE CASCADE;
```

### 4.2. Polymorphic Relationship

Transaction có mối quan hệ polymorphic với employee/partner/project:

```sql
-- Không tạo FK vì polymorphic, nhưng có thể tạo trigger để validate
CREATE OR REPLACE FUNCTION fn_validate_transaction_object()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.object_type = 'employee' THEN
        IF NOT EXISTS (SELECT 1 FROM employee WHERE id = NEW.object_id) THEN
            RAISE EXCEPTION 'Invalid employee_id';
        END IF;
    ELSIF NEW.object_type = 'partner' THEN
        IF NOT EXISTS (SELECT 1 FROM partner WHERE id = NEW.object_id) THEN
            RAISE EXCEPTION 'Invalid partner_id';
        END IF;
    ELSIF NEW.object_type = 'project' THEN
        IF NOT EXISTS (SELECT 1 FROM project WHERE id = NEW.object_id) THEN
            RAISE EXCEPTION 'Invalid project_id';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_transaction_object
BEFORE INSERT OR UPDATE ON transaction
FOR EACH ROW
EXECUTE FUNCTION fn_validate_transaction_object();
```

---

## 5. INDEXES

### 5.1. Performance Indexes

```sql
-- transaction: Tìm kiếm theo mã giao dịch (rất thường xuyên)
CREATE UNIQUE INDEX idx_transaction_code ON transaction(transaction_code);

-- transaction: Filter theo BU (cho Dashboard & Quản lý thu chi)
CREATE INDEX idx_transaction_business_unit ON transaction(business_unit_id);

-- transaction: Filter theo ngày (cho báo cáo)
CREATE INDEX idx_transaction_date ON transaction(transaction_date DESC);

-- transaction: Filter theo trạng thái phê duyệt
CREATE INDEX idx_transaction_approval_status ON transaction(approval_status);

-- transaction: Filter theo loại giao dịch
CREATE INDEX idx_transaction_type ON transaction(transaction_type);

-- transaction: Composite index cho query phổ biến
CREATE INDEX idx_transaction_bu_date_status 
ON transaction(business_unit_id, transaction_date DESC, approval_status);

-- transaction: Full-text search
CREATE INDEX idx_transaction_search 
ON transaction USING gin(to_tsvector('english', object_name || ' ' || COALESCE(description, '')));

-- user: Đăng nhập
CREATE UNIQUE INDEX idx_user_email ON "user"(email);

-- employee: Tìm theo mã
CREATE UNIQUE INDEX idx_employee_code ON employee(employee_code);

-- partner: Tìm theo mã
CREATE UNIQUE INDEX idx_partner_code ON partner(partner_code);

-- project: Tìm theo mã
CREATE UNIQUE INDEX idx_project_code ON project(project_code);

-- approval_history: Trace lịch sử
CREATE INDEX idx_approval_history_transaction ON approval_history(transaction_id, performed_at DESC);

-- audit_log: Trace thay đổi
CREATE INDEX idx_audit_log_record ON audit_log(table_name, record_id, changed_at DESC);
```

### 5.2. Partial Indexes (Tối ưu cho query cụ thể)

```sql
-- Chỉ index các giao dịch đang chờ phê duyệt (query thường xuyên)
CREATE INDEX idx_transaction_pending 
ON transaction(business_unit_id, created_at DESC) 
WHERE approval_status = 'pending';

-- Chỉ index các giao dịch có phân bổ gián tiếp
CREATE INDEX idx_transaction_indirect 
ON transaction(business_unit_id) 
WHERE cost_allocation = 'indirect';
```

---

## 6. TRIGGERS

### 6.1. Auto-generate Transaction Code

```sql
CREATE OR REPLACE FUNCTION fn_generate_transaction_code()
RETURNS TRIGGER AS $$
DECLARE
    prefix CHAR(1);
    month_year CHAR(4);
    seq_number INTEGER;
    new_code VARCHAR(50);
BEGIN
    -- Xác định prefix dựa vào transaction_type
    CASE NEW.transaction_type
        WHEN 'income' THEN prefix := 'T';
        WHEN 'expense' THEN prefix := 'C';
        WHEN 'loan' THEN prefix := 'V';
    END CASE;
    
    -- Lấy tháng và năm từ transaction_date
    month_year := TO_CHAR(NEW.transaction_date, 'MMYY');
    
    -- Tìm số thứ tự tiếp theo cho tháng này
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(transaction_code FROM '[0-9]+$') AS INTEGER)
    ), 0) + 1
    INTO seq_number
    FROM transaction
    WHERE transaction_code LIKE prefix || month_year || '_%';
    
    -- Tạo mã giao dịch
    new_code := prefix || month_year || '_' || LPAD(seq_number::TEXT, 2, '0');
    
    -- Gán vào NEW.transaction_code
    NEW.transaction_code := new_code;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_transaction_code
BEFORE INSERT ON transaction
FOR EACH ROW
WHEN (NEW.transaction_code IS NULL OR NEW.transaction_code = '')
EXECUTE FUNCTION fn_generate_transaction_code();
```

### 6.2. Auto-update timestamp

```sql
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Áp dụng cho các bảng có updated_at
CREATE TRIGGER trg_user_updated_at
BEFORE UPDATE ON "user"
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_transaction_updated_at
BEFORE UPDATE ON transaction
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_business_unit_updated_at
BEFORE UPDATE ON business_unit
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_employee_updated_at
BEFORE UPDATE ON employee
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_partner_updated_at
BEFORE UPDATE ON partner
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_project_updated_at
BEFORE UPDATE ON project
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();
```

### 6.3. Audit Log Trigger

```sql
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), NEW.created_by);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NEW.updated_by);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_data)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD));
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Áp dụng cho transaction
CREATE TRIGGER trg_transaction_audit
AFTER INSERT OR UPDATE OR DELETE ON transaction
FOR EACH ROW
EXECUTE FUNCTION fn_audit_log();
```

### 6.4. Validate Allocation Percentages

```sql
CREATE OR REPLACE FUNCTION fn_validate_allocation_sum()
RETURNS TRIGGER AS $$
DECLARE
    total_percentage DECIMAL(5, 2);
BEGIN
    -- Tính tổng % phân bổ cho transaction này
    SELECT COALESCE(SUM(percentage), 0)
    INTO total_percentage
    FROM transaction_allocation
    WHERE transaction_id = NEW.transaction_id;
    
    -- Kiểm tra tổng không vượt quá 100%
    IF total_percentage > 100 THEN
        RAISE EXCEPTION 'Total allocation percentage cannot exceed 100%% (current: %%)', total_percentage;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_allocation_sum
AFTER INSERT OR UPDATE ON transaction_allocation
FOR EACH ROW
EXECUTE FUNCTION fn_validate_allocation_sum();
```

### 6.5. Update Attachment Count

```sql
CREATE OR REPLACE FUNCTION fn_update_attachment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE transaction 
        SET attachment_count = attachment_count + 1 
        WHERE id = NEW.transaction_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE transaction 
        SET attachment_count = GREATEST(attachment_count - 1, 0)
        WHERE id = OLD.transaction_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_attachment_count_insert
AFTER INSERT ON attachment
FOR EACH ROW
EXECUTE FUNCTION fn_update_attachment_count();

CREATE TRIGGER trg_update_attachment_count_delete
AFTER DELETE ON attachment
FOR EACH ROW
EXECUTE FUNCTION fn_update_attachment_count();
```

---

## 7. FUNCTIONS & STORED PROCEDURES

### 7.1. Get BU Financial Summary

```sql
CREATE OR REPLACE FUNCTION fn_get_bu_financial_summary(
    p_business_unit_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    total_income DECIMAL(18, 2),
    total_expense DECIMAL(18, 2),
    total_loan DECIMAL(18, 2),
    net_profit DECIMAL(18, 2),
    profit_margin DECIMAL(5, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expense,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'loan' THEN t.amount ELSE 0 END), 0) AS total_loan,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE -t.amount END), 0) AS net_profit,
        CASE 
            WHEN SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END) > 0 THEN
                (SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE -t.amount END) / 
                 SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END)) * 100
            ELSE 0
        END AS profit_margin
    FROM transaction t
    WHERE t.business_unit_id = p_business_unit_id
      AND t.approval_status = 'approved'
      AND t.transaction_date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;
```

**Sử dụng:**
```sql
SELECT * FROM fn_get_bu_financial_summary(
    'uuid-of-bluebolt-software',
    '2026-01-01',
    '2026-12-31'
);
```

### 7.2. Approve Transaction

```sql
CREATE OR REPLACE FUNCTION fn_approve_transaction(
    p_transaction_id UUID,
    p_approved_by UUID,
    p_comment TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_old_status VARCHAR(20);
BEGIN
    -- Lấy trạng thái hiện tại
    SELECT approval_status INTO v_old_status
    FROM transaction
    WHERE id = p_transaction_id;
    
    -- Kiểm tra trạng thái hợp lệ
    IF v_old_status NOT IN ('draft', 'pending') THEN
        RAISE EXCEPTION 'Transaction cannot be approved from status: %', v_old_status;
    END IF;
    
    -- Update transaction
    UPDATE transaction
    SET approval_status = 'approved',
        approved_by = p_approved_by,
        approved_at = CURRENT_TIMESTAMP,
        updated_by = p_approved_by
    WHERE id = p_transaction_id;
    
    -- Log approval history
    INSERT INTO approval_history (
        transaction_id, action, from_status, to_status, 
        performed_by, comment
    ) VALUES (
        p_transaction_id, 'approve', v_old_status, 'approved',
        p_approved_by, p_comment
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### 7.3. Reject Transaction

```sql
CREATE OR REPLACE FUNCTION fn_reject_transaction(
    p_transaction_id UUID,
    p_rejected_by UUID,
    p_rejection_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_old_status VARCHAR(20);
BEGIN
    SELECT approval_status INTO v_old_status
    FROM transaction
    WHERE id = p_transaction_id;
    
    IF v_old_status NOT IN ('pending') THEN
        RAISE EXCEPTION 'Transaction cannot be rejected from status: %', v_old_status;
    END IF;
    
    UPDATE transaction
    SET approval_status = 'rejected',
        rejection_reason = p_rejection_reason,
        updated_by = p_rejected_by
    WHERE id = p_transaction_id;
    
    INSERT INTO approval_history (
        transaction_id, action, from_status, to_status, 
        performed_by, comment
    ) VALUES (
        p_transaction_id, 'reject', v_old_status, 'rejected',
        p_rejected_by, p_rejection_reason
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### 7.4. Get Transactions with Indirect Allocation

```sql
CREATE OR REPLACE FUNCTION fn_get_bu_transactions_with_allocation(
    p_business_unit_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    transaction_id UUID,
    transaction_code VARCHAR(50),
    transaction_type VARCHAR(20),
    transaction_date DATE,
    original_bu_id UUID,
    original_bu_name VARCHAR(255),
    allocation_type VARCHAR(20),
    allocated_amount DECIMAL(18, 2),
    allocation_percentage DECIMAL(5, 2)
) AS $$
BEGIN
    RETURN QUERY
    -- Direct transactions
    SELECT 
        t.id,
        t.transaction_code,
        t.transaction_type,
        t.transaction_date,
        t.business_unit_id,
        bu.name,
        'direct'::VARCHAR(20),
        t.amount,
        100.00::DECIMAL(5, 2)
    FROM transaction t
    JOIN business_unit bu ON t.business_unit_id = bu.id
    WHERE t.business_unit_id = p_business_unit_id
      AND t.approval_status = 'approved'
      AND t.transaction_date BETWEEN p_start_date AND p_end_date
    
    UNION ALL
    
    -- Indirect allocations
    SELECT 
        t.id,
        t.transaction_code,
        t.transaction_type,
        t.transaction_date,
        t.business_unit_id,
        bu.name,
        'indirect'::VARCHAR(20),
        ta.amount,
        ta.percentage
    FROM transaction t
    JOIN transaction_allocation ta ON t.id = ta.transaction_id
    JOIN business_unit bu ON t.business_unit_id = bu.id
    WHERE ta.business_unit_id = p_business_unit_id
      AND t.approval_status = 'approved'
      AND t.transaction_date BETWEEN p_start_date AND p_end_date
    
    ORDER BY transaction_date DESC;
END;
$$ LANGUAGE plpgsql;
```

---

## 8. VIEWS

### 8.1. Transaction Summary View

```sql
CREATE OR REPLACE VIEW v_transaction_summary AS
SELECT 
    t.id,
    t.transaction_code,
    t.transaction_type,
    t.transaction_date,
    t.amount,
    c.name AS category_name,
    bu.name AS business_unit_name,
    bu.code AS business_unit_code,
    t.object_name,
    pm.name AS payment_method_name,
    t.approval_status,
    u_created.full_name AS created_by_name,
    u_approved.full_name AS approved_by_name,
    t.created_at,
    t.approved_at
FROM transaction t
LEFT JOIN category c ON t.category_id = c.id
LEFT JOIN business_unit bu ON t.business_unit_id = bu.id
LEFT JOIN payment_method pm ON t.payment_method_id = pm.id
LEFT JOIN "user" u_created ON t.created_by = u_created.id
LEFT JOIN "user" u_approved ON t.approved_by = u_approved.id;

COMMENT ON VIEW v_transaction_summary IS 'View tổng hợp thông tin giao dịch với tên đầy đủ';
```

### 8.2. BU Performance View

```sql
CREATE OR REPLACE VIEW v_bu_performance AS
SELECT 
    bu.id AS business_unit_id,
    bu.name AS business_unit_name,
    bu.code AS business_unit_code,
    EXTRACT(YEAR FROM t.transaction_date) AS year,
    EXTRACT(MONTH FROM t.transaction_date) AS month,
    SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END) AS total_expense,
    SUM(CASE WHEN t.transaction_type = 'loan' THEN t.amount ELSE 0 END) AS total_loan,
    SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE -t.amount END) AS net_profit,
    COUNT(t.id) AS transaction_count
FROM business_unit bu
LEFT JOIN transaction t ON bu.id = t.business_unit_id AND t.approval_status = 'approved'
GROUP BY bu.id, bu.name, bu.code, EXTRACT(YEAR FROM t.transaction_date), EXTRACT(MONTH FROM t.transaction_date);

COMMENT ON VIEW v_bu_performance IS 'Hiệu suất tài chính theo BU và tháng';
```

### 8.3. Pending Approval View

```sql
CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT 
    t.id,
    t.transaction_code,
    t.transaction_type,
    t.transaction_date,
    t.amount,
    bu.name AS business_unit_name,
    c.name AS category_name,
    u.full_name AS created_by_name,
    t.created_at,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.created_at))/3600 AS hours_pending
FROM transaction t
JOIN business_unit bu ON t.business_unit_id = bu.id
JOIN category c ON t.category_id = c.id
JOIN "user" u ON t.created_by = u.id
WHERE t.approval_status = 'pending'
ORDER BY t.created_at ASC;

COMMENT ON VIEW v_pending_approvals IS 'Danh sách giao dịch chờ phê duyệt';
```

---

## 9. CONSTRAINTS & VALIDATION

### 9.1. Check Constraints

```sql
-- Đảm bảo approval_status hợp lệ
ALTER TABLE transaction 
ADD CONSTRAINT chk_approval_status 
CHECK (approval_status IN ('draft', 'pending', 'approved', 'rejected'));

-- Đảm bảo amount > 0
ALTER TABLE transaction 
ADD CONSTRAINT chk_amount_positive 
CHECK (amount > 0);

-- Đảm bảo percentage hợp lệ
ALTER TABLE transaction_allocation 
ADD CONSTRAINT chk_percentage_valid 
CHECK (percentage > 0 AND percentage <= 100);

-- Đảm bảo transaction_date không quá xa trong quá khứ/tương lai
ALTER TABLE transaction 
ADD CONSTRAINT chk_transaction_date_valid 
CHECK (
    transaction_date >= DATE '2020-01-01' AND 
    transaction_date <= CURRENT_DATE + INTERVAL '1 year'
);
```

### 9.2. Business Logic Constraints

```sql
-- Nếu approved, phải có approved_by và approved_at
CREATE OR REPLACE FUNCTION fn_check_approval_data()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.approval_status = 'approved' THEN
        IF NEW.approved_by IS NULL OR NEW.approved_at IS NULL THEN
            RAISE EXCEPTION 'Approved transaction must have approved_by and approved_at';
        END IF;
    END IF;
    
    IF NEW.approval_status = 'rejected' THEN
        IF NEW.rejection_reason IS NULL OR TRIM(NEW.rejection_reason) = '' THEN
            RAISE EXCEPTION 'Rejected transaction must have rejection_reason';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_approval_data
BEFORE INSERT OR UPDATE ON transaction
FOR EACH ROW
EXECUTE FUNCTION fn_check_approval_data();
```

---

## 10. SECURITY & PERMISSIONS

### 10.1. Row Level Security (RLS)

```sql
-- Enable RLS trên bảng transaction
ALTER TABLE transaction ENABLE ROW LEVEL SECURITY;

-- Policy: CEO/Admin xem tất cả
CREATE POLICY policy_transaction_ceo_admin ON transaction
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM "user" u
        JOIN user_role ur ON u.role_id = ur.id
        WHERE u.id = current_setting('app.current_user_id')::UUID
        AND ur.code IN ('CEO', 'ADMIN')
    )
);

-- Policy: Trưởng BU chỉ xem transactions của BU mình
CREATE POLICY policy_transaction_bu_manager ON transaction
FOR SELECT
TO authenticated
USING (
    business_unit_id IN (
        SELECT business_unit_id 
        FROM "user" 
        WHERE id = current_setting('app.current_user_id')::UUID
    )
    OR EXISTS (
        SELECT 1 FROM transaction_allocation ta
        WHERE ta.transaction_id = transaction.id
        AND ta.business_unit_id IN (
            SELECT business_unit_id 
            FROM "user" 
            WHERE id = current_setting('app.current_user_id')::UUID
        )
    )
);

-- Policy: Nhân viên chỉ xem transactions mình tạo
CREATE POLICY policy_transaction_employee ON transaction
FOR SELECT
TO authenticated
USING (
    created_by = current_setting('app.current_user_id')::UUID
);
```

### 10.2. Database Roles

```sql
-- Role: Read-only (cho báo cáo)
CREATE ROLE bluebolt_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO bluebolt_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO bluebolt_readonly;

-- Role: Accountant (tạo/sửa transaction, không phê duyệt)
CREATE ROLE bluebolt_accountant;
GRANT SELECT, INSERT, UPDATE ON transaction TO bluebolt_accountant;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO bluebolt_accountant;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO bluebolt_accountant;

-- Role: Manager (full quyền)
CREATE ROLE bluebolt_manager;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bluebolt_manager;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bluebolt_manager;
```

---

## 11. MIGRATION SCRIPTS

### 11.1. Initial Migration (001_init.sql)

```sql
-- Create all tables in order
BEGIN;

-- 1. Master data tables (no dependencies)
CREATE TABLE business_unit (...);
CREATE TABLE user_role (...);
CREATE TABLE category (...);
CREATE TABLE payment_method (...);

-- 2. Tables with FK to master data
CREATE TABLE "user" (...);
CREATE TABLE employee (...);
CREATE TABLE partner (...);
CREATE TABLE project (...);

-- 3. Main transaction table
CREATE TABLE transaction (...);

-- 4. Transaction related tables
CREATE TABLE transaction_allocation (...);
CREATE TABLE attachment (...);
CREATE TABLE approval_history (...);
CREATE TABLE audit_log (...);

-- Create indexes
CREATE INDEX idx_transaction_code ON transaction(transaction_code);
-- ... (tất cả indexes)

-- Create triggers
CREATE TRIGGER trg_generate_transaction_code ...;
-- ... (tất cả triggers)

-- Create functions
CREATE FUNCTION fn_get_bu_financial_summary ...;
-- ... (tất cả functions)

-- Create views
CREATE VIEW v_transaction_summary ...;
-- ... (tất cả views)

COMMIT;
```

### 11.2. Seed Data Migration (002_seed_data.sql)

```sql
BEGIN;

-- Insert business units
INSERT INTO business_unit (id, name, code, description) VALUES
(gen_random_uuid(), 'BlueBolt Software', 'SW', 'Đơn vị phát triển phần mềm'),
(gen_random_uuid(), 'BlueBolt Academy', 'AC', 'Đơn vị đào tạo'),
(gen_random_uuid(), 'BlueBolt Services', 'SV', 'Đơn vị dịch vụ'),
(gen_random_uuid(), 'BlueBolt R&D', 'RD', 'Đơn vị nghiên cứu và phát triển'),
(gen_random_uuid(), 'BlueBolt G&A', 'GA', 'Đơn vị hành chính tổng hợp');

-- Insert user roles
INSERT INTO user_role (id, name, code, permissions) VALUES
(gen_random_uuid(), 'CEO', 'CEO', '["view_all", "approve_all", "manage_all"]'),
(gen_random_uuid(), 'Admin', 'ADMIN', '["view_all", "create", "edit", "delete", "approve"]'),
(gen_random_uuid(), 'Trưởng BU', 'BU_MANAGER', '["view_bu", "approve_bu", "manage_bu"]'),
(gen_random_uuid(), 'Kế toán', 'ACCOUNTANT', '["view_all", "create", "edit"]'),
(gen_random_uuid(), 'Nhân viên', 'EMPLOYEE', '["view_own", "create_draft"]');

-- Insert categories
INSERT INTO category (name, type, code) VALUES
-- Income
('Doanh thu dịch vụ', 'income', 'INCOME_SERVICE'),
('Doanh thu dự án', 'income', 'INCOME_PROJECT'),
('Doanh thu đào tạo', 'income', 'INCOME_TRAINING'),
('Doanh thu khác', 'income', 'INCOME_OTHER'),
-- Expense
('Lương, thưởng, phụ cấp', 'expense', 'EXP_SALARY'),
('Bảo hiểm xã hội', 'expense', 'EXP_INSURANCE'),
('Chi phí văn phòng', 'expense', 'EXP_OFFICE'),
('Chi phí marketing', 'expense', 'EXP_MARKETING'),
('Chi phí vận hành', 'expense', 'EXP_OPERATION'),
('Chi phí khác', 'expense', 'EXP_OTHER'),
-- Loan
('Tạm ứng nhân viên', 'loan', 'LOAN_EMPLOYEE'),
('Vay ngắn hạn', 'loan', 'LOAN_SHORT_TERM');

-- Insert payment methods
INSERT INTO payment_method (name, code) VALUES
('Tiền mặt', 'CASH'),
('Chuyển khoản', 'BANK_TRANSFER'),
('Ví điện tử', 'E_WALLET'),
('Séc', 'CHEQUE');

COMMIT;
```

### 11.3. Demo Users Migration (003_demo_users.sql)

```sql
BEGIN;

-- Get role IDs
DO $$
DECLARE
    role_ceo_id UUID;
    role_admin_id UUID;
    role_bu_manager_id UUID;
    bu_software_id UUID;
    bu_academy_id UUID;
    bu_services_id UUID;
BEGIN
    SELECT id INTO role_ceo_id FROM user_role WHERE code = 'CEO';
    SELECT id INTO role_admin_id FROM user_role WHERE code = 'ADMIN';
    SELECT id INTO role_bu_manager_id FROM user_role WHERE code = 'BU_MANAGER';
    
    SELECT id INTO bu_software_id FROM business_unit WHERE code = 'SW';
    SELECT id INTO bu_academy_id FROM business_unit WHERE code = 'AC';
    SELECT id INTO bu_services_id FROM business_unit WHERE code = 'SV';

    -- CEO
    INSERT INTO "user" (email, password_hash, full_name, role_id, business_unit_id) VALUES
    ('ceo@bluebolt.vn', '$2b$10$...', 'Nguyễn Văn CEO', role_ceo_id, NULL);
    
    -- Admin
    INSERT INTO "user" (email, password_hash, full_name, role_id, business_unit_id) VALUES
    ('admin@bluebolt.vn', '$2b$10$...', 'Trần Thị Admin', role_admin_id, NULL);
    
    -- BU Managers
    INSERT INTO "user" (email, password_hash, full_name, role_id, business_unit_id) VALUES
    ('manager.software@bluebolt.vn', '$2b$10$...', 'Lê Văn Manager', role_bu_manager_id, bu_software_id),
    ('manager.academy@bluebolt.vn', '$2b$10$...', 'Phạm Thị Hương', role_bu_manager_id, bu_academy_id),
    ('manager.services@bluebolt.vn', '$2b$10$...', 'Hoàng Văn Dịch vụ', role_bu_manager_id, bu_services_id);
END $$;

COMMIT;
```

---

## 12. BACKUP & MAINTENANCE

### 12.1. Backup Script

```bash
#!/bin/bash
# backup_database.sh

DB_NAME="bluebolt_db"
BACKUP_DIR="/var/backups/postgresql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Create backup
pg_dump $DB_NAME | gzip > $BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

### 12.2. Maintenance Queries

```sql
-- Analyze tables
ANALYZE transaction;
ANALYZE transaction_allocation;
ANALYZE "user";

-- Reindex
REINDEX TABLE transaction;

-- Vacuum
VACUUM ANALYZE transaction;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Find unused indexes
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND schemaname = 'public';
```

---

## 📚 PHỤ LỤC

### A. Quy ước mã giao dịch

| Loại giao dịch | Prefix | Format | Ví dụ |
|---------------|--------|---------|-------|
| Thu (Income) | T | T[MM][YY]_[Number] | T0126_01 |
| Chi (Expense) | C | C[MM][YY]_[Number] | C0126_01 |
| Vay (Loan) | V | V[MM][YY]_[Number] | V0126_01 |

### B. Workflow trạng thái giao dịch

```
draft → pending → approved
                ↓
              rejected
```

### C. Quyền hạn theo vai trò

| Vai trò | Xem dữ liệu | Tạo | Sửa | Xóa | Phê duyệt |
|---------|-------------|-----|-----|-----|-----------|
| CEO | Tất cả | ✅ | ✅ | ✅ | ✅ |
| Admin | Tất cả | ✅ | ✅ | ✅ | ✅ |
| Trưởng BU | BU của mình | ✅ | ✅ | ❌ | ✅ (BU mình) |
| Kế toán | Tất cả | ✅ | ✅ | ❌ | ❌ |
| Nhân viên | Của mình | ✅ (draft) | ✅ (draft) | ❌ | ❌ |

---

**Tài liệu này được tạo bởi AI Assistant cho dự án BLUEBOLT**  
**Liên hệ:** support@bluebolt.vn  
**Website:** https://bluebolt.vn
