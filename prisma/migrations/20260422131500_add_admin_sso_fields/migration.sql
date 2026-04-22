-- AlterTable
ALTER TABLE `Admin`
  ADD COLUMN `ssoProvider` VARCHAR(191) NULL,
  ADD COLUMN `ssoSubject` VARCHAR(191) NULL,
  ADD COLUMN `ssoLinkedAt` DATETIME(3) NULL,
  ADD COLUMN `ssoLastLoginAt` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Admin_ssoProvider_ssoSubject_key`
ON `Admin`(`ssoProvider`, `ssoSubject`);
