/**
 * SIGNATURE MODEL (Sequelize)
 * MySQL table for faculty/admin signatures
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Signature = sequelize.define('Signature', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    userName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'user_name'
    },
    designation: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    signatureType: {
        type: DataTypes.ENUM('upload', 'canvas'),
        allowNull: false,
        defaultValue: 'upload',
        field: 'signature_type'
    },
    signatureData: {
        type: DataTypes.TEXT('long'), // For base64 encoded images
        allowNull: false,
        field: 'signature_data'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'signatures',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['user_id', 'is_active']
        }
    ]
});

module.exports = Signature;
