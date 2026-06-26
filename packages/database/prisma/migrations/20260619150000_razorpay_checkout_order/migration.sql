-- CreateTable
CREATE TABLE "razorpay_checkout_order" (
    "id" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "razorpay_checkout_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "razorpay_checkout_order_razorpayOrderId_key" ON "razorpay_checkout_order"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "razorpay_checkout_order_workspaceId_idx" ON "razorpay_checkout_order"("workspaceId");

-- AddForeignKey
ALTER TABLE "razorpay_checkout_order" ADD CONSTRAINT "razorpay_checkout_order_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
