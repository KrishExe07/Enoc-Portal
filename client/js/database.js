/**
 * DATABASE UTILITIES
 * Manages localStorage as a simple database for the eNOC portal
 */

const nocDatabase = {
    /**
     * Initialize database with schema and seed data
     */
    init: function () {
        // Initialize companies if not exists
        if (!portalUtils.getFromStorage('companies')) {
            this.seedCompanies();
        }

        // Initialize pending companies if not exists
        if (!portalUtils.getFromStorage('pending_companies')) {
            portalUtils.saveToStorage('pending_companies', []);
        }

        // Initialize NOC requests if not exists
        if (!portalUtils.getFromStorage('noc_requests')) {
            portalUtils.saveToStorage('noc_requests', []);
        }

        console.log('NOC Database initialized');
    },

    /**
     * Seed initial company data
     */
    seedCompanies: function () {
        const companies = [
{
                id: 'COMP-001',
                name: 'Apex Softech Software Solutions',
                location: 'N/A',
                website: 'http://www.apexsofttech.com/',
                address: 'http://www.apexsofttech.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'Ample Infotech - Not allowed',
                technologies: 'Wordpress',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-002',
                name: 'Bhavani Engineering',
                location: 'N/A',
                website: 'https://bhavaniengineering.co.in/',
                address: 'https://bhavaniengineering.co.in/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'Foxmula - Not allowed',
                technologies: 'Android Application',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-003',
                name: 'Bista Solutions',
                location: 'N/A',
                website: 'https://www.bistasolutions.com/',
                address: 'https://www.bistasolutions.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Odoo software',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-004',
                name: 'Cilans System',
                location: 'N/A',
                website: 'https://www.cilans.net/',
                address: 'https://www.cilans.net/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Data Analysis using Power BI',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-005',
                name: 'Cypherox Technologies Pvt Ltd',
                location: 'N/A',
                website: 'https://www.cypherox.com/',
                address: 'https://www.cypherox.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Android Application',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-006',
                name: 'Differenz system',
                location: 'N/A',
                website: 'https://www.differenzsystem.com/',
                address: 'https://www.differenzsystem.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Android Application',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-007',
                name: 'ElectoMech',
                location: 'N/A',
                website: 'https://www.electromech.info/',
                address: 'https://www.electromech.info/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'AWS (Terraform, CICD pipeline)',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-008',
                name: 'Evernet Technologies',
                location: 'N/A',
                website: 'http://evernet-tech.com/',
                address: 'http://evernet-tech.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Website Development',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-009',
                name: 'F5systems',
                location: 'N/A',
                website: 'https://www.f5sys.com/home.php',
                address: 'https://www.f5sys.com/home.php',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Website development',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-010',
                name: 'FlyMeDigital Pvt Ltd',
                location: 'N/A',
                website: 'https://flymedigital.com/',
                address: 'https://flymedigital.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'E Commerce Platform Developement',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-011',
                name: 'GDO infotech Pvt Ltd (etherauthoriy)',
                location: 'N/A',
                website: 'https://gdo.co.in/',
                address: 'https://gdo.co.in/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Web Application (php and mysql)',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-012',
                name: 'Global Bits',
                location: 'N/A',
                website: 'http://globalbits.net/',
                address: 'http://globalbits.net/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Website development',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-013',
                name: 'Grey desk Pvt Ltd',
                location: 'N/A',
                website: 'https://www.greydeskinc.com/',
                address: 'https://www.greydeskinc.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Tracking app using QR code',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-014',
                name: 'Gurukrupa Enterprise',
                location: 'N/A',
                website: 'https://www.indiamart.com/gurukrupa-enterprise-gujarat/profile.html',
                address: 'https://www.indiamart.com/gurukrupa-enterprise-gujarat/profile.html',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Android Application',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-015',
                name: 'Horizon Webinfo Pvt Ltd',
                location: 'N/A',
                website: 'http://www.horizonwebinfo.com/',
                address: 'http://www.horizonwebinfo.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Android Application',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-016',
                name: 'I Can Infotech',
                location: 'N/A',
                website: 'https://www.icaninfotech.com/',
                address: 'https://www.icaninfotech.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Android Application',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-017',
                name: 'ICARUS SOLUTION',
                location: 'N/A',
                website: 'http://icarussolution.com/',
                address: 'http://icarussolution.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Android Application',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-018',
                name: 'Inferno Infosec',
                location: 'N/A',
                website: 'https://www.infernoinfosec.in/',
                address: 'https://www.infernoinfosec.in/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Web Application - Pen Testing and Reverse Engineering',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-019',
                name: 'Infosenseglobal',
                location: 'N/A',
                website: 'https://infosenseglobal.com/',
                address: 'https://infosenseglobal.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'AWS - ALEXA FOR SALES REPRESENTATIVE',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-020',
                name: 'Jeen Web Technologists pvt ltd',
                location: 'N/A',
                website: 'https://jeenweb.com/',
                address: 'https://jeenweb.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Website development',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-021',
                name: 'Jinee Infotech',
                location: 'N/A',
                website: 'http://jinee.in/',
                address: 'http://jinee.in/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Django CMS',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-022',
                name: 'KPMG',
                location: 'N/A',
                website: 'https://home.kpmg/xx/en/home.html',
                address: 'https://home.kpmg/xx/en/home.html',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Data Analytics',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-023',
                name: 'L&T Power',
                location: 'N/A',
                website: 'https://www.lntpower.com/',
                address: 'https://www.lntpower.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Process Improvement For Digital Signature Application',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-024',
                name: 'Leadingindia',
                location: 'N/A',
                website: 'https://www.leadingindia.ai/',
                address: 'https://www.leadingindia.ai/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Object Detection in Computer Vision',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-025',
                name: 'Logistic InfoTech',
                location: 'N/A',
                website: 'https://www.logisticinfotech.com/',
                address: 'https://www.logisticinfotech.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Web application',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-026',
                name: 'Mafatlal industries limited',
                location: 'N/A',
                website: 'https://www.mafatlals.com/',
                address: 'https://www.mafatlals.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Web application',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-027',
                name: 'Msquare Technologies',
                location: 'N/A',
                website: 'https://msquaretec.com/',
                address: 'https://msquaretec.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Printshoppy App, Local Authentication App',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-028',
                name: 'My TechWay Solutions',
                location: 'N/A',
                website: 'https://www.mytechway.com/',
                address: 'https://www.mytechway.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Android Application (Bookshelf App)',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-029',
                name: 'Narayan Infotech',
                location: 'N/A',
                website: 'http://narayaninfotech.com/?i=1',
                address: 'http://narayaninfotech.com/?i=1',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Vegetable Ecommerce mobile application',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-030',
                name: 'Newtech Infosoft',
                location: 'N/A',
                website: 'https://newtechinfosoft.com/',
                address: 'https://newtechinfosoft.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Android Application',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-031',
                name: 'Profism Technology LLP',
                location: 'N/A',
                website: 'https://www.profism.com/',
                address: 'https://www.profism.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Android Application',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-032',
                name: 'Siccus Infotech',
                location: 'N/A',
                website: 'http://siccus.in/',
                address: 'http://siccus.in/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Website development',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-033',
                name: 'Softsecure infotech private limited',
                location: 'N/A',
                website: 'http://applydigitalsignature.in/',
                address: 'http://applydigitalsignature.in/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Android Application',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-034',
                name: 'Softvan Pvt Ltd',
                location: 'N/A',
                website: 'https://softvan.in/',
                address: 'https://softvan.in/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Python with Machine learning (Athlete Pose Detection)',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-035',
                name: 'TechIndia infosolutions pvt ltd',
                location: 'N/A',
                website: 'http://techindiainfo.com/',
                address: 'http://techindiainfo.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Android Application',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-036',
                name: 'Time infotech',
                location: 'N/A',
                website: 'https://timeifotech.com',
                address: 'https://timeifotech.com',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'ORGANIC-SEO DIGITAL MARKETING',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-037',
                name: 'TM Systems Pvt Ltd',
                location: 'N/A',
                website: 'https://www.tmspl.com/',
                address: 'https://www.tmspl.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'AWS (Text to speech using AWS Polly)',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-038',
                name: 'Zonic digital inc',
                location: 'N/A',
                website: 'http://www.gozonic.com/',
                address: 'http://www.gozonic.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Website development',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-039',
                name: 'Sciative Solutions Private Ltd',
                location: 'N/A',
                website: 'https://www.sciative.com/',
                address: 'https://www.sciative.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Research Analyst Intern, Data Analytics',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-040',
                name: 'Light information Systems',
                location: 'N/A',
                website: 'https://www.nlpbots.com/',
                address: 'https://www.nlpbots.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Mobile application development and NLP',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-041',
                name: 'Darwin Travel Tech Pvt Ltd',
                location: 'N/A',
                website: 'https://www.tripdarwin.com/',
                address: 'https://www.tripdarwin.com/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'General',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-042',
                name: 'Social 101',
                location: 'N/A',
                website: 'http://social101.in/',
                address: 'http://social101.in/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'Seo & Web Development',
                approved: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'COMP-043',
                name: 'Exposys',
                location: 'N/A',
                website: 'http://www.exposysdata.in/',
                address: 'http://www.exposysdata.in/',
                hr_name: 'N/A',
                hr_email: 'not-provided@company.local',
                hr_phone: 'N/A',
                num_employees: 'N/A',
                technologies: 'General',
                approved: true,
                created_at: new Date().toISOString()
            }
        ];

        portalUtils.saveToStorage('companies', companies);
        console.log('Seeded', companies.length, 'companies');
    },

    /**
     * Get companies list
     * @param {boolean} approvedOnly - Return only approved companies
     * @returns {Array} Array of companies
     */
    getCompanies: function (approvedOnly = true) {
        const companies = portalUtils.getFromStorage('companies') || [];
        if (approvedOnly) {
            return companies.filter(c => c.approved === true);
        }
        return companies;
    },

    /**
     * Get company by ID
     * @param {string} companyId - Company ID
     * @returns {Object|null} Company object or null
     */
    getCompanyById: function (companyId) {
        const companies = this.getCompanies(false);
        return companies.find(c => c.id === companyId) || null;
    },

    /**
     * Add new company (pending approval)
     * @param {Object} companyData - Company information
     * @returns {Object} Created company object
     */
    addPendingCompany: function (companyData) {
        const pendingCompanies = portalUtils.getFromStorage('pending_companies') || [];

        const newCompany = {
            id: `PEND-${Date.now()}`,
            name: companyData.name,
            location: companyData.location || '',
            website: companyData.website || '',
            address: companyData.address || '',
            hr_name: companyData.hr_name || '',
            hr_email: companyData.hr_email || '',
            hr_phone: companyData.hr_phone || '',
            num_employees: companyData.num_employees || '',
            technologies: companyData.technologies || '',
            approved: false,
            created_at: new Date().toISOString(),
            submitted_by: companyData.submitted_by || ''
        };

        pendingCompanies.push(newCompany);
        portalUtils.saveToStorage('pending_companies', pendingCompanies);

        return newCompany;
    },

    /**
     * Get pending companies
     * @returns {Array} Array of pending companies
     */
    getPendingCompanies: function () {
        return portalUtils.getFromStorage('pending_companies') || [];
    },

    /**
     * Approve pending company
     * @param {string} pendingId - Pending company ID
     * @returns {boolean} Success status
     */
    approveCompany: function (pendingId) {
        const pendingCompanies = this.getPendingCompanies();
        const companyIndex = pendingCompanies.findIndex(c => c.id === pendingId);

        if (companyIndex === -1) return false;

        const company = pendingCompanies[companyIndex];

        // Move to approved companies
        const companies = this.getCompanies(false);
        const approvedCompany = {
            ...company,
            id: `COMP-${String(companies.length + 1).padStart(3, '0')}`,
            approved: true,
            approved_at: new Date().toISOString()
        };

        companies.push(approvedCompany);
        portalUtils.saveToStorage('companies', companies);

        // Remove from pending
        pendingCompanies.splice(companyIndex, 1);
        portalUtils.saveToStorage('pending_companies', pendingCompanies);

        // Update any NOC requests that reference this pending company
        this.updateNOCRequestsCompanyId(pendingId, approvedCompany.id);

        return true;
    },

    /**
     * Reject pending company
     * @param {string} pendingId - Pending company ID
     * @returns {boolean} Success status
     */
    rejectCompany: function (pendingId) {
        const pendingCompanies = this.getPendingCompanies();
        const companyIndex = pendingCompanies.findIndex(c => c.id === pendingId);

        if (companyIndex === -1) return false;

        pendingCompanies.splice(companyIndex, 1);
        portalUtils.saveToStorage('pending_companies', pendingCompanies);

        return true;
    },

    /**
     * Submit NOC request
     * @param {Object} nocData - NOC request data
     * @returns {Object} Created NOC request
     */
    submitNOCRequest: function (nocData) {
        const nocRequests = portalUtils.getFromStorage('noc_requests') || [];

        const newRequest = {
            id: portalUtils.generateApplicationId('NOC'),
            student_id: nocData.student_id,
            student_name: nocData.student_name,
            semester: nocData.semester,
            email: nocData.email,
            mobile: nocData.mobile,
            company_id: nocData.company_id,
            start_date: nocData.start_date,
            end_date: nocData.end_date,
            status: 'pending',
            created_at: new Date().toISOString(),
            pdf_generated: false,
            pdf_path: null
        };

        nocRequests.push(newRequest);
        portalUtils.saveToStorage('noc_requests', nocRequests);

        return newRequest;
    },

    /**
     * Get NOC requests
     * @param {Object} filters - Filter options {student_id, status, company_id}
     * @returns {Array} Array of NOC requests
     */
    getNOCRequests: function (filters = {}) {
        let requests = portalUtils.getFromStorage('noc_requests') || [];

        if (filters.student_id) {
            requests = requests.filter(r => r.student_id === filters.student_id);
        }

        if (filters.status) {
            requests = requests.filter(r => r.status === filters.status);
        }

        if (filters.company_id) {
            requests = requests.filter(r => r.company_id === filters.company_id);
        }

        // Sort by date (newest first)
        requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return requests;
    },

    /**
     * Get NOC request by ID
     * @param {string} nocId - NOC request ID
     * @returns {Object|null} NOC request or null
     */
    getNOCRequestById: function (nocId) {
        const requests = this.getNOCRequests();
        return requests.find(r => r.id === nocId) || null;
    },

    /**
     * Update NOC request status
     * @param {string} nocId - NOC request ID
     * @param {string} status - New status (pending, approved, rejected)
     * @returns {boolean} Success status
     */
    updateNOCStatus: function (nocId, status) {
        const requests = portalUtils.getFromStorage('noc_requests') || [];
        const requestIndex = requests.findIndex(r => r.id === nocId);

        if (requestIndex === -1) return false;

        requests[requestIndex].status = status;
        requests[requestIndex].updated_at = new Date().toISOString();

        portalUtils.saveToStorage('noc_requests', requests);
        return true;
    },

    /**
     * Mark NOC PDF as generated
     * @param {string} nocId - NOC request ID
     * @param {string} pdfPath - Path to generated PDF
     * @returns {boolean} Success status
     */
    markPDFGenerated: function (nocId, pdfPath = null) {
        const requests = portalUtils.getFromStorage('noc_requests') || [];
        const requestIndex = requests.findIndex(r => r.id === nocId);

        if (requestIndex === -1) return false;

        requests[requestIndex].pdf_generated = true;
        requests[requestIndex].pdf_path = pdfPath;
        requests[requestIndex].pdf_generated_at = new Date().toISOString();

        portalUtils.saveToStorage('noc_requests', requests);
        return true;
    },

    /**
     * Check for duplicate NOC request
     * @param {string} studentId - Student ID
     * @param {string} companyId - Company ID
     * @returns {boolean} True if duplicate exists
     */
    checkDuplicateNOC: function (studentId, companyId) {
        const requests = this.getNOCRequests({ student_id: studentId });
        return requests.some(r => r.company_id === companyId && r.status !== 'rejected');
    },

    /**
     * Update company ID in NOC requests (when pending company is approved)
     * @param {string} oldCompanyId - Old (pending) company ID
     * @param {string} newCompanyId - New (approved) company ID
     */
    updateNOCRequestsCompanyId: function (oldCompanyId, newCompanyId) {
        const requests = portalUtils.getFromStorage('noc_requests') || [];
        let updated = false;

        requests.forEach(request => {
            if (request.company_id === oldCompanyId) {
                request.company_id = newCompanyId;
                updated = true;
            }
        });

        if (updated) {
            portalUtils.saveToStorage('noc_requests', requests);
        }
    }
};

// Initialize database on load
document.addEventListener('DOMContentLoaded', function () {
    nocDatabase.init();
});

// Export for use in other scripts
window.nocDatabase = nocDatabase;

