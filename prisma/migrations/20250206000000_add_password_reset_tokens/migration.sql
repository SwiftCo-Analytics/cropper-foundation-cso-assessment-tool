-- AlterTable
ALTER TABLE `Organization` ADD COLUMN `passwordResetToken` VARCHAR(191) NULL,
    ADD COLUMN `passwordResetExpiry` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Admin` ADD COLUMN `passwordResetToken` VARCHAR(191) NULL,
    ADD COLUMN `passwordResetExpiry` DATETIME(3) NULL;
