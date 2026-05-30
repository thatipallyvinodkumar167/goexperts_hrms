/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: Attendance
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Attendance` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` datetime(3) NOT NULL,
  `checkIn` datetime(3) DEFAULT NULL,
  `checkOut` datetime(3) DEFAULT NULL,
  `status` enum(
  'PRESENT',
  'ABSENT',
  'HALF_DAY',
  'WEEK_OFF',
  'HOLIDAY',
  'LEAVE'
  ) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Attendance_employeeId_fkey` (`employeeId`),
  CONSTRAINT `Attendance_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: AuditLog
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `AuditLog` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `metadata` json DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `AuditLog_userId_fkey` (`userId`),
  CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: Company
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Company` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ownerName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ownerEmail` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `legalName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `domain` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `companyLogo` longtext COLLATE utf8mb4_unicode_ci,
  `industryTypeId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `companySize` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foundedYear` int DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `status` enum(
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'INVITED',
  'PENDING_APPROVAL'
  ) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INVITED',
  `isEmailVerified` tinyint(1) NOT NULL DEFAULT '0',
  `isProfileCompleted` tinyint(1) NOT NULL DEFAULT '0',
  `invitedAt` datetime(3) DEFAULT NULL,
  `activatedAt` datetime(3) DEFAULT NULL,
  `lastActiveAt` datetime(3) DEFAULT NULL,
  `inactiveAt` datetime(3) DEFAULT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdById` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `cinNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linkedinUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signature` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `termsAndConditions` longtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Company_email_key` (`email`),
  UNIQUE KEY `Company_domain_key` (`domain`),
  UNIQUE KEY `Company_name_key` (`name`),
  KEY `Company_status_idx` (`status`),
  KEY `Company_lastActiveAt_idx` (`lastActiveAt`),
  KEY `Company_industryTypeId_fkey` (`industryTypeId`),
  KEY `Company_createdById_fkey` (`createdById`),
  CONSTRAINT `Company_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Company_industryTypeId_fkey` FOREIGN KEY (`industryTypeId`) REFERENCES `IndustryType` (`id`) ON DELETE
  SET
  NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: CompanyAddress
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `CompanyAddress` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `addressLine1` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `addressLine2` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pincode` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `landmark` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `CompanyAddress_companyId_key` (`companyId`),
  CONSTRAINT `CompanyAddress_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: CompanyCompliance
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `CompanyCompliance` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gstNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `panNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cinNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `msmeNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pfEnabled` tinyint(1) NOT NULL DEFAULT '0',
  `pfPercentage` double DEFAULT NULL,
  `esiEnabled` tinyint(1) NOT NULL DEFAULT '0',
  `insuranceProvider` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `esiRegistrationNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pfRegistrationNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ptRegistrationNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `CompanyCompliance_companyId_key` (`companyId`),
  CONSTRAINT `CompanyCompliance_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: CompanyDirector
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `CompanyDirector` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fullName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `designation` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `aadhaarNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `panNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bankName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accountNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ifscCode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isPrimary` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `CompanyDirector_companyId_fkey` (`companyId`),
  CONSTRAINT `CompanyDirector_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: CompanyDocument
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `CompanyDocument` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` enum(
  'GST_CERTIFICATE',
  'PAN_CARD',
  'TAN_CERTIFICATE',
  'INCORPORATION_CERTIFICATE',
  'ADDRESS_PROOF',
  'BANK_PROOF',
  'PF_REGISTRATION',
  'ESI_REGISTRATION',
  'MSME_CERTIFICATE',
  'SHOP_LICENSE',
  'COMPANY_LOGO'
  ) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileUrl` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING', 'APPROVED', 'REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `remarks` longtext COLLATE utf8mb4_unicode_ci,
  `uploadedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `verifiedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `CompanyDocument_companyId_fkey` (`companyId`),
  CONSTRAINT `CompanyDocument_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: CompanyHRSetting
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `CompanyHRSetting` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workingHours` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `workingDays` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `probationPeriod` int DEFAULT NULL,
  `noticePeriod` int DEFAULT NULL,
  `companyPolicy` longtext COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `leaveCycle` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shiftType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `workModel` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employeeTerms` longtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `CompanyHRSetting_companyId_key` (`companyId`),
  CONSTRAINT `CompanyHRSetting_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: CompanyInvite
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `CompanyInvite` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `acceptedAt` datetime(3) DEFAULT NULL,
  `reminderSent` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `CompanyInvite_token_key` (`token`),
  KEY `CompanyInvite_companyId_fkey` (`companyId`),
  KEY `CompanyInvite_userId_fkey` (`userId`),
  CONSTRAINT `CompanyInvite_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `CompanyInvite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE
  SET
  NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: CompanyNotification
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `CompanyNotification` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notificationId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `readAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `CompanyNotification_notificationId_companyId_key` (`notificationId`, `companyId`),
  KEY `CompanyNotification_companyId_fkey` (`companyId`),
  CONSTRAINT `CompanyNotification_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `CompanyNotification_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `Notification` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: CompanyPayrollSetting
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `CompanyPayrollSetting` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currency` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salaryCycle` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payrollStartDay` int DEFAULT NULL,
  `payrollEndDay` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `CompanyPayrollSetting_companyId_key` (`companyId`),
  CONSTRAINT `CompanyPayrollSetting_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: CompanySystemSetting
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `CompanySystemSetting` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `timezone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dateFormat` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `language` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `CompanySystemSetting_companyId_key` (`companyId`),
  CONSTRAINT `CompanySystemSetting_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: CorrectionRequest
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `CorrectionRequest` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requestedBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fields` json NOT NULL,
  `attachments` json DEFAULT NULL,
  `status` enum('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `hrNote` longtext COLLATE utf8mb4_unicode_ci,
  `approvedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `CorrectionRequest_employeeId_status_idx` (`employeeId`, `status`),
  KEY `CorrectionRequest_approvedBy_fkey` (`approvedBy`),
  CONSTRAINT `CorrectionRequest_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `Employee` (`id`) ON DELETE
  SET
  NULL ON UPDATE CASCADE,
  CONSTRAINT `CorrectionRequest_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: Department
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Department` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Department_companyId_fkey` (`companyId`),
  CONSTRAINT `Department_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: DepartmentTemplate
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `DepartmentTemplate` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `industryTypeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `DepartmentTemplate_industryTypeId_fkey` (`industryTypeId`),
  CONSTRAINT `DepartmentTemplate_industryTypeId_fkey` FOREIGN KEY (`industryTypeId`) REFERENCES `IndustryType` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: Designation
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Designation` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `level` int NOT NULL,
  `companyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Designation_companyId_fkey` (`companyId`),
  CONSTRAINT `Designation_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: DesignationTemplate
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `DesignationTemplate` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `level` int NOT NULL DEFAULT '1',
  `industryTypeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `departmentId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `DesignationTemplate_industryTypeId_fkey` (`industryTypeId`),
  KEY `DesignationTemplate_departmentId_fkey` (`departmentId`),
  CONSTRAINT `DesignationTemplate_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `DepartmentTemplate` (`id`) ON DELETE
  SET
  NULL ON UPDATE CASCADE,
  CONSTRAINT `DesignationTemplate_industryTypeId_fkey` FOREIGN KEY (`industryTypeId`) REFERENCES `IndustryType` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: Employee
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Employee` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeCode` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `firstName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `middleName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profilePhoto` longtext COLLATE utf8mb4_unicode_ci,
  `onboardingStep` int NOT NULL DEFAULT '1',
  `onboardingCompleted` tinyint(1) NOT NULL DEFAULT '0',
  `probationPeriod` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT '6 Months',
  `noticePeriod` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT '90 Days',
  `departmentId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `designationId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `joiningDate` datetime(3) NOT NULL,
  `employmentType` enum(
  'FRESHER',
  'EXPERIENCED',
  'INTERN',
  'CONTRACT',
  'PART_TIME',
  'FULL_TIME'
  ) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workLocation` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `managerId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum(
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'INVITED',
  'PENDING_APPROVAL'
  ) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INVITED',
  `bgvStatus` enum('PENDING', 'APPROVED', 'REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `bgvRemarks` longtext COLLATE utf8mb4_unicode_ci,
  `deletedAt` datetime(3) DEFAULT NULL,
  `isDeclaredTrue` tinyint(1) NOT NULL DEFAULT '0',
  `signature` longtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Employee_userId_key` (`userId`),
  UNIQUE KEY `Employee_employeeCode_key` (`employeeCode`),
  KEY `Employee_companyId_fkey` (`companyId`),
  KEY `Employee_departmentId_fkey` (`departmentId`),
  KEY `Employee_designationId_fkey` (`designationId`),
  KEY `Employee_managerId_fkey` (`managerId`),
  CONSTRAINT `Employee_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Employee_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Employee_designationId_fkey` FOREIGN KEY (`designationId`) REFERENCES `Designation` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Employee_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `Employee` (`id`) ON DELETE
  SET
  NULL ON UPDATE CASCADE,
  CONSTRAINT `Employee_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: EmployeeBank
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `EmployeeBank` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bankName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accountHolderName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accountNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ifscCode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branchName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `upiId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `EmployeeBank_employeeId_key` (`employeeId`),
  CONSTRAINT `EmployeeBank_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: EmployeeCompliance
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `EmployeeCompliance` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pfNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `esiNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uanNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `insuranceId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `insuranceProvider` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `policyNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coverageAmount` double DEFAULT NULL,
  `policyStartDate` datetime(3) DEFAULT NULL,
  `policyEndDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `EmployeeCompliance_employeeId_key` (`employeeId`),
  CONSTRAINT `EmployeeCompliance_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: EmployeeDocument
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `EmployeeDocument` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileUrl` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING', 'APPROVED', 'REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `remarks` longtext COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `EmployeeDocument_employeeId_fkey` (`employeeId`),
  CONSTRAINT `EmployeeDocument_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: EmployeeEducation
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `EmployeeEducation` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `degree` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `specialization` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `college` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `university` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `percentage` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cgpa` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `startYear` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `endYear` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `EmployeeEducation_employeeId_fkey` (`employeeId`),
  CONSTRAINT `EmployeeEducation_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: EmployeeEmergencyContact
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `EmployeeEmergencyContact` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contactPersonName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `relationship` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contactNumber` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alternateContact` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `EmployeeEmergencyContact_employeeId_fkey` (`employeeId`),
  CONSTRAINT `EmployeeEmergencyContact_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: EmployeeExperience
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `EmployeeExperience` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `startDate` datetime(3) NOT NULL,
  `endDate` datetime(3) DEFAULT NULL,
  `technologies` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `responsibilities` longtext COLLATE utf8mb4_unicode_ci,
  `totalYears` double DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `EmployeeExperience_employeeId_fkey` (`employeeId`),
  CONSTRAINT `EmployeeExperience_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: EmployeeInvite
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `EmployeeInvite` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('SUPER_ADMIN', 'OWNER', 'HR', 'EMPLOYEE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `departmentId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `designationId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `acceptedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `EmployeeInvite_token_key` (`token`),
  KEY `EmployeeInvite_companyId_fkey` (`companyId`),
  KEY `EmployeeInvite_userId_fkey` (`userId`),
  CONSTRAINT `EmployeeInvite_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `EmployeeInvite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE
  SET
  NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: EmployeeNominee
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `EmployeeNominee` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nomineeName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `relationship` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dob` datetime(3) DEFAULT NULL,
  `gender` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `aadhaarNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `panNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nomineePercentage` double DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `EmployeeNominee_employeeId_key` (`employeeId`),
  CONSTRAINT `EmployeeNominee_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: EmployeePersonal
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `EmployeePersonal` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `personalEmail` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alternatePhone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `addressLine1` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `addressLine2` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dob` datetime(3) DEFAULT NULL,
  `maritalStatus` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bloodGroup` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nationality` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `EmployeePersonal_employeeId_key` (`employeeId`),
  CONSTRAINT `EmployeePersonal_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: EmployeeSkill
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `EmployeeSkill` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `certifications` json DEFAULT NULL,
  `githubUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `languagesKnown` json DEFAULT NULL,
  `linkedinUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `portfolioUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primarySkills` json DEFAULT NULL,
  `secondarySkills` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `EmployeeSkill_employeeId_key` (`employeeId`),
  CONSTRAINT `EmployeeSkill_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: GlobalLeaveType
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `GlobalLeaveType` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `maxDays` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `GlobalLeaveType_name_key` (`name`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: HR
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `HR` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permissions` json NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `HR_userId_key` (`userId`),
  CONSTRAINT `HR_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: IndustryType
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `IndustryType` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IndustryType_name_key` (`name`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: JoiningLetter
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `JoiningLetter` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `joiningDate` datetime(3) NOT NULL,
  `documentUrl` longtext COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `JoiningLetter_employeeId_key` (`employeeId`),
  CONSTRAINT `JoiningLetter_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: Leave
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Leave` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `leaveTypeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fromDate` datetime(3) NOT NULL,
  `toDate` datetime(3) NOT NULL,
  `reason` longtext COLLATE utf8mb4_unicode_ci,
  `status` enum('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Leave_employeeId_fkey` (`employeeId`),
  KEY `Leave_leaveTypeId_fkey` (`leaveTypeId`),
  CONSTRAINT `Leave_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Leave_leaveTypeId_fkey` FOREIGN KEY (`leaveTypeId`) REFERENCES `LeaveType` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: LeaveType
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `LeaveType` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `maxDays` int NOT NULL,
  `companyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `LeaveType_companyId_fkey` (`companyId`),
  CONSTRAINT `LeaveType_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: Notification
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Notification` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum(
  'INFO',
  'WARNING',
  'SUCCESS',
  'ERROR',
  'MAINTENANCE',
  'COMPLIANCE',
  'FEATURE'
  ) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INFO',
  `sentById` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isGlobal` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Notification_sentById_fkey` (`sentById`),
  CONSTRAINT `Notification_sentById_fkey` FOREIGN KEY (`sentById`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: NotificationIndustry
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `NotificationIndustry` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notificationId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `industryTypeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `NotificationIndustry_notificationId_industryTypeId_key` (`notificationId`, `industryTypeId`),
  KEY `NotificationIndustry_industryTypeId_fkey` (`industryTypeId`),
  CONSTRAINT `NotificationIndustry_industryTypeId_fkey` FOREIGN KEY (`industryTypeId`) REFERENCES `IndustryType` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `NotificationIndustry_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `Notification` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: OfferLetter
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `OfferLetter` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employeeEmail` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('SUPER_ADMIN', 'OWNER', 'HR', 'EMPLOYEE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EMPLOYEE',
  `position` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `departmentId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `designationId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctc` double NOT NULL,
  `monthlyGross` double DEFAULT NULL,
  `variablePay` double DEFAULT NULL,
  `joiningBonus` double DEFAULT NULL,
  `annualBonus` double DEFAULT NULL,
  `joiningDate` datetime(3) NOT NULL,
  `status` enum('SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SENT',
  `documentUrl` longtext COLLATE utf8mb4_unicode_ci,
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `OfferLetter_employeeId_key` (`employeeId`),
  KEY `OfferLetter_companyId_fkey` (`companyId`),
  CONSTRAINT `OfferLetter_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `OfferLetter_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE
  SET
  NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: PasswordResetToken
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `PasswordResetToken` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `PasswordResetToken_userId_fkey` (`userId`),
  CONSTRAINT `PasswordResetToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: Payroll
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Payroll` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grossSalary` double NOT NULL,
  `deductions` double NOT NULL,
  `pfAmount` double NOT NULL,
  `esiAmount` double NOT NULL,
  `tdsAmount` double NOT NULL,
  `professionalTax` double NOT NULL,
  `bonus` double NOT NULL,
  `lopDays` double DEFAULT NULL,
  `netSalary` double NOT NULL,
  `payslipUrl` longtext COLLATE utf8mb4_unicode_ci,
  `status` enum('PENDING', 'PROCESSED', 'PAID', 'FAILED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `month` int NOT NULL,
  `year` int NOT NULL,
  `generatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Payroll_employeeId_fkey` (`employeeId`),
  CONSTRAINT `Payroll_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: SalaryStructure
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `SalaryStructure` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `basic` double NOT NULL,
  `hra` double NOT NULL,
  `allowances` double NOT NULL,
  `bonus` double NOT NULL DEFAULT '0',
  `pfEmployee` double NOT NULL DEFAULT '0',
  `esiEmployee` double NOT NULL DEFAULT '0',
  `pfEmployer` double NOT NULL DEFAULT '0',
  `esiEmployer` double NOT NULL DEFAULT '0',
  `deductions` double NOT NULL DEFAULT '0',
  `netSalary` double NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `SalaryStructure_employeeId_key` (`employeeId`),
  CONSTRAINT `SalaryStructure_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: SalaryTemplate
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `SalaryTemplate` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `basicPercentage` double NOT NULL DEFAULT '50',
  `hraPercentageOfBasic` double NOT NULL DEFAULT '40',
  `pfPercentage` double NOT NULL DEFAULT '12',
  `esiPercentage` double NOT NULL DEFAULT '0.75',
  `employerPfPercentage` double NOT NULL DEFAULT '12',
  `employerEsiPercentage` double NOT NULL DEFAULT '3.25',
  `industryTypeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SalaryTemplate_industryTypeId_key` (`industryTypeId`),
  CONSTRAINT `SalaryTemplate_industryTypeId_fkey` FOREIGN KEY (`industryTypeId`) REFERENCES `IndustryType` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: Subscription
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Subscription` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `planId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `startDate` datetime(3) NOT NULL,
  `endDate` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Subscription_companyId_fkey` (`companyId`),
  KEY `Subscription_planId_fkey` (`planId`),
  CONSTRAINT `Subscription_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Subscription_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `SubscriptionPlan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: SubscriptionPlan
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `SubscriptionPlan` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` double NOT NULL,
  `duration` int NOT NULL,
  `features` json NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `SubscriptionPlan_name_key` (`name`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: SystemPolicy
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `SystemPolicy` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum(
  'TERMS_AND_CONDITIONS',
  'PRIVACY_POLICY',
  'REFUND_POLICY',
  'COOKIE_POLICY'
  ) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1.0.0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SystemPolicy_type_key` (`type`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: User
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `User` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('SUPER_ADMIN', 'OWNER', 'HR', 'EMPLOYEE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum(
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'INVITED',
  'PENDING_APPROVAL'
  ) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INVITED',
  `profileLogo` longtext COLLATE utf8mb4_unicode_ci,
  `companyId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isEmailVerified` tinyint(1) NOT NULL DEFAULT '0',
  `lastLoginAt` datetime(3) DEFAULT NULL,
  `failedLoginAttempts` int NOT NULL DEFAULT '0',
  `lockUntil` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_companyId_key` (`email`, `companyId`),
  KEY `User_companyId_fkey` (`companyId`),
  CONSTRAINT `User_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`) ON DELETE
  SET
  NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: Attendance
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: AuditLog
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: Company
# ------------------------------------------------------------

INSERT INTO
  `Company` (
    `id`,
    `name`,
    `email`,
    `ownerName`,
    `ownerEmail`,
    `legalName`,
    `phone`,
    `website`,
    `domain`,
    `companyLogo`,
    `industryTypeId`,
    `companySize`,
    `foundedYear`,
    `latitude`,
    `longitude`,
    `status`,
    `isEmailVerified`,
    `isProfileCompleted`,
    `invitedAt`,
    `activatedAt`,
    `lastActiveAt`,
    `inactiveAt`,
    `deletedAt`,
    `createdById`,
    `createdAt`,
    `updatedAt`,
    `cinNumber`,
    `linkedinUrl`,
    `signature`,
    `termsAndConditions`
  )
VALUES
  (
    '2e765207-a289-40f3-b2e8-a86aea5073f7',
    'thatipallyvinodkumar167 Pvt Ltd',
    'thatipallyvinodkumar167@gmail.com',
    'Rahul Sharma',
    'owner@acme.com',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'INVITED',
    0,
    0,
    '2026-05-18 13:10:58.955',
    NULL,
    NULL,
    NULL,
    NULL,
    'f636b711-046d-4e9d-8572-8ae48a0496ac',
    '2026-05-18 13:10:58.956',
    '2026-05-18 13:10:58.956',
    NULL,
    NULL,
    NULL,
    NULL
  );
INSERT INTO
  `Company` (
    `id`,
    `name`,
    `email`,
    `ownerName`,
    `ownerEmail`,
    `legalName`,
    `phone`,
    `website`,
    `domain`,
    `companyLogo`,
    `industryTypeId`,
    `companySize`,
    `foundedYear`,
    `latitude`,
    `longitude`,
    `status`,
    `isEmailVerified`,
    `isProfileCompleted`,
    `invitedAt`,
    `activatedAt`,
    `lastActiveAt`,
    `inactiveAt`,
    `deletedAt`,
    `createdById`,
    `createdAt`,
    `updatedAt`,
    `cinNumber`,
    `linkedinUrl`,
    `signature`,
    `termsAndConditions`
  )
VALUES
  (
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'thatipallyvinodkumar1 Pvt Ltd',
    'thatipallyvinodkumar1@gmail.com',
    ' thatipallyvinodkumar1',
    'vinod@acme.com',
    'thatipallyvinodkumar1 Pvt Ltd',
    '+91-9876543210',
    'https://vinod.com',
    '\tvinod.com',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779345754/hrms/company_docs/logo_1779345753422.jpg',
    'd0e987fe-f71e-4822-84c2-ad34cc0f69ad',
    '51-200',
    2020,
    17.4301329,
    78.4511079,
    'ACTIVE',
    1,
    1,
    '2026-05-13 04:36:49.601',
    '2026-05-22 05:17:07.092',
    '2026-05-22 05:17:07.092',
    NULL,
    NULL,
    'f636b711-046d-4e9d-8572-8ae48a0496ac',
    '2026-05-13 04:36:49.602',
    '2026-05-23 05:46:49.090',
    'U72200KA2020PTC123456',
    NULL,
    '\"thatipally Vinod kumar\"',
    'SaaS Platform Agreement... to GOEXPERTS'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: CompanyAddress
# ------------------------------------------------------------

INSERT INTO
  `CompanyAddress` (
    `id`,
    `companyId`,
    `addressLine1`,
    `addressLine2`,
    `city`,
    `state`,
    `country`,
    `pincode`,
    `landmark`,
    `createdAt`
  )
VALUES
  (
    '7382b6c6-8e71-4747-928c-e19174071d65',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'MG Road',
    'Near Metro',
    'Bengaluru',
    'Karnataka',
    'India',
    '560001',
    NULL,
    '2026-05-13 06:01:39.930'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: CompanyCompliance
# ------------------------------------------------------------

INSERT INTO
  `CompanyCompliance` (
    `id`,
    `companyId`,
    `gstNumber`,
    `panNumber`,
    `tanNumber`,
    `cinNumber`,
    `msmeNumber`,
    `pfEnabled`,
    `pfPercentage`,
    `esiEnabled`,
    `insuranceProvider`,
    `createdAt`,
    `esiRegistrationNumber`,
    `pfRegistrationNumber`,
    `ptRegistrationNumber`
  )
VALUES
  (
    '396e4c1d-ce5f-4807-a287-6b06eeff2373',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '29ABCDE1234F1Z5',
    'ABCDE1234F',
    'BLRA12345B',
    'U72200KA2020PTC123456',
    NULL,
    1,
    12,
    1,
    NULL,
    '2026-05-13 06:01:39.930',
    NULL,
    '\tKN/BN/1234567/000',
    NULL
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: CompanyDirector
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: CompanyDocument
# ------------------------------------------------------------

INSERT INTO
  `CompanyDocument` (
    `id`,
    `companyId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `uploadedAt`,
    `verifiedAt`
  )
VALUES
  (
    '0b08d089-5ee7-4ba1-8528-3f40a8780e03',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'PAN_CARD',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779110637/hrms/company_docs/panProof_1779110636014.jpg',
    'PENDING',
    NULL,
    '2026-05-18 13:24:03.399',
    NULL
  );
INSERT INTO
  `CompanyDocument` (
    `id`,
    `companyId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `uploadedAt`,
    `verifiedAt`
  )
VALUES
  (
    '146d450f-f4de-46df-a94a-ef80104db81b',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'GST_CERTIFICATE',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779345754/hrms/company_docs/gstProof_1779345753580.jpg',
    'PENDING',
    NULL,
    '2026-05-21 06:42:41.681',
    NULL
  );
INSERT INTO
  `CompanyDocument` (
    `id`,
    `companyId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `uploadedAt`,
    `verifiedAt`
  )
VALUES
  (
    '2954f16d-78de-4feb-94af-eebab4ca40f9',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'GST_CERTIFICATE',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1778917503/hrms/company_docs/gstProof_1778917502213.jpg',
    'PENDING',
    NULL,
    '2026-05-16 07:45:09.762',
    NULL
  );
INSERT INTO
  `CompanyDocument` (
    `id`,
    `companyId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `uploadedAt`,
    `verifiedAt`
  )
VALUES
  (
    '41291471-e4a4-40e9-9df5-a205f2a7ef42',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'INCORPORATION_CERTIFICATE',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1778917503/hrms/company_docs/regCertificate_1778917502213.jpg',
    'PENDING',
    NULL,
    '2026-05-16 07:45:09.762',
    NULL
  );
INSERT INTO
  `CompanyDocument` (
    `id`,
    `companyId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `uploadedAt`,
    `verifiedAt`
  )
VALUES
  (
    '4b7ed1fb-6eff-4659-95b6-b470dcf20a59',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'PAN_CARD',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779165431/hrms/company_docs/panProof_1779165430482.jpg',
    'PENDING',
    NULL,
    '2026-05-19 04:37:18.409',
    NULL
  );
INSERT INTO
  `CompanyDocument` (
    `id`,
    `companyId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `uploadedAt`,
    `verifiedAt`
  )
VALUES
  (
    '628b331c-bf19-4882-9818-4562757a6161',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'GST_CERTIFICATE',
    'https://res.cloudinary.com/demo/image/upload/gst_proof.pdf',
    'PENDING',
    NULL,
    '2026-05-13 06:01:46.739',
    NULL
  );
INSERT INTO
  `CompanyDocument` (
    `id`,
    `companyId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `uploadedAt`,
    `verifiedAt`
  )
VALUES
  (
    '6661443f-3090-4acd-8949-2830c0f204d3',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'GST_CERTIFICATE',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779165431/hrms/company_docs/gstProof_1779165430481.jpg',
    'PENDING',
    NULL,
    '2026-05-19 04:37:18.409',
    NULL
  );
INSERT INTO
  `CompanyDocument` (
    `id`,
    `companyId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `uploadedAt`,
    `verifiedAt`
  )
VALUES
  (
    '7e110aba-6412-428c-bee6-59b55a74d5ab',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'INCORPORATION_CERTIFICATE',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779345754/hrms/company_docs/regCertificate_1779345753580.jpg',
    'PENDING',
    NULL,
    '2026-05-21 06:42:41.681',
    NULL
  );
INSERT INTO
  `CompanyDocument` (
    `id`,
    `companyId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `uploadedAt`,
    `verifiedAt`
  )
VALUES
  (
    'b54c1dd1-4fa2-4b49-b040-a4ccdb6b5f23',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'INCORPORATION_CERTIFICATE',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779165431/hrms/company_docs/regCertificate_1779165430481.jpg',
    'PENDING',
    NULL,
    '2026-05-19 04:37:18.409',
    NULL
  );
INSERT INTO
  `CompanyDocument` (
    `id`,
    `companyId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `uploadedAt`,
    `verifiedAt`
  )
VALUES
  (
    'b7f2fe8f-5323-44eb-900b-23c75aa7c8d9',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'PAN_CARD',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779345754/hrms/company_docs/panProof_1779345753580.jpg',
    'PENDING',
    NULL,
    '2026-05-21 06:42:41.681',
    NULL
  );
INSERT INTO
  `CompanyDocument` (
    `id`,
    `companyId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `uploadedAt`,
    `verifiedAt`
  )
VALUES
  (
    'c2353947-32df-4c1b-b2d5-b366172bef37',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'PAN_CARD',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1778917503/hrms/company_docs/panProof_1778917502213.jpg',
    'PENDING',
    NULL,
    '2026-05-16 07:45:09.762',
    NULL
  );
INSERT INTO
  `CompanyDocument` (
    `id`,
    `companyId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `uploadedAt`,
    `verifiedAt`
  )
VALUES
  (
    'cd0ac622-07e4-4dcc-a04a-612305971cfb',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'INCORPORATION_CERTIFICATE',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779110637/hrms/company_docs/regCertificate_1779110636014.jpg',
    'PENDING',
    NULL,
    '2026-05-18 13:24:03.399',
    NULL
  );
INSERT INTO
  `CompanyDocument` (
    `id`,
    `companyId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `uploadedAt`,
    `verifiedAt`
  )
VALUES
  (
    'f129d148-ddbc-4d94-bb54-de8af973e287',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'GST_CERTIFICATE',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779110637/hrms/company_docs/gstProof_1779110636014.jpg',
    'PENDING',
    NULL,
    '2026-05-18 13:24:03.399',
    NULL
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: CompanyHRSetting
# ------------------------------------------------------------

INSERT INTO
  `CompanyHRSetting` (
    `id`,
    `companyId`,
    `workingHours`,
    `workingDays`,
    `probationPeriod`,
    `noticePeriod`,
    `companyPolicy`,
    `createdAt`,
    `leaveCycle`,
    `shiftType`,
    `workModel`,
    `employeeTerms`
  )
VALUES
  (
    '36993132-e7c6-4521-80b1-38020914c2d9',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '9:00 AM - 6:00 PM',
    'Monday - Friday',
    6,
    90,
    '\"Holiday & Leave Policy...\"',
    '2026-05-13 06:01:39.930',
    'Jan-Dec',
    NULL,
    'Hybrid',
    '\"Employment Agreement Text...\"'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: CompanyInvite
# ------------------------------------------------------------

INSERT INTO
  `CompanyInvite` (
    `id`,
    `email`,
    `token`,
    `companyId`,
    `userId`,
    `expiresAt`,
    `acceptedAt`,
    `reminderSent`,
    `createdAt`
  )
VALUES
  (
    '3f271de6-ac9b-4f08-b16c-d8180039826e',
    'owner@acme.com',
    '781fb734ad6ed63cb2e4c8e1b38b3811b0396b6a6ae951b13c2c135bed60e5d1',
    '2e765207-a289-40f3-b2e8-a86aea5073f7',
    NULL,
    '2026-05-19 13:11:00.480',
    NULL,
    1,
    '2026-05-18 13:11:00.481'
  );
INSERT INTO
  `CompanyInvite` (
    `id`,
    `email`,
    `token`,
    `companyId`,
    `userId`,
    `expiresAt`,
    `acceptedAt`,
    `reminderSent`,
    `createdAt`
  )
VALUES
  (
    '8786e346-4608-47cb-afc2-21bbde8b2770',
    'vinod@acme.com',
    '689aa35747b65f566e6ab0618ab45c61b806dd774f78fbc4585b6db239c787c2',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    NULL,
    '2026-05-14 04:36:51.394',
    '2026-05-13 04:37:21.596',
    0,
    '2026-05-13 04:36:51.395'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: CompanyNotification
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: CompanyPayrollSetting
# ------------------------------------------------------------

INSERT INTO
  `CompanyPayrollSetting` (
    `id`,
    `companyId`,
    `currency`,
    `salaryCycle`,
    `payrollStartDay`,
    `payrollEndDay`,
    `createdAt`
  )
VALUES
  (
    '3ef0f82f-189a-4552-bdf1-789342d5a4ad',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'INR',
    'Monthly',
    1,
    31,
    '2026-05-13 06:01:39.930'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: CompanySystemSetting
# ------------------------------------------------------------

INSERT INTO
  `CompanySystemSetting` (
    `id`,
    `companyId`,
    `timezone`,
    `dateFormat`,
    `language`,
    `createdAt`
  )
VALUES
  (
    'bedfe838-6c4e-4638-ac24-a724ede80295',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'Asia/Kolkata',
    'DD-MM-YYYY',
    'English (India)',
    '2026-05-13 06:01:39.930'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: CorrectionRequest
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: Department
# ------------------------------------------------------------

INSERT INTO
  `Department` (`id`, `name`, `companyId`, `createdAt`)
VALUES
  (
    '26d43f81-c76b-4012-ac3b-79356078c56c',
    'Software Development',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-13 06:18:38.777'
  );
INSERT INTO
  `Department` (`id`, `name`, `companyId`, `createdAt`)
VALUES
  (
    '98be2180-3691-48f1-90fc-2017b8542f3d',
    'HR',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-13 06:18:38.777'
  );
INSERT INTO
  `Department` (`id`, `name`, `companyId`, `createdAt`)
VALUES
  (
    'b346d3c8-6edf-4a2b-a212-b81b91726429',
    'Product',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-13 06:18:38.777'
  );
INSERT INTO
  `Department` (`id`, `name`, `companyId`, `createdAt`)
VALUES
  (
    'c0d0863d-277a-4343-8b29-7a7be8767dc5',
    'QA',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-13 06:18:38.777'
  );
INSERT INTO
  `Department` (`id`, `name`, `companyId`, `createdAt`)
VALUES
  (
    'd1e29052-61c9-4d96-abca-27c26f831451',
    'Finance',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-13 06:18:38.777'
  );
INSERT INTO
  `Department` (`id`, `name`, `companyId`, `createdAt`)
VALUES
  (
    'd9a3a82b-2940-46bb-86bc-45d4330ce83a',
    'DevOps',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-13 06:18:38.777'
  );
INSERT INTO
  `Department` (`id`, `name`, `companyId`, `createdAt`)
VALUES
  (
    'da3843a7-5202-4e5b-9872-f703a6b7ad13',
    'Design',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-13 06:18:38.777'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: DepartmentTemplate
# ------------------------------------------------------------

INSERT INTO
  `DepartmentTemplate` (`id`, `name`, `industryTypeId`, `createdAt`)
VALUES
  (
    '18bf6586-9b75-4409-a966-54ef1273736c',
    'Machine Learning',
    '68966bd2-c2f1-4d23-b21d-9dbb4f33a93e',
    '2026-05-13 09:57:21.717'
  );
INSERT INTO
  `DepartmentTemplate` (`id`, `name`, `industryTypeId`, `createdAt`)
VALUES
  (
    '47c98e6e-1b68-4264-bb83-962aba758c82',
    'Software Development',
    'd0e987fe-f71e-4822-84c2-ad34cc0f69ad',
    '2026-05-13 07:28:56.826'
  );
INSERT INTO
  `DepartmentTemplate` (`id`, `name`, `industryTypeId`, `createdAt`)
VALUES
  (
    '8b508649-156f-4bd0-973d-6347bc3d9805',
    'Finance',
    'd0e987fe-f71e-4822-84c2-ad34cc0f69ad',
    '2026-05-13 07:29:08.801'
  );
INSERT INTO
  `DepartmentTemplate` (`id`, `name`, `industryTypeId`, `createdAt`)
VALUES
  (
    '92dcb194-7647-445c-b8c2-184d25963e74',
    'HR',
    'd0e987fe-f71e-4822-84c2-ad34cc0f69ad',
    '2026-05-13 07:29:04.487'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: Designation
# ------------------------------------------------------------

INSERT INTO
  `Designation` (`id`, `title`, `level`, `companyId`, `createdAt`)
VALUES
  (
    '42f510e6-b3a8-4083-a8be-17bd9ca17401',
    'Tech Lead',
    7,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-13 06:18:39.656'
  );
INSERT INTO
  `Designation` (`id`, `title`, `level`, `companyId`, `createdAt`)
VALUES
  (
    '9ca7e1c6-d5c8-47a8-9337-d5815523a275',
    'Software Engineer',
    3,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-13 06:18:39.656'
  );
INSERT INTO
  `Designation` (`id`, `title`, `level`, `companyId`, `createdAt`)
VALUES
  (
    'b259b181-0de6-4e66-9f63-f44400bedd9d',
    'Junior Developer',
    2,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-13 06:18:39.656'
  );
INSERT INTO
  `Designation` (`id`, `title`, `level`, `companyId`, `createdAt`)
VALUES
  (
    'd26b1bbc-fdb9-4ff1-b4b0-445447280cbb',
    'Senior Developer',
    5,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-13 06:18:39.656'
  );
INSERT INTO
  `Designation` (`id`, `title`, `level`, `companyId`, `createdAt`)
VALUES
  (
    'dbca24c4-6d1b-49a0-89fd-1eee1a8a113c',
    'Architect',
    9,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-13 06:18:39.656'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: DesignationTemplate
# ------------------------------------------------------------

INSERT INTO
  `DesignationTemplate` (
    `id`,
    `title`,
    `level`,
    `industryTypeId`,
    `createdAt`,
    `departmentId`
  )
VALUES
  (
    '011226aa-873f-405c-8f41-63e7147b1f2b',
    'HR Coordinator',
    2,
    'd0e987fe-f71e-4822-84c2-ad34cc0f69ad',
    '2026-05-13 07:29:05.602',
    '92dcb194-7647-445c-b8c2-184d25963e74'
  );
INSERT INTO
  `DesignationTemplate` (
    `id`,
    `title`,
    `level`,
    `industryTypeId`,
    `createdAt`,
    `departmentId`
  )
VALUES
  (
    '086a5cff-7c98-4117-b4dc-f2bef6852151',
    'Tech Lead',
    7,
    'd0e987fe-f71e-4822-84c2-ad34cc0f69ad',
    '2026-05-13 07:29:02.384',
    '47c98e6e-1b68-4264-bb83-962aba758c82'
  );
INSERT INTO
  `DesignationTemplate` (
    `id`,
    `title`,
    `level`,
    `industryTypeId`,
    `createdAt`,
    `departmentId`
  )
VALUES
  (
    '257ba0d6-408f-4841-b6b7-39e7bf34141b',
    'Architect',
    9,
    'd0e987fe-f71e-4822-84c2-ad34cc0f69ad',
    '2026-05-13 07:29:03.433',
    '47c98e6e-1b68-4264-bb83-962aba758c82'
  );
INSERT INTO
  `DesignationTemplate` (
    `id`,
    `title`,
    `level`,
    `industryTypeId`,
    `createdAt`,
    `departmentId`
  )
VALUES
  (
    '32c6a842-d166-4560-9a1e-93c3a1c64c83',
    'Accountant',
    3,
    'd0e987fe-f71e-4822-84c2-ad34cc0f69ad',
    '2026-05-13 07:29:10.125',
    '8b508649-156f-4bd0-973d-6347bc3d9805'
  );
INSERT INTO
  `DesignationTemplate` (
    `id`,
    `title`,
    `level`,
    `industryTypeId`,
    `createdAt`,
    `departmentId`
  )
VALUES
  (
    '3a7c2f3b-ae01-49b8-806e-696ec31cf2a1',
    'Data Scientist',
    4,
    '68966bd2-c2f1-4d23-b21d-9dbb4f33a93e',
    '2026-05-13 10:01:37.141',
    '18bf6586-9b75-4409-a966-54ef1273736c'
  );
INSERT INTO
  `DesignationTemplate` (
    `id`,
    `title`,
    `level`,
    `industryTypeId`,
    `createdAt`,
    `departmentId`
  )
VALUES
  (
    '50df2353-aca7-413c-a295-788d1c3390f1',
    'Software Engineer',
    3,
    'd0e987fe-f71e-4822-84c2-ad34cc0f69ad',
    '2026-05-13 07:29:00.285',
    '47c98e6e-1b68-4264-bb83-962aba758c82'
  );
INSERT INTO
  `DesignationTemplate` (
    `id`,
    `title`,
    `level`,
    `industryTypeId`,
    `createdAt`,
    `departmentId`
  )
VALUES
  (
    '76cef2fc-e45f-48cc-9c39-8b3b5f671b3a',
    'Senior Developer',
    5,
    'd0e987fe-f71e-4822-84c2-ad34cc0f69ad',
    '2026-05-13 07:29:01.334',
    '47c98e6e-1b68-4264-bb83-962aba758c82'
  );
INSERT INTO
  `DesignationTemplate` (
    `id`,
    `title`,
    `level`,
    `industryTypeId`,
    `createdAt`,
    `departmentId`
  )
VALUES
  (
    'bd4ec441-d568-486a-8b3a-ecd31ee3c59d',
    'HR Director',
    9,
    'd0e987fe-f71e-4822-84c2-ad34cc0f69ad',
    '2026-05-13 07:29:07.720',
    '92dcb194-7647-445c-b8c2-184d25963e74'
  );
INSERT INTO
  `DesignationTemplate` (
    `id`,
    `title`,
    `level`,
    `industryTypeId`,
    `createdAt`,
    `departmentId`
  )
VALUES
  (
    'c37585cd-c302-42b4-ad53-19d973aafcdf',
    'Junior Developer',
    2,
    'd0e987fe-f71e-4822-84c2-ad34cc0f69ad',
    '2026-05-13 07:28:58.702',
    '47c98e6e-1b68-4264-bb83-962aba758c82'
  );
INSERT INTO
  `DesignationTemplate` (
    `id`,
    `title`,
    `level`,
    `industryTypeId`,
    `createdAt`,
    `departmentId`
  )
VALUES
  (
    'c869c6b0-baf0-40f8-881d-4478130648c0',
    'HR Manager',
    6,
    'd0e987fe-f71e-4822-84c2-ad34cc0f69ad',
    '2026-05-13 07:29:06.661',
    '92dcb194-7647-445c-b8c2-184d25963e74'
  );
INSERT INTO
  `DesignationTemplate` (
    `id`,
    `title`,
    `level`,
    `industryTypeId`,
    `createdAt`,
    `departmentId`
  )
VALUES
  (
    'fd161705-fa64-44ca-a275-07ed6e4299d8',
    'Finance Head',
    8,
    'd0e987fe-f71e-4822-84c2-ad34cc0f69ad',
    '2026-05-13 07:29:11.186',
    '8b508649-156f-4bd0-973d-6347bc3d9805'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: Employee
# ------------------------------------------------------------

INSERT INTO
  `Employee` (
    `id`,
    `userId`,
    `companyId`,
    `employeeCode`,
    `firstName`,
    `middleName`,
    `lastName`,
    `profilePhoto`,
    `onboardingStep`,
    `onboardingCompleted`,
    `probationPeriod`,
    `noticePeriod`,
    `departmentId`,
    `designationId`,
    `joiningDate`,
    `employmentType`,
    `workLocation`,
    `managerId`,
    `status`,
    `bgvStatus`,
    `bgvRemarks`,
    `deletedAt`,
    `isDeclaredTrue`,
    `signature`
  )
VALUES
  (
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'b0ed585f-83f6-40e9-8474-ab05e082e08a',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'EMP-1778744312673',
    NULL,
    NULL,
    NULL,
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779429702/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_profilePhoto_1779429700958.jpg',
    10,
    1,
    '6 Months',
    '90 Days',
    '26d43f81-c76b-4012-ac3b-79356078c56c',
    '42f510e6-b3a8-4083-a8be-17bd9ca17401',
    '2026-05-14 07:38:32.673',
    'FRESHER',
    NULL,
    NULL,
    'PENDING_APPROVAL',
    'APPROVED',
    NULL,
    NULL,
    1,
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779429702/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_signature_1779429700959.jpg'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: EmployeeBank
# ------------------------------------------------------------

INSERT INTO
  `EmployeeBank` (
    `id`,
    `employeeId`,
    `bankName`,
    `accountHolderName`,
    `accountNumber`,
    `ifscCode`,
    `branchName`,
    `upiId`,
    `createdAt`
  )
VALUES
  (
    '53baac32-ebb7-4004-a20b-fe07d20c9f1f',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'HDFC Bank',
    'John Doe',
    '12345678901234',
    'HDFC0001234',
    'Koramangala',
    NULL,
    '2026-05-15 07:07:50.946'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: EmployeeCompliance
# ------------------------------------------------------------

INSERT INTO
  `EmployeeCompliance` (
    `id`,
    `employeeId`,
    `pfNumber`,
    `esiNumber`,
    `uanNumber`,
    `insuranceId`,
    `insuranceProvider`,
    `policyNumber`,
    `coverageAmount`,
    `policyStartDate`,
    `policyEndDate`,
    `createdAt`
  )
VALUES
  (
    'e952b12e-9382-41db-a819-341b04600b3e',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'MH/BAN/12345/678',
    '1100123456789',
    '100012345678',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-05-15 07:07:53.938'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: EmployeeDocument
# ------------------------------------------------------------

INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    '129ba5ca-6da2-4bef-9506-2e59ad91a02e',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'CANCELLEDCHEQUE',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779429702/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_cancelledCheque_1779429701256.jpg',
    'PENDING',
    NULL,
    '2026-05-22 06:02:03.162'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    '13a23900-0c2e-4987-8a10-6f8d9b659956',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'CANCELLEDCHEQUE',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779355017/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_cancelledCheque_1779355016124.jpg',
    'PENDING',
    NULL,
    '2026-05-21 09:17:15.626'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    '1e6b11a9-f641-4213-9f8f-96b09c38b779',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'RELIEVING_LETTER',
    '/uploads/employee-docs/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_relieving_letter_1778828859613',
    'PENDING',
    NULL,
    '2026-05-15 07:07:59.927'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    '212be5ff-b1af-4d0d-9bd6-b80931ef44a3',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'BANKPASSBOOK',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779426855/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_bankPassbook_1779426854274.jpg',
    'PENDING',
    NULL,
    '2026-05-22 05:14:35.239'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    '22be62a1-51c6-4d26-bd68-5655204d220b',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'AADHAAR',
    '/uploads/employee-docs/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_aadhaar_1778828859613',
    'PENDING',
    NULL,
    '2026-05-15 07:07:57.928'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    '36f4388d-79a4-42f7-b06b-b55f8e31ea2f',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'PAN',
    '/uploads/employee-docs/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_pan_1778828859613',
    'PENDING',
    NULL,
    '2026-05-15 07:07:58.925'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    '4255df3a-d2cb-4ab2-b018-c783736e8911',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'RELIEVING_LETTER',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779429702/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_relieving_letter_1779429701256.jpg',
    'PENDING',
    NULL,
    '2026-05-22 06:02:01.820'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    '4dc68249-e475-458f-af44-a301ed0ea09d',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'BANKPASSBOOK',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779355017/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_bankPassbook_1779355016124.jpg',
    'PENDING',
    NULL,
    '2026-05-21 09:17:15.174'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    '59b5fd34-ce68-433d-add8-2d65e672a2c5',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'PAYSLIPS',
    '/uploads/employee-docs/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_payslips_1778828859809',
    'PENDING',
    NULL,
    '2026-05-15 07:08:00.429'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    '59e47609-ce9e-4f25-835e-5b41f3ecfffd',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'AADHAAR',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779429702/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_aadhaar_1779429701247.jpg',
    'PENDING',
    NULL,
    '2026-05-22 06:02:00.027'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    '6ae6f200-c879-4898-b6a3-f7f1822c38a0',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'PAN',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779426855/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_pan_1779426854273.jpg',
    'PENDING',
    NULL,
    '2026-05-22 05:14:33.447'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    '954a0c4a-48df-4455-9721-d8aa48d3ce71',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'BANKPASSBOOK',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1778925583/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_bankPassbook_1778925582168.jpg',
    'PENDING',
    NULL,
    '2026-05-16 10:00:00.522'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    '992a735c-a151-41b1-ab08-9559b7e5cdc0',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'AADHAAR',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779426855/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_aadhaar_1779426854273.jpg',
    'PENDING',
    NULL,
    '2026-05-22 05:14:32.556'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'a2044cc1-b116-4b05-b879-211df9dee5b4',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'PAYSLIPS',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779355017/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_payslips_1779355016124.jpg',
    'PENDING',
    NULL,
    '2026-05-21 09:17:14.728'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'a23bdfcf-91aa-4579-8365-fd824161d72f',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'EDUCATION_PROOF',
    '/uploads/employee-docs/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_education_proof_1778828859613',
    'PENDING',
    NULL,
    '2026-05-15 07:07:59.424'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'b8925bbc-0dc4-4b08-b8f0-8660be3dd08a',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'PAN',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1778925583/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_pan_1778925582168.jpg',
    'PENDING',
    NULL,
    '2026-05-16 09:59:58.803'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'b9872ce2-8c32-4047-9403-f541572428d5',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'AADHAAR',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779355017/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_aadhaar_1779355016080.jpg',
    'PENDING',
    NULL,
    '2026-05-21 09:17:12.498'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'ba13463c-fcdd-4ea5-bd40-fdc2cc0ca80f',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'PAYSLIPS',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779429702/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_payslips_1779429701256.jpg',
    'PENDING',
    NULL,
    '2026-05-22 06:02:02.268'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'c6a1e999-250a-4b5b-809f-2f1d90f33ede',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'EDUCATION_PROOF',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779426855/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_education_proof_1779426854274.jpg',
    'PENDING',
    NULL,
    '2026-05-22 05:14:33.899'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'c6de207e-1284-4fc9-ad9c-6d8de9c7ec6e',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'EDUCATION_PROOF',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779429702/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_education_proof_1779429701256.jpg',
    'PENDING',
    NULL,
    '2026-05-22 06:02:01.373'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'cdb775f2-2fd7-4eb5-a5b3-be72e77667a5',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'CANCELLEDCHEQUE',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779426855/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_cancelledCheque_1779426854274.jpg',
    'PENDING',
    NULL,
    '2026-05-22 05:14:35.685'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'cdfc242a-277a-47d4-a35e-aeebc80a8c7c',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'AADHAAR',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1778925583/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_aadhaar_1778925582165.jpg',
    'PENDING',
    NULL,
    '2026-05-16 09:59:57.948'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'cf9d81d7-5fa5-4e1e-86f2-93ce28aa0153',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'EDUCATION_PROOF',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1778925583/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_education_proof_1778925582168.jpg',
    'PENDING',
    NULL,
    '2026-05-16 09:59:59.231'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'cfecdbc7-3505-4c1e-80df-805b680941a0',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'PAYSLIPS',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1778925583/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_payslips_1778925582168.jpg',
    'PENDING',
    NULL,
    '2026-05-16 10:00:00.090'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'd42053c0-9c46-4b30-9fe9-8f5bb1044042',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'CANCELLEDCHEQUE',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1778925583/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_cancelledCheque_1778925582168.jpg',
    'PENDING',
    NULL,
    '2026-05-16 10:00:00.951'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'd4ab8c79-860b-46b5-bdb8-c667bd93ab79',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'PAN',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779429702/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_pan_1779429701256.jpg',
    'PENDING',
    NULL,
    '2026-05-22 06:02:00.925'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'd4e12e9a-456c-40da-ab1e-bd963e3f33a7',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'BANKPASSBOOK',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779429702/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_bankPassbook_1779429701256.jpg',
    'PENDING',
    NULL,
    '2026-05-22 06:02:02.715'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'e6fb6894-8093-48fe-9832-767f50851067',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'PAYSLIPS',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779426855/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_payslips_1779426854274.jpg',
    'PENDING',
    NULL,
    '2026-05-22 05:14:34.793'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'e782979b-5411-4085-8635-3aeefc4398a7',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'PAN',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779355017/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_pan_1779355016085.jpg',
    'PENDING',
    NULL,
    '2026-05-21 09:17:13.391'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'ed0887fc-e0cf-4427-b210-987d48b319a8',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'CANCELLEDCHEQUE',
    '/uploads/employee-docs/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_cancelledCheque_1778828859809',
    'PENDING',
    NULL,
    '2026-05-15 07:08:01.427'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'ee6c3cc0-3462-4935-80ae-5286860d0134',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'RELIEVING_LETTER',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779426855/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_relieving_letter_1779426854274.jpg',
    'PENDING',
    NULL,
    '2026-05-22 05:14:34.346'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'f5ead567-d0d6-428b-8a75-f3e73de9a363',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'RELIEVING_LETTER',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779355017/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_relieving_letter_1779355016085.jpg',
    'PENDING',
    NULL,
    '2026-05-21 09:17:14.284'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'f8b0cf09-87cd-455a-9bc0-975b83561293',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'RELIEVING_LETTER',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1778925583/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_relieving_letter_1778925582168.jpg',
    'PENDING',
    NULL,
    '2026-05-16 09:59:59.660'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'fa6a2aef-38c9-43fc-b306-0e09d8d5db49',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'BANKPASSBOOK',
    '/uploads/employee-docs/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_bankPassbook_1778828859809',
    'PENDING',
    NULL,
    '2026-05-15 07:08:00.928'
  );
INSERT INTO
  `EmployeeDocument` (
    `id`,
    `employeeId`,
    `name`,
    `fileUrl`,
    `status`,
    `remarks`,
    `createdAt`
  )
VALUES
  (
    'fb22c422-7239-4f6a-b1ee-bd183a6ae4bf',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'EDUCATION_PROOF',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779355017/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_education_proof_1779355016085.jpg',
    'PENDING',
    NULL,
    '2026-05-21 09:17:13.837'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: EmployeeEducation
# ------------------------------------------------------------

INSERT INTO
  `EmployeeEducation` (
    `id`,
    `employeeId`,
    `degree`,
    `specialization`,
    `college`,
    `university`,
    `percentage`,
    `cgpa`,
    `startYear`,
    `endYear`,
    `createdAt`
  )
VALUES
  (
    '4bd10636-5228-4871-af99-6b7ad5f60254',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'Graduation',
    'Computer Science',
    'NIT Surathkal',
    NULL,
    NULL,
    '8.5',
    '2015',
    '2019',
    '2026-05-22 06:01:49.720'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: EmployeeEmergencyContact
# ------------------------------------------------------------

INSERT INTO
  `EmployeeEmergencyContact` (
    `id`,
    `employeeId`,
    `contactPersonName`,
    `relationship`,
    `contactNumber`,
    `alternateContact`,
    `address`,
    `createdAt`
  )
VALUES
  (
    'a3a13fc5-198c-4bdd-a113-592073c87d54',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'Jane Doe',
    'Sister',
    '+919988776655',
    NULL,
    'Bengaluru',
    '2026-05-22 06:01:48.826'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: EmployeeExperience
# ------------------------------------------------------------

INSERT INTO
  `EmployeeExperience` (
    `id`,
    `employeeId`,
    `companyName`,
    `role`,
    `startDate`,
    `endDate`,
    `technologies`,
    `responsibilities`,
    `totalYears`,
    `createdAt`
  )
VALUES
  (
    '106a1c18-0b8b-4980-a375-ca5d109a164f',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'Tech Solutions Inc.',
    'Software Engineer',
    '2019-07-01 00:00:00.000',
    '2023-08-01 00:00:00.000',
    'Node.js, React',
    'Backend development',
    NULL,
    '2026-05-22 06:01:50.615'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: EmployeeInvite
# ------------------------------------------------------------

INSERT INTO
  `EmployeeInvite` (
    `id`,
    `email`,
    `token`,
    `companyId`,
    `role`,
    `name`,
    `userId`,
    `departmentId`,
    `designationId`,
    `expiresAt`,
    `acceptedAt`,
    `createdAt`
  )
VALUES
  (
    '2d990333-a24b-4990-b783-dd3e5c0bf416',
    'vk4950362@gmail.com',
    'af26bf348125f8dba495ae3756758e5c94bbd71fda4f7f16de92c81d8602dd0d',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'HR',
    'thatipally Vinod  ',
    NULL,
    '4c2ef5ee-8a4a-4251-8845-3ae3b4f19553',
    '5b907a8c-d143-41a1-ad5c-d59872630d8c',
    '2026-05-16 06:27:01.706',
    '2026-05-14 07:38:33.560',
    '2026-05-14 06:27:01.709'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: EmployeeNominee
# ------------------------------------------------------------

INSERT INTO
  `EmployeeNominee` (
    `id`,
    `employeeId`,
    `nomineeName`,
    `relationship`,
    `dob`,
    `gender`,
    `phone`,
    `email`,
    `aadhaarNumber`,
    `panNumber`,
    `nomineePercentage`,
    `address`,
    `createdAt`
  )
VALUES
  (
    'a78ea45d-8fee-457a-8a8c-74e96265c665',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    'Jane Doe',
    'Sister',
    NULL,
    NULL,
    NULL,
    NULL,
    '123456789012',
    NULL,
    100,
    NULL,
    '2026-05-15 07:07:52.442'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: EmployeePersonal
# ------------------------------------------------------------

INSERT INTO
  `EmployeePersonal` (
    `id`,
    `employeeId`,
    `personalEmail`,
    `phone`,
    `alternatePhone`,
    `addressLine1`,
    `addressLine2`,
    `city`,
    `state`,
    `country`,
    `pincode`,
    `gender`,
    `dob`,
    `maritalStatus`,
    `bloodGroup`,
    `nationality`,
    `createdAt`
  )
VALUES
  (
    '81564cc2-8ef2-4305-b327-5d43c8718331',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    NULL,
    '+919876543210',
    '+919876543211',
    '123 Tech Park',
    'Apt 405',
    'Bengaluru',
    'Karnataka',
    'India',
    '560001',
    'MALE',
    '1998-08-15 00:00:00.000',
    'SINGLE',
    'O+',
    'Indian',
    '2026-05-15 07:07:44.956'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: EmployeeSkill
# ------------------------------------------------------------

INSERT INTO
  `EmployeeSkill` (
    `id`,
    `employeeId`,
    `createdAt`,
    `certifications`,
    `githubUrl`,
    `languagesKnown`,
    `linkedinUrl`,
    `portfolioUrl`,
    `primarySkills`,
    `secondarySkills`
  )
VALUES
  (
    'd14217d5-3f0c-472d-85fd-abd46cf5def7',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    '2026-05-22 06:01:51.512',
    '[]',
    NULL,
    '[]',
    NULL,
    NULL,
    '[]',
    '[]'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: GlobalLeaveType
# ------------------------------------------------------------

INSERT INTO
  `GlobalLeaveType` (`id`, `name`, `maxDays`, `createdAt`)
VALUES
  (
    '41e1cf38-c4f5-4fb5-b44b-662a82c8a6f3',
    'Casual Leave',
    8,
    '2026-05-20 11:28:33.671'
  );
INSERT INTO
  `GlobalLeaveType` (`id`, `name`, `maxDays`, `createdAt`)
VALUES
  (
    'd1f45d7c-0b74-416b-bf7b-0f5bab3fabd6',
    'Paternity Leave',
    7,
    '2026-05-20 11:28:33.671'
  );
INSERT INTO
  `GlobalLeaveType` (`id`, `name`, `maxDays`, `createdAt`)
VALUES
  (
    'd581d042-8723-4dba-8875-4463a98ea3df',
    'Earned Leave',
    18,
    '2026-05-20 11:28:33.671'
  );
INSERT INTO
  `GlobalLeaveType` (`id`, `name`, `maxDays`, `createdAt`)
VALUES
  (
    'd7a73a1b-0808-4107-a9f2-d966eacc1521',
    'Compensatory Off',
    6,
    '2026-05-20 11:28:33.671'
  );
INSERT INTO
  `GlobalLeaveType` (`id`, `name`, `maxDays`, `createdAt`)
VALUES
  (
    'e8301f5a-402c-4c8e-969e-e194c688bd55',
    'Maternity Leave',
    182,
    '2026-05-20 11:28:33.671'
  );
INSERT INTO
  `GlobalLeaveType` (`id`, `name`, `maxDays`, `createdAt`)
VALUES
  (
    'ee6c3449-3478-477e-8123-f92f83b31e11',
    'Sick Leave',
    12,
    '2026-05-20 11:28:33.671'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: HR
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: IndustryType
# ------------------------------------------------------------

INSERT INTO
  `IndustryType` (`id`, `name`, `createdAt`, `updatedAt`)
VALUES
  (
    '00d56702-549f-41a4-a8ba-d5e1ced74d88',
    'Legal / Consulting',
    '2026-05-13 05:41:52.961',
    '2026-05-13 06:16:32.387'
  );
INSERT INTO
  `IndustryType` (`id`, `name`, `createdAt`, `updatedAt`)
VALUES
  (
    '37d1515f-5f17-43ba-84e5-06bcf37e5429',
    'Manufacturing / Automotive',
    '2026-05-13 05:41:56.817',
    '2026-05-13 06:16:36.437'
  );
INSERT INTO
  `IndustryType` (`id`, `name`, `createdAt`, `updatedAt`)
VALUES
  (
    '405d6b2d-bdf8-48a6-b3d6-7862b32e7d41',
    'Healthcare / Medical',
    '2026-05-13 05:41:43.643',
    '2026-05-13 06:16:22.592'
  );
INSERT INTO
  `IndustryType` (`id`, `name`, `createdAt`, `updatedAt`)
VALUES
  (
    '68966bd2-c2f1-4d23-b21d-9dbb4f33a93e',
    'Robotics & AI',
    '2026-05-13 09:53:43.591',
    '2026-05-13 09:53:43.591'
  );
INSERT INTO
  `IndustryType` (`id`, `name`, `createdAt`, `updatedAt`)
VALUES
  (
    '6c4c6b5d-ad25-4a74-bc29-502d9e16cdeb',
    'Finance / Banking',
    '2026-05-13 05:41:49.119',
    '2026-05-13 06:16:28.331'
  );
INSERT INTO
  `IndustryType` (`id`, `name`, `createdAt`, `updatedAt`)
VALUES
  (
    'd0e987fe-f71e-4822-84c2-ad34cc0f69ad',
    'IT / Software',
    '2026-05-13 05:40:35.333',
    '2026-05-13 07:28:54.594'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: JoiningLetter
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: Leave
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: LeaveType
# ------------------------------------------------------------

INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    '029bcafc-2d64-459c-bb46-0c622e182b0f',
    'Compensatory Off',
    6,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-20 10:41:11.274'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    '05a51046-ec12-4ceb-9747-f4b4ea04b42a',
    'Paternity Leave',
    7,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-20 10:41:11.274'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    '10e147c3-f6b6-495d-90dd-90e9995bb6bb',
    'Paternity Leave',
    7,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-22 05:17:06.198'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    '15227ab7-ea9e-4d18-859e-e977f4ffd96c',
    'Compensatory Off',
    6,
    '2e765207-a289-40f3-b2e8-a86aea5073f7',
    '2026-05-20 10:41:09.750'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    '1bb27275-702b-4cd1-a730-aadb84f64225',
    'Casual Leave',
    8,
    '2e765207-a289-40f3-b2e8-a86aea5073f7',
    '2026-05-20 10:41:09.750'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    '1bf77bff-925a-429a-a284-68671ae4f3f4',
    'Compensatory Off',
    6,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-22 05:17:06.198'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    '229ce8f2-1c92-49c5-8611-0b349b2e3bf8',
    'Earned Leave',
    18,
    '2e765207-a289-40f3-b2e8-a86aea5073f7',
    '2026-05-20 10:41:09.750'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    '2420bcdd-23bb-4170-a413-2dac82f93a6b',
    'Maternity Leave',
    182,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-21 06:44:58.134'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    '24846e38-7199-4c17-ad36-80e647133250',
    'Maternity Leave',
    182,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-22 05:17:06.198'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    '26ff8d27-1d6f-47b7-a743-ef80ab3a3183',
    'Casual Leave',
    8,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-20 10:41:11.274'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    '421d9ddc-2a2c-4fb4-b163-90ae7604fc29',
    'Casual Leave',
    8,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-22 05:17:06.198'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    '52aeb449-cc1d-423a-b882-f01fb7045b0c',
    'Sick Leave',
    12,
    '2e765207-a289-40f3-b2e8-a86aea5073f7',
    '2026-05-20 10:41:09.750'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    '5a787052-154a-4b12-b341-de75cbd08894',
    'Earned Leave',
    18,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-21 06:44:58.134'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    '651e4f54-0b81-4fbf-8be2-54262d0db47e',
    'Maternity Leave',
    182,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-21 06:34:27.536'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    '87f41389-0925-491e-992d-9bbb5d9406d1',
    'Sick Leave',
    12,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-21 06:34:27.536'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    'a1487b7d-678b-4d03-a117-a10325252172',
    'Paternity Leave',
    7,
    '2e765207-a289-40f3-b2e8-a86aea5073f7',
    '2026-05-20 10:41:09.750'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    'a7b115ed-1b2a-44fe-810f-a410d6e77e99',
    'Earned Leave',
    18,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-20 10:41:11.274'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    'abefb28b-38a7-4af5-b656-8f1eebf3b191',
    'Sick Leave',
    12,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-21 06:44:58.134'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    'ad2809a3-4671-42cd-acac-6a8d2edb8a7b',
    'Paternity Leave',
    7,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-21 06:34:27.536'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    'b12e132e-3307-4ae0-807f-7db13c165afa',
    'Maternity Leave',
    182,
    '2e765207-a289-40f3-b2e8-a86aea5073f7',
    '2026-05-20 10:41:09.750'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    'b7c454ae-fc73-4328-b2bc-f70b67e80c77',
    'Maternity Leave',
    182,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-20 10:41:11.274'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    'd151dd78-e0d1-41b5-a2a7-0e665fd6baad',
    'Sick Leave',
    12,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-20 10:41:11.274'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    'd7f064a7-4b91-49dc-b6d3-0ad437864ecf',
    'Compensatory Off',
    6,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-21 06:44:58.134'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    'd89abd9b-7721-4e64-8bc3-401eabdab9f2',
    'Paternity Leave',
    7,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-21 06:44:58.134'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    'debdc497-3bc5-4676-ba84-724414475ffa',
    'Compensatory Off',
    6,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-21 06:34:27.536'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    'e662bec1-c9c9-4632-ac9e-d932e672f5e4',
    'Earned Leave',
    18,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-22 05:17:06.198'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    'fa850dbb-fb9d-464c-8727-7fd143bf0e0f',
    'Casual Leave',
    8,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-21 06:34:27.536'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    'fb08311a-380e-496c-ad26-fd36bf67188a',
    'Earned Leave',
    18,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-21 06:34:27.536'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    'fc66fd77-e3ff-495d-ab0a-4e15ede35356',
    'Sick Leave',
    12,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-22 05:17:06.198'
  );
INSERT INTO
  `LeaveType` (`id`, `name`, `maxDays`, `companyId`, `createdAt`)
VALUES
  (
    'fedec72b-fc4a-435f-9879-219afb566cc9',
    'Casual Leave',
    8,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '2026-05-21 06:44:58.134'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: Notification
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: NotificationIndustry
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: OfferLetter
# ------------------------------------------------------------

INSERT INTO
  `OfferLetter` (
    `id`,
    `name`,
    `employeeEmail`,
    `companyId`,
    `role`,
    `position`,
    `departmentId`,
    `designationId`,
    `ctc`,
    `monthlyGross`,
    `variablePay`,
    `joiningBonus`,
    `annualBonus`,
    `joiningDate`,
    `status`,
    `documentUrl`,
    `employeeId`,
    `createdAt`,
    `updatedAt`
  )
VALUES
  (
    '16cc938e-619b-4d9d-b58b-b5b856bd0e31',
    'thatipally Vinod  ',
    'vk4950362@gmail.com',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'HR',
    'Human Resources Manager',
    '4c2ef5ee-8a4a-4251-8845-3ae3b4f19553',
    '5b907a8c-d143-41a1-ad5c-d59872630d8c',
    85000,
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-06-15 00:00:00.000',
    'SENT',
    NULL,
    NULL,
    '2026-05-14 06:17:55.152',
    '2026-05-14 06:17:55.152'
  );
INSERT INTO
  `OfferLetter` (
    `id`,
    `name`,
    `employeeEmail`,
    `companyId`,
    `role`,
    `position`,
    `departmentId`,
    `designationId`,
    `ctc`,
    `monthlyGross`,
    `variablePay`,
    `joiningBonus`,
    `annualBonus`,
    `joiningDate`,
    `status`,
    `documentUrl`,
    `employeeId`,
    `createdAt`,
    `updatedAt`
  )
VALUES
  (
    '3bd53b9f-d4e3-4ec2-bf5b-5270db417815',
    'thatipally Vinod  ',
    'vk4950362@gmail.com',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'HR',
    'Human Resources Manager',
    '4c2ef5ee-8a4a-4251-8845-3ae3b4f19553',
    '5b907a8c-d143-41a1-ad5c-d59872630d8c',
    85000,
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-06-15 00:00:00.000',
    'SENT',
    NULL,
    NULL,
    '2026-05-13 10:40:48.609',
    '2026-05-13 10:40:48.609'
  );
INSERT INTO
  `OfferLetter` (
    `id`,
    `name`,
    `employeeEmail`,
    `companyId`,
    `role`,
    `position`,
    `departmentId`,
    `designationId`,
    `ctc`,
    `monthlyGross`,
    `variablePay`,
    `joiningBonus`,
    `annualBonus`,
    `joiningDate`,
    `status`,
    `documentUrl`,
    `employeeId`,
    `createdAt`,
    `updatedAt`
  )
VALUES
  (
    '3bde277e-3680-4328-8def-8f9e78890372',
    'thatipally Vinod  ',
    'vk4950362@gmail.com',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'HR',
    'Human Resources Manager',
    '4c2ef5ee-8a4a-4251-8845-3ae3b4f19553',
    '5b907a8c-d143-41a1-ad5c-d59872630d8c',
    85000,
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-06-15 00:00:00.000',
    'SENT',
    NULL,
    NULL,
    '2026-05-13 12:49:51.897',
    '2026-05-13 12:49:51.897'
  );
INSERT INTO
  `OfferLetter` (
    `id`,
    `name`,
    `employeeEmail`,
    `companyId`,
    `role`,
    `position`,
    `departmentId`,
    `designationId`,
    `ctc`,
    `monthlyGross`,
    `variablePay`,
    `joiningBonus`,
    `annualBonus`,
    `joiningDate`,
    `status`,
    `documentUrl`,
    `employeeId`,
    `createdAt`,
    `updatedAt`
  )
VALUES
  (
    '62ce119d-4506-4295-8420-d958983a6fb7',
    'thatipally Vinod  ',
    'vk4950362@gmail.com',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'HR',
    'Human Resources Manager',
    '4c2ef5ee-8a4a-4251-8845-3ae3b4f19553',
    '5b907a8c-d143-41a1-ad5c-d59872630d8c',
    85000,
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-06-15 00:00:00.000',
    'ACCEPTED',
    NULL,
    NULL,
    '2026-05-14 06:25:58.454',
    '2026-05-14 06:27:00.153'
  );
INSERT INTO
  `OfferLetter` (
    `id`,
    `name`,
    `employeeEmail`,
    `companyId`,
    `role`,
    `position`,
    `departmentId`,
    `designationId`,
    `ctc`,
    `monthlyGross`,
    `variablePay`,
    `joiningBonus`,
    `annualBonus`,
    `joiningDate`,
    `status`,
    `documentUrl`,
    `employeeId`,
    `createdAt`,
    `updatedAt`
  )
VALUES
  (
    '8aa9e84b-b29f-426b-bfe6-c093c43326e7',
    'thatipally Vinod  ',
    'vk4950362@gmail.com',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'HR',
    'Human Resources Manager',
    '4c2ef5ee-8a4a-4251-8845-3ae3b4f19553',
    '5b907a8c-d143-41a1-ad5c-d59872630d8c',
    85000,
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-06-15 00:00:00.000',
    'SENT',
    NULL,
    NULL,
    '2026-05-13 10:20:35.527',
    '2026-05-13 10:20:35.527'
  );
INSERT INTO
  `OfferLetter` (
    `id`,
    `name`,
    `employeeEmail`,
    `companyId`,
    `role`,
    `position`,
    `departmentId`,
    `designationId`,
    `ctc`,
    `monthlyGross`,
    `variablePay`,
    `joiningBonus`,
    `annualBonus`,
    `joiningDate`,
    `status`,
    `documentUrl`,
    `employeeId`,
    `createdAt`,
    `updatedAt`
  )
VALUES
  (
    '92f64372-500a-4b99-a833-e894d7d15be6',
    'thatipally Vinod  ',
    'vk4950362@gmail.com',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'HR',
    'Human Resources Manager',
    '4c2ef5ee-8a4a-4251-8845-3ae3b4f19553',
    '5b907a8c-d143-41a1-ad5c-d59872630d8c',
    85000,
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-06-15 00:00:00.000',
    'SENT',
    NULL,
    NULL,
    '2026-05-13 12:32:56.909',
    '2026-05-13 12:32:56.909'
  );
INSERT INTO
  `OfferLetter` (
    `id`,
    `name`,
    `employeeEmail`,
    `companyId`,
    `role`,
    `position`,
    `departmentId`,
    `designationId`,
    `ctc`,
    `monthlyGross`,
    `variablePay`,
    `joiningBonus`,
    `annualBonus`,
    `joiningDate`,
    `status`,
    `documentUrl`,
    `employeeId`,
    `createdAt`,
    `updatedAt`
  )
VALUES
  (
    '95d73fef-5667-4dbf-8b2d-f0503b436bd6',
    'thatipally Vinod  ',
    'vk4950362@gmail.com',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'HR',
    'Human Resources Manager',
    '4c2ef5ee-8a4a-4251-8845-3ae3b4f19553',
    '5b907a8c-d143-41a1-ad5c-d59872630d8c',
    85000,
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-06-15 00:00:00.000',
    'SENT',
    NULL,
    NULL,
    '2026-05-13 12:56:19.605',
    '2026-05-13 12:56:19.605'
  );
INSERT INTO
  `OfferLetter` (
    `id`,
    `name`,
    `employeeEmail`,
    `companyId`,
    `role`,
    `position`,
    `departmentId`,
    `designationId`,
    `ctc`,
    `monthlyGross`,
    `variablePay`,
    `joiningBonus`,
    `annualBonus`,
    `joiningDate`,
    `status`,
    `documentUrl`,
    `employeeId`,
    `createdAt`,
    `updatedAt`
  )
VALUES
  (
    'b6decd51-fe51-4c2f-93a8-6e8ce4a37a57',
    'Vinod HR Head',
    'hr.vinod@gmail.com',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'HR',
    'Human Resources Manager',
    '4c2ef5ee-8a4a-4251-8845-3ae3b4f19553',
    '5b907a8c-d143-41a1-ad5c-d59872630d8c',
    85000,
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-06-15 00:00:00.000',
    'SENT',
    NULL,
    NULL,
    '2026-05-13 10:18:39.336',
    '2026-05-13 10:18:39.336'
  );
INSERT INTO
  `OfferLetter` (
    `id`,
    `name`,
    `employeeEmail`,
    `companyId`,
    `role`,
    `position`,
    `departmentId`,
    `designationId`,
    `ctc`,
    `monthlyGross`,
    `variablePay`,
    `joiningBonus`,
    `annualBonus`,
    `joiningDate`,
    `status`,
    `documentUrl`,
    `employeeId`,
    `createdAt`,
    `updatedAt`
  )
VALUES
  (
    'f16876bb-8773-4f8b-a94b-85bef8bbaa63',
    'thatipally Vinod  ',
    'vk4950362@gmail.com',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'HR',
    'Human Resources Manager',
    '4c2ef5ee-8a4a-4251-8845-3ae3b4f19553',
    '5b907a8c-d143-41a1-ad5c-d59872630d8c',
    85000,
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-06-15 00:00:00.000',
    'SENT',
    NULL,
    NULL,
    '2026-05-14 06:20:59.299',
    '2026-05-14 06:20:59.299'
  );
INSERT INTO
  `OfferLetter` (
    `id`,
    `name`,
    `employeeEmail`,
    `companyId`,
    `role`,
    `position`,
    `departmentId`,
    `designationId`,
    `ctc`,
    `monthlyGross`,
    `variablePay`,
    `joiningBonus`,
    `annualBonus`,
    `joiningDate`,
    `status`,
    `documentUrl`,
    `employeeId`,
    `createdAt`,
    `updatedAt`
  )
VALUES
  (
    'f1e98de5-7dd0-44ba-835b-a39a1ad76968',
    'thatipally Vinod  ',
    'vk4950362@gmail.com',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    'HR',
    'Human Resources Manager',
    '4c2ef5ee-8a4a-4251-8845-3ae3b4f19553',
    '5b907a8c-d143-41a1-ad5c-d59872630d8c',
    85000,
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-06-15 00:00:00.000',
    'SENT',
    NULL,
    NULL,
    '2026-05-13 10:38:29.096',
    '2026-05-13 10:38:29.096'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: PasswordResetToken
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: Payroll
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: SalaryStructure
# ------------------------------------------------------------

INSERT INTO
  `SalaryStructure` (
    `id`,
    `employeeId`,
    `basic`,
    `hra`,
    `allowances`,
    `bonus`,
    `pfEmployee`,
    `esiEmployee`,
    `pfEmployer`,
    `esiEmployer`,
    `deductions`,
    `netSalary`,
    `createdAt`
  )
VALUES
  (
    '00069047-c5cf-4a43-95f1-0ac754f0d9f6',
    '8a0510dd-3a98-4b4e-a5a3-669ce6abdc91',
    25000,
    10000,
    15000,
    0,
    3000,
    0,
    3000,
    0,
    3000,
    47000,
    '2026-05-15 13:19:10.945'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: SalaryTemplate
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: Subscription
# ------------------------------------------------------------

INSERT INTO
  `Subscription` (
    `id`,
    `companyId`,
    `planId`,
    `startDate`,
    `endDate`,
    `createdAt`
  )
VALUES
  (
    'dd8711c0-63d0-4554-b88d-0ec223fa6f3f',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    '53089257-c69f-4deb-bd86-c28c141253bf',
    '2026-05-13 06:18:35.703',
    '2026-06-12 06:18:35.703',
    '2026-05-13 06:18:35.704'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: SubscriptionPlan
# ------------------------------------------------------------

INSERT INTO
  `SubscriptionPlan` (
    `id`,
    `name`,
    `price`,
    `duration`,
    `features`,
    `createdAt`
  )
VALUES
  (
    '003684ca-f209-44e9-9ad5-915e88713372',
    'ENTERPRISE',
    499,
    365,
    '{\"modules\": [\"All\"], \"employees\": 10000}',
    '2026-05-13 06:16:43.348'
  );
INSERT INTO
  `SubscriptionPlan` (
    `id`,
    `name`,
    `price`,
    `duration`,
    `features`,
    `createdAt`
  )
VALUES
  (
    '53089257-c69f-4deb-bd86-c28c141253bf',
    'BASIC',
    0,
    365,
    '{\"modules\": [\"Core HR\"], \"employees\": 50}',
    '2026-05-13 06:16:40.349'
  );
INSERT INTO
  `SubscriptionPlan` (
    `id`,
    `name`,
    `price`,
    `duration`,
    `features`,
    `createdAt`
  )
VALUES
  (
    '607927c1-2c74-43e7-9f88-79f39cd6e550',
    'PRO',
    99,
    365,
    '{\"modules\": [\"Payroll\"], \"employees\": 200}',
    '2026-05-13 06:16:42.101'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: SystemPolicy
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: User
# ------------------------------------------------------------

INSERT INTO
  `User` (
    `id`,
    `name`,
    `email`,
    `password`,
    `role`,
    `status`,
    `profileLogo`,
    `companyId`,
    `isEmailVerified`,
    `lastLoginAt`,
    `failedLoginAttempts`,
    `lockUntil`,
    `createdAt`,
    `updatedAt`,
    `deletedAt`
  )
VALUES
  (
    '36fdee36-ec16-4d71-a718-b02b9d31245f',
    'Rahul Sharma',
    'owner@acme.com',
    '',
    'OWNER',
    'INVITED',
    NULL,
    '2e765207-a289-40f3-b2e8-a86aea5073f7',
    0,
    NULL,
    0,
    NULL,
    '2026-05-18 13:10:59.828',
    '2026-05-18 13:10:59.828',
    NULL
  );
INSERT INTO
  `User` (
    `id`,
    `name`,
    `email`,
    `password`,
    `role`,
    `status`,
    `profileLogo`,
    `companyId`,
    `isEmailVerified`,
    `lastLoginAt`,
    `failedLoginAttempts`,
    `lockUntil`,
    `createdAt`,
    `updatedAt`,
    `deletedAt`
  )
VALUES
  (
    'b0ed585f-83f6-40e9-8474-ab05e082e08a',
    'thatipally Vinod  ',
    'vk4950362@gmail.com',
    '$2b$10$0hAhT7..JqCFOEtKvrj9TeIMcdJGEb8s/hYwnJmXilsgdAVlidkQm',
    'HR',
    'ACTIVE',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779429702/hrms/employee_docs/b0ed585f-83f6-40e9-8474-ab05e082e08a_profilePhoto_1779429700958.jpg',
    '83fc6706-297b-44a0-8369-8976a3685aca',
    1,
    '2026-05-26 10:21:31.229',
    0,
    NULL,
    '2026-05-14 06:30:17.572',
    '2026-05-26 10:21:31.230',
    NULL
  );
INSERT INTO
  `User` (
    `id`,
    `name`,
    `email`,
    `password`,
    `role`,
    `status`,
    `profileLogo`,
    `companyId`,
    `isEmailVerified`,
    `lastLoginAt`,
    `failedLoginAttempts`,
    `lockUntil`,
    `createdAt`,
    `updatedAt`,
    `deletedAt`
  )
VALUES
  (
    'dfc02b56-4d48-474d-80bc-fee0b067c45c',
    ' thatipallyvinodkumar1',
    'vinod@acme.com',
    '$2b$10$ONcSWP0yVcx2nM6appPUeu3YMB.OKtlvmVbRjrnlMqZ21.x3tBIlK',
    'OWNER',
    'ACTIVE',
    NULL,
    '83fc6706-297b-44a0-8369-8976a3685aca',
    0,
    '2026-05-22 11:20:22.139',
    0,
    NULL,
    '2026-05-13 04:36:50.499',
    '2026-05-22 11:20:22.140',
    NULL
  );
INSERT INTO
  `User` (
    `id`,
    `name`,
    `email`,
    `password`,
    `role`,
    `status`,
    `profileLogo`,
    `companyId`,
    `isEmailVerified`,
    `lastLoginAt`,
    `failedLoginAttempts`,
    `lockUntil`,
    `createdAt`,
    `updatedAt`,
    `deletedAt`
  )
VALUES
  (
    'f636b711-046d-4e9d-8572-8ae48a0496ac',
    'GoExperts Super Admin',
    'goexperts@admin',
    '$2b$10$wh.8PBN93aTHdGRls80mvOE8/zlHb4Gx1Nk9eRZbOkWF1Xz6QAGJS',
    'SUPER_ADMIN',
    'ACTIVE',
    'https://res.cloudinary.com/dbwvg78rl/image/upload/v1779109425/hrms/profiles/kvfr6nhtknx4tjhzu7ug.jpg',
    NULL,
    1,
    '2026-05-25 06:51:25.325',
    0,
    NULL,
    '2026-05-12 11:28:35.664',
    '2026-05-25 06:51:25.327',
    NULL
  );

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
