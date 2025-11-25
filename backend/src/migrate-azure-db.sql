-- Azure MySQL Database Migration Script
-- Removes 'Suspended' status and migrates users to Active/Banned
-- 
-- IMPORTANT: 
-- 1. Test on staging environment first
-- 2. Run during low-traffic hours
-- 3. Make sure application code is deployed before running this

-- Step 1: Create backup table
CREATE TABLE IF NOT EXISTS userprofile_backup AS 
SELECT * FROM userprofile WHERE 1=0;

INSERT INTO userprofile_backup SELECT * FROM userprofile;

SELECT 'Backup created with' as message, COUNT(*) as records FROM userprofile_backup;

-- Step 2: Show current status distribution
SELECT 'Current status distribution:' as message;
SELECT AccountStatus, COUNT(*) as count 
FROM userprofile 
GROUP BY AccountStatus;

-- Step 3: Migrate suspended users to Active/Banned randomly
UPDATE userprofile 
SET AccountStatus = CASE 
    WHEN RAND() < 0.5 THEN 'Active'
    ELSE 'Banned'
END 
WHERE AccountStatus = 'Suspended';

SELECT 'Migration completed. Affected rows:' as message, ROW_COUNT() as affected_rows;

-- Step 4: Verify no suspended users remain
SELECT 'Remaining suspended users:' as message, COUNT(*) as count 
FROM userprofile 
WHERE AccountStatus = 'Suspended';

-- Step 5: Show new status distribution
SELECT 'New status distribution:' as message;
SELECT AccountStatus, COUNT(*) as count 
FROM userprofile 
GROUP BY AccountStatus;

-- Step 6: Alter table to remove 'Suspended' from ENUM
-- WARNING: This will lock the table briefly
ALTER TABLE userprofile 
MODIFY COLUMN AccountStatus ENUM('Active', 'Banned') NOT NULL DEFAULT 'Active';

SELECT 'Schema updated successfully' as message;

-- Step 7: Final verification
DESCRIBE userprofile;

-- Cleanup note (run manually only if everything works):
-- DROP TABLE userprofile_backup;