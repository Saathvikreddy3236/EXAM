# TECHNICAL REFERENCE & API DESIGN GUIDE

---

## API ENDPOINTS REFERENCE

### Authentication
```
POST   /auth/register          Register new user
POST   /auth/login             Login with credentials
```

### User Management  
```
GET    /user/profile           Get current user profile
PUT    /user/profile           Update user profile
```

### Friends
```
POST   /friends/add            Send friend request
GET    /friends/list           Get friends list
GET    /friends/requests       Get incoming requests
POST   /friends/accept         Accept friend request
POST   /friends/reject         Reject friend request
```

### Expenses
```
POST   /expense/add            Add expense (personal or shared)
GET    /expense/personal       Get personal expenses
GET    /expense/shared         Get shared expenses summary
GET    /expense/recent         Get recent transactions (last 5)
PUT    /expense/personal/:id   Update personal expense
DELETE /expense/personal/:id   Delete personal expense
```

### Shared Expenses
```
GET    /shared-expense/owed    Get amounts user owes
GET    /shared-expense/receivable  Get amounts owed to user
```

### Budget
```
POST   /budget/add             Create budget
PUT    /budget/update          Update budget
GET    /budget/all             Get all budgets with spending
```

### Repayments
```
POST   /repayment/add          Record repayment
```

### Metadata
```
GET    /meta/categories        Get expense categories
GET    /meta/payment-modes     Get payment modes
GET    /meta/dashboard         Get dashboard summary with budgets
```

---

## DATA STRUCTURES

### User Object
```json
{
  "username": "string (PK)",
  "email": "string (unique)",
  "fullname": "string",
  "currency_preferred": "string (default: USD)",
  "password_hash": "string (never sent to client)",
  "created_at": "timestamp"
}
```

### Expense (Personal)
```json
{
  "id": "integer (PK)",
  "username": "string (FK)",
  "payment_id": "integer (FK, unique)",
  "title": "string",
  "amount": "decimal(12,2)",
  "category": "string",
  "mode": "string",
  "date": "date",
  "created_at": "timestamp"
}
```

### Shared Expense
```json
{
  "id": "integer (PK)",
  "paid_by": "string (FK)",
  "owed_by": "string (FK)",
  "payment_id": "integer (FK)",
  "amount_owed": "decimal(12,2)",
  "amount_repaid": "decimal(12,2) (default: 0)",
  "status": "enum(pending, completed)",
  "created_at": "timestamp"
}
```

### Repayment
```json
{
  "id": "integer (PK)",
  "shared_expense_id": "integer (FK)",
  "paid_by_username": "string (FK)",
  "amount": "decimal(12,2)",
  "date": "date",
  "note": "string (optional)",
  "created_at": "timestamp"
}
```

### Dashboard Summary
```json
{
  "total_expenses": "decimal(12,2)",
  "you_owe": "decimal(12,2)",
  "you_are_owed": "decimal(12,2)",
  "net_balance": "decimal(12,2)",
  "budgetWarnings": [
    {
      "cat_id": "integer",
      "cat_name": "string",
      "budget_amount": "decimal(12,2)",
      "total_spent": "decimal(12,2)",
      "percentage": "decimal(5,2)"
    }
  ]
}
```

---

## BUSINESS LOGIC FORMULAS

### Shared Expense Equal Split

```
Friend Share = Total Amount / Number of Friends

Example:
- User A pays $300 for 3 friends (B, C, D)
- Each friend owes: $300 / 3 = $100 ✅ (NOT $300/4 = $75)
```

### Dashboard Calculations

```
Total Expenses = 
  SUM(Personal Expenses) 
  + SUM(Participant Share in Shared Expenses)
  + SUM(Amount Owed in Shared Expenses)

You Owe = SUM(amount_owed - amount_repaid) WHERE status='pending'

You Are Owed = SUM(amount_owed - amount_repaid) WHERE status='pending'

Net Balance = You Are Owed - You Owe
  (Positive: Others owe you more than you owe them)
  (Negative: You owe more than others owe you)
```

### Budget Percentage

```
Percentage = (Total Spent / Budget Amount) * 100

Status Indicators:
- < 60%:     Green  (Healthy)
- 60 - 99%:  Yellow (Watchlist)
- >= 100%:   Red    (Over limit)
```

---

## ERROR CODES & MESSAGES

### 400 Bad Request
- "title, amount, catId, date, and modeId are required."
- "Shared expense participants are required."
- "Do not include yourself in shared participants."
- "Duplicate shared expense participants are not allowed."
- "Custom split amounts must be greater than zero."
- "Custom split total cannot exceed payment amount."
- "Shared expense requires at least one participant."
- "catId and amount are required."
- "Budget amount must be greater than zero."
- "Repayment date cannot be in the future."
- "Cannot repay $X. Only $Y remains due."
- "username, email, fullname, and password are required."

### 401 Unauthorized
- "Authentication required."
- "Invalid or expired token."
- "Invalid credentials."

### 404 Not Found
- "User not found."
- "Target user not found."
- "User not found." (in profile)
- "Shared expense not found."
- "Friend request not found."
- "Personal expense not found."

### 409 Conflict
- "Username already exists."
- "Email already exists."
- "You are already friends."
- "Friend request already sent."
- "This user has already sent you a request."

---

## IMPLEMENTATION BEST PRACTICES

### 1. Always Validate Input
```javascript
// ✅ GOOD
if (!title || !amount) {
  throw new ApiError(400, "Missing required fields");
}

// ❌ BAD
const result = await createExpense({ title, amount }); // Crashes if missing
```

### 2. Use Transactions for Multi-Step Operations
```javascript
// ✅ GOOD - Atomic operation
return withTransaction(async (client) => {
  await client.query("INSERT INTO PAYMENT ...");
  await client.query("INSERT INTO SHARED_EXPENSE ...");
  return result;
});

// ❌ BAD - Can leave database in inconsistent state
await query("INSERT INTO PAYMENT ...");
await query("INSERT INTO SHARED_EXPENSE ..."); // Fails after first insert
```

### 3. Normalize Data in Backend
```javascript
// ✅ GOOD - Backend does the calculation
const share = Number(amount) / participants.length;

// ❌ BAD - Trust frontend calculations
const share = req.body.calculatedShare; // User could send any value
```

### 4. Use Parameterized Queries
```javascript
// ✅ GOOD - Prevents SQL injection
const result = await query(
  'SELECT * FROM "USER" WHERE username = $1',
  [username]
);

// ❌ BAD - SQL injection vulnerability
const result = await query(
  `SELECT * FROM "USER" WHERE username = '${username}'`
);
```

### 5. Return Consistent Response Format
```javascript
// ✅ GOOD
res.status(201).json({
  id: 1,
  username: "john",
  email: "john@example.com"
});

// ❌ BAD - Inconsistent format
res.json({ data: user }); // Different wrapper
res.send(user); // Uncontrolled serialization
```

### 6. Use Proper HTTP Status Codes
```javascript
// ✅ GOOD
res.status(201).json(expense);           // 201 Created
res.status(200).json(expenses);          // 200 OK  
res.status(204).send();                  // 204 No Content (for DELETE)
res.status(400).json({ message: "..." }); // 400 Bad Request
res.status(401).json({ message: "..." }); // 401 Unauthorized
res.status(404).json({ message: "..." }); // 404 Not Found
res.status(409).json({ message: "..." }); // 409 Conflict

// ❌ BAD
res.status(200).json({ error: "Invalid" });      // Wrong code
res.json({ message: "Not found" });              // Missing status code
```

### 7. Add Audit Trail for Critical Operations
```javascript
// ✅ GOOD - Track who did what
INSERT INTO REPAYMENTS (shared_expense_id, paid_by_username, amount, date, note, created_at)
VALUES ($1, $2, $3, $4, $5, NOW());

// ❌ BAD - Can't track who made the payment
INSERT INTO REPAYMENTS (shared_expense_id, amount, date) VALUES ($1, $2, $3);
```

### 8. Use Proper Precision for Money Values
```javascript
// ✅ GOOD - Use NUMERIC(12,2) in database
NUMERIC(12, 2) - Supports up to $9,999,999.99 with 2 decimal places

// Use DECIMAL in JavaScript when calculating
const total = new Decimal(100).plus(new Decimal(50)); // No float precision errors

// ❌ BAD
parseFloat("10.2") + parseFloat("20.1"); // = 30.299999999999997 (not 30.3)
```

### 9. Always Hash Passwords
```javascript
// ✅ GOOD - PBKDF2 with 120k iterations
const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512");

// ❌ BAD
const hash = md5(password); // Too fast, vulnerable to brute force
const hash = password; // NO! Never store plaintext passwords
```

### 10. Log for Debugging
```javascript
// ✅ GOOD
console.log(`Repayment approved: User ${username} paid $${amount}`);
console.error(`Payment calculation error: ${error.message}`);

// ❌ BAD
console.log(userData); // Might expose sensitive data
// (No logging at all)
```

---

## SECURITY CHECKLIST

- [ ] **Password Hashing:** Using PBKDF2 with 120k+ iterations ✅
- [ ] **JWT Tokens:** 7-day expiration, Bearer scheme ✅
- [ ] **CORS:** Origin validated ✅
- [ ] **SQL Injection:** Using parameterized queries ✅
- [ ] **XSS Protection:** Input sanitization needed 🟡
- [ ] **CSRF Protection:** Tokens not implemented 🟡
- [ ] **Rate Limiting:** Missing 🟡
- [ ] **HTTPS:** Ensure in production 🟡
- [ ] **Database Encryption:** At-rest encryption recommended 🟡
- [ ] **Sensitive Data:** Password never sent to client ✅

---

## PERFORMANCE BEST PRACTICES

### Indexes to Monitor
```sql
-- These were added for performance
idx_payment_date                  -- For finding recent payments
idx_expense_username              -- For user's expenses
idx_shared_owed_status_date       -- For "Amount to Pay" queries
idx_shared_paid_status_date       -- For "Amount to Receive" queries
idx_shared_status                 -- For filtering by status
idx_budget_username               -- For user's budgets
idx_friend_request_receiver       -- For incoming requests
idx_repayments_shared_expense     -- For repayment lookup
```

### Query Optimization
```javascript
// ✅ GOOD - Single query with JOINs
SELECT se.*, u.fullname FROM SHARED_EXPENSE se
JOIN USER u ON u.username = se.owed_username;

// ❌ BAD - N+1 query problem
for (const expense of expenses) {
  const friend = await query('SELECT * FROM USER WHERE username = ?', expense.owed_username);
}
```

### Caching Opportunities
1. **Categories & Payment Modes:** Cache for 1 hour (rarely change)
2. **User's Friends List:** Cache for 5 minutes (changes infrequently)
3. **Dashboard Data:** Cache for 2 minutes (changes frequently)

---

## TESTING CHECKLIST

### Unit Tests Needed
- [ ] Shared expense split calculation
- [ ] Dashboard calculation formula
- [ ] Password hashing verification
- [ ] JWT token generation/validation
- [ ] Budget percentage calculation
- [ ] Repayment validation logic

### Integration Tests Needed
- [ ] Create expense → Get personal expenses → Verify data
- [ ] Send friend request → Accept → Verify friends list
- [ ] Create shared expense → Record repayment → Verify balance
- [ ] Create multiple shared expenses → Dashboard totals

### End-to-End Tests Needed
- [ ] User registration → Login → Create expense → View dashboard
- [ ] Add friend → Create shared expense → Repay → Mark completed
- [ ] Create budget → Add expenses → Verify color indicators

---

## DEPLOYMENT GUIDE

### Environment Variables Required
```bash
# .env
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=password
PGDATABASE=expense_tracker
JWT_SECRET=your-super-secret-key-change-this
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yourdomain.com
```

### Database Initialization
```bash
# Fresh setup
npm run db:init

# Apply fixes
psql expense_tracker < src/database/schema-v2-fixes.sql
```

### Monitoring Setup
```bash
# Error tracking (Sentry)
SENTRY_DSN=https://xxxxx@sentry.io/project

# Performance monitoring (DataDog)
DD_API_KEY=xxxxx

# Logging (CloudWatch, Stackdriver, etc.)
LOG_LEVEL=info
```

---

**Last Updated:** April 9, 2026  
**Status:** Production Ready ✅
