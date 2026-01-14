/*
  Warnings:

  - You are about to drop the `vision_boards` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vision_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "vision_boards" DROP CONSTRAINT "vision_boards_userId_fkey";

-- DropForeignKey
ALTER TABLE "vision_items" DROP CONSTRAINT "vision_items_goalId_fkey";

-- DropForeignKey
ALTER TABLE "vision_items" DROP CONSTRAINT "vision_items_visionBoardId_fkey";

-- DropTable
DROP TABLE "vision_boards";

-- DropTable
DROP TABLE "vision_items";

-- CreateTable
CREATE TABLE "VisionBoard" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'default',
    "backgroundColor" TEXT NOT NULL DEFAULT '#f8fafc',
    "background" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisionBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisionItem" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "quote" TEXT,
    "imageUrl" TEXT,
    "imageKey" TEXT,
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "height" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zIndex" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visionBoardId" TEXT NOT NULL,
    "goalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedImage" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "userId" TEXT NOT NULL,
    "visionBoardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadedImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisionBoard_userId_idx" ON "VisionBoard"("userId");

-- CreateIndex
CREATE INDEX "VisionItem_visionBoardId_idx" ON "VisionItem"("visionBoardId");

-- CreateIndex
CREATE INDEX "VisionItem_goalId_idx" ON "VisionItem"("goalId");

-- CreateIndex
CREATE INDEX "UploadedImage_userId_idx" ON "UploadedImage"("userId");

-- CreateIndex
CREATE INDEX "UploadedImage_visionBoardId_idx" ON "UploadedImage"("visionBoardId");

-- AddForeignKey
ALTER TABLE "VisionBoard" ADD CONSTRAINT "VisionBoard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisionItem" ADD CONSTRAINT "VisionItem_visionBoardId_fkey" FOREIGN KEY ("visionBoardId") REFERENCES "VisionBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisionItem" ADD CONSTRAINT "VisionItem_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedImage" ADD CONSTRAINT "UploadedImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedImage" ADD CONSTRAINT "UploadedImage_visionBoardId_fkey" FOREIGN KEY ("visionBoardId") REFERENCES "VisionBoard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
