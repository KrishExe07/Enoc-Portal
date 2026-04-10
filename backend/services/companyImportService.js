const fs = require('fs');
const xlsx = require('xlsx');
const { Op, fn, col, where } = require('sequelize');
const { Company } = require('../models');

const REQUIRED_COLUMNS = [
    'SR. No',
    'Company Name',
    'Company Details',
    'Technology',
    'Paid Internship - Not allowed'
];

function normalizeHeader(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[._]/g, '');
}

function buildHeaderMap(headers) {
    const map = new Map();
    headers.forEach((header) => {
        map.set(normalizeHeader(header), header);
    });
    return map;
}

function validateAndGetColumnMap(headers) {
    const headerMap = buildHeaderMap(headers);

    const columnMap = {
        serialNumber: headerMap.get(normalizeHeader('SR. No')),
        companyName: headerMap.get(normalizeHeader('Company Name')),
        companyDetails: headerMap.get(normalizeHeader('Company Details')),
        technology: headerMap.get(normalizeHeader('Technology')),
        paidInternshipNotAllowed: headerMap.get(normalizeHeader('Paid Internship - Not allowed'))
    };

    const missing = REQUIRED_COLUMNS.filter((requiredHeader) => {
        return !headerMap.get(normalizeHeader(requiredHeader));
    });

    if (missing.length > 0) {
        const error = new Error(`Excel validation failed. Missing required column(s): ${missing.join(', ')}`);
        error.code = 'INVALID_EXCEL_COLUMNS';
        throw error;
    }

    return columnMap;
}

function normalizeCompanyName(name) {
    return String(name || '')
        .replace(/[\uFFFD\u00FF]/g, '')
        .trim()
        .replace(/\s+/g, ' ');
}

function createCompanyPayload(row, columnMap) {
    const name = normalizeCompanyName(row[columnMap.companyName]);
    const companyDetails = String(row[columnMap.companyDetails] || '').trim();
    const technology = String(row[columnMap.technology] || '').trim();
    const paidInternshipNotAllowed = String(row[columnMap.paidInternshipNotAllowed] || '').trim();
    const website = /^https?:\/\//i.test(companyDetails) ? companyDetails : null;

    return {
        name,
        location: 'N/A',
        website,
        address: companyDetails || 'N/A',
        hrName: 'N/A',
        hrEmail: 'not-provided@company.local',
        hrPhone: 'N/A',
        numEmployees: paidInternshipNotAllowed || null,
        technologies: technology || null,
        approved: true,
        approvedAt: new Date(),
        submittedBy: null,
        approvedBy: null
    };
}

async function upsertCompanyByName(companyPayload) {
    const normalizedName = companyPayload.name.toLowerCase();
    const existingCompany = await Company.findOne({
        where: where(fn('LOWER', col('name')), normalizedName)
    });

    if (existingCompany) {
        await existingCompany.update({
            address: companyPayload.address || existingCompany.address,
            website: companyPayload.website || existingCompany.website,
            technologies: companyPayload.technologies || existingCompany.technologies,
            numEmployees: companyPayload.numEmployees || existingCompany.numEmployees,
            approved: true,
            approvedAt: existingCompany.approvedAt || new Date()
        });
        return { action: 'updated', company: existingCompany };
    }

    const createdCompany = await Company.create(companyPayload);
    return { action: 'inserted', company: createdCompany };
}

function parseWorkbook(workbook) {
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
        const error = new Error('Excel file does not contain any sheet');
        error.code = 'EMPTY_WORKBOOK';
        throw error;
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, {
        defval: '',
        raw: false
    });

    if (!rows.length) {
        const error = new Error('Excel file is empty. Add at least one company row.');
        error.code = 'EMPTY_SHEET';
        throw error;
    }

    const headers = Object.keys(rows[0]);
    const columnMap = validateAndGetColumnMap(headers);

    return { rows, columnMap };
}

async function importCompaniesFromWorkbook(workbook) {
    const { rows, columnMap } = parseWorkbook(workbook);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const seenNames = new Set();

    for (const row of rows) {
        const companyPayload = createCompanyPayload(row, columnMap);

        if (!companyPayload.name) {
            skipped += 1;
            continue;
        }

        const normalizedName = companyPayload.name.toLowerCase();
        if (seenNames.has(normalizedName)) {
            skipped += 1;
            continue;
        }
        seenNames.add(normalizedName);

        const result = await upsertCompanyByName(companyPayload);
        if (result.action === 'inserted') {
            inserted += 1;
        } else {
            updated += 1;
        }
    }

    return {
        success: true,
        totalRows: rows.length,
        inserted,
        updated,
        skipped
    };
}

async function importCompaniesFromBuffer(fileBuffer) {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    return importCompaniesFromWorkbook(workbook);
}

async function importCompaniesFromFile(filePath) {
    if (!fs.existsSync(filePath)) {
        const error = new Error(`Excel file not found at: ${filePath}`);
        error.code = 'FILE_NOT_FOUND';
        throw error;
    }

    const workbook = xlsx.readFile(filePath);
    return importCompaniesFromWorkbook(workbook);
}

async function findCompanyByName(companyName) {
    const normalizedCompanyName = normalizeCompanyName(companyName);
    if (!normalizedCompanyName) return null;

    return Company.findOne({
        where: where(fn('LOWER', col('name')), normalizedCompanyName.toLowerCase())
    });
}

module.exports = {
    importCompaniesFromBuffer,
    importCompaniesFromFile,
    findCompanyByName
};