USE [RestaurantDB_Final];
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Departments WHERE DepartmentName = N'Front of House')
    INSERT INTO dbo.Departments (DepartmentName, Description)
    VALUES (N'Front of House', N'Guest service and dining room operations');

IF NOT EXISTS (SELECT 1 FROM dbo.Departments WHERE DepartmentName = N'Kitchen')
    INSERT INTO dbo.Departments (DepartmentName, Description)
    VALUES (N'Kitchen', N'Food preparation and kitchen operations');

IF NOT EXISTS (SELECT 1 FROM dbo.Departments WHERE DepartmentName = N'Cashier')
    INSERT INTO dbo.Departments (DepartmentName, Description)
    VALUES (N'Cashier', N'Payments and bill reconciliation');
GO
