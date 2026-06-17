-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('INCLUDED', 'ADDON', 'NOT_AVAILABLE');

-- CreateEnum
CREATE TYPE "AddonPricingModel" AS ENUM ('FIXED_MONTHLY', 'PER_SEAT', 'PERCENT_OF_PRODUCT');

-- CreateEnum
CREATE TYPE "TermLength" AS ENUM ('MONTHLY', 'ANNUAL', 'TWO_YEAR');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tier" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "basePricePerSeat" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureTierAvailability" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "availability" "Availability" NOT NULL DEFAULT 'NOT_AVAILABLE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureTierAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddonPricing" (
    "id" TEXT NOT NULL,
    "featureTierAvailabilityId" TEXT NOT NULL,
    "pricingModel" "AddonPricingModel" NOT NULL,
    "pricingValue" DECIMAL(10,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddonPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "termLength" "TermLength" NOT NULL,
    "overallDiscountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "overallDiscountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteLineItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "QuoteLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteAddonSelection" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "seats" INTEGER,

    CONSTRAINT "QuoteAddonSelection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tier_productId_name_key" ON "Tier"("productId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_productId_name_key" ON "Feature"("productId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureTierAvailability_featureId_tierId_key" ON "FeatureTierAvailability"("featureId", "tierId");

-- CreateIndex
CREATE UNIQUE INDEX "AddonPricing_featureTierAvailabilityId_key" ON "AddonPricing"("featureTierAvailabilityId");

-- AddForeignKey
ALTER TABLE "Tier" ADD CONSTRAINT "Tier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureTierAvailability" ADD CONSTRAINT "FeatureTierAvailability_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureTierAvailability" ADD CONSTRAINT "FeatureTierAvailability_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddonPricing" ADD CONSTRAINT "AddonPricing_featureTierAvailabilityId_fkey" FOREIGN KEY ("featureTierAvailabilityId") REFERENCES "FeatureTierAvailability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLineItem" ADD CONSTRAINT "QuoteLineItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteAddonSelection" ADD CONSTRAINT "QuoteAddonSelection_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteAddonSelection" ADD CONSTRAINT "QuoteAddonSelection_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
