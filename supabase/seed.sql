-- UPDATED Fixed Seed Data for Study Materials Management System - Khulna University
-- This file includes ALL 29 disciplines with complete batches
-- 
-- Usage: Copy and paste this entire file in Supabase SQL Editor
-- 
-- What this fixes:
-- 1. Adds ALL 29 disciplines (was missing Statistics and Agrotechnology)
-- 2. Creates 232 total batches (29 disciplines × 8 batches each)
-- 3. Uses consistent UUID format 
-- 4. Follows proper academic year structure (Year 1-4, Semester 1-2)

-- First, let's clean up any inconsistent batch data and rebuild properly
TRUNCATE TABLE batches CASCADE;

-- Insert ALL 29 disciplines with correct data
INSERT INTO disciplines (id, name, code, description) VALUES
    -- Engineering Disciplines  
    ('11111111-1111-1111-1111-111111111111', 'Computer Science and Engineering', 'CSE', 'Computer Science and Engineering Discipline'),
    ('22222222-2222-2222-2222-222222222222', 'Electronics and Communication Engineering', 'ECE', 'Electronics and Communication Engineering Discipline'),
    ('33333333-3333-3333-3333-333333333333', 'Architecture', 'ARCH', 'Architecture Discipline'),
    ('44444444-4444-4444-4444-444444444444', 'Urban and Rural Planning', 'URP', 'Urban and Rural Planning Discipline'),
    
    -- Business Disciplines
    ('55555555-5555-5555-5555-555555555555', 'Business Administration', 'BA', 'Business Administration Discipline'),
    ('66666666-6666-6666-6666-666666666666', 'Human Resource Management', 'HRM', 'Human Resource Management Discipline'),
    
    -- Science & Technology Disciplines
    ('77777777-7777-7777-7777-777777777777', 'Mathematics', 'MATH', 'Mathematics Discipline'),
    ('88888888-8888-8888-8888-888888888888', 'Physics', 'PHY', 'Physics Discipline'),
    ('99999999-9999-9999-9999-999999999999', 'Chemistry', 'CHEM', 'Chemistry Discipline'),
    ('10101010-1010-1010-1010-101010101010', 'Statistics', 'STAT', 'Statistics Discipline'),
    
    -- Life Sciences & Environment Disciplines
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Environmental Science', 'ENV', 'Environmental Science Discipline'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Fisheries and Marine Resources Technology', 'FMRT', 'Fisheries and Marine Resources Technology Discipline'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Biotechnology and Genetic Engineering', 'BGE', 'Biotechnology and Genetic Engineering Discipline'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Forestry and Wood Technology', 'FWT', 'Forestry and Wood Technology Discipline'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Pharmacy', 'PHAR', 'Pharmacy Discipline'),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Soil, Water and Environment', 'SWE', 'Soil, Water and Environment Discipline'),
    ('21212121-2121-2121-2121-212121212121', 'Agrotechnology', 'AGRO', 'Agrotechnology Discipline'),
    
    -- Social Science Disciplines
    ('abababab-abab-abab-abab-abababababab', 'Economics', 'ECON', 'Economics Discipline'),
    ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', 'Development Studies', 'DS', 'Development Studies Discipline'),
    ('efefefef-efef-efef-efef-efefefefefef', 'Sociology', 'SOC', 'Sociology Discipline'),
    ('12121212-1212-1212-1212-121212121212', 'Mass Communication and Journalism', 'MCJ', 'Mass Communication and Journalism Discipline'),
    
    -- Language & Literature Disciplines  
    ('13131313-1313-1313-1313-131313131313', 'English', 'ENG', 'English Discipline'),
    ('14141414-1414-1414-1414-141414141414', 'Bangla', 'BAN', 'Bangla Discipline'),
    ('15151515-1515-1515-1515-151515151515', 'History and Civilization', 'HC', 'History and Civilization Discipline'),
    
    -- Law
    ('16161616-1616-1616-1616-161616161616', 'Law', 'LAW', 'Law Discipline'),
    
    -- Fine Arts
    ('17171717-1717-1717-1717-171717171717', 'Drawing and Painting', 'DP', 'Drawing and Painting Discipline'),
    ('18181818-1818-1818-1818-181818181818', 'Print Making', 'PM', 'Print Making Discipline'),
    ('19191919-1919-1919-1919-191919191919', 'Sculpture', 'SCP', 'Sculpture Discipline'),
    
    -- Education
    ('20202020-2020-2020-2020-202020202020', 'Education', 'EDU', 'Education Discipline')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Insert comprehensive batches for ALL 29 disciplines (4 years × 2 semesters = 8 batches per discipline)
-- Total: 29 disciplines × 8 batches = 232 batches

INSERT INTO batches (id, discipline_id, year, semester, code) VALUES
    -- Computer Science and Engineering (CSE) - 8 batches
    ('11111111-1111-1111-1111-111111111001', '11111111-1111-1111-1111-111111111111', 1, '1', 'CSE-1-1'),
    ('11111111-1111-1111-1111-111111111002', '11111111-1111-1111-1111-111111111111', 1, '2', 'CSE-1-2'),
    ('11111111-1111-1111-1111-111111111003', '11111111-1111-1111-1111-111111111111', 2, '1', 'CSE-2-1'),
    ('11111111-1111-1111-1111-111111111004', '11111111-1111-1111-1111-111111111111', 2, '2', 'CSE-2-2'),
    ('11111111-1111-1111-1111-111111111005', '11111111-1111-1111-1111-111111111111', 3, '1', 'CSE-3-1'),
    ('11111111-1111-1111-1111-111111111006', '11111111-1111-1111-1111-111111111111', 3, '2', 'CSE-3-2'),
    ('11111111-1111-1111-1111-111111111007', '11111111-1111-1111-1111-111111111111', 4, '1', 'CSE-4-1'),
    ('11111111-1111-1111-1111-111111111008', '11111111-1111-1111-1111-111111111111', 4, '2', 'CSE-4-2'),

    -- Electronics and Communication Engineering (ECE) - 8 batches  
    ('22222222-2222-2222-2222-222222222001', '22222222-2222-2222-2222-222222222222', 1, '1', 'ECE-1-1'),
    ('22222222-2222-2222-2222-222222222002', '22222222-2222-2222-2222-222222222222', 1, '2', 'ECE-1-2'),
    ('22222222-2222-2222-2222-222222222003', '22222222-2222-2222-2222-222222222222', 2, '1', 'ECE-2-1'),
    ('22222222-2222-2222-2222-222222222004', '22222222-2222-2222-2222-222222222222', 2, '2', 'ECE-2-2'),
    ('22222222-2222-2222-2222-222222222005', '22222222-2222-2222-2222-222222222222', 3, '1', 'ECE-3-1'),
    ('22222222-2222-2222-2222-222222222006', '22222222-2222-2222-2222-222222222222', 3, '2', 'ECE-3-2'),
    ('22222222-2222-2222-2222-222222222007', '22222222-2222-2222-2222-222222222222', 4, '1', 'ECE-4-1'),
    ('22222222-2222-2222-2222-222222222008', '22222222-2222-2222-2222-222222222222', 4, '2', 'ECE-4-2'),

    -- Architecture (ARCH) - 8 batches
    ('33333333-3333-3333-3333-333333333001', '33333333-3333-3333-3333-333333333333', 1, '1', 'ARCH-1-1'),
    ('33333333-3333-3333-3333-333333333002', '33333333-3333-3333-3333-333333333333', 1, '2', 'ARCH-1-2'),
    ('33333333-3333-3333-3333-333333333003', '33333333-3333-3333-3333-333333333333', 2, '1', 'ARCH-2-1'),
    ('33333333-3333-3333-3333-333333333004', '33333333-3333-3333-3333-333333333333', 2, '2', 'ARCH-2-2'),
    ('33333333-3333-3333-3333-333333333005', '33333333-3333-3333-3333-333333333333', 3, '1', 'ARCH-3-1'),
    ('33333333-3333-3333-3333-333333333006', '33333333-3333-3333-3333-333333333333', 3, '2', 'ARCH-3-2'),
    ('33333333-3333-3333-3333-333333333007', '33333333-3333-3333-3333-333333333333', 4, '1', 'ARCH-4-1'),
    ('33333333-3333-3333-3333-333333333008', '33333333-3333-3333-3333-333333333333', 4, '2', 'ARCH-4-2'),

    -- Urban and Rural Planning (URP) - 8 batches
    ('44444444-4444-4444-4444-444444444001', '44444444-4444-4444-4444-444444444444', 1, '1', 'URP-1-1'),
    ('44444444-4444-4444-4444-444444444002', '44444444-4444-4444-4444-444444444444', 1, '2', 'URP-1-2'),
    ('44444444-4444-4444-4444-444444444003', '44444444-4444-4444-4444-444444444444', 2, '1', 'URP-2-1'),
    ('44444444-4444-4444-4444-444444444004', '44444444-4444-4444-4444-444444444444', 2, '2', 'URP-2-2'),
    ('44444444-4444-4444-4444-444444444005', '44444444-4444-4444-4444-444444444444', 3, '1', 'URP-3-1'),
    ('44444444-4444-4444-4444-444444444006', '44444444-4444-4444-4444-444444444444', 3, '2', 'URP-3-2'),
    ('44444444-4444-4444-4444-444444444007', '44444444-4444-4444-4444-444444444444', 4, '1', 'URP-4-1'),
    ('44444444-4444-4444-4444-444444444008', '44444444-4444-4444-4444-444444444444', 4, '2', 'URP-4-2'),

    -- Business Administration (BA) - 8 batches
    ('55555555-5555-5555-5555-555555555001', '55555555-5555-5555-5555-555555555555', 1, '1', 'BA-1-1'),
    ('55555555-5555-5555-5555-555555555002', '55555555-5555-5555-5555-555555555555', 1, '2', 'BA-1-2'),
    ('55555555-5555-5555-5555-555555555003', '55555555-5555-5555-5555-555555555555', 2, '1', 'BA-2-1'),
    ('55555555-5555-5555-5555-555555555004', '55555555-5555-5555-5555-555555555555', 2, '2', 'BA-2-2'),
    ('55555555-5555-5555-5555-555555555005', '55555555-5555-5555-5555-555555555555', 3, '1', 'BA-3-1'),
    ('55555555-5555-5555-5555-555555555006', '55555555-5555-5555-5555-555555555555', 3, '2', 'BA-3-2'),
    ('55555555-5555-5555-5555-555555555007', '55555555-5555-5555-5555-555555555555', 4, '1', 'BA-4-1'),
    ('55555555-5555-5555-5555-555555555008', '55555555-5555-5555-5555-555555555555', 4, '2', 'BA-4-2'),

    -- Human Resource Management (HRM) - 8 batches
    ('66666666-6666-6666-6666-666666666001', '66666666-6666-6666-6666-666666666666', 1, '1', 'HRM-1-1'),
    ('66666666-6666-6666-6666-666666666002', '66666666-6666-6666-6666-666666666666', 1, '2', 'HRM-1-2'),
    ('66666666-6666-6666-6666-666666666003', '66666666-6666-6666-6666-666666666666', 2, '1', 'HRM-2-1'),
    ('66666666-6666-6666-6666-666666666004', '66666666-6666-6666-6666-666666666666', 2, '2', 'HRM-2-2'),
    ('66666666-6666-6666-6666-666666666005', '66666666-6666-6666-6666-666666666666', 3, '1', 'HRM-3-1'),
    ('66666666-6666-6666-6666-666666666006', '66666666-6666-6666-6666-666666666666', 3, '2', 'HRM-3-2'),
    ('66666666-6666-6666-6666-666666666007', '66666666-6666-6666-6666-666666666666', 4, '1', 'HRM-4-1'),
    ('66666666-6666-6666-6666-666666666008', '66666666-6666-6666-6666-666666666666', 4, '2', 'HRM-4-2'),

    -- Mathematics (MATH) - 8 batches
    ('77777777-7777-7777-7777-777777777001', '77777777-7777-7777-7777-777777777777', 1, '1', 'MATH-1-1'),
    ('77777777-7777-7777-7777-777777777002', '77777777-7777-7777-7777-777777777777', 1, '2', 'MATH-1-2'),
    ('77777777-7777-7777-7777-777777777003', '77777777-7777-7777-7777-777777777777', 2, '1', 'MATH-2-1'),
    ('77777777-7777-7777-7777-777777777004', '77777777-7777-7777-7777-777777777777', 2, '2', 'MATH-2-2'),
    ('77777777-7777-7777-7777-777777777005', '77777777-7777-7777-7777-777777777777', 3, '1', 'MATH-3-1'),
    ('77777777-7777-7777-7777-777777777006', '77777777-7777-7777-7777-777777777777', 3, '2', 'MATH-3-2'),
    ('77777777-7777-7777-7777-777777777007', '77777777-7777-7777-7777-777777777777', 4, '1', 'MATH-4-1'),
    ('77777777-7777-7777-7777-777777777008', '77777777-7777-7777-7777-777777777777', 4, '2', 'MATH-4-2'),

    -- Physics (PHY) - 8 batches
    ('88888888-8888-8888-8888-888888888001', '88888888-8888-8888-8888-888888888888', 1, '1', 'PHY-1-1'),
    ('88888888-8888-8888-8888-888888888002', '88888888-8888-8888-8888-888888888888', 1, '2', 'PHY-1-2'),
    ('88888888-8888-8888-8888-888888888003', '88888888-8888-8888-8888-888888888888', 2, '1', 'PHY-2-1'),
    ('88888888-8888-8888-8888-888888888004', '88888888-8888-8888-8888-888888888888', 2, '2', 'PHY-2-2'),
    ('88888888-8888-8888-8888-888888888005', '88888888-8888-8888-8888-888888888888', 3, '1', 'PHY-3-1'),
    ('88888888-8888-8888-8888-888888888006', '88888888-8888-8888-8888-888888888888', 3, '2', 'PHY-3-2'),
    ('88888888-8888-8888-8888-888888888007', '88888888-8888-8888-8888-888888888888', 4, '1', 'PHY-4-1'),
    ('88888888-8888-8888-8888-888888888008', '88888888-8888-8888-8888-888888888888', 4, '2', 'PHY-4-2'),

    -- Chemistry (CHEM) - 8 batches
    ('99999999-9999-9999-9999-999999999001', '99999999-9999-9999-9999-999999999999', 1, '1', 'CHEM-1-1'),
    ('99999999-9999-9999-9999-999999999002', '99999999-9999-9999-9999-999999999999', 1, '2', 'CHEM-1-2'),
    ('99999999-9999-9999-9999-999999999003', '99999999-9999-9999-9999-999999999999', 2, '1', 'CHEM-2-1'),
    ('99999999-9999-9999-9999-999999999004', '99999999-9999-9999-9999-999999999999', 2, '2', 'CHEM-2-2'),
    ('99999999-9999-9999-9999-999999999005', '99999999-9999-9999-9999-999999999999', 3, '1', 'CHEM-3-1'),
    ('99999999-9999-9999-9999-999999999006', '99999999-9999-9999-9999-999999999999', 3, '2', 'CHEM-3-2'),
    ('99999999-9999-9999-9999-999999999007', '99999999-9999-9999-9999-999999999999', 4, '1', 'CHEM-4-1'),
    ('99999999-9999-9999-9999-999999999008', '99999999-9999-9999-9999-999999999999', 4, '2', 'CHEM-4-2'),

    -- Statistics (STAT) - 8 batches *** NEWLY ADDED ***
    ('10101010-1010-1010-1010-101010101001', '10101010-1010-1010-1010-101010101010', 1, '1', 'STAT-1-1'),
    ('10101010-1010-1010-1010-101010101002', '10101010-1010-1010-1010-101010101010', 1, '2', 'STAT-1-2'),
    ('10101010-1010-1010-1010-101010101003', '10101010-1010-1010-1010-101010101010', 2, '1', 'STAT-2-1'),
    ('10101010-1010-1010-1010-101010101004', '10101010-1010-1010-1010-101010101010', 2, '2', 'STAT-2-2'),
    ('10101010-1010-1010-1010-101010101005', '10101010-1010-1010-1010-101010101010', 3, '1', 'STAT-3-1'),
    ('10101010-1010-1010-1010-101010101006', '10101010-1010-1010-1010-101010101010', 3, '2', 'STAT-3-2'),
    ('10101010-1010-1010-1010-101010101007', '10101010-1010-1010-1010-101010101010', 4, '1', 'STAT-4-1'),
    ('10101010-1010-1010-1010-101010101008', '10101010-1010-1010-1010-101010101010', 4, '2', 'STAT-4-2'),

    -- Environmental Science (ENV) - 8 batches
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, '1', 'ENV-1-1'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, '2', 'ENV-1-2'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, '1', 'ENV-2-1'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, '2', 'ENV-2-2'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, '1', 'ENV-3-1'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, '2', 'ENV-3-2'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, '1', 'ENV-4-1'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, '2', 'ENV-4-2'),

    -- Fisheries and Marine Resources Technology (FMRT) - 8 batches
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, '1', 'FMRT-1-1'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, '2', 'FMRT-1-2'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, '1', 'FMRT-2-1'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, '2', 'FMRT-2-2'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb05', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 3, '1', 'FMRT-3-1'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb06', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 3, '2', 'FMRT-3-2'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb07', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, '1', 'FMRT-4-1'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb08', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, '2', 'FMRT-4-2'),

    -- Biotechnology and Genetic Engineering (BGE) - 8 batches
    ('cccccccc-cccc-cccc-cccc-cccccccccc01', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, '1', 'BGE-1-1'),
    ('cccccccc-cccc-cccc-cccc-cccccccccc02', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, '2', 'BGE-1-2'),
    ('cccccccc-cccc-cccc-cccc-cccccccccc03', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 2, '1', 'BGE-2-1'),
    ('cccccccc-cccc-cccc-cccc-cccccccccc04', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 2, '2', 'BGE-2-2'),
    ('cccccccc-cccc-cccc-cccc-cccccccccc05', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 3, '1', 'BGE-3-1'),
    ('cccccccc-cccc-cccc-cccc-cccccccccc06', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 3, '2', 'BGE-3-2'),
    ('cccccccc-cccc-cccc-cccc-cccccccccc07', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, '1', 'BGE-4-1'),
    ('cccccccc-cccc-cccc-cccc-cccccccccc08', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, '2', 'BGE-4-2'),

    -- Forestry and Wood Technology (FWT) - 8 batches
    ('dddddddd-dddd-dddd-dddd-dddddddddd01', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1, '1', 'FWT-1-1'),
    ('dddddddd-dddd-dddd-dddd-dddddddddd02', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1, '2', 'FWT-1-2'),
    ('dddddddd-dddd-dddd-dddd-dddddddddd03', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 2, '1', 'FWT-2-1'),
    ('dddddddd-dddd-dddd-dddd-dddddddddd04', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 2, '2', 'FWT-2-2'),
    ('dddddddd-dddd-dddd-dddd-dddddddddd05', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 3, '1', 'FWT-3-1'),
    ('dddddddd-dddd-dddd-dddd-dddddddddd06', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 3, '2', 'FWT-3-2'),
    ('dddddddd-dddd-dddd-dddd-dddddddddd07', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 4, '1', 'FWT-4-1'),
    ('dddddddd-dddd-dddd-dddd-dddddddddd08', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 4, '2', 'FWT-4-2'),

    -- Pharmacy (PHAR) - 8 batches
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1, '1', 'PHAR-1-1'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1, '2', 'PHAR-1-2'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 2, '1', 'PHAR-2-1'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee04', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 2, '2', 'PHAR-2-2'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee05', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, '1', 'PHAR-3-1'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee06', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, '2', 'PHAR-3-2'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee07', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 4, '1', 'PHAR-4-1'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee08', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 4, '2', 'PHAR-4-2'),

    -- Soil, Water and Environment (SWE) - 8 batches
    ('ffffffff-ffff-ffff-ffff-ffffffffff01', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1, '1', 'SWE-1-1'),
    ('ffffffff-ffff-ffff-ffff-ffffffffff02', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1, '2', 'SWE-1-2'),
    ('ffffffff-ffff-ffff-ffff-ffffffffff03', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 2, '1', 'SWE-2-1'),
    ('ffffffff-ffff-ffff-ffff-ffffffffff04', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 2, '2', 'SWE-2-2'),
    ('ffffffff-ffff-ffff-ffff-ffffffffff05', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, '1', 'SWE-3-1'),
    ('ffffffff-ffff-ffff-ffff-ffffffffff06', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, '2', 'SWE-3-2'),
    ('ffffffff-ffff-ffff-ffff-ffffffffff07', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 4, '1', 'SWE-4-1'),
    ('ffffffff-ffff-ffff-ffff-ffffffffff08', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 4, '2', 'SWE-4-2'),

    -- Agrotechnology (AGRO) - 8 batches *** NEWLY ADDED ***
    ('21212121-2121-2121-2121-212121212001', '21212121-2121-2121-2121-212121212121', 1, '1', 'AGRO-1-1'),
    ('21212121-2121-2121-2121-212121212002', '21212121-2121-2121-2121-212121212121', 1, '2', 'AGRO-1-2'),
    ('21212121-2121-2121-2121-212121212003', '21212121-2121-2121-2121-212121212121', 2, '1', 'AGRO-2-1'),
    ('21212121-2121-2121-2121-212121212004', '21212121-2121-2121-2121-212121212121', 2, '2', 'AGRO-2-2'),
    ('21212121-2121-2121-2121-212121212005', '21212121-2121-2121-2121-212121212121', 3, '1', 'AGRO-3-1'),
    ('21212121-2121-2121-2121-212121212006', '21212121-2121-2121-2121-212121212121', 3, '2', 'AGRO-3-2'),
    ('21212121-2121-2121-2121-212121212007', '21212121-2121-2121-2121-212121212121', 4, '1', 'AGRO-4-1'),
    ('21212121-2121-2121-2121-212121212008', '21212121-2121-2121-2121-212121212121', 4, '2', 'AGRO-4-2'),

    -- Economics (ECON) - 8 batches
    ('abababab-abab-abab-abab-ababababa001', 'abababab-abab-abab-abab-abababababab', 1, '1', 'ECON-1-1'),
    ('abababab-abab-abab-abab-ababababa002', 'abababab-abab-abab-abab-abababababab', 1, '2', 'ECON-1-2'),
    ('abababab-abab-abab-abab-ababababa003', 'abababab-abab-abab-abab-abababababab', 2, '1', 'ECON-2-1'),
    ('abababab-abab-abab-abab-ababababa004', 'abababab-abab-abab-abab-abababababab', 2, '2', 'ECON-2-2'),
    ('abababab-abab-abab-abab-ababababa005', 'abababab-abab-abab-abab-abababababab', 3, '1', 'ECON-3-1'),
    ('abababab-abab-abab-abab-ababababa006', 'abababab-abab-abab-abab-abababababab', 3, '2', 'ECON-3-2'),
    ('abababab-abab-abab-abab-ababababa007', 'abababab-abab-abab-abab-abababababab', 4, '1', 'ECON-4-1'),
    ('abababab-abab-abab-abab-ababababa008', 'abababab-abab-abab-abab-abababababab', 4, '2', 'ECON-4-2'),

    -- Development Studies (DS) - 8 batches
    ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdc001', 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', 1, '1', 'DS-1-1'),
    ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdc002', 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', 1, '2', 'DS-1-2'),
    ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdc003', 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', 2, '1', 'DS-2-1'),
    ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdc004', 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', 2, '2', 'DS-2-2'),
    ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdc005', 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', 3, '1', 'DS-3-1'),
    ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdc006', 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', 3, '2', 'DS-3-2'),
    ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdc007', 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', 4, '1', 'DS-4-1'),
    ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdc008', 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', 4, '2', 'DS-4-2'),

    -- Sociology (SOC) - 8 batches
    ('efefefef-efef-efef-efef-efefefefe001', 'efefefef-efef-efef-efef-efefefefefef', 1, '1', 'SOC-1-1'),
    ('efefefef-efef-efef-efef-efefefefe002', 'efefefef-efef-efef-efef-efefefefefef', 1, '2', 'SOC-1-2'),
    ('efefefef-efef-efef-efef-efefefefe003', 'efefefef-efef-efef-efef-efefefefefef', 2, '1', 'SOC-2-1'),
    ('efefefef-efef-efef-efef-efefefefe004', 'efefefef-efef-efef-efef-efefefefefef', 2, '2', 'SOC-2-2'),
    ('efefefef-efef-efef-efef-efefefefe005', 'efefefef-efef-efef-efef-efefefefefef', 3, '1', 'SOC-3-1'),
    ('efefefef-efef-efef-efef-efefefefe006', 'efefefef-efef-efef-efef-efefefefefef', 3, '2', 'SOC-3-2'),
    ('efefefef-efef-efef-efef-efefefefe007', 'efefefef-efef-efef-efef-efefefefefef', 4, '1', 'SOC-4-1'),
    ('efefefef-efef-efef-efef-efefefefe008', 'efefefef-efef-efef-efef-efefefefefef', 4, '2', 'SOC-4-2'),

    -- Mass Communication and Journalism (MCJ) - 8 batches
    ('12121212-1212-1212-1212-121212121001', '12121212-1212-1212-1212-121212121212', 1, '1', 'MCJ-1-1'),
    ('12121212-1212-1212-1212-121212121002', '12121212-1212-1212-1212-121212121212', 1, '2', 'MCJ-1-2'),
    ('12121212-1212-1212-1212-121212121003', '12121212-1212-1212-1212-121212121212', 2, '1', 'MCJ-2-1'),
    ('12121212-1212-1212-1212-121212121004', '12121212-1212-1212-1212-121212121212', 2, '2', 'MCJ-2-2'),
    ('12121212-1212-1212-1212-121212121005', '12121212-1212-1212-1212-121212121212', 3, '1', 'MCJ-3-1'),
    ('12121212-1212-1212-1212-121212121006', '12121212-1212-1212-1212-121212121212', 3, '2', 'MCJ-3-2'),
    ('12121212-1212-1212-1212-121212121007', '12121212-1212-1212-1212-121212121212', 4, '1', 'MCJ-4-1'),
    ('12121212-1212-1212-1212-121212121008', '12121212-1212-1212-1212-121212121212', 4, '2', 'MCJ-4-2'),

    -- English (ENG) - 8 batches
    ('13131313-1313-1313-1313-131313131001', '13131313-1313-1313-1313-131313131313', 1, '1', 'ENG-1-1'),
    ('13131313-1313-1313-1313-131313131002', '13131313-1313-1313-1313-131313131313', 1, '2', 'ENG-1-2'),
    ('13131313-1313-1313-1313-131313131003', '13131313-1313-1313-1313-131313131313', 2, '1', 'ENG-2-1'),
    ('13131313-1313-1313-1313-131313131004', '13131313-1313-1313-1313-131313131313', 2, '2', 'ENG-2-2'),
    ('13131313-1313-1313-1313-131313131005', '13131313-1313-1313-1313-131313131313', 3, '1', 'ENG-3-1'),
    ('13131313-1313-1313-1313-131313131006', '13131313-1313-1313-1313-131313131313', 3, '2', 'ENG-3-2'),
    ('13131313-1313-1313-1313-131313131007', '13131313-1313-1313-1313-131313131313', 4, '1', 'ENG-4-1'),
    ('13131313-1313-1313-1313-131313131008', '13131313-1313-1313-1313-131313131313', 4, '2', 'ENG-4-2'),

    -- Bangla (BAN) - 8 batches
    ('14141414-1414-1414-1414-141414141001', '14141414-1414-1414-1414-141414141414', 1, '1', 'BAN-1-1'),
    ('14141414-1414-1414-1414-141414141002', '14141414-1414-1414-1414-141414141414', 1, '2', 'BAN-1-2'),
    ('14141414-1414-1414-1414-141414141003', '14141414-1414-1414-1414-141414141414', 2, '1', 'BAN-2-1'),
    ('14141414-1414-1414-1414-141414141004', '14141414-1414-1414-1414-141414141414', 2, '2', 'BAN-2-2'),
    ('14141414-1414-1414-1414-141414141005', '14141414-1414-1414-1414-141414141414', 3, '1', 'BAN-3-1'),
    ('14141414-1414-1414-1414-141414141006', '14141414-1414-1414-1414-141414141414', 3, '2', 'BAN-3-2'),
    ('14141414-1414-1414-1414-141414141007', '14141414-1414-1414-1414-141414141414', 4, '1', 'BAN-4-1'),
    ('14141414-1414-1414-1414-141414141008', '14141414-1414-1414-1414-141414141414', 4, '2', 'BAN-4-2'),

    -- History and Civilization (HC) - 8 batches
    ('15151515-1515-1515-1515-151515151001', '15151515-1515-1515-1515-151515151515', 1, '1', 'HC-1-1'),
    ('15151515-1515-1515-1515-151515151002', '15151515-1515-1515-1515-151515151515', 1, '2', 'HC-1-2'),
    ('15151515-1515-1515-1515-151515151003', '15151515-1515-1515-1515-151515151515', 2, '1', 'HC-2-1'),
    ('15151515-1515-1515-1515-151515151004', '15151515-1515-1515-1515-151515151515', 2, '2', 'HC-2-2'),
    ('15151515-1515-1515-1515-151515151005', '15151515-1515-1515-1515-151515151515', 3, '1', 'HC-3-1'),
    ('15151515-1515-1515-1515-151515151006', '15151515-1515-1515-1515-151515151515', 3, '2', 'HC-3-2'),
    ('15151515-1515-1515-1515-151515151007', '15151515-1515-1515-1515-151515151515', 4, '1', 'HC-4-1'),
    ('15151515-1515-1515-1515-151515151008', '15151515-1515-1515-1515-151515151515', 4, '2', 'HC-4-2'),

    -- Law (LAW) - 8 batches
    ('16161616-1616-1616-1616-161616161001', '16161616-1616-1616-1616-161616161616', 1, '1', 'LAW-1-1'),
    ('16161616-1616-1616-1616-161616161002', '16161616-1616-1616-1616-161616161616', 1, '2', 'LAW-1-2'),
    ('16161616-1616-1616-1616-161616161003', '16161616-1616-1616-1616-161616161616', 2, '1', 'LAW-2-1'),
    ('16161616-1616-1616-1616-161616161004', '16161616-1616-1616-1616-161616161616', 2, '2', 'LAW-2-2'),
    ('16161616-1616-1616-1616-161616161005', '16161616-1616-1616-1616-161616161616', 3, '1', 'LAW-3-1'),
    ('16161616-1616-1616-1616-161616161006', '16161616-1616-1616-1616-161616161616', 3, '2', 'LAW-3-2'),
    ('16161616-1616-1616-1616-161616161007', '16161616-1616-1616-1616-161616161616', 4, '1', 'LAW-4-1'),
    ('16161616-1616-1616-1616-161616161008', '16161616-1616-1616-1616-161616161616', 4, '2', 'LAW-4-2'),

    -- Drawing and Painting (DP) - 8 batches
    ('17171717-1717-1717-1717-171717171001', '17171717-1717-1717-1717-171717171717', 1, '1', 'DP-1-1'),
    ('17171717-1717-1717-1717-171717171002', '17171717-1717-1717-1717-171717171717', 1, '2', 'DP-1-2'),
    ('17171717-1717-1717-1717-171717171003', '17171717-1717-1717-1717-171717171717', 2, '1', 'DP-2-1'),
    ('17171717-1717-1717-1717-171717171004', '17171717-1717-1717-1717-171717171717', 2, '2', 'DP-2-2'),
    ('17171717-1717-1717-1717-171717171005', '17171717-1717-1717-1717-171717171717', 3, '1', 'DP-3-1'),
    ('17171717-1717-1717-1717-171717171006', '17171717-1717-1717-1717-171717171717', 3, '2', 'DP-3-2'),
    ('17171717-1717-1717-1717-171717171007', '17171717-1717-1717-1717-171717171717', 4, '1', 'DP-4-1'),
    ('17171717-1717-1717-1717-171717171008', '17171717-1717-1717-1717-171717171717', 4, '2', 'DP-4-2'),

    -- Print Making (PM) - 8 batches
    ('18181818-1818-1818-1818-181818181001', '18181818-1818-1818-1818-181818181818', 1, '1', 'PM-1-1'),
    ('18181818-1818-1818-1818-181818181002', '18181818-1818-1818-1818-181818181818', 1, '2', 'PM-1-2'),
    ('18181818-1818-1818-1818-181818181003', '18181818-1818-1818-1818-181818181818', 2, '1', 'PM-2-1'),
    ('18181818-1818-1818-1818-181818181004', '18181818-1818-1818-1818-181818181818', 2, '2', 'PM-2-2'),
    ('18181818-1818-1818-1818-181818181005', '18181818-1818-1818-1818-181818181818', 3, '1', 'PM-3-1'),
    ('18181818-1818-1818-1818-181818181006', '18181818-1818-1818-1818-181818181818', 3, '2', 'PM-3-2'),
    ('18181818-1818-1818-1818-181818181007', '18181818-1818-1818-1818-181818181818', 4, '1', 'PM-4-1'),
    ('18181818-1818-1818-1818-181818181008', '18181818-1818-1818-1818-181818181818', 4, '2', 'PM-4-2'),

    -- Sculpture (SCP) - 8 batches
    ('19191919-1919-1919-1919-191919191001', '19191919-1919-1919-1919-191919191919', 1, '1', 'SCP-1-1'),
    ('19191919-1919-1919-1919-191919191002', '19191919-1919-1919-1919-191919191919', 1, '2', 'SCP-1-2'),
    ('19191919-1919-1919-1919-191919191003', '19191919-1919-1919-1919-191919191919', 2, '1', 'SCP-2-1'),
    ('19191919-1919-1919-1919-191919191004', '19191919-1919-1919-1919-191919191919', 2, '2', 'SCP-2-2'),
    ('19191919-1919-1919-1919-191919191005', '19191919-1919-1919-1919-191919191919', 3, '1', 'SCP-3-1'),
    ('19191919-1919-1919-1919-191919191006', '19191919-1919-1919-1919-191919191919', 3, '2', 'SCP-3-2'),
    ('19191919-1919-1919-1919-191919191007', '19191919-1919-1919-1919-191919191919', 4, '1', 'SCP-4-1'),
    ('19191919-1919-1919-1919-191919191008', '19191919-1919-1919-1919-191919191919', 4, '2', 'SCP-4-2'),

    -- Education (EDU) - 8 batches
    ('20202020-2020-2020-2020-202020201001', '20202020-2020-2020-2020-202020202020', 1, '1', 'EDU-1-1'),
    ('20202020-2020-2020-2020-202020201002', '20202020-2020-2020-2020-202020202020', 1, '2', 'EDU-1-2'),
    ('20202020-2020-2020-2020-202020201003', '20202020-2020-2020-2020-202020202020', 2, '1', 'EDU-2-1'),
    ('20202020-2020-2020-2020-202020201004', '20202020-2020-2020-2020-202020202020', 2, '2', 'EDU-2-2'),
    ('20202020-2020-2020-2020-202020201005', '20202020-2020-2020-2020-202020202020', 3, '1', 'EDU-3-1'),
    ('20202020-2020-2020-2020-202020201006', '20202020-2020-2020-2020-202020202020', 3, '2', 'EDU-3-2'),
    ('20202020-2020-2020-2020-202020201007', '20202020-2020-2020-2020-202020202020', 4, '1', 'EDU-4-1'),
    ('20202020-2020-2020-2020-202020201008', '20202020-2020-2020-2020-202020202020', 4, '2', 'EDU-4-2');

-- Update timestamps for all batches
UPDATE batches SET updated_at = NOW();

-- Insert comprehensive course codes for all disciplines including the newly added ones
INSERT INTO course_codes (discipline_id, code, title, description) VALUES
    -- CSE courses
    ('11111111-1111-1111-1111-111111111111', 'CSE101', 'Introduction to Programming', 'Basic programming concepts using C/C++'),
    ('11111111-1111-1111-1111-111111111111', 'CSE201', 'Data Structures', 'Fundamental data structures and algorithms'),
    ('11111111-1111-1111-1111-111111111111', 'CSE301', 'Database Systems', 'Database design and management systems'),
    ('11111111-1111-1111-1111-111111111111', 'CSE401', 'Software Engineering', 'Software development methodologies'),
    ('11111111-1111-1111-1111-111111111111', 'CSE302', 'Computer Networks', 'Network protocols and communication'),
    ('11111111-1111-1111-1111-111111111111', 'CSE303', 'Operating Systems', 'OS concepts and system programming'),

    -- ECE courses
    ('22222222-2222-2222-2222-222222222222', 'ECE101', 'Circuit Analysis', 'Basic electrical circuit analysis'),
    ('22222222-2222-2222-2222-222222222222', 'ECE201', 'Digital Logic Design', 'Digital systems and logic design'),
    ('22222222-2222-2222-2222-222222222222', 'ECE301', 'Signal Processing', 'Digital signal processing techniques'),
    ('22222222-2222-2222-2222-222222222222', 'ECE302', 'Communication Systems', 'Communication theory and systems'),

    -- Architecture courses
    ('33333333-3333-3333-3333-333333333333', 'ARCH101', 'Architectural Design Studio', 'Basic architectural design principles'),
    ('33333333-3333-3333-3333-333333333333', 'ARCH201', 'Building Construction', 'Construction methods and materials'),
    ('33333333-3333-3333-3333-333333333333', 'ARCH301', 'Urban Planning', 'Urban design and planning concepts'),

    -- Business Administration courses
    ('55555555-5555-5555-5555-555555555555', 'BBA101', 'Principles of Management', 'Introduction to management concepts'),
    ('55555555-5555-5555-5555-555555555555', 'BBA201', 'Marketing Management', 'Marketing strategies and practices'),
    ('55555555-5555-5555-5555-555555555555', 'BBA301', 'Financial Management', 'Financial planning and analysis'),
    ('55555555-5555-5555-5555-555555555555', 'BBA302', 'Human Resource Management', 'HR policies and practices'),

    -- English courses
    ('13131313-1313-1313-1313-131313131313', 'ENG101', 'English Composition', 'Academic writing and composition'),
    ('13131313-1313-1313-1313-131313131313', 'ENG201', 'British Literature', 'Survey of British literary works'),
    ('13131313-1313-1313-1313-131313131313', 'ENG301', 'American Literature', 'Survey of American literary works'),
    ('13131313-1313-1313-1313-131313131313', 'ENG302', 'Linguistics', 'Introduction to linguistic theory'),

    -- Mathematics courses
    ('77777777-7777-7777-7777-777777777777', 'MATH101', 'Calculus I', 'Differential and integral calculus'),
    ('77777777-7777-7777-7777-777777777777', 'MATH201', 'Linear Algebra', 'Vector spaces and linear transformations'),
    ('77777777-7777-7777-7777-777777777777', 'MATH301', 'Abstract Algebra', 'Group theory and ring theory'),
    ('77777777-7777-7777-7777-777777777777', 'MATH302', 'Real Analysis', 'Real number system and analysis'),

    -- Statistics courses *** NEWLY ADDED ***
    ('10101010-1010-1010-1010-101010101010', 'STAT101', 'Descriptive Statistics', 'Basic statistical concepts and data analysis'),
    ('10101010-1010-1010-1010-101010101010', 'STAT201', 'Probability Theory', 'Probability distributions and inference'),
    ('10101010-1010-1010-1010-101010101010', 'STAT301', 'Inferential Statistics', 'Hypothesis testing and confidence intervals'),
    ('10101010-1010-1010-1010-101010101010', 'STAT401', 'Applied Statistics', 'Statistical modeling and applications'),

    -- Agrotechnology courses *** NEWLY ADDED ***
    ('21212121-2121-2121-2121-212121212121', 'AGRO101', 'Introduction to Agrotechnology', 'Basic principles of agricultural technology'),
    ('21212121-2121-2121-2121-212121212121', 'AGRO201', 'Crop Production Technology', 'Modern crop production techniques'),
    ('21212121-2121-2121-2121-212121212121', 'AGRO301', 'Agricultural Biotechnology', 'Biotechnology applications in agriculture'),
    ('21212121-2121-2121-2121-212121212121', 'AGRO401', 'Precision Agriculture', 'Technology-driven farming methods'),

    -- Physics courses
    ('88888888-8888-8888-8888-888888888888', 'PHY101', 'Classical Mechanics', 'Newtonian mechanics and dynamics'),
    ('88888888-8888-8888-8888-888888888888', 'PHY201', 'Electromagnetism', 'Electric and magnetic phenomena'),
    ('88888888-8888-8888-8888-888888888888', 'PHY301', 'Quantum Mechanics', 'Quantum theory and applications'),

    -- Chemistry courses
    ('99999999-9999-9999-9999-999999999999', 'CHEM101', 'General Chemistry', 'Basic chemical principles'),
    ('99999999-9999-9999-9999-999999999999', 'CHEM201', 'Organic Chemistry', 'Organic compounds and reactions'),
    ('99999999-9999-9999-9999-999999999999', 'CHEM301', 'Physical Chemistry', 'Chemical thermodynamics and kinetics'),

    -- Economics courses
    ('abababab-abab-abab-abab-abababababab', 'ECON101', 'Microeconomics', 'Individual economic behavior'),
    ('abababab-abab-abab-abab-abababababab', 'ECON201', 'Macroeconomics', 'National economic systems'),
    ('abababab-abab-abab-abab-abababababab', 'ECON301', 'Development Economics', 'Economic development theory'),

    -- Law courses
    ('16161616-1616-1616-1616-161616161616', 'LAW101', 'Constitutional Law', 'Principles of constitutional law'),
    ('16161616-1616-1616-1616-161616161616', 'LAW201', 'Criminal Law', 'Criminal justice system'),
    ('16161616-1616-1616-1616-161616161616', 'LAW301', 'Civil Law', 'Civil legal procedures')
ON CONFLICT (discipline_id, code) DO NOTHING;

-- Verification queries to check the results
-- Run these to verify everything was inserted correctly

-- 1. Count disciplines and batches (should be 29 disciplines, 232 batches)
SELECT 
    'VERIFICATION SUMMARY' as info,
    (SELECT COUNT(*) FROM disciplines) as total_disciplines,
    (SELECT COUNT(*) FROM batches) as total_batches,
    (SELECT COUNT(*) FROM course_codes) as total_course_codes;

-- 2. Show batch counts per discipline (should be 8 each)
SELECT 
    d.code as discipline_code,
    d.name as discipline_name,
    COUNT(b.id) as batch_count
FROM disciplines d
LEFT JOIN batches b ON d.id = b.discipline_id
GROUP BY d.code, d.name
ORDER BY d.code;

-- 3. Show disciplines missing batches (should return no rows)
SELECT 
    d.code as discipline_code,
    d.name as discipline_name
FROM disciplines d
LEFT JOIN batches b ON d.id = b.discipline_id
WHERE b.id IS NULL;

-- 4. Verify the newly added disciplines are present
SELECT 
    code,
    name,
    'NEWLY ADDED' as status
FROM disciplines 
WHERE code IN ('STAT', 'AGRO')
ORDER BY code;

-- 5. Sample batch codes for verification (including new disciplines)
SELECT 
    d.code as discipline,
    CONCAT(b.year, ':', b.semester) as term,
    b.code as batch_code,
    b.created_at
FROM batches b
JOIN disciplines d ON b.discipline_id = d.id
WHERE d.code IN ('CSE', 'ECE', 'ARCH', 'BA', 'MATH', 'ENG', 'STAT', 'AGRO')
ORDER BY d.code, b.year, b.semester;

-- 6. Final verification - Check total batch count is exactly 232 (29 × 8)
SELECT 
    CASE 
        WHEN COUNT(*) = 232 THEN 'SUCCESS: All 29 disciplines have complete batches!'
        ELSE CONCAT('ERROR: Expected 232 batches but found ', COUNT(*), ' batches')
    END as final_verification
FROM batches;

-- Success message
SELECT 'SEED DATA UPDATED SUCCESSFULLY! All 29 disciplines (including Statistics & Agrotechnology) now have 8 batches each (232 total batches)' as result;