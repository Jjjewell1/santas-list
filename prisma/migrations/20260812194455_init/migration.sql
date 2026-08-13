-- CreateTable
CREATE TABLE "Year" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" INTEGER NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "lockDaysBefore" INTEGER,
    "familyShareToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Kid" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "yearId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT '🎄',
    "color" TEXT NOT NULL DEFAULT '#0f766e',
    "pinHash" TEXT,
    "shareToken" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "bigBudget" INTEGER,
    "smallBudget" INTEGER,
    "wildcardEnabled" BOOLEAN NOT NULL DEFAULT true,
    "softCeilingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "softCeilingPct" INTEGER NOT NULL DEFAULT 60,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Kid_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "Year" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GiftItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kidId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "price" INTEGER,
    "productUrl" TEXT,
    "category" TEXT NOT NULL,
    "claimedBy" TEXT,
    "surpriseFlag" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GiftItem_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "Kid" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tradition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "yearId" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photoUrl" TEXT,
    CONSTRAINT "Tradition_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "Year" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Year_year_key" ON "Year"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Year_familyShareToken_key" ON "Year"("familyShareToken");

-- CreateIndex
CREATE INDEX "Year_isCurrent_idx" ON "Year"("isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "Kid_shareToken_key" ON "Kid"("shareToken");

-- CreateIndex
CREATE INDEX "Kid_yearId_idx" ON "Kid"("yearId");

-- CreateIndex
CREATE INDEX "GiftItem_kidId_category_idx" ON "GiftItem"("kidId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Tradition_yearId_day_key" ON "Tradition"("yearId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
