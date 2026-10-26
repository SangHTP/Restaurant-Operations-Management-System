USE [RestaurantDB_Final];
GO

IF OBJECT_ID(N'dbo.Reservations', N'U') IS NULL
    THROW 50001, 'Reservations table is required before creating reservation feedback.', 1;

IF OBJECT_ID(N'dbo.Customers', N'U') IS NULL
    THROW 50002, 'Customers table is required before creating reservation feedback.', 1;

IF OBJECT_ID(N'dbo.ReservationFeedbacks', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[ReservationFeedbacks](
        [ReservationFeedbackID] [int] IDENTITY(1,1) NOT NULL
            CONSTRAINT [PK_ReservationFeedbacks] PRIMARY KEY,
        [ReservationID] [int] NOT NULL,
        [CustomerID] [int] NOT NULL,
        [Rating] [tinyint] NOT NULL,
        [Content] [nvarchar](1000) NULL,
        [CreatedAt] [datetime] NOT NULL
            CONSTRAINT [DF_ReservationFeedbacks_CreatedAt] DEFAULT(GETDATE()),
        CONSTRAINT [UQ_ReservationFeedbacks_ReservationID] UNIQUE ([ReservationID]),
        CONSTRAINT [FK_ReservationFeedbacks_Reservations]
            FOREIGN KEY ([ReservationID]) REFERENCES [dbo].[Reservations]([ReservationID]) ON DELETE CASCADE,
        CONSTRAINT [FK_ReservationFeedbacks_Customers]
            FOREIGN KEY ([CustomerID]) REFERENCES [dbo].[Customers]([CustomerID]),
        CONSTRAINT [CK_ReservationFeedbacks_Rating] CHECK ([Rating] BETWEEN 1 AND 5)
    );
END;
GO
