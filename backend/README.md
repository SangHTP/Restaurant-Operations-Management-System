# Employee Management API

ASP.NET Core Web API for the employee directory and employee role management, backed by the local SQL Server Express database. The employee roster UI uses this API; the browser does not connect directly to SQL Server.

## Prerequisites

- .NET 8 SDK
- SQL Server with the `RestaurantDB_Final` database
- The existing schema from `database/DatabasePRJ.sql`

## Database setup

Run these scripts against `RestaurantDB_Final` after creating the base schema:

1. `database/EmployeeManagementMigration.sql` adds employee active-status and position columns and seeds the roles used by the API.
2. `database/AccountManagementMigration.sql` adds username, password-hash, and active-status columns to Customers for Customer account management.
3. `database/DepartmentManagementMigration.sql` seeds the sample `Front of House`, `Kitchen`, and `Cashier` departments.

## Configure and run

The local development connection string in `src/Services/Employee/appsettings.json` targets `localhost\SQLEXPRESS` using Windows Authentication. Start the API from the repository root:

```powershell
dotnet run --project backend/src/Services/Employee/Employee.Api.csproj
```

The launch profile serves HTTP at `http://localhost:5000`, which is the frontend API default. Windows Authentication uses the Windows account running the API; ensure that account can access `RestaurantDB_Final`. If your SQL Server instance has a different name, override the connection string in PowerShell before starting:

```powershell
$env:ConnectionStrings__RestaurantDb = "Server=YOUR-PC\SQLEXPRESS;Database=RestaurantDB_Final;Trusted_Connection=True;TrustServerCertificate=True"
dotnet run --project backend/src/Services/Employee/Employee.Api.csproj
```

For SQL Server authentication, keep credentials in a local secret store or environment variables; do not commit them to `appsettings.json`.

The API uses the configured Vite development origins in `src/Services/Employee/appsettings.json`. To point the frontend at another API URL, set `VITE_API_BASE_URL` in the frontend environment (default: `http://localhost:5000/api`).

## Initial Owner/Admin setup

The first elevated account must be bootstrapped once because Owner/Admin accounts cannot be created through normal account management. Start the API with a one-time local bootstrap key in the API process environment:

```powershell
$env:AccountBootstrap__Key = "replace-with-a-long-random-one-time-key"
& "C:\Program Files\dotnet\dotnet.exe" run --project .\backend\src\Services\Employee\Employee.Api.csproj
```

In another PowerShell window, use the same key and create the initial Admin account. The password is prompted securely instead of being written into command history:

```powershell
$bootstrapKey = Read-Host "Bootstrap key"
$securePassword = Read-Host "Initial Admin password" -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    $body = @{
        bootstrapKey = $bootstrapKey
        username = "restaurant-admin"
        password = $password
        fullName = "Restaurant Admin"
        phone = "0900000000"
        email = "admin@example.com"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:5000/api/auth/bootstrap" -Method Post -ContentType "application/json" -Body $body
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    Remove-Variable password -ErrorAction SilentlyContinue
}
```

Bootstrap creates one Admin account and becomes unavailable after any Owner/Admin exists. Owner and Admin are treated as the same elevated permission group. After signing in, use Account Management to create Managers and assign each one a department. Managers can only create, edit, or deactivate Staff/Kitchen employees in their assigned department. Owner/Admin can manage other non-elevated roles across departments, but cannot create or modify any Owner/Admin account.

## Employee endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/employees` | List employees; optional `search`, `status`, `roleId`, and `departmentId` query filters |
| `GET` | `/api/employees/{id}` | Employee detail |
| `POST` | `/api/employees` | Create an employee |
| `PUT` | `/api/employees/{id}` | Update employee details, department, role, and status |
| `DELETE` | `/api/employees/{id}` | Permanently delete when no related records exist; otherwise set the employee to Inactive |
| `PATCH` | `/api/employees/{id}/role` | Assign a role to an active employee |
| `GET` | `/api/employee-roles` | List available roles |
| `GET` | `/api/departments` | List departments |

The employee roster page loads employee, role, and department data from this API. Employee create/update, role assignment, and deactivation are persisted to SQL Server. Shift availability and dining-area assignments are not yet persisted by this employee API.

Sign-in for employee/management accounts uses a database-verified username or email and password. The API issues an HTTP-only session cookie and verifies the account's active status and role for protected account operations.

The Account Management page also loads employee accounts and customer records from SQL Server. Managers only receive Staff/Kitchen accounts in their assigned department. Owner/Admin can manage non-elevated employee and customer records. These operations are enforced by the API, not only hidden in the UI:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/accounts` | List employee and customer accounts |
| `POST` | `/api/accounts` | Create an employee or customer account |
| `PUT` | `/api/accounts/{accountType}/{id}` | Update account profile and username |
| `PATCH` | `/api/accounts/{accountType}/{id}/status` | Activate or deactivate an account |

New account passwords are hashed by the API using PBKDF2; password hashes are never returned. Existing customer rows can be listed before credentials are added; set a unique username before editing them. Customer sign-in and password reset are not integrated.

## Kitchen order queue

The Kitchen Display page reads active preparation items from `Orders` and `OrderDetails`; it no longer uses browser-only sample tickets. Tickets with `Chờ chế biến` or `Đang chế biến` items appear in the queue. Kitchen, Manager, Owner, and Admin accounts can advance items from pending to cooking and then to ready (`Đã xong`). Ready items leave the cooking queue for service. The page polls for new tickets every 15 seconds and also provides a manual refresh.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/kitchen/tickets` | List active kitchen tickets (Kitchen, Staff, Manager, Owner, or Admin) |
| `PATCH` | `/api/kitchen/items/{id}/status` | Advance an item to Cooking or Ready (Kitchen, Manager, Owner, or Admin) |

The queue is empty until order items exist in SQL Server and have a preparation status. The current Orders page is still a frontend prototype and does not create database orders, so a separate order-entry/API integration is needed before orders placed through that page can flow into the KDS.

## Security note

Employee account management uses server-side cookie authentication and role/department checks. Customer login and the rest of the frontend authentication/profile flow are still mock implementations. The API also contains employee endpoints intended for local development; complete a security review and configure HTTPS, secrets, and production-grade authentication/CSRF controls before exposing this service publicly.
