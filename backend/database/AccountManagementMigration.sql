USE [RestaurantDB_Final];
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH('dbo.Customers', 'Username') IS NULL
    ALTER TABLE dbo.Customers ADD Username varchar(50) NULL;
GO

IF COL_LENGTH('dbo.Customers', 'PasswordHash') IS NULL
    ALTER TABLE dbo.Customers ADD PasswordHash varchar(255) NULL;
GO

IF COL_LENGTH('dbo.Customers', 'IsActive') IS NULL
BEGIN
    ALTER TABLE dbo.Customers
        ADD IsActive bit NOT NULL
            CONSTRAINT DF_Customers_IsActive DEFAULT (1) WITH VALUES;
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_Customers_Username'
      AND object_id = OBJECT_ID('dbo.Customers')
)
    CREATE UNIQUE INDEX UX_Customers_Username
        ON dbo.Customers (Username)
        WHERE Username IS NOT NULL;
GO
