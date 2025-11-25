-- Migration script to randomly assign Suspended users to Active or Banned status
-- Run this script after updating the schema to remove 'Suspended' status

-- Update suspended users to either Active or Banned randomly
UPDATE userprofile 
SET AccountStatus = CASE 
    WHEN RAND() < 0.5 THEN 'Active'
    ELSE 'Banned'
END 
WHERE AccountStatus = 'Suspended';

-- For SQLite version (if using SQLite):
-- UPDATE userprofile 
-- SET AccountStatus = CASE 
--     WHEN (ABS(RANDOM()) % 2) = 0 THEN 'Active'
--     ELSE 'Banned'
-- END 
-- WHERE AccountStatus = 'Suspended';