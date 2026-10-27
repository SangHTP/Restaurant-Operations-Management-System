-- ============================================================
-- Script bổ sung bảng/cột thiếu cho UC-29 → UC-59
-- ============================================================
USE [RestaurantDB_Final];
GO

-- ================================
-- 1. Tạo bảng Banners (UC-29: Manage Banner)
-- ================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Banners')
BEGIN
    CREATE TABLE [dbo].[Banners](
        [BannerID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Title] [nvarchar](200) NOT NULL,
        [Subtitle] [nvarchar](500) NULL,
        [ImageUrl] [varchar](500) NULL,
        [LinkUrl] [varchar](255) NULL,
        [DisplayOrder] [int] NOT NULL DEFAULT(0),
        [IsActive] [bit] NOT NULL DEFAULT(1),
        [CreatedAt] [datetime] NOT NULL DEFAULT(GETDATE()),
        [UpdatedAt] [datetime] NULL
    );
    PRINT N'✅ Đã tạo bảng Banners';
END
ELSE
    PRINT N'⏭️ Bảng Banners đã tồn tại';
GO

-- ================================
-- 2. Tạo bảng News (UC-30: Manage News)
-- ================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'News')
BEGIN
    CREATE TABLE [dbo].[News](
        [NewsID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Title] [nvarchar](300) NOT NULL,
        [Summary] [nvarchar](500) NULL,
        [Content] [nvarchar](MAX) NULL,
        [ThumbnailUrl] [varchar](500) NULL,
        [Category] [nvarchar](100) NULL,
        [Author] [nvarchar](100) NULL,
        [IsPublished] [bit] NOT NULL DEFAULT(0),
        [IsFeatured] [bit] NOT NULL DEFAULT(0),
        [ViewCount] [int] NOT NULL DEFAULT(0),
        [CreatedAt] [datetime] NOT NULL DEFAULT(GETDATE()),
        [UpdatedAt] [datetime] NULL,
        [PublishedAt] [datetime] NULL
    );
    PRINT N'✅ Đã tạo bảng News';
END
ELSE
    PRINT N'⏭️ Bảng News đã tồn tại';
GO

-- ================================
-- 3. Bổ sung cột IsHidden, HiddenReason cho Feedbacks (UC-58)
-- ================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Feedbacks') AND name = 'IsHidden')
BEGIN
    ALTER TABLE [dbo].[Feedbacks] ADD [IsHidden] [bit] NOT NULL DEFAULT(0);
    PRINT N'✅ Đã thêm cột IsHidden vào Feedbacks';
END
ELSE
    PRINT N'⏭️ Cột IsHidden đã tồn tại';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Feedbacks') AND name = 'HiddenReason')
BEGIN
    ALTER TABLE [dbo].[Feedbacks] ADD [HiddenReason] [nvarchar](200) NULL;
    PRINT N'✅ Đã thêm cột HiddenReason vào Feedbacks';
END
ELSE
    PRINT N'⏭️ Cột HiddenReason đã tồn tại';
GO

-- ================================
-- 4. Tạo bảng FeedbackReplies (UC-57: Reply to Customer Feedback)
-- ================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FeedbackReplies')
BEGIN
    CREATE TABLE [dbo].[FeedbackReplies](
        [ReplyID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [FeedbackID] [int] NOT NULL FOREIGN KEY REFERENCES [dbo].[Feedbacks]([FeedbackID]) ON DELETE CASCADE,
        [EmployeeID] [int] NOT NULL FOREIGN KEY REFERENCES [dbo].[Employees]([EmployeeID]),
        [ReplyContent] [nvarchar](2000) NOT NULL,
        [CreatedAt] [datetime] NOT NULL DEFAULT(GETDATE())
    );
    PRINT N'✅ Đã tạo bảng FeedbackReplies';
END
ELSE
    PRINT N'⏭️ Bảng FeedbackReplies đã tồn tại';
GO

PRINT N'';
PRINT N'====================================';
PRINT N'🎉 Hoàn tất bổ sung database!';
PRINT N'====================================';
GO
