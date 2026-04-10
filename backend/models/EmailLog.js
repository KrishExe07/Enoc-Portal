/**
 * EMAIL LOG MODEL (Sequelize)
 * MySQL table for tracking sent emails
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmailLog = sequelize.define('EmailLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nocRequestId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'noc_request_id',
        references: {
            model: 'noc_requests',
            key: 'id'
        }
    },
    sentTo: {
        type: DataTypes.JSON, // Array of email addresses
        allowNull: false,
        field: 'sent_to'
    },
    cc: {
        type: DataTypes.JSON, // Array of email addresses
        field: 'cc'
    },
    subject: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    body: {
        type: DataTypes.TEXT('long'),
        allowNull: false
    },
    attachments: {
        type: DataTypes.JSON, // Array of {filename, path}
        field: 'attachments'
    },
    status: {
        type: DataTypes.ENUM('sent', 'failed', 'pending'),
        defaultValue: 'pending'
    },
    errorMessage: {
        type: DataTypes.TEXT,
        field: 'error_message'
    },
    sentAt: {
        type: DataTypes.DATE,
        field: 'sent_at'
    }
}, {
    tableName: 'email_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['noc_request_id']
        },
        {
            fields: ['status', 'created_at']
        }
    ]
});

module.exports = EmailLog;
