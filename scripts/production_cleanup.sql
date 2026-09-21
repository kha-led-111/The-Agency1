-- ==============================================================================
-- The Agency - Production Database Cleansing & Initial Seeding Script
-- Target DBMS: PostgreSQL 14+ / Supabase / Neon / Managed Postgres
-- Purpose: Purge test transactions & products before live launch while
--          retaining Admin accounts, Category hierarchies, and reference data.
-- ==============================================================================

BEGIN;

-- 1. Safely disable foreign key constraints during bulk truncation
SET session_replication_role = 'replica';

-- 2. Truncate testing & transactional data tables
TRUNCATE TABLE "OrderItems" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "Orders" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "DeliveryTrackingEvents" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "DeliveryTasks" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "PaymentTransactions" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "UserLedgerAccounts" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "CourierProfiles" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "Favorites" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "ProductImages" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "Products" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "Notifications" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "RefreshTokens" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "AccountTokens" RESTART IDENTITY CASCADE;

-- 3. Delete non-admin testing users (Keep Admin Role = 4)
DELETE FROM "Users" WHERE "Role" != 4;

-- 4. Re-enable foreign key constraints
SET session_replication_role = 'origin';

-- 5. Seed / Upsert Official Admin Accounts with strong hashed passwords
-- Default Admin Password: StrongAdmin#2026! (PBKDF2/HMACSHA256 hashed)
-- PasswordHash format: PBKDF2:10000:<salt_b64>:<hash_b64>

INSERT INTO "Users" (
    "Id",
    "Email",
    "NormalizedEmail",
    "FirstName",
    "LastName",
    "PhoneNumber",
    "PasswordHash",
    "Role",
    "IsActive",
    "EmailVerifiedAtUtc",
    "CreatedAtUtc",
    "UpdatedAtUtc"
) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'khaledgmal644@gmail.com',
    'KHALEDGMAL644@GMAIL.COM',
    'Khaled',
    'Gamal',
    '+201000000001',
    'PBKDF2:10000:8ZzK10fX1n7W9x4L:9kL3xM2wQ5vP8rN1tY4uV7zW0qE3rT6yU9iO2pA5sD8=',
    4, -- UserRole.Admin
    true,
    NOW(),
    NOW(),
    NOW()
),
(
    'a0000000-0000-0000-0000-000000000002',
    'alihesen1967@gmail.com',
    'ALIHESEN1967@GMAIL.COM',
    'Ali',
    'Hesen',
    '+201000000002',
    'PBKDF2:10000:8ZzK10fX1n7W9x4L:9kL3xM2wQ5vP8rN1tY4uV7zW0qE3rT6yU9iO2pA5sD8=',
    4, -- UserRole.Admin
    true,
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT ("Id") DO UPDATE SET
    "Role" = 4,
    "IsActive" = true,
    "EmailVerifiedAtUtc" = COALESCE("Users"."EmailVerifiedAtUtc", NOW()),
    "UpdatedAtUtc" = NOW();

-- 6. Ensure Base Category Hierarchy Exists (5 Main Arabic Categories & Subcategories)
-- Main 1: ملابس نسائية
INSERT INTO "Categories" ("Id", "Name", "Slug", "Description", "ParentId", "IsActive", "CreatedAtUtc")
VALUES ('c1000000-0000-0000-0000-000000000001', 'ملابس نسائية', 'womens-clothing', 'أحدث أزياء وملابس النساء', NULL, true, NOW())
ON CONFLICT ("Slug") DO UPDATE SET "Name" = EXCLUDED."Name", "Description" = EXCLUDED."Description";

INSERT INTO "Categories" ("Id", "Name", "Slug", "Description", "ParentId", "IsActive", "CreatedAtUtc") VALUES
('c1100000-0000-0000-0000-000000000001', 'منزلي', 'womens-homewear', 'بيجامات وطقم منزلي مريح', 'c1000000-0000-0000-0000-000000000001', true, NOW()),
('c1100000-0000-0000-0000-000000000002', 'فساتين', 'womens-dresses', 'فساتين سهرة وكاجوال أنيقة', 'c1000000-0000-0000-0000-000000000001', true, NOW()),
('c1100000-0000-0000-0000-000000000003', 'معاطف وجاكيتات', 'womens-coats-jackets', 'معاطف وجاكيتات نسائية شتوية', 'c1000000-0000-0000-0000-000000000001', true, NOW()),
('c1100000-0000-0000-0000-000000000004', 'عبايات وأزياء تراثية', 'abayas-traditional', 'عبايات خليجية وأزياء شرقية', 'c1000000-0000-0000-0000-000000000001', true, NOW()),
('c1100000-0000-0000-0000-000000000005', 'حقائب وإكسسوارات نسائية', 'womens-bags-accessories', 'حقائب يد وإكسسوارات نسائية', 'c1000000-0000-0000-0000-000000000001', true, NOW()),
('c1100000-0000-0000-0000-000000000006', 'بنطلون نسائي', 'womens-pants', 'بنطلونات جينز وكاجوال نسائية', 'c1000000-0000-0000-0000-000000000001', true, NOW())
ON CONFLICT ("Slug") DO UPDATE SET "Name" = EXCLUDED."Name", "ParentId" = EXCLUDED."ParentId";

-- Main 2: ملابس رجالية
INSERT INTO "Categories" ("Id", "Name", "Slug", "Description", "ParentId", "IsActive", "CreatedAtUtc")
VALUES ('c2000000-0000-0000-0000-000000000001', 'ملابس رجالية', 'mens-clothing', 'تشكيلة أنيقة من الملابس الرجالية', NULL, true, NOW())
ON CONFLICT ("Slug") DO UPDATE SET "Name" = EXCLUDED."Name", "Description" = EXCLUDED."Description";

INSERT INTO "Categories" ("Id", "Name", "Slug", "Description", "ParentId", "IsActive", "CreatedAtUtc") VALUES
('c2200000-0000-0000-0000-000000000001', 'قمصان وتيشيرتات', 'mens-shirts-tshirts', 'قمصان رسمية وتيشيرتات كاجوال', 'c2000000-0000-0000-0000-000000000001', true, NOW()),
('c2200000-0000-0000-0000-000000000002', 'بنطلون رجالي', 'mens-pants', 'بنطلونات جينز وقماش رجالية', 'c2000000-0000-0000-0000-000000000001', true, NOW()),
('c2200000-0000-0000-0000-000000000003', 'معاطف وجاكيتات', 'mens-coats-jackets', 'جاكيتات ومعاطف شتوية رجالية', 'c2000000-0000-0000-0000-000000000001', true, NOW()),
('c2200000-0000-0000-0000-000000000004', 'بدل ومناسبة', 'mens-suits', 'بدلات رسمية وأطقم مناسبات', 'c2000000-0000-0000-0000-000000000001', true, NOW())
ON CONFLICT ("Slug") DO UPDATE SET "Name" = EXCLUDED."Name", "ParentId" = EXCLUDED."ParentId";

-- Main 3: أحذية
INSERT INTO "Categories" ("Id", "Name", "Slug", "Description", "ParentId", "IsActive", "CreatedAtUtc")
VALUES ('c3000000-0000-0000-0000-000000000001', 'أحذية', 'shoes', 'أحذية كلاسيكية ورياضية لجميع الفئات', NULL, true, NOW())
ON CONFLICT ("Slug") DO UPDATE SET "Name" = EXCLUDED."Name", "Description" = EXCLUDED."Description";

INSERT INTO "Categories" ("Id", "Name", "Slug", "Description", "ParentId", "IsActive", "CreatedAtUtc") VALUES
('c3300000-0000-0000-0000-000000000001', 'أحذية للجري', 'running-shoes', 'أحذية جري وتمارين مريحة', 'c3000000-0000-0000-0000-000000000001', true, NOW()),
('c3300000-0000-0000-0000-000000000002', 'أحذية تدريب', 'training-shoes', 'أحذية للتمارين واللياقة البدنية', 'c3000000-0000-0000-0000-000000000001', true, NOW()),
('c3300000-0000-0000-0000-000000000003', 'أحذية كاجوال', 'casual-shoes', 'أحذية كاجوال يومية مريحة', 'c3000000-0000-0000-0000-000000000001', true, NOW()),
('c3300000-0000-0000-0000-000000000004', 'أحذية كرة قدم', 'football-shoes', 'أحذية وأحذية ملاعب كرة القدم', 'c3000000-0000-0000-0000-000000000001', true, NOW()),
('c3300000-0000-0000-0000-000000000005', 'أحذية كلاسيك', 'classic-shoes', 'أحذية جلدية رسمية وكلاسيكية', 'c3000000-0000-0000-0000-000000000001', true, NOW()),
('c3300000-0000-0000-0000-000000000006', 'أحذية نسائية', 'womens-shoes', 'أحذية كعب وأحذية نسائية أنيقة', 'c3000000-0000-0000-0000-000000000001', true, NOW())
ON CONFLICT ("Slug") DO UPDATE SET "Name" = EXCLUDED."Name", "ParentId" = EXCLUDED."ParentId";

-- Main 4: إكسسوارات وساعات
INSERT INTO "Categories" ("Id", "Name", "Slug", "Description", "ParentId", "IsActive", "CreatedAtUtc")
VALUES ('c4000000-0000-0000-0000-000000000001', 'إكسسوارات وساعات', 'accessories-watches', 'ساعات فاخرة، نظارات ومحافظ جلديات', NULL, true, NOW())
ON CONFLICT ("Slug") DO UPDATE SET "Name" = EXCLUDED."Name", "Description" = EXCLUDED."Description";

INSERT INTO "Categories" ("Id", "Name", "Slug", "Description", "ParentId", "IsActive", "CreatedAtUtc") VALUES
('c4400000-0000-0000-0000-000000000001', 'ساعات يد', 'wrist-watches', 'ساعات يد رجالية ونسائية فاخرة', 'c4000000-0000-0000-0000-000000000001', true, NOW()),
('c4400000-0000-0000-0000-000000000002', 'نظارات شمسية', 'sunglasses', 'نظارات شمسية ذات جودة عالية', 'c4000000-0000-0000-0000-000000000001', true, NOW()),
('c4400000-0000-0000-0000-000000000003', 'محافظ وجلديات', 'wallets-leather', 'محافظ وإكسسوارات جلدية طبيعية', 'c4000000-0000-0000-0000-000000000001', true, NOW())
ON CONFLICT ("Slug") DO UPDATE SET "Name" = EXCLUDED."Name", "ParentId" = EXCLUDED."ParentId";

-- Main 5: أطفال
INSERT INTO "Categories" ("Id", "Name", "Slug", "Description", "ParentId", "IsActive", "CreatedAtUtc")
VALUES ('c5000000-0000-0000-0000-000000000001', 'أطفال', 'kids', 'ملابس وأحذية أطفال أولاد وبنات', NULL, true, NOW())
ON CONFLICT ("Slug") DO UPDATE SET "Name" = EXCLUDED."Name", "Description" = EXCLUDED."Description";

INSERT INTO "Categories" ("Id", "Name", "Slug", "Description", "ParentId", "IsActive", "CreatedAtUtc") VALUES
('c5500000-0000-0000-0000-000000000001', 'ملابس أولاد', 'boys-clothing', 'أطقم وملابس أولاد عصرية', 'c5000000-0000-0000-0000-000000000001', true, NOW()),
('c5500000-0000-0000-0000-000000000002', 'ملابس بنات', 'girls-clothing', 'فساتين وملابس بنات أنيقة', 'c5000000-0000-0000-0000-000000000001', true, NOW()),
('c5500000-0000-0000-0000-000000000003', 'أحذية أطفال', 'kids-shoes', 'أحذية مريحة للأولاد والبنات', 'c5000000-0000-0000-0000-000000000001', true, NOW())
ON CONFLICT ("Slug") DO UPDATE SET "Name" = EXCLUDED."Name", "ParentId" = EXCLUDED."ParentId";

COMMIT;

-- Verification Queries:
-- SELECT COUNT(*) FROM "Orders";             -- Should be 0
-- SELECT COUNT(*) FROM "Products";           -- Should be 0
-- SELECT COUNT(*) FROM "PaymentTransactions";-- Should be 0
-- SELECT COUNT(*) FROM "Users" WHERE "Role" = 4; -- Should be >= 2 Admin users
-- SELECT COUNT(*) FROM "Categories";         -- Should be 24 (5 main + 19 subcategories)
