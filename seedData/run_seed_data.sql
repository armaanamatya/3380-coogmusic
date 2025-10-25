-- CoogMusic Database Seeding Script
-- This script creates the database schema and populates it with comprehensive seed data

-- Read and execute the schema file
.read ../backend/src/schema.sqlite.sql

-- Read and execute the seed data file
.read seed_data.sql

-- Display completion message
SELECT 'Database seeding completed successfully!' as Status;
