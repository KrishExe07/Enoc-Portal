/**
 * COMPANY MODEL (Sequelize)
 * MySQL table for companies
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Company = sequelize.define('Company', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    location: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    website: {
        type: DataTypes.STRING(500)
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    hrName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'hr_name'
    },
    hrEmail: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'hr_email',
        validate: {
            isEmail: true
        }
    },
    hrPhone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'hr_phone'
    },
    numEmployees: {
        type: DataTypes.STRING(50),
        field: 'num_employees'
    },
    technologies: {
        type: DataTypes.TEXT
    },
    approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    approvedBy: {
        type: DataTypes.INTEGER,
        field: 'approved_by',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    approvedAt: {
        type: DataTypes.DATE,
        field: 'approved_at'
    },
    submittedBy: {
        type: DataTypes.INTEGER,
        field: 'submitted_by',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    rejectionReason: {
        type: DataTypes.TEXT,
        field: 'rejection_reason'
    }
}, {
    tableName: 'companies',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['approved']
        },
        {
            fields: ['name']
        }
    ]
});

module.exports = Company;
