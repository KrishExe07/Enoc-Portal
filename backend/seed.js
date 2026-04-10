/**
 * SEED DATABASE SCRIPT
 * Populate MySQL database with initial data:
 *   - Faculty & Admin user accounts (with bcrypt-hashed passwords)
 *   - Approved company list
 *
 * Usage:
 *   node seed.js          → seed without dropping tables
 *   node seed.js --reset  → drop all tables and re-seed
 */

const bcrypt = require('bcryptjs');
const { User, Company } = require('./models');
const { sequelize } = require('./config/database');

// ── Faculty & Admin accounts to seed ────────────────────────────
const STAFF_ACCOUNTS = [
    {
        email: 'faculty@charusat.ac.in',
        name: 'Prof. Faculty User',
        role: 'faculty',
        password: 'Faculty@123',
        department: 'Information Technology',
        designation: 'Assistant Professor',
        domainType: 'ac',
        loginProvider: 'local'
    },
    {
        email: 'admin@charusat.ac.in',
        name: 'Admin User',
        role: 'admin',
        password: 'Admin@123',
        department: 'Administration',
        designation: 'System Administrator',
        domainType: 'ac',
        loginProvider: 'local'
    },
    // Extra faculty account for testing
    {
        email: 'hod@charusat.ac.in',
        name: 'Dr. HOD User',
        role: 'faculty',
        password: 'Hod@123',
        department: 'Computer Engineering',
        designation: 'Head of Department',
        domainType: 'ac',
        loginProvider: 'local'
    }
];

// ── Company list ────────────────────────────────────────────────
const COMPANIES = [
    { name: 'Apex Softech Software Solutions', location: 'N/A', website: 'http://www.apexsofttech.com/', address: 'http://www.apexsofttech.com/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Wordpress', approved: true },
    { name: 'Bhavani Engineering', location: 'N/A', website: 'https://bhavaniengineering.co.in/', address: 'https://bhavaniengineering.co.in/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Android Application', approved: true },
    { name: 'Bista Solutions', location: 'N/A', website: 'https://www.bistasolutions.com/', address: 'https://www.bistasolutions.com/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Odoo software', approved: true },
    { name: 'Cilans System', location: 'N/A', website: 'https://www.cilans.net/', address: 'https://www.cilans.net/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Data Analysis using Power BI', approved: true },
    { name: 'Cypherox Technologies Pvt Ltd', location: 'N/A', website: 'https://www.cypherox.com/', address: 'https://www.cypherox.com/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Android Application', approved: true },
    { name: 'Differenz system', location: 'N/A', website: 'https://www.differenzsystem.com/', address: 'https://www.differenzsystem.com/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Android Application', approved: true },
    { name: 'ElectoMech', location: 'N/A', website: 'https://www.electromech.info/', address: 'https://www.electromech.info/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'AWS (Terraform, CICD pipeline)', approved: true },
    { name: 'Evernet Technologies', location: 'N/A', website: 'http://evernet-tech.com/', address: 'http://evernet-tech.com/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Website Development', approved: true },
    { name: 'F5systems', location: 'N/A', website: 'https://www.f5sys.com/home.php', address: 'https://www.f5sys.com/home.php', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Website development', approved: true },
    { name: 'FlyMeDigital Pvt Ltd', location: 'N/A', website: 'https://flymedigital.com/', address: 'https://flymedigital.com/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'E Commerce Platform Development', approved: true },
    { name: 'GDO infotech Pvt Ltd', location: 'N/A', website: 'https://gdo.co.in/', address: 'https://gdo.co.in/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Web Application (php and mysql)', approved: true },
    { name: 'Global Bits', location: 'N/A', website: 'http://globalbits.net/', address: 'http://globalbits.net/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Website development', approved: true },
    { name: 'Grey desk Pvt Ltd', location: 'N/A', website: 'https://www.greydeskinc.com/', address: 'https://www.greydeskinc.com/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Tracking app using QR code', approved: true },
    { name: 'Gurukrupa Enterprise', location: 'N/A', website: 'https://www.indiamart.com/gurukrupa-enterprise-gujarat/profile.html', address: 'N/A', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Android Application', approved: true },
    { name: 'Horizon Webinfo Pvt Ltd', location: 'N/A', website: 'http://www.horizonwebinfo.com/', address: 'http://www.horizonwebinfo.com/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Android Application', approved: true },
    { name: 'I Can Infotech', location: 'N/A', website: 'https://www.icaninfotech.com/', address: 'https://www.icaninfotech.com/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Android Application', approved: true },
    { name: 'ICARUS SOLUTION', location: 'N/A', website: 'http://icarussolution.com/', address: 'http://icarussolution.com/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Android Application', approved: true },
    { name: 'Inferno Infosec', location: 'N/A', website: 'https://www.infernoinfosec.in/', address: 'https://www.infernoinfosec.in/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Web Application - Pen Testing', approved: true },
    { name: 'Infosenseglobal', location: 'N/A', website: 'https://infosenseglobal.com/', address: 'https://infosenseglobal.com/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'AWS - ALEXA', approved: true },
    { name: 'KPMG', location: 'N/A', website: 'https://home.kpmg/xx/en/home.html', address: 'https://home.kpmg/xx/en/home.html', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Data Analytics', approved: true },
    { name: 'L&T Power', location: 'N/A', website: 'https://www.lntpower.com/', address: 'https://www.lntpower.com/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Digital Signature Application', approved: true },
    { name: 'Logistic InfoTech', location: 'N/A', website: 'https://www.logisticinfotech.com/', address: 'https://www.logisticinfotech.com/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Web application', approved: true },
    { name: 'Softvan Pvt Ltd', location: 'N/A', website: 'https://softvan.in/', address: 'https://softvan.in/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Python with Machine learning', approved: true },
    { name: 'Sciative Solutions Private Ltd', location: 'N/A', website: 'https://www.sciative.com/', address: 'https://www.sciative.com/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Data Analytics', approved: true },
    { name: 'TechIndia infosolutions pvt ltd', location: 'N/A', website: 'http://techindiainfo.com/', address: 'http://techindiainfo.com/', hrName: 'N/A', hrEmail: 'not-provided@company.local', hrPhone: 'N/A', numEmployees: 'N/A', technologies: 'Android Application', approved: true },
];

async function seedDatabase() {
    try {
        const forceReset = process.argv.includes('--reset');
        
        console.log('🌱 Starting database seeding...');
        if (forceReset) {
            console.log('⚠️  --reset flag detected: dropping and recreating all tables!');
        }

        // Sync database
        await sequelize.sync({ force: forceReset });
        console.log('✅ Database tables ' + (forceReset ? 'recreated' : 'synced'));

        // ── Seed Staff Accounts ─────────────────────────────────────
        console.log('\n👤 Seeding staff accounts...');
        let usersCreated = 0;
        let usersSkipped = 0;

        for (const account of STAFF_ACCOUNTS) {
            const existing = await User.findOne({ where: { email: account.email } });
            if (existing) {
                console.log(`   ⏭️  ${account.email} already exists — skipping`);
                usersSkipped++;
                continue;
            }

            // Hash password with bcrypt (10 rounds)
            const passwordHash = await bcrypt.hash(account.password, 10);

            await User.create({
                email: account.email,
                name: account.name,
                role: account.role,
                passwordHash: passwordHash,
                googleId: null,
                loginProvider: account.loginProvider,
                domainType: account.domainType,
                department: account.department,
                designation: account.designation,
                emailVerified: true,
                isActive: true,
                lastLogin: new Date()
            });

            console.log(`   ✅ Created ${account.role}: ${account.email}`);
            usersCreated++;
        }

        console.log(`\n📊 Users: ${usersCreated} created, ${usersSkipped} skipped`);

        // ── Seed Companies ──────────────────────────────────────────
        console.log('\n🏢 Seeding companies...');
        let companiesCreated = 0;
        let companiesSkipped = 0;

        for (const company of COMPANIES) {
            const existing = await Company.findOne({ where: { name: company.name } });
            if (existing) {
                companiesSkipped++;
                continue;
            }
            await Company.create(company);
            companiesCreated++;
        }

        console.log(`📊 Companies: ${companiesCreated} created, ${companiesSkipped} skipped`);

        // ── Summary ─────────────────────────────────────────────────
        console.log('\n╔══════════════════════════════════════════════╗');
        console.log('║  🎉 Database seeding completed successfully!  ║');
        console.log('╠══════════════════════════════════════════════╣');
        console.log('║                                              ║');
        console.log('║  Staff Login Credentials:                    ║');
        console.log('║  ──────────────────────────────────────────  ║');
        console.log('║  Faculty:  faculty@charusat.ac.in            ║');
        console.log('║           Password: Faculty@123              ║');
        console.log('║                                              ║');
        console.log('║  Admin:   admin@charusat.ac.in               ║');
        console.log('║           Password: Admin@123                ║');
        console.log('║                                              ║');
        console.log('║  HOD:     hod@charusat.ac.in                 ║');
        console.log('║           Password: Hod@123                  ║');
        console.log('║                                              ║');
        console.log('╚══════════════════════════════════════════════╝');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run seeding
seedDatabase();
