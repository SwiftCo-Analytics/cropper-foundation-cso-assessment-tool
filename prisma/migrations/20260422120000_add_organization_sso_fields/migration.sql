-- AlterTable
ALTER TABLE `Organization`
  ADD COLUMN `ssoProvider` VARCHAR(191) NULL,
  ADD COLUMN `ssoSubject` VARCHAR(191) NULL,
  ADD COLUMN `ssoLinkedAt` DATETIME(3) NULL,
  ADD COLUMN `ssoLastLoginAt` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Organization_ssoProvider_ssoSubject_key`
ON `Organization`(`ssoProvider`, `ssoSubject`);
