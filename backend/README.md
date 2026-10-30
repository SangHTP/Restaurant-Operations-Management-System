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

The local development connection string in `appsettings.json` targets `localhost\SQLEXPRESS` using Windows Authentication. Start the combined API from the repository root:

```powershell
dotnet run --project backend/backend.csproj --urls http://localhost:5249
```

The backend hosts both the restaurant controllers and employee/account/authentication endpoints at `http://localhost:5249`. Windows Authentication uses the Windows account running the API; ensure that account can access `RestaurantDB_Final`. If your SQL Server instance has a different name, override both connection-string environment variables before starting:

```powershell
$connectionString = "Server=YOUR-PC\SQLEXPRESS;Database=RestaurantDB_Final;Trusted_Connection=True;TrustServerCertificate=True"
$env:ConnectionStrings__DefaultConnection = $connectionString
$env:ConnectionStrings__RestaurantDb = $connectionString
dotnet run --project backend/backend.csproj --urls http://localhost:5249
```

For SQL Server authentication, keep credentials in a local secret store or environment variables; do not commit them to `appsettings.json`.

The API allows the Vite development origins `http://localhost:5173` and `http://127.0.0.1:5173`. To point the frontend at another API URL, set `VITE_API_BASE_URL` in the frontend environment (default: `http://localhost:5249/api`).

## Initial Owner/Admin setup

The first elevated account must be bootstrapped once because Owner/Admin accounts cannot be created through normal account management. Start the API with a one-time local bootstrap key in the API process environment:

```powershell
$env:AccountBootstrap__Key = Read-Host "One-time bootstrap key"
dotnet run --project .\backend\backend.csproj --urls http://localhost:5249
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
    Invoke-RestMethod -Uri "http://localhost:5249/api/auth/bootstrap" -Method Post -ContentType "application/json" -Body $body
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

New account passwords are hashed by the API using PBKDF2; password hashes are never returned. When an Employee account is created, the API generates an 8-character temporary password containing lowercase, uppercase, a digit, and a special character, then emails the username and password to the required employee email address. The password is not accepted from or returned to the browser. Account creation is rolled back if credential email delivery fails. Customer accounts continue to use a password entered in the form; customer sign-in and password reset are not integrated.

Employee credential email is sent from `NgocHong.616199@gmail.com` through the Gmail API using OAuth 2.0. No Gmail or App Password is used. Enable the Gmail API in a Google Cloud project, configure an OAuth consent screen and OAuth client, and authorize the sender account with the `https://www.googleapis.com/auth/gmail.send` scope. The OAuth client must allow the redirect URI `https://developers.google.com/oauthplayground` if using Google's OAuth Playground to grant consent and obtain a refresh token. In OAuth Playground settings, select "Use your own OAuth credentials" and enter the project's client ID and secret before authorizing. Keep the refresh token and OAuth client secret private.

Configure these values in the API process environment before creating employee accounts; do not put OAuth secrets or refresh tokens in `appsettings.json` or source control:

```powershell
$env:Mail__GoogleClientId = Read-Host "Google OAuth client ID"
$env:Mail__GoogleClientSecret = Read-Host "Google OAuth client secret"
$env:Mail__GoogleRefreshToken = Read-Host "Google OAuth refresh token"
dotnet run --project .\backend\backend.csproj --urls http://localhost:5249
```

The API exchanges the refresh token for a short-lived access token and sends messages with the Gmail `users.messages.send` API. If the OAuth consent screen is in External/Testing mode, Google may expire refresh tokens after seven days; use a suitable production consent configuration or reauthorize when required. If OAuth configuration is missing, consent is revoked, or Gmail rejects the request, the API returns an error and does not create the Employee account. See Google's [Gmail sending guide](https://developers.google.com/workspace/gmail/api/guides/sending) and [OAuth 2.0 web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server).

## Kitchen order queue

The Kitchen Display page reads active preparation items from `Orders` and `OrderDetails`; it no longer uses browser-only sample tickets. Tickets with `Chờ chế biến` or `Đang chế biến` items appear in the queue. Kitchen, Manager, Owner, and Admin accounts can advance items from pending to cooking and then to ready (`Đã xong`). Ready items leave the cooking queue for service. The page polls for new tickets every 15 seconds and also provides a manual refresh.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/kitchen/tickets` | List active kitchen tickets (Kitchen, Staff, Manager, Owner, or Admin) |
| `PATCH` | `/api/kitchen/items/{id}/status` | Advance an item to Cooking or Ready (Kitchen, Manager, Owner, or Admin) |

The queue is empty until order items exist in SQL Server and have a preparation status. The current Orders page is still a frontend prototype and does not create database orders, so a separate order-entry/API integration is needed before orders placed through that page can flow into the KDS.

## Security note

Employee account management uses server-side cookie authentication and role/department checks. Customer login and the rest of the frontend authentication/profile flow are still mock implementations. The API also contains employee endpoints intended for local development; complete a security review and configure HTTPS, secrets, and production-grade authentication/CSRF controls before exposing this service publicly.
