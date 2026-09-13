-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "durationMin" INTEGER NOT NULL,
    "priceChf" DOUBLE PRECISION NOT NULL,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonCustomer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "allergies" TEXT,
    "sensitive" BOOLEAN NOT NULL DEFAULT false,
    "prefShape" TEXT,
    "prefGel" TEXT,
    "prefColors" TEXT,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalonCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "priceChf" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'bekliyor',
    "notes" TEXT,
    "staffNote" TEXT,
    "deposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depositPaid" BOOLEAN NOT NULL DEFAULT false,
    "staffId" TEXT,
    "loyaltyAwarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "serviceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'bekliyor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "customer" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "minQuantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyLog" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalonCustomer_phone_key" ON "SalonCustomer"("phone");

-- CreateIndex
CREATE INDEX "Booking_startAt_idx" ON "Booking"("startAt");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_staffId_idx" ON "Booking"("staffId");

-- CreateIndex
CREATE INDEX "Review_status_idx" ON "Review"("status");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_bookingId_idx" ON "NotificationLog"("bookingId");

-- CreateIndex
CREATE INDEX "GalleryItem_customerId_idx" ON "GalleryItem"("customerId");

-- CreateIndex
CREATE INDEX "InventoryItem_category_idx" ON "InventoryItem"("category");

-- CreateIndex
CREATE INDEX "StaffMember_active_idx" ON "StaffMember"("active");

-- CreateIndex
CREATE INDEX "LoyaltyLog_customerId_idx" ON "LoyaltyLog"("customerId");

-- CreateIndex
CREATE INDEX "LoyaltyLog_createdAt_idx" ON "LoyaltyLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "SalonCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryItem" ADD CONSTRAINT "GalleryItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "SalonCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyLog" ADD CONSTRAINT "LoyaltyLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "SalonCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

