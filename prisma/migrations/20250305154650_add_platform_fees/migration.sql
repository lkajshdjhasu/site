-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publicKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blink" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isCustomInput" BOOLEAN NOT NULL DEFAULT false,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0.001,
    "platformFeeType" TEXT NOT NULL DEFAULT 'fixed',
    "userId" TEXT NOT NULL,

    CONSTRAINT "Blink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amount" (
    "id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "blinkId" TEXT NOT NULL,

    CONSTRAINT "Amount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_publicKey_key" ON "User"("publicKey");

-- AddForeignKey
ALTER TABLE "Blink" ADD CONSTRAINT "Blink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amount" ADD CONSTRAINT "Amount_blinkId_fkey" FOREIGN KEY ("blinkId") REFERENCES "Blink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
