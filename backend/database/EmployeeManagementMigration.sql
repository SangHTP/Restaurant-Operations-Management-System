USE [RestaurantDB_Final];
GO

IF COL_LENGTH('dbo.Employees', 'IsActive') IS NULL
BEGIN
    ALTER TABLE dbo.Employees
        ADD IsActive bit NOT NULL
            CONSTRAINT DF_Employees_IsActive DEFAULT (1) WITH VALUES;
END;
GO

IF COL_LENGTH('dbo.Employees', 'Position') IS NULL
BEGIN
    ALTER TABLE dbo.Employees
        ADD Position nvarchar(100) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'Staff')
    INSERT INTO dbo.Roles (RoleName, Description) VALUES (N'Staff', N'Restaurant service staff');

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'Kitchen')
    INSERT INTO dbo.Roles (RoleName, Description) VALUES (N'Kitchen', N'Kitchen operations');

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'Manager')
    INSERT INTO dbo.Roles (RoleName, Description) VALUES (N'Manager', N'Restaurant management');

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'Owner')
    INSERT INTO dbo.Roles (RoleName, Description) VALUES (N'Owner', N'Business owner');

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'Admin')
    INSERT INTO dbo.Roles (RoleName, Description) VALUES (N'Admin', N'System administrator');
GO
