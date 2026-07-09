-- This is a placeholder for your database dump file.
--
-- To generate the actual file with your database's structure and data,
-- you must run the following command in your terminal:
--
-- npm run db:dump
--
-- This will execute the `scripts/create-dump.js` script and replace this
-- file with the real contents of your database.
--
-- If the command fails, please ensure:
-- 1. Your database server (MySQL) is running.
-- 2. The `DATABASE_URL` in your `.env` file is correct.
-- 3. You have installed the necessary MySQL command-line tools on your computer.

-- The generated file will look something like this:

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
CREATE TABLE `User` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
);

-- ...and so on for all your tables and data.
