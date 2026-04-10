/**
 * NOC REQUEST MODEL (Sequelize)
 * MySQL table for NOC requests with approval workflow
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NOCRequest = sequelize.define('NOCRequest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nocId: {
        type: DataTypes.STRING(50),
        allowNull: true,  // Changed to true temporarily to allow beforeCreate hook to work
        unique: true,
        field: 'noc_id'
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'student_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    studentName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'student_name'
    },
    studentEmail: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'student_email'
    },
    // Enrollment number derived from email — VIRTUAL (not stored in DB, computed on read)
    // e.g. "24it068@charusat.edu.in" → "24IT068"
    enrollmentNo: {
        type: DataTypes.VIRTUAL,
        get() {
            const email = this.getDataValue('studentEmail');
            if (!email) return null;
            const local = email.split('@')[0];
            return local.toUpperCase();
        }
    },
    semester: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 8
        }
    },
    mobile: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'company_id',
        references: {
            model: 'companies',
            key: 'id'
        }
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'start_date'
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'end_date'
    },
    // Status workflow
    status: {
        type: DataTypes.ENUM('submitted', 'under_review', 'approved', 'signed', 'rejected'),
        allowNull: false,
        defaultValue: 'submitted'
    },
    // Approval fields
    reviewedBy: {
        type: DataTypes.INTEGER,
        field: 'reviewed_by',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    reviewedByName: {
        type: DataTypes.STRING(255),
        field: 'reviewed_by_name'
    },
    reviewedAt: {
        type: DataTypes.DATE,
        field: 'reviewed_at'
    },
    approvalComments: {
        type: DataTypes.TEXT,
        field: 'approval_comments'
    },
    // Rejection fields
    rejectionReason: {
        type: DataTypes.TEXT,
        field: 'rejection_reason'
    },
    rejectedAt: {
        type: DataTypes.DATE,
        field: 'rejected_at'
    },
    // Signature
    signatureId: {
        type: DataTypes.INTEGER,
        field: 'signature_id',
        references: {
            model: 'signatures',
            key: 'id'
        }
    },
    signedAt: {
        type: DataTypes.DATE,
        field: 'signed_at'
    },
    // PDF paths
    unsignedPdfPath: {
        type: DataTypes.STRING(500),
        field: 'unsigned_pdf_path'
    },
    signedPdfPath: {
        type: DataTypes.STRING(500),
        field: 'signed_pdf_path'
    },
    // Email tracking
    emailSent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'email_sent'
    },
    emailSentAt: {
        type: DataTypes.DATE,
        field: 'email_sent_at'
    },
    // Submission tracking
    submittedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'submitted_at'
    }
}, {
    tableName: 'noc_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['student_id', 'status']
        },
        {
            fields: ['status', 'created_at']
        },
        {
            unique: true,
            fields: ['noc_id']
        }
    ],
    hooks: {
        afterCreate: async (nocRequest, options) => {
            if (!nocRequest.nocId && nocRequest.id) {
                const year = new Date().getFullYear();
                const newNocId = `NOC-${year}-${String(nocRequest.id).padStart(4, '0')}`;
                await nocRequest.update({ nocId: newNocId }, { transaction: options.transaction });
            }
        }
    }
});

module.exports = NOCRequest;
