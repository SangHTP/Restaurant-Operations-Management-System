using System.Data;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("RestaurantDb");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("ConnectionStrings:RestaurantDb is not configured.");
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
    });
});

builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "Restaurant.Api.Session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
        options.Events.OnValidatePrincipal = async context =>
        {
            var principal = context.Principal;
            var identity = principal?.Identity as ClaimsIdentity;
            var employeeIdValue = principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (identity is null || !int.TryParse(employeeIdValue, out var employeeId))
            {
                context.RejectPrincipal();
                await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return;
            }

            const string sql = """
                SELECT r.RoleName, e.DepartmentID, d.DepartmentName
                FROM dbo.Employees e
                INNER JOIN dbo.Accounts a ON a.EmployeeID = e.EmployeeID
                INNER JOIN dbo.Roles r ON r.RoleID = e.RoleID
                LEFT JOIN dbo.Departments d ON d.DepartmentID = e.DepartmentID
                WHERE e.EmployeeID = @EmployeeID;
                """;
            await using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync(context.HttpContext.RequestAborted);
            await using var command = new SqlCommand(sql, connection);
            command.Parameters.Add("@EmployeeID", SqlDbType.Int).Value = employeeId;
            await using var reader = await command.ExecuteReaderAsync(context.HttpContext.RequestAborted);
            if (!await reader.ReadAsync(context.HttpContext.RequestAborted))
            {
                context.RejectPrincipal();
                await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return;
            }

            var existingRole = identity.FindFirst(ClaimTypes.Role);
            if (existingRole is not null) identity.RemoveClaim(existingRole);
            identity.AddClaim(new Claim(ClaimTypes.Role, reader.GetString(0)));
            foreach (var claimType in new[] { "departmentId", "departmentName" })
            {
                var existingClaim = identity.FindFirst(claimType);
                if (existingClaim is not null) identity.RemoveClaim(existingClaim);
            }
            if (!reader.IsDBNull(1))
            {
                identity.AddClaim(new Claim("departmentId", reader.GetInt32(1).ToString()));
                if (!reader.IsDBNull(2))
                    identity.AddClaim(new Claim("departmentName", reader.GetString(2)));
            }
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (SqlException exception) when (exception.Number is 2601 or 2627)
    {
        context.Response.StatusCode = StatusCodes.Status409Conflict;
        await context.Response.WriteAsJsonAsync(new { message = "An account with the same username, phone number, or email already exists." });
    }
    catch (SqlException exception)
    {
        app.Logger.LogError(exception, "A database operation failed.");
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsJsonAsync(new { message = "The employee service could not complete the database operation." });
    }
});

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.MapGet("/api/kitchen/tickets", async (HttpContext context, CancellationToken cancellationToken) =>
{
    var roleName = context.User.FindFirstValue(ClaimTypes.Role);
    if (roleName is not ("Kitchen" or "Staff" or "Manager" or "Owner" or "Admin"))
        return Results.Forbid();

    const string sql = """
        SELECT od.OrderDetailID, o.OrderID, mi.ItemName, od.Quantity, od.Note,
               od.Status, COALESCE((
                   SELECT STRING_AGG(t.TableName, N', ')
                   FROM dbo.OrderTables ot
                   INNER JOIN dbo.Tables t ON t.TableID = ot.TableID
                   WHERE ot.OrderID = o.OrderID
               ), N'Unassigned') AS TableNames,
               COALESCE(e.FullName, N'Unknown') AS ServerName,
               COALESCE(od.OrderTime, o.OrderTime) AS CreatedAt
        FROM dbo.OrderDetails od
        INNER JOIN dbo.Orders o ON o.OrderID = od.OrderID
        INNER JOIN dbo.MenuItems mi ON mi.MenuItemID = od.MenuItemID
        LEFT JOIN dbo.Employees e ON e.EmployeeID = o.EmployeeID
        WHERE od.Status IN (N'Chờ chế biến', N'Đang chế biến')
          AND o.Status <> N'Đã hủy'
        ORDER BY COALESCE(od.OrderTime, o.OrderTime), o.OrderID, od.OrderDetailID;
        """;
    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var command = new SqlCommand(sql, connection);
    await using var reader = await command.ExecuteReaderAsync(cancellationToken);
    var tickets = new Dictionary<int, KitchenTicketResponse>();
    while (await reader.ReadAsync(cancellationToken))
    {
        var orderId = reader.GetInt32(1);
        if (!tickets.TryGetValue(orderId, out var ticket))
        {
            ticket = new KitchenTicketResponse(
                orderId,
                reader.GetString(6),
                reader.GetString(7),
                reader.IsDBNull(8) ? null : reader.GetDateTime(8),
                []);
            tickets.Add(orderId, ticket);
        }

        ticket.Items.Add(new KitchenTicketItemResponse(
            reader.GetInt32(0),
            reader.GetString(2),
            reader.GetInt32(3),
            reader.IsDBNull(4) ? null : reader.GetString(4),
            reader.GetString(5) == "Chờ chế biến" ? "Pending" : "Cooking"));
    }

    return Results.Ok(tickets.Values);
}).RequireAuthorization();

app.MapPatch("/api/kitchen/items/{id:int}/status", async (
    int id,
    KitchenItemStatusRequest request,
    HttpContext context,
    CancellationToken cancellationToken) =>
{
    var roleName = context.User.FindFirstValue(ClaimTypes.Role);
    if (roleName is not ("Kitchen" or "Manager" or "Owner" or "Admin"))
        return Results.Forbid();

    var (currentStatus, nextStatus) = request.Status switch
    {
        "Cooking" => ("Chờ chế biến", "Đang chế biến"),
        "Ready" => ("Đang chế biến", "Đã xong"),
        _ => ((string?)null, (string?)null)
    };
    if (currentStatus is null || nextStatus is null)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["status"] = ["Status must be Cooking or Ready."]
        });
    }

    const string updateSql = """
        UPDATE od
        SET Status = @NextStatus
        FROM dbo.OrderDetails od
        INNER JOIN dbo.Orders o ON o.OrderID = od.OrderID
        WHERE od.OrderDetailID = @OrderDetailID
          AND od.Status = @CurrentStatus
          AND o.Status <> N'Đã hủy';
        """;
    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var command = new SqlCommand(updateSql, connection);
    command.Parameters.Add("@NextStatus", SqlDbType.NVarChar, 50).Value = nextStatus;
    command.Parameters.Add("@CurrentStatus", SqlDbType.NVarChar, 50).Value = currentStatus;
    command.Parameters.Add("@OrderDetailID", SqlDbType.Int).Value = id;
    if (await command.ExecuteNonQueryAsync(cancellationToken) == 1)
        return Results.NoContent();

    const string existsSql = """
        SELECT od.Status
        FROM dbo.OrderDetails od
        INNER JOIN dbo.Orders o ON o.OrderID = od.OrderID
        WHERE od.OrderDetailID = @OrderDetailID AND o.Status <> N'Đã hủy';
        """;
    await using var existsCommand = new SqlCommand(existsSql, connection);
    existsCommand.Parameters.Add("@OrderDetailID", SqlDbType.Int).Value = id;
    var status = await existsCommand.ExecuteScalarAsync(cancellationToken);
    return status is null or DBNull
        ? Results.NotFound(new { message = "Kitchen ticket item was not found or its order was cancelled." })
        : Results.Conflict(new { message = "This item has already changed status. Refresh the kitchen queue and try again." });
}).RequireAuthorization();

app.MapPost("/api/auth/login", async (LoginRequest request, HttpContext context, CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrEmpty(request.Password))
        return Results.Unauthorized();

    const string sql = """
        SELECT e.EmployeeID, a.Username, e.FullName, e.Email, e.Phone, r.RoleName,
               e.DepartmentID, d.DepartmentName, a.PasswordHash
        FROM dbo.Accounts a
        INNER JOIN dbo.Employees e ON e.EmployeeID = a.EmployeeID
        INNER JOIN dbo.Roles r ON r.RoleID = e.RoleID
        LEFT JOIN dbo.Departments d ON d.DepartmentID = e.DepartmentID
        WHERE (a.Username = @Username OR e.Email = @Username)
          AND a.IsActive = 1 AND e.IsActive = 1;
        """;
    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var command = new SqlCommand(sql, connection);
    command.Parameters.Add("@Username", SqlDbType.VarChar, 100).Value = request.Username.Trim();
    int employeeId;
    string username;
    string fullName;
    string? email;
    string phone;
    string roleName;
    int? departmentId;
    string? departmentName;
    await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
    {
        if (!await reader.ReadAsync(cancellationToken) || !VerifyPassword(request.Password, reader.IsDBNull(8) ? null : reader.GetString(8)))
            return Results.Unauthorized();
        employeeId = reader.GetInt32(0);
        username = reader.GetString(1);
        fullName = reader.GetString(2);
        email = reader.IsDBNull(3) ? null : reader.GetString(3);
        phone = reader.GetString(4);
        roleName = reader.GetString(5);
        departmentId = reader.IsDBNull(6) ? null : reader.GetInt32(6);
        departmentName = reader.IsDBNull(7) ? null : reader.GetString(7);
    }

    var claims = new List<Claim>
    {
        new(ClaimTypes.NameIdentifier, employeeId.ToString()),
        new(ClaimTypes.Name, username),
        new(ClaimTypes.Role, roleName),
        new("fullName", fullName),
        new("phone", phone)
    };
    if (email is not null) claims.Add(new Claim(ClaimTypes.Email, email));
    if (departmentId is int assignedDepartmentId)
    {
        claims.Add(new Claim("departmentId", assignedDepartmentId.ToString()));
        if (departmentName is not null) claims.Add(new Claim("departmentName", departmentName));
    }

    await context.SignInAsync(
        CookieAuthenticationDefaults.AuthenticationScheme,
        new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)));

    return Results.Ok(new
    {
        employeeId,
        username,
        fullName,
        email,
        phone,
        roleName,
        departmentId,
        departmentName
    });
});

app.MapGet("/api/auth/me", (HttpContext context) =>
{
    var user = context.User;
    if (user.Identity?.IsAuthenticated != true) return Results.Unauthorized();
    return Results.Ok(new
    {
        employeeId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!),
        username = user.Identity.Name,
        fullName = user.FindFirstValue("fullName"),
        email = user.FindFirstValue(ClaimTypes.Email),
        phone = user.FindFirstValue("phone"),
        roleName = user.FindFirstValue(ClaimTypes.Role),
        departmentId = int.TryParse(user.FindFirstValue("departmentId"), out var departmentId) ? departmentId : (int?)null,
        departmentName = user.FindFirstValue("departmentName")
    });
}).RequireAuthorization();

app.MapPost("/api/auth/logout", async (HttpContext context) =>
{
    await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.NoContent();
});

app.MapPost("/api/auth/bootstrap", async (AccountBootstrapRequest request, CancellationToken cancellationToken) =>
{
    var bootstrapKey = builder.Configuration["AccountBootstrap:Key"];
    if (string.IsNullOrWhiteSpace(bootstrapKey))
        return Results.Conflict(new { message = "Account bootstrap is not enabled. Configure AccountBootstrap__Key locally first." });
    if (string.IsNullOrEmpty(request.BootstrapKey) ||
        !CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(request.BootstrapKey), Encoding.UTF8.GetBytes(bootstrapKey)))
        return Results.Unauthorized();
    if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Trim().Length > 50 ||
        string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Trim().Length > 100 ||
        string.IsNullOrWhiteSpace(request.Phone) || request.Phone.Trim().Length > 15 ||
        string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8 ||
        (!string.IsNullOrWhiteSpace(request.Email) &&
         (request.Email.Length > 100 || !System.Net.Mail.MailAddress.TryCreate(request.Email, out _))))
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["account"] = ["Username, full name, phone, and a password of at least 8 characters are required."]
        });

    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
    const string elevatedExistsSql = """
        SELECT CASE WHEN EXISTS (
            SELECT 1 FROM dbo.Employees e
            INNER JOIN dbo.Roles r ON r.RoleID = e.RoleID
            WHERE r.RoleName IN (N'Owner', N'Admin')
        ) THEN 1 ELSE 0 END;
        """;
    await using (var elevatedCheck = new SqlCommand(elevatedExistsSql, connection, (SqlTransaction)transaction))
    {
        if (Convert.ToInt32(await elevatedCheck.ExecuteScalarAsync(cancellationToken)) == 1)
            return Results.Conflict(new { message = "An Owner/Admin account already exists; bootstrap is no longer available." });
    }

    const string createSql = """
        DECLARE @RoleID int = (SELECT RoleID FROM dbo.Roles WHERE RoleName = N'Admin');
        IF @RoleID IS NULL SELECT CAST(NULL AS int);
        ELSE
        BEGIN
            INSERT INTO dbo.Employees (RoleID, FullName, Phone, Email, DepartmentID, IsActive)
            OUTPUT INSERTED.EmployeeID
            VALUES (@RoleID, @FullName, @Phone, @Email, NULL, 1);
        END;
        """;
    await using var createCommand = new SqlCommand(createSql, connection, (SqlTransaction)transaction);
    createCommand.Parameters.Add("@FullName", SqlDbType.NVarChar, 100).Value = request.FullName.Trim();
    createCommand.Parameters.Add("@Phone", SqlDbType.VarChar, 15).Value = request.Phone.Trim();
    createCommand.Parameters.Add("@Email", SqlDbType.VarChar, 100).Value =
        string.IsNullOrWhiteSpace(request.Email) ? DBNull.Value : request.Email.Trim();
    var idResult = await createCommand.ExecuteScalarAsync(cancellationToken);
    if (idResult is null or DBNull)
        return Results.Conflict(new { message = "The Admin role is missing from dbo.Roles." });

    var employeeId = Convert.ToInt32(idResult);
    await using var accountCommand = new SqlCommand(
        "INSERT INTO dbo.Accounts (EmployeeID, Username, PasswordHash, IsActive) VALUES (@EmployeeID, @Username, @PasswordHash, 1);",
        connection,
        (SqlTransaction)transaction);
    accountCommand.Parameters.Add("@EmployeeID", SqlDbType.Int).Value = employeeId;
    accountCommand.Parameters.Add("@Username", SqlDbType.VarChar, 50).Value = request.Username.Trim();
    accountCommand.Parameters.Add("@PasswordHash", SqlDbType.VarChar, 255).Value = HashPassword(request.Password);
    await accountCommand.ExecuteNonQueryAsync(cancellationToken);
    await transaction.CommitAsync(cancellationToken);
    return Results.Created($"/api/auth/bootstrap/{employeeId}", new { employeeId, roleName = "Admin" });
});

app.MapGet("/api/employees", async (
    string? search,
    string? status,
    int? roleId,
    int? departmentId,
    CancellationToken cancellationToken) =>
{
    if (status is not null and not ("Active" or "Inactive"))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["status"] = ["Status must be Active or Inactive."]
        });
    }

    const string sql = """
        SELECT e.EmployeeID, e.FullName, e.Phone, e.Email, e.CreatedAt,
               e.RoleID, r.RoleName, e.DepartmentID, d.DepartmentName,
               e.Position, e.IsActive
        FROM dbo.Employees e
        INNER JOIN dbo.Roles r ON r.RoleID = e.RoleID
        LEFT JOIN dbo.Departments d ON d.DepartmentID = e.DepartmentID
        WHERE (@Search IS NULL OR e.FullName LIKE @Search OR e.Phone LIKE @Search OR e.Email LIKE @Search)
          AND (@RoleID IS NULL OR e.RoleID = @RoleID)
          AND (@DepartmentID IS NULL OR e.DepartmentID = @DepartmentID)
          AND (@Status IS NULL OR (@Status = 'Active' AND e.IsActive = 1) OR (@Status = 'Inactive' AND e.IsActive = 0))
        ORDER BY e.FullName, e.EmployeeID;
        """;
    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var command = new SqlCommand(sql, connection);
    command.Parameters.Add("@Search", SqlDbType.NVarChar, 202).Value =
        string.IsNullOrWhiteSpace(search) ? DBNull.Value : $"%{search.Trim()}%";
    command.Parameters.Add("@RoleID", SqlDbType.Int).Value = roleId ?? (object)DBNull.Value;
    command.Parameters.Add("@DepartmentID", SqlDbType.Int).Value = departmentId ?? (object)DBNull.Value;
    command.Parameters.Add("@Status", SqlDbType.VarChar, 10).Value =
        status is "Active" or "Inactive" ? status : DBNull.Value;

    var employees = new List<EmployeeResponse>();
    await using var reader = await command.ExecuteReaderAsync(cancellationToken);
    while (await reader.ReadAsync(cancellationToken))
    {
        employees.Add(ReadEmployee(reader));
    }
    return Results.Ok(employees);
});

app.MapGet("/api/employees/{id:int}", async (int id, CancellationToken cancellationToken) =>
{
    const string sql = """
        SELECT e.EmployeeID, e.FullName, e.Phone, e.Email, e.CreatedAt,
               e.RoleID, r.RoleName, e.DepartmentID, d.DepartmentName,
               e.Position, e.IsActive
        FROM dbo.Employees e
        INNER JOIN dbo.Roles r ON r.RoleID = e.RoleID
        LEFT JOIN dbo.Departments d ON d.DepartmentID = e.DepartmentID
        WHERE e.EmployeeID = @EmployeeID;
        """;
    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var command = new SqlCommand(sql, connection);
    command.Parameters.Add("@EmployeeID", SqlDbType.Int).Value = id;
    await using var reader = await command.ExecuteReaderAsync(cancellationToken);
    return await reader.ReadAsync(cancellationToken)
        ? Results.Ok(ReadEmployee(reader))
        : Results.NotFound(new { message = $"Employee {id} was not found." });
});

app.MapPost("/api/employees", async (EmployeeRequest request, HttpContext context, CancellationToken cancellationToken) =>
{
    var validation = ValidateEmployee(request);
    if (validation is not null) return Results.ValidationProblem(validation);
    var actorRole = context.User.FindFirstValue(ClaimTypes.Role);
    if (!IsElevatedRole(actorRole) && actorRole != "Manager") return Results.Forbid();
    if (IsElevatedRole(request.RoleName) || request.RoleName == "Customer")
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["roleName"] = ["Owner/Admin and Customer records cannot be created through the employee endpoint."]
        });
    if (actorRole == "Manager")
    {
        var managerDepartmentId = GetDepartmentId(context.User);
        if (managerDepartmentId is null)
            return Results.Problem("Assign this Manager to a department before creating employees.", statusCode: StatusCodes.Status403Forbidden);
        if (request.RoleName is not ("Staff" or "Kitchen")) return Results.Forbid();
        request = request with { DepartmentId = managerDepartmentId, Status = "Active" };
    }
    if (request.DepartmentId is null)
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["departmentId"] = ["Choose a department for this employee."]
        });
    if (request.DepartmentId is int departmentId &&
        !await DepartmentExists(connectionString, departmentId, cancellationToken))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["departmentId"] = ["The selected department does not exist."]
        });
    }

    const string sql = """
        INSERT INTO dbo.Employees (RoleID, FullName, Phone, Email, DepartmentID, Position, IsActive)
        OUTPUT INSERTED.EmployeeID
        SELECT RoleID, @FullName, @Phone, @Email, @DepartmentID, @Position, @IsActive
        FROM dbo.Roles
        WHERE RoleName = @RoleName;
        """;
    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var command = new SqlCommand(sql, connection);
    AddEmployeeParameters(command, request);
    var result = await command.ExecuteScalarAsync(cancellationToken);
    if (result is null or DBNull)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["roleName"] = ["The selected role does not exist."]
        });
    }

    return Results.Created($"/api/employees/{Convert.ToInt32(result)}", new { employeeId = Convert.ToInt32(result) });
}).RequireAuthorization();

app.MapPut("/api/employees/{id:int}", async (int id, EmployeeRequest request, HttpContext context, CancellationToken cancellationToken) =>
{
    var validation = ValidateEmployee(request);
    if (validation is not null) return Results.ValidationProblem(validation);
    var actorRole = context.User.FindFirstValue(ClaimTypes.Role);
    if (!IsElevatedRole(actorRole) && actorRole != "Manager") return Results.Forbid();
    if (IsElevatedRole(request.RoleName) || request.RoleName == "Customer")
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["roleName"] = ["Owner/Admin and Customer roles cannot be assigned through the employee endpoint."]
        });
    await using var permissionConnection = new SqlConnection(connectionString);
    await permissionConnection.OpenAsync(cancellationToken);
    var permission = await CanManageEmployeeRecord(permissionConnection, null, id, context.User, cancellationToken);
    if (!permission.Allowed)
        return permission.NotFound
            ? Results.NotFound(new { message = $"Employee {id} was not found." })
            : Results.Forbid();
    if (actorRole == "Manager")
    {
        if (request.RoleName is not ("Staff" or "Kitchen")) return Results.Forbid();
        request = request with { DepartmentId = GetDepartmentId(context.User) };
    }
    if (request.DepartmentId is null)
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["departmentId"] = ["Choose a department for this employee."]
        });
    if (request.DepartmentId is int departmentId &&
        !await DepartmentExists(connectionString, departmentId, cancellationToken))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["departmentId"] = ["The selected department does not exist."]
        });
    }

    const string sql = """
        UPDATE e
        SET RoleID = r.RoleID,
            FullName = @FullName,
            Phone = @Phone,
            Email = @Email,
            DepartmentID = @DepartmentID,
            Position = @Position,
            IsActive = @IsActive
        FROM dbo.Employees e
        INNER JOIN dbo.Roles r ON r.RoleName = @RoleName
        WHERE e.EmployeeID = @EmployeeID;
        """;
    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var command = new SqlCommand(sql, connection);
    AddEmployeeParameters(command, request);
    command.Parameters.Add("@EmployeeID", SqlDbType.Int).Value = id;
    var affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);
    if (affectedRows == 0)
    {
        var roleExists = await RoleExists(connection, request.RoleName, cancellationToken);
        return roleExists
            ? Results.NotFound(new { message = $"Employee {id} was not found." })
            : Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["roleName"] = ["The selected role does not exist."]
            });
    }
    return Results.NoContent();
}).RequireAuthorization();

app.MapDelete("/api/employees/{id:int}", async (int id, HttpContext context, CancellationToken cancellationToken) =>
{
    var actorRole = context.User.FindFirstValue(ClaimTypes.Role);
    if (!IsElevatedRole(actorRole) && actorRole != "Manager") return Results.Forbid();
    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var transaction = connection.BeginTransaction(IsolationLevel.Serializable);

    var permission = await CanManageEmployeeRecord(connection, transaction, id, context.User, cancellationToken);
    if (!permission.Allowed)
        return permission.NotFound
            ? Results.NotFound(new { message = $"Active employee {id} was not found." })
            : Results.Forbid();

    await using (var employeeCommand = new SqlCommand(
        "SELECT 1 FROM dbo.Employees WITH (XLOCK, HOLDLOCK) WHERE EmployeeID = @EmployeeID AND IsActive = 1;",
        connection,
        transaction))
    {
        employeeCommand.Parameters.Add("@EmployeeID", SqlDbType.Int).Value = id;
        if (await employeeCommand.ExecuteScalarAsync(cancellationToken) is null)
        {
            return Results.NotFound(new { message = $"Active employee {id} was not found." });
        }
    }

    const string hasHistorySql = """
        SELECT CASE WHEN
            EXISTS (SELECT 1 FROM dbo.Assignments WHERE EmployeeID = @EmployeeID)
            OR EXISTS (SELECT 1 FROM dbo.WorkAvailabilities WHERE EmployeeID = @EmployeeID)
            OR EXISTS (SELECT 1 FROM dbo.Orders WHERE EmployeeID = @EmployeeID)
            OR EXISTS (SELECT 1 FROM dbo.Bills WHERE CreatedBy = @EmployeeID)
            OR EXISTS (SELECT 1 FROM dbo.Reservations WHERE EmployeeID = @EmployeeID)
            OR EXISTS (SELECT 1 FROM dbo.ActionLogs WHERE EmployeeID = @EmployeeID)
            OR EXISTS (SELECT 1 FROM dbo.Accounts WHERE EmployeeID = @EmployeeID)
        THEN 1 ELSE 0 END;
        """;
    await using var historyCommand = new SqlCommand(hasHistorySql, connection, transaction);
    historyCommand.Parameters.Add("@EmployeeID", SqlDbType.Int).Value = id;
    var hasHistory = Convert.ToInt32(await historyCommand.ExecuteScalarAsync(cancellationToken)) == 1;

    var sql = hasHistory
        ? "UPDATE dbo.Employees SET IsActive = 0 WHERE EmployeeID = @EmployeeID AND IsActive = 1;"
        : "DELETE FROM dbo.Employees WHERE EmployeeID = @EmployeeID AND IsActive = 1;";
    await using var deleteCommand = new SqlCommand(sql, connection, transaction);
    deleteCommand.Parameters.Add("@EmployeeID", SqlDbType.Int).Value = id;
    var affectedRows = await deleteCommand.ExecuteNonQueryAsync(cancellationToken);
    if (affectedRows == 0)
    {
        return Results.NotFound(new { message = $"Active employee {id} was not found." });
    }

    await transaction.CommitAsync(cancellationToken);
    return Results.Ok(new
    {
        action = hasHistory ? "deactivated" : "deleted",
        message = hasHistory
            ? "Employee has related work or historical records and was set to Inactive."
            : "Employee had no related records and was permanently deleted."
    });
}).RequireAuthorization();

app.MapGet("/api/accounts", async (HttpContext context, CancellationToken cancellationToken) =>
{
    var roleName = context.User.FindFirstValue(ClaimTypes.Role);
    if (!IsElevatedRole(roleName) && roleName != "Manager")
        return Results.Forbid();
    var departmentId = GetDepartmentId(context.User);
    if (roleName == "Manager" && departmentId is null)
        return Results.Problem("Assign this Manager to a department before managing accounts.", statusCode: StatusCodes.Status403Forbidden);

    const string sql = """
        SELECT e.EmployeeID, 'Employee' AS AccountType, a.Username, e.FullName, e.Email, e.Phone,
               r.RoleName, CONVERT(bit, CASE WHEN e.IsActive = 1 AND a.IsActive = 1 THEN 1 ELSE 0 END),
               e.CreatedAt, e.DepartmentID, d.DepartmentName
        FROM dbo.Employees e
        INNER JOIN dbo.Accounts a ON a.EmployeeID = e.EmployeeID
        INNER JOIN dbo.Roles r ON r.RoleID = e.RoleID
        LEFT JOIN dbo.Departments d ON d.DepartmentID = e.DepartmentID
        WHERE @IsElevated = 1 OR (e.DepartmentID = @DepartmentID AND r.RoleName IN (N'Staff', N'Kitchen'))
        UNION ALL
        SELECT c.CustomerID, 'Customer', COALESCE(c.Username, ''), c.FullName, c.Email, c.Phone,
               'Customer', c.IsActive, c.CreatedAt, CAST(NULL AS int), CAST(NULL AS nvarchar(100))
        FROM dbo.Customers c
        WHERE @IsElevated = 1
        ORDER BY AccountType, FullName;
        """;
    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var command = new SqlCommand(sql, connection);
    command.Parameters.Add("@IsElevated", SqlDbType.Bit).Value = IsElevatedRole(roleName);
    command.Parameters.Add("@DepartmentID", SqlDbType.Int).Value = departmentId ?? (object)DBNull.Value;
    await using var reader = await command.ExecuteReaderAsync(cancellationToken);
    var accounts = new List<AccountResponse>();
    while (await reader.ReadAsync(cancellationToken))
    {
        accounts.Add(new AccountResponse(
            reader.GetInt32(0),
            reader.GetString(1),
            reader.GetString(2),
            reader.GetString(3),
            reader.IsDBNull(4) ? null : reader.GetString(4),
            reader.GetString(5),
            reader.GetString(6),
            reader.GetBoolean(7) ? "Active" : "Inactive",
            reader.IsDBNull(8) ? null : reader.GetDateTime(8),
            reader.IsDBNull(9) ? null : reader.GetInt32(9),
            reader.IsDBNull(10) ? null : reader.GetString(10)));
    }
    return Results.Ok(accounts);
}).RequireAuthorization();

app.MapPost("/api/accounts", async (AccountCreateRequest request, HttpContext context, CancellationToken cancellationToken) =>
{
    var validation = ValidateAccount(request);
    if (validation is not null) return Results.ValidationProblem(validation);
    if (request.AccountType is not ("Employee" or "Customer"))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["accountType"] = ["Account type must be Employee or Customer."]
        });
    }
    var actorRole = context.User.FindFirstValue(ClaimTypes.Role);
    var isElevated = IsElevatedRole(actorRole);
    var managerDepartmentId = GetDepartmentId(context.User);
    if (!isElevated && actorRole != "Manager")
        return Results.Forbid();
    if (request.AccountType == "Customer" && (!isElevated || request.RoleName != "Customer"))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["roleName"] = ["Only Owner/Admin can create Customer accounts."]
        });
    }
    if (request.AccountType == "Employee" && request.RoleName == "Customer")
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["roleName"] = ["Employee accounts must use an employee role."]
        });
    }
    if (request.AccountType == "Employee" && IsElevatedRole(request.RoleName))
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["roleName"] = ["Owner/Admin accounts cannot be created through account management."]
        });
    if (actorRole == "Manager")
    {
        if (managerDepartmentId is null)
            return Results.Problem("Assign this Manager to a department before creating accounts.", statusCode: StatusCodes.Status403Forbidden);
        if (request.AccountType != "Employee" || request.RoleName is not ("Staff" or "Kitchen"))
            return Results.Forbid();
        request = request with { DepartmentId = managerDepartmentId };
    }
    if (request.AccountType == "Employee" &&
        (request.DepartmentId is null || !await DepartmentExists(connectionString, request.DepartmentId.Value, cancellationToken)))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["departmentId"] = ["Choose a valid department for this employee."]
        });
    }

    var passwordHash = HashPassword(request.Password);
    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

    const string usernameExistsSql = """
        SELECT CASE WHEN
            EXISTS (SELECT 1 FROM dbo.Accounts WITH (UPDLOCK, HOLDLOCK) WHERE Username = @Username)
            OR EXISTS (SELECT 1 FROM dbo.Customers WITH (UPDLOCK, HOLDLOCK) WHERE Username = @Username)
        THEN 1 ELSE 0 END;
        """;
    await using (var usernameCommand = new SqlCommand(usernameExistsSql, connection, (SqlTransaction)transaction))
    {
        usernameCommand.Parameters.Add("@Username", SqlDbType.VarChar, 50).Value = request.Username.Trim();
        if (Convert.ToInt32(await usernameCommand.ExecuteScalarAsync(cancellationToken)) == 1)
        {
            return Results.Conflict(new { message = "That username is already in use." });
        }
    }

    int accountId;
    if (request.AccountType == "Customer")
    {
        const string sql = """
            INSERT INTO dbo.Customers (FullName, Phone, Email, Username, PasswordHash, IsActive)
            OUTPUT INSERTED.CustomerID
            VALUES (@FullName, @Phone, @Email, @Username, @PasswordHash, 1);
            """;
        await using var command = new SqlCommand(sql, connection, (SqlTransaction)transaction);
        AddAccountParameters(command, request);
        command.Parameters.Add("@PasswordHash", SqlDbType.VarChar, 255).Value = passwordHash;
        accountId = Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
    }
    else
    {
        const string sql = """
            DECLARE @RoleID int = (SELECT RoleID FROM dbo.Roles WHERE RoleName = @RoleName);
            IF @RoleID IS NULL
                SELECT CAST(NULL AS int);
            ELSE
            BEGIN
                INSERT INTO dbo.Employees (RoleID, FullName, Phone, Email, DepartmentID, IsActive)
                OUTPUT INSERTED.EmployeeID
                VALUES (@RoleID, @FullName, @Phone, @Email, @DepartmentID, 1);
            END;
            """;
        await using var command = new SqlCommand(sql, connection, (SqlTransaction)transaction);
        AddAccountParameters(command, request);
        var insertedId = await command.ExecuteScalarAsync(cancellationToken);
        if (insertedId is null or DBNull)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["roleName"] = ["The selected employee role does not exist."]
            });
        }
        accountId = Convert.ToInt32(insertedId);

        await using var accountCommand = new SqlCommand(
            "INSERT INTO dbo.Accounts (EmployeeID, Username, PasswordHash, IsActive) VALUES (@EmployeeID, @Username, @PasswordHash, 1);",
            connection,
            (SqlTransaction)transaction);
        accountCommand.Parameters.Add("@EmployeeID", SqlDbType.Int).Value = accountId;
        accountCommand.Parameters.Add("@Username", SqlDbType.VarChar, 50).Value = request.Username.Trim();
        accountCommand.Parameters.Add("@PasswordHash", SqlDbType.VarChar, 255).Value = passwordHash;
        await accountCommand.ExecuteNonQueryAsync(cancellationToken);
    }

    await transaction.CommitAsync(cancellationToken);
    return Results.Created($"/api/accounts/{request.AccountType.ToLowerInvariant()}/{accountId}", new
    {
        accountId,
        accountType = request.AccountType
    });
}).RequireAuthorization();

app.MapPut("/api/accounts/{accountType}/{id:int}", async (
    string accountType,
    int id,
    AccountUpdateRequest request,
    HttpContext context,
    CancellationToken cancellationToken) =>
{
    var validation = ValidateAccountUpdate(request);
    if (validation is not null) return Results.ValidationProblem(validation);
    if (accountType is not ("employee" or "customer"))
        return Results.BadRequest(new { message = "Account type must be employee or customer." });
    if (accountType == "customer" && request.RoleName != "Customer")
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["roleName"] = ["Customer profiles must use the Customer role."]
        });
    if (accountType == "employee" && request.RoleName == "Customer")
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["roleName"] = ["Employee accounts must use an employee role."]
        });

    var actorRole = context.User.FindFirstValue(ClaimTypes.Role);
    var isElevated = IsElevatedRole(actorRole);
    if (!isElevated && actorRole != "Manager")
        return Results.Forbid();
    if (accountType == "customer" && !isElevated)
        return Results.Forbid();
    if (accountType == "employee")
    {
        await using var permissionConnection = new SqlConnection(connectionString);
        await permissionConnection.OpenAsync(cancellationToken);
        var permission = await CanManageEmployee(permissionConnection, null, id, context.User, cancellationToken);
        if (!permission.Allowed)
            return permission.NotFound
                ? Results.NotFound(new { message = "Account was not found." })
                : Results.Forbid();
        if (IsElevatedRole(request.RoleName))
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["roleName"] = ["An Owner/Admin account cannot be created or assigned through account management."]
            });
        if (actorRole == "Manager")
        {
            if (request.RoleName is not ("Staff" or "Kitchen"))
                return Results.Forbid();
            request = request with { DepartmentId = GetDepartmentId(context.User) };
        }
        if (request.DepartmentId is null ||
            !await DepartmentExists(connectionString, request.DepartmentId.Value, cancellationToken))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["departmentId"] = ["Choose a valid department for this employee."]
            });
        }
    }

    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
    const string usernameExistsSql = """
        SELECT CASE WHEN
            EXISTS (SELECT 1 FROM dbo.Accounts WITH (UPDLOCK, HOLDLOCK) WHERE Username = @Username AND (@AccountType <> 'employee' OR EmployeeID <> @AccountID))
            OR EXISTS (SELECT 1 FROM dbo.Customers WITH (UPDLOCK, HOLDLOCK) WHERE Username = @Username AND (@AccountType <> 'customer' OR CustomerID <> @AccountID))
        THEN 1 ELSE 0 END;
        """;
    await using (var usernameCommand = new SqlCommand(usernameExistsSql, connection, (SqlTransaction)transaction))
    {
        usernameCommand.Parameters.Add("@Username", SqlDbType.VarChar, 50).Value = request.Username.Trim();
        usernameCommand.Parameters.Add("@AccountType", SqlDbType.VarChar, 10).Value = accountType;
        usernameCommand.Parameters.Add("@AccountID", SqlDbType.Int).Value = id;
        if (Convert.ToInt32(await usernameCommand.ExecuteScalarAsync(cancellationToken)) == 1)
            return Results.Conflict(new { message = "That username is already in use." });
    }

    int affectedRows;
    if (accountType == "customer")
    {
        const string sql = """
            UPDATE dbo.Customers
            SET FullName = @FullName, Phone = @Phone, Email = @Email, Username = @Username
            WHERE CustomerID = @AccountID;
            """;
        await using var command = new SqlCommand(sql, connection, (SqlTransaction)transaction);
        AddAccountUpdateParameters(command, request);
        command.Parameters.Add("@AccountID", SqlDbType.Int).Value = id;
        affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);
    }
    else
    {
        const string sql = """
            UPDATE e
            SET FullName = @FullName, Phone = @Phone, Email = @Email,
                RoleID = r.RoleID, DepartmentID = @DepartmentID
            FROM dbo.Employees e
            INNER JOIN dbo.Accounts a ON a.EmployeeID = e.EmployeeID
            INNER JOIN dbo.Roles r ON r.RoleName = @RoleName
            WHERE e.EmployeeID = @AccountID;
            """;
        await using var command = new SqlCommand(sql, connection, (SqlTransaction)transaction);
        AddAccountUpdateParameters(command, request);
        command.Parameters.Add("@AccountID", SqlDbType.Int).Value = id;
        affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);
        if (affectedRows == 0 && !await RoleExists(connection, request.RoleName, cancellationToken, (SqlTransaction)transaction))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["roleName"] = ["The selected role does not exist."]
            });
        }
        if (affectedRows > 0)
        {
            await using var accountCommand = new SqlCommand(
                "UPDATE dbo.Accounts SET Username = @Username WHERE EmployeeID = @AccountID;",
                connection,
                (SqlTransaction)transaction);
            accountCommand.Parameters.Add("@Username", SqlDbType.VarChar, 50).Value = request.Username.Trim();
            accountCommand.Parameters.Add("@AccountID", SqlDbType.Int).Value = id;
            await accountCommand.ExecuteNonQueryAsync(cancellationToken);
        }
    }

    if (affectedRows == 0)
        return Results.NotFound(new { message = "Account was not found." });

    await transaction.CommitAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization();

app.MapPatch("/api/accounts/{accountType}/{id:int}/status", async (
    string accountType,
    int id,
    AccountStatusRequest request,
    HttpContext context,
    CancellationToken cancellationToken) =>
{
    if (request.IsActive is null)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["isActive"] = ["The active status is required."]
        });
    }
    var actorRole = context.User.FindFirstValue(ClaimTypes.Role);
    if (accountType == "customer")
    {
        if (!IsElevatedRole(actorRole)) return Results.Forbid();
    }
    else if (accountType == "employee")
    {
        if (!IsElevatedRole(actorRole) && actorRole != "Manager") return Results.Forbid();
        await using var permissionConnection = new SqlConnection(connectionString);
        await permissionConnection.OpenAsync(cancellationToken);
        var permission = await CanManageEmployee(permissionConnection, null, id, context.User, cancellationToken);
        if (!permission.Allowed)
            return permission.NotFound
                ? Results.NotFound(new { message = "Account was not found." })
                : Results.Forbid();
    }
    else
    {
        return Results.BadRequest(new { message = "Account type must be employee or customer." });
    }

    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
    if (accountType == "employee")
    {
        await using var accountCommand = new SqlCommand(
            "UPDATE dbo.Accounts SET IsActive = @IsActive WHERE EmployeeID = @AccountID;",
            connection,
            (SqlTransaction)transaction);
        accountCommand.Parameters.Add("@IsActive", SqlDbType.Bit).Value = request.IsActive.Value;
        accountCommand.Parameters.Add("@AccountID", SqlDbType.Int).Value = id;
        if (await accountCommand.ExecuteNonQueryAsync(cancellationToken) == 0)
            return Results.NotFound(new { message = "Account was not found." });

        await using var employeeCommand = new SqlCommand(
            "UPDATE dbo.Employees SET IsActive = @IsActive WHERE EmployeeID = @AccountID;",
            connection,
            (SqlTransaction)transaction);
        employeeCommand.Parameters.Add("@IsActive", SqlDbType.Bit).Value = request.IsActive.Value;
        employeeCommand.Parameters.Add("@AccountID", SqlDbType.Int).Value = id;
        await employeeCommand.ExecuteNonQueryAsync(cancellationToken);
    }
    else if (accountType == "customer")
    {
        await using var command = new SqlCommand(
            "UPDATE dbo.Customers SET IsActive = @IsActive WHERE CustomerID = @AccountID;",
            connection,
            (SqlTransaction)transaction);
        command.Parameters.Add("@IsActive", SqlDbType.Bit).Value = request.IsActive.Value;
        command.Parameters.Add("@AccountID", SqlDbType.Int).Value = id;
        if (await command.ExecuteNonQueryAsync(cancellationToken) == 0)
            return Results.NotFound(new { message = "Account was not found." });
    }
    await transaction.CommitAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization();

app.MapPatch("/api/employees/{id:int}/role", async (
    int id,
    AssignRoleRequest request,
    HttpContext context,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.RoleName) || request.RoleName.Trim().Length > 50)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["roleName"] = ["A role is required."]
        });
    }
    var actorRole = context.User.FindFirstValue(ClaimTypes.Role);
    if (!IsElevatedRole(actorRole) && actorRole != "Manager") return Results.Forbid();
    if (IsElevatedRole(request.RoleName) || request.RoleName == "Customer")
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["roleName"] = ["Owner/Admin and Customer roles cannot be assigned through this endpoint."]
        });
    await using var permissionConnection = new SqlConnection(connectionString);
    await permissionConnection.OpenAsync(cancellationToken);
    var permission = await CanManageEmployeeRecord(permissionConnection, null, id, context.User, cancellationToken);
    if (!permission.Allowed)
        return permission.NotFound
            ? Results.NotFound(new { message = $"Active employee {id} was not found." })
            : Results.Forbid();
    if (actorRole == "Manager" && request.RoleName is not ("Staff" or "Kitchen"))
        return Results.Forbid();

    const string sql = """
        UPDATE e
        SET RoleID = r.RoleID
        FROM dbo.Employees e
        INNER JOIN dbo.Roles r ON r.RoleName = @RoleName
        WHERE e.EmployeeID = @EmployeeID;
        """;
    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var command = new SqlCommand(sql, connection);
    command.Parameters.Add("@RoleName", SqlDbType.NVarChar, 50).Value = request.RoleName.Trim();
    command.Parameters.Add("@EmployeeID", SqlDbType.Int).Value = id;
    var affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);
    if (affectedRows == 0)
    {
        var roleExists = await RoleExists(connection, request.RoleName.Trim(), cancellationToken);
        return roleExists
            ? Results.NotFound(new { message = $"Active employee {id} was not found." })
            : Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["roleName"] = ["The selected role does not exist."]
            });
    }
    return Results.NoContent();
}).RequireAuthorization();

app.MapGet("/api/employee-roles", async (CancellationToken cancellationToken) =>
{
    const string sql = "SELECT RoleID AS roleId, RoleName AS roleName, Description AS description FROM dbo.Roles ORDER BY RoleName;";
    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var command = new SqlCommand(sql, connection);
    await using var reader = await command.ExecuteReaderAsync(cancellationToken);
    var roles = new List<object>();
    while (await reader.ReadAsync(cancellationToken))
    {
        roles.Add(new
        {
            roleId = reader.GetInt32(0),
            roleName = reader.GetString(1),
            description = reader.IsDBNull(2) ? null : reader.GetString(2)
        });
    }
    return Results.Ok(roles);
});

app.MapGet("/api/departments", async (CancellationToken cancellationToken) =>
{
    const string sql = "SELECT DepartmentID AS departmentId, DepartmentName AS departmentName FROM dbo.Departments ORDER BY DepartmentName;";
    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var command = new SqlCommand(sql, connection);
    await using var reader = await command.ExecuteReaderAsync(cancellationToken);
    var departments = new List<object>();
    while (await reader.ReadAsync(cancellationToken))
    {
        departments.Add(new { departmentId = reader.GetInt32(0), departmentName = reader.GetString(1) });
    }
    return Results.Ok(departments);
});

app.Run();

static EmployeeResponse ReadEmployee(SqlDataReader reader) => new(
    reader.GetInt32(0),
    reader.GetString(1),
    reader.GetString(2),
    reader.IsDBNull(3) ? null : reader.GetString(3),
    reader.IsDBNull(4) ? null : reader.GetDateTime(4),
    reader.GetInt32(5),
    reader.GetString(6),
    reader.IsDBNull(7) ? null : reader.GetInt32(7),
    reader.IsDBNull(8) ? null : reader.GetString(8),
    reader.IsDBNull(9) ? null : reader.GetString(9),
    reader.GetBoolean(10) ? "Active" : "Inactive");

static Dictionary<string, string[]>? ValidateEmployee(EmployeeRequest request)
{
    var errors = new Dictionary<string, string[]>();
    if (string.IsNullOrWhiteSpace(request.FullName))
        errors["fullName"] = ["Full name is required."];
    else if (request.FullName.Trim().Length > 100)
        errors["fullName"] = ["Full name must not exceed 100 characters."];

    if (string.IsNullOrWhiteSpace(request.Phone))
        errors["phone"] = ["Phone number is required."];
    else if (request.Phone.Trim().Length > 15)
        errors["phone"] = ["Phone number must not exceed 15 characters."];

    if (!string.IsNullOrWhiteSpace(request.Email) &&
        (request.Email.Length > 100 || !System.Net.Mail.MailAddress.TryCreate(request.Email, out _)))
        errors["email"] = ["Email must be a valid address of at most 100 characters."];

    if (string.IsNullOrWhiteSpace(request.RoleName) || request.RoleName.Trim().Length > 50)
        errors["roleName"] = ["A valid role is required."];

    if (request.Position?.Length > 100)
        errors["position"] = ["Position must not exceed 100 characters."];

    if (request.DepartmentId is <= 0)
        errors["departmentId"] = ["Department ID must be greater than zero."];

    if (request.Status is not null and not ("Active" or "Inactive"))
        errors["status"] = ["Status must be Active or Inactive."];

    return errors.Count == 0 ? null : errors;
}

static void AddEmployeeParameters(SqlCommand command, EmployeeRequest request)
{
    command.Parameters.Add("@RoleName", SqlDbType.NVarChar, 50).Value = request.RoleName.Trim();
    command.Parameters.Add("@FullName", SqlDbType.NVarChar, 100).Value = request.FullName.Trim();
    command.Parameters.Add("@Phone", SqlDbType.VarChar, 15).Value = request.Phone.Trim();
    command.Parameters.Add("@Email", SqlDbType.VarChar, 100).Value =
        string.IsNullOrWhiteSpace(request.Email) ? DBNull.Value : request.Email.Trim();
    command.Parameters.Add("@DepartmentID", SqlDbType.Int).Value = request.DepartmentId ?? (object)DBNull.Value;
    command.Parameters.Add("@Position", SqlDbType.NVarChar, 100).Value =
        string.IsNullOrWhiteSpace(request.Position) ? DBNull.Value : request.Position.Trim();
    command.Parameters.Add("@IsActive", SqlDbType.Bit).Value = request.Status != "Inactive";
}

static async Task<bool> RoleExists(
    SqlConnection connection,
    string roleName,
    CancellationToken cancellationToken,
    SqlTransaction? transaction = null)
{
    await using var command = new SqlCommand(
        "SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = @RoleName) THEN 1 ELSE 0 END;",
        connection,
        transaction);
    command.Parameters.Add("@RoleName", SqlDbType.NVarChar, 50).Value = roleName.Trim();
    return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken)) == 1;
}

static bool IsElevatedRole(string? roleName) => roleName is "Owner" or "Admin";

static int? GetDepartmentId(ClaimsPrincipal user) =>
    int.TryParse(user.FindFirstValue("departmentId"), out var departmentId) ? departmentId : null;

static async Task<(bool Allowed, bool NotFound)> CanManageEmployee(
    SqlConnection connection,
    SqlTransaction? transaction,
    int employeeId,
    ClaimsPrincipal actor,
    CancellationToken cancellationToken)
{
    const string sql = """
        SELECT r.RoleName, e.DepartmentID
        FROM dbo.Employees e
        INNER JOIN dbo.Roles r ON r.RoleID = e.RoleID
        INNER JOIN dbo.Accounts a ON a.EmployeeID = e.EmployeeID
        WHERE e.EmployeeID = @EmployeeID AND e.IsActive = 1 AND a.IsActive = 1;
        """;
    await using var command = new SqlCommand(sql, connection, transaction);
    command.Parameters.Add("@EmployeeID", SqlDbType.Int).Value = employeeId;
    await using var reader = await command.ExecuteReaderAsync(cancellationToken);
    if (!await reader.ReadAsync(cancellationToken)) return (false, true);

    var targetRole = reader.GetString(0);
    int? targetDepartmentId = reader.IsDBNull(1) ? null : reader.GetInt32(1);
    var actorRole = actor.FindFirstValue(ClaimTypes.Role);
    if (IsElevatedRole(targetRole)) return (false, false);
    if (IsElevatedRole(actorRole)) return (true, false);
    if (actorRole != "Manager") return (false, false);

    var managerDepartmentId = GetDepartmentId(actor);
    return managerDepartmentId is not null &&
        targetDepartmentId == managerDepartmentId &&
        targetRole is "Staff" or "Kitchen"
            ? (true, false)
            : (false, false);
}

static async Task<(bool Allowed, bool NotFound)> CanManageEmployeeRecord(
    SqlConnection connection,
    SqlTransaction? transaction,
    int employeeId,
    ClaimsPrincipal actor,
    CancellationToken cancellationToken)
{
    const string sql = """
        SELECT r.RoleName, e.DepartmentID
        FROM dbo.Employees e
        INNER JOIN dbo.Roles r ON r.RoleID = e.RoleID
        WHERE e.EmployeeID = @EmployeeID AND e.IsActive = 1;
        """;
    await using var command = new SqlCommand(sql, connection, transaction);
    command.Parameters.Add("@EmployeeID", SqlDbType.Int).Value = employeeId;
    await using var reader = await command.ExecuteReaderAsync(cancellationToken);
    if (!await reader.ReadAsync(cancellationToken)) return (false, true);

    var targetRole = reader.GetString(0);
    int? targetDepartmentId = reader.IsDBNull(1) ? null : reader.GetInt32(1);
    var actorRole = actor.FindFirstValue(ClaimTypes.Role);
    if (IsElevatedRole(targetRole)) return (false, false);
    if (IsElevatedRole(actorRole)) return (true, false);
    if (actorRole != "Manager") return (false, false);

    var managerDepartmentId = GetDepartmentId(actor);
    return managerDepartmentId is not null &&
        targetDepartmentId == managerDepartmentId &&
        targetRole is "Staff" or "Kitchen"
            ? (true, false)
            : (false, false);
}

static Dictionary<string, string[]>? ValidateAccount(AccountCreateRequest request)
{
    var errors = new Dictionary<string, string[]>();
    if (string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Trim().Length > 100)
        errors["fullName"] = ["Full name is required and must not exceed 100 characters."];
    if (string.IsNullOrWhiteSpace(request.Phone) || request.Phone.Trim().Length > 15)
        errors["phone"] = ["Phone is required and must not exceed 15 characters."];
    if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Trim().Length > 50)
        errors["username"] = ["Username is required and must not exceed 50 characters."];
    if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
        errors["password"] = ["Password must contain at least 8 characters."];
    if (string.IsNullOrWhiteSpace(request.RoleName) || request.RoleName.Trim().Length > 50)
        errors["roleName"] = ["A valid role is required."];
    if (!string.IsNullOrWhiteSpace(request.Email) &&
        (request.Email.Length > 100 || !System.Net.Mail.MailAddress.TryCreate(request.Email, out _)))
        errors["email"] = ["Email must be a valid address of at most 100 characters."];
    return errors.Count == 0 ? null : errors;
}

static Dictionary<string, string[]>? ValidateAccountUpdate(AccountUpdateRequest request)
{
    var errors = new Dictionary<string, string[]>();
    if (string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Trim().Length > 100)
        errors["fullName"] = ["Full name is required and must not exceed 100 characters."];
    if (string.IsNullOrWhiteSpace(request.Phone) || request.Phone.Trim().Length > 15)
        errors["phone"] = ["Phone is required and must not exceed 15 characters."];
    if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Trim().Length > 50)
        errors["username"] = ["Username is required and must not exceed 50 characters."];
    if (string.IsNullOrWhiteSpace(request.RoleName) || request.RoleName.Trim().Length > 50)
        errors["roleName"] = ["A valid role is required."];
    if (!string.IsNullOrWhiteSpace(request.Email) &&
        (request.Email.Length > 100 || !System.Net.Mail.MailAddress.TryCreate(request.Email, out _)))
        errors["email"] = ["Email must be a valid address of at most 100 characters."];
    return errors.Count == 0 ? null : errors;
}

static void AddAccountParameters(SqlCommand command, AccountCreateRequest request)
{
    command.Parameters.Add("@FullName", SqlDbType.NVarChar, 100).Value = request.FullName.Trim();
    command.Parameters.Add("@Phone", SqlDbType.VarChar, 15).Value = request.Phone.Trim();
    command.Parameters.Add("@Email", SqlDbType.VarChar, 100).Value =
        string.IsNullOrWhiteSpace(request.Email) ? DBNull.Value : request.Email.Trim();
    command.Parameters.Add("@Username", SqlDbType.VarChar, 50).Value = request.Username.Trim();
    command.Parameters.Add("@RoleName", SqlDbType.NVarChar, 50).Value = request.RoleName.Trim();
    command.Parameters.Add("@DepartmentID", SqlDbType.Int).Value = request.DepartmentId ?? (object)DBNull.Value;
}

static void AddAccountUpdateParameters(SqlCommand command, AccountUpdateRequest request)
{
    command.Parameters.Add("@FullName", SqlDbType.NVarChar, 100).Value = request.FullName.Trim();
    command.Parameters.Add("@Phone", SqlDbType.VarChar, 15).Value = request.Phone.Trim();
    command.Parameters.Add("@Email", SqlDbType.VarChar, 100).Value =
        string.IsNullOrWhiteSpace(request.Email) ? DBNull.Value : request.Email.Trim();
    command.Parameters.Add("@Username", SqlDbType.VarChar, 50).Value = request.Username.Trim();
    command.Parameters.Add("@RoleName", SqlDbType.NVarChar, 50).Value = request.RoleName.Trim();
    command.Parameters.Add("@DepartmentID", SqlDbType.Int).Value = request.DepartmentId ?? (object)DBNull.Value;
}

static string HashPassword(string password)
{
    const int iterations = 210_000;
    var salt = RandomNumberGenerator.GetBytes(16);
    var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, 32);
    return $"PBKDF2-SHA256${iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
}

static bool VerifyPassword(string password, string? encodedHash)
{
    if (string.IsNullOrWhiteSpace(encodedHash)) return false;
    var parts = encodedHash.Split('$');
    if (parts.Length != 4 || parts[0] != "PBKDF2-SHA256" ||
        !int.TryParse(parts[1], out var iterations) || iterations is < 100_000 or > 1_000_000)
        return false;
    try
    {
        var salt = Convert.FromBase64String(parts[2]);
        var expectedHash = Convert.FromBase64String(parts[3]);
        var actualHash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            expectedHash.Length);
        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }
    catch (FormatException)
    {
        return false;
    }
}

static async Task<bool> DepartmentExists(string connectionString, int departmentId, CancellationToken cancellationToken)
{
    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var command = new SqlCommand(
        "SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.Departments WHERE DepartmentID = @DepartmentID) THEN 1 ELSE 0 END;",
        connection);
    command.Parameters.Add("@DepartmentID", SqlDbType.Int).Value = departmentId;
    return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken)) == 1;
}

internal sealed record EmployeeRequest(
    string FullName,
    string Phone,
    string? Email,
    string RoleName,
    int? DepartmentId,
    string? Position,
    string? Status);

internal sealed record AssignRoleRequest(string RoleName);

internal sealed record LoginRequest(string Username, string Password);

internal sealed record AccountBootstrapRequest(
    string BootstrapKey,
    string Username,
    string Password,
    string FullName,
    string Phone,
    string? Email);

internal sealed record AccountCreateRequest(
    string AccountType,
    string Username,
    string Password,
    string FullName,
    string Phone,
    string? Email,
    string RoleName,
    int? DepartmentId);

internal sealed record AccountUpdateRequest(
    string Username,
    string FullName,
    string Phone,
    string? Email,
    string RoleName,
    int? DepartmentId);

internal sealed record AccountStatusRequest(bool? IsActive);

internal sealed record KitchenItemStatusRequest(string Status);

internal sealed record KitchenTicketResponse(
    int OrderId,
    string Table,
    string Server,
    DateTime? CreatedAt,
    List<KitchenTicketItemResponse> Items);

internal sealed record KitchenTicketItemResponse(
    int Id,
    string Name,
    int Quantity,
    string? Note,
    string Status);

internal sealed record AccountResponse(
    int AccountId,
    string AccountType,
    string Username,
    string FullName,
    string? Email,
    string Phone,
    string RoleName,
    string Status,
    DateTime? CreatedAt,
    int? DepartmentId,
    string? DepartmentName);

internal sealed record EmployeeResponse(
    int EmployeeId,
    string FullName,
    string Phone,
    string? Email,
    DateTime? CreatedAt,
    int RoleId,
    string RoleName,
    int? DepartmentId,
    string? DepartmentName,
    string? Position,
    string Status);
