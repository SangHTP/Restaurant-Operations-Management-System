CREATE DATABASE [RestaurantDB_Final];
GO

USE [RestaurantDB_Final];
GO

CREATE TABLE [dbo].[Areas](
	[AreaID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[AreaName] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](255) NULL
);
GO

CREATE TABLE [dbo].[Categories](
	[CategoryID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[CategoryName] [nvarchar](100) NOT NULL UNIQUE
);
GO

CREATE TABLE [dbo].[Departments](
	[DepartmentID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[DepartmentName] [nvarchar](100) NOT NULL UNIQUE,
	[Description] [nvarchar](255) NULL
);
GO

CREATE TABLE [dbo].[Promotions](
	[PromotionID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[Code] [varchar](50) NOT NULL UNIQUE,
	[PromotionName] [nvarchar](150) NULL,
	[DiscountType] [varchar](20) NOT NULL CHECK (DiscountType IN ('Amount', 'Percent')),
	[DiscountValue] [decimal](18, 0) NOT NULL,
	[MinOrderValue] [decimal](18, 0) DEFAULT ((0)),
	[StartDate] [datetime] NOT NULL,
	[EndDate] [datetime] NOT NULL,
	[IsActive] [bit] DEFAULT ((1))
);
GO

CREATE TABLE [dbo].[Roles](
	[RoleID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[RoleName] [nvarchar](50) NOT NULL UNIQUE,
	[Description] [nvarchar](255) NULL
);
GO

CREATE TABLE [dbo].[Shifts](
	[ShiftID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[ShiftName] [nvarchar](50) NOT NULL,
	[StartTime] [time](7) NOT NULL,
	[EndTime] [time](7) NOT NULL
);
GO

CREATE TABLE [dbo].[Customers](
	[CustomerID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[FullName] [nvarchar](100) NOT NULL,
	[Phone] [varchar](15) NOT NULL UNIQUE,
	[Email] [varchar](100) NULL UNIQUE,
	[RewardPoints] [int] DEFAULT ((0)),
	[CreatedAt] [datetime] DEFAULT (getdate())
);
GO

CREATE TABLE [dbo].[Tables](
	[TableID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[AreaID] [int] NOT NULL FOREIGN KEY REFERENCES [dbo].[Areas] ([AreaID]),
	[TableName] [nvarchar](50) NOT NULL,
	[Capacity] [int] NOT NULL CHECK ([Capacity]>(0)),
	[Status] [nvarchar](50) DEFAULT (N'Trống') CHECK ([Status] IN (N'Ghép bàn', N'Đã sử dụng', N'Đang phục vụ', N'Đã đặt', N'Trống'))
);
GO

CREATE TABLE [dbo].[Employees](
	[EmployeeID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[RoleID] [int] NOT NULL FOREIGN KEY REFERENCES [dbo].[Roles] ([RoleID]),
	[FullName] [nvarchar](100) NOT NULL,
	[Phone] [varchar](15) NOT NULL UNIQUE,
	[Email] [varchar](100) NULL UNIQUE,
	[CreatedAt] [datetime] DEFAULT (getdate()),
	[DepartmentID] [int] NULL FOREIGN KEY REFERENCES [dbo].[Departments] ([DepartmentID])
);
GO

CREATE TABLE [dbo].[Accounts](
	[AccountID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[EmployeeID] [int] NOT NULL UNIQUE FOREIGN KEY REFERENCES [dbo].[Employees] ([EmployeeID]),
	[Username] [varchar](50) NOT NULL UNIQUE,
	[PasswordHash] [varchar](255) NOT NULL,
	[IsActive] [bit] DEFAULT ((1))
);
GO

CREATE TABLE [dbo].[ActionLogs](
	[LogID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[EmployeeID] [int] NOT NULL FOREIGN KEY REFERENCES [dbo].[Employees] ([EmployeeID]),
	[ActionType] [varchar](50) NOT NULL,
	[ReferenceTable] [varchar](50) NOT NULL,
	[ReferenceID] [int] NOT NULL,
	[Description] [nvarchar](500) NULL,
	[CreatedAt] [datetime] DEFAULT (getdate())
);
GO

CREATE TABLE [dbo].[Assignments](
	[AssignmentID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[EmployeeID] [int] NOT NULL FOREIGN KEY REFERENCES [dbo].[Employees] ([EmployeeID]),
	[AreaID] [int] NULL FOREIGN KEY REFERENCES [dbo].[Areas] ([AreaID]),
	[ShiftID] [int] NOT NULL FOREIGN KEY REFERENCES [dbo].[Shifts] ([ShiftID]),
	[ShiftDate] [date] NOT NULL
);
GO

CREATE TABLE [dbo].[MenuItems](
	[MenuItemID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[CategoryID] [int] NOT NULL FOREIGN KEY REFERENCES [dbo].[Categories] ([CategoryID]),
	[ItemName] [nvarchar](150) NOT NULL,
	[Price] [decimal](18, 0) NOT NULL CHECK ([Price]>=(0)),
	[Description] [nvarchar](500) NULL,
	[ImageUrl] [varchar](255) NULL,
	[IsActive] [bit] DEFAULT ((1))
);
GO

CREATE TABLE [dbo].[DailyInventories](
	[InventoryID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[MenuItemID] [int] NOT NULL FOREIGN KEY REFERENCES [dbo].[MenuItems] ([MenuItemID]),
	[Date] [date] NOT NULL,
	[InitialQuantity] [int] NOT NULL CHECK ([InitialQuantity]>=(0)),
	[RemainingQuantity] [int] NOT NULL CHECK ([RemainingQuantity]>=(0)),
	UNIQUE ([MenuItemID], [Date])
);
GO

CREATE TABLE [dbo].[Orders](
	[OrderID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[EmployeeID] [int] NOT NULL FOREIGN KEY REFERENCES [dbo].[Employees] ([EmployeeID]),
	[OrderTime] [datetime] DEFAULT (getdate()),
	[Status] [nvarchar](50) DEFAULT (N'Đang phục vụ') CHECK ([Status] IN (N'Đã hủy', N'Đã hoàn thành', N'Chờ thanh toán', N'Đang phục vụ'))
);
GO

CREATE TABLE [dbo].[OrderDetails](
	[OrderDetailID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[OrderID] [int] NOT NULL FOREIGN KEY REFERENCES [dbo].[Orders] ([OrderID]),
	[MenuItemID] [int] NOT NULL FOREIGN KEY REFERENCES [dbo].[MenuItems] ([MenuItemID]),
	[Quantity] [int] NOT NULL CHECK ([Quantity]>(0)),
	[UnitPrice] [decimal](18, 0) NOT NULL,
	[Note] [nvarchar](255) NULL,
	[Status] [nvarchar](50) DEFAULT (N'Chờ chế biến') CHECK ([Status] IN (N'Đã hủy', N'Đã phục vụ', N'Đã xong', N'Đang chế biến', N'Chờ chế biến')),
	[OrderTime] [datetime] DEFAULT (getdate())
);
GO

CREATE TABLE [dbo].[OrderTables](
	[OrderID] [int] NOT NULL FOREIGN KEY REFERENCES [dbo].[Orders] ([OrderID]),
	[TableID] [int] NOT NULL FOREIGN KEY REFERENCES [dbo].[Tables] ([TableID]),
	PRIMARY KEY ([OrderID], [TableID])
);
GO

CREATE TABLE [dbo].[Bills](
	[BillID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[OrderID] [int] NOT NULL UNIQUE FOREIGN KEY REFERENCES [dbo].[Orders] ([OrderID]),
	[PromotionID] [int] NULL FOREIGN KEY REFERENCES [dbo].[Promotions] ([PromotionID]),
	[SubTotal] [decimal](18, 0) NOT NULL,
	[DiscountAmount] [decimal](18, 0) DEFAULT ((0)),
	[TaxAmount] [decimal](18, 0) DEFAULT ((0)),
	[FinalAmount] [decimal](18, 0) NOT NULL,
	[CreatedBy] [int] NOT NULL FOREIGN KEY REFERENCES [dbo].[Employees] ([EmployeeID]),
	[CreatedAt] [datetime] DEFAULT (getdate())
);
GO

CREATE TABLE [dbo].[Payments](
	[PaymentID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[BillID] [int] NOT NULL UNIQUE FOREIGN KEY REFERENCES [dbo].[Bills] ([BillID]),
	[PaymentMethod] [nvarchar](50) NOT NULL,
	[TransactionNo] [varchar](100) NULL,
	[AmountPaid] [decimal](18, 0) NOT NULL,
	[PaymentTime] [datetime] DEFAULT (getdate()),
	[Status] [nvarchar](50) DEFAULT (N'Đang xử lý') CHECK ([Status] IN (N'Thất bại', N'Thành công', N'Đang xử lý'))
);
GO

CREATE TABLE [dbo].[Reservations](
	[ReservationID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[TableID] [int] NULL FOREIGN KEY REFERENCES [dbo].[Tables] ([TableID]),
	[EmployeeID] [int] NOT NULL FOREIGN KEY REFERENCES [dbo].[Employees] ([EmployeeID]),
	[CustomerID] [int] NULL FOREIGN KEY REFERENCES [dbo].[Customers] ([CustomerID]),
	[CustomerName] [nvarchar](100) NOT NULL,
	[CustomerPhone] [varchar](15) NOT NULL,
	[ReservationTime] [datetime] NOT NULL,
	[NumberOfGuests] [int] NOT NULL CHECK ([NumberOfGuests]>(0)),
	[Status] [nvarchar](50) DEFAULT (N'Chờ xác nhận') CHECK ([Status] IN (N'Đã hủy', N'Đã đến', N'Đã xác nhận', N'Chờ xác nhận')),
	[CreatedAt] [datetime] DEFAULT (getdate())
);
GO

CREATE TABLE [dbo].[Feedbacks](
	[FeedbackID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[BillID] [int] NOT NULL UNIQUE FOREIGN KEY REFERENCES [dbo].[Bills] ([BillID]),
	[CustomerID] [int] NULL FOREIGN KEY REFERENCES [dbo].[Customers] ([CustomerID]),
	[CustomerName] [nvarchar](100) NULL,
	[CustomerPhone] [varchar](15) NULL,
	[Rating] [tinyint] NOT NULL CHECK ([Rating]>=(1) AND [Rating]<=(5)),
	[Content] [nvarchar](1000) NULL,
	[CreatedAt] [datetime] DEFAULT (getdate())
);
GO

CREATE TABLE [dbo].[WorkAvailabilities](
	[AvailabilityID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[EmployeeID] [int] NOT NULL FOREIGN KEY REFERENCES [dbo].[Employees] ([EmployeeID]),
	[ShiftID] [int] NOT NULL FOREIGN KEY REFERENCES [dbo].[Shifts] ([ShiftID]),
	[AvailableDate] [date] NOT NULL,
	[Status] [nvarchar](20) DEFAULT ('Pending')
);
GO

CREATE TRIGGER [dbo].[TRG_Deduct_Inventory]
ON [dbo].[OrderDetails]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Today DATE = CAST(GETDATE() AS DATE);

    UPDATE INV
    SET INV.RemainingQuantity = INV.RemainingQuantity - I.Quantity
    FROM [dbo].[DailyInventories] INV
    INNER JOIN inserted I ON INV.MenuItemID = I.MenuItemID
    WHERE INV.[Date] = @Today;
END;
GO