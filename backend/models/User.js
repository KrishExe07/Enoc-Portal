/**
 * USER MODEL (Sequelize)
 * MySQL table for users with Google OAuth
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    googleId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        field: 'google_id'
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'password_hash'
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('student', 'faculty', 'admin'),
        allowNull: false,
        defaultValue: 'student'
    },
    profilePicture: {
        type: DataTypes.TEXT,
        field: 'profile_picture'
    },
    emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'email_verified'
    },
    loginProvider: {
        type: DataTypes.ENUM('google', 'local'),
        defaultValue: 'google',
        field: 'login_provider'
    },
    domainType: {
        type: DataTypes.ENUM('edu', 'ac'),
        allowNull: false,
        field: 'domain_type'
    },
    // Student-specific fields
    studentId: {
        type: DataTypes.STRING(100),
        field: 'student_id'
    },
    semester: {
        type: DataTypes.INTEGER,
        validate: {
            min: 1,
            max: 8
        }
    },
    mobile: {
        type: DataTypes.STRING(20)
    },
    // Faculty-specific fields
    department: {
        type: DataTypes.STRING(255)
    },
    designation: {
        type: DataTypes.STRING(255)
    },
    // Status
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    lastLogin: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'last_login'
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['google_id']
        },
        {
            unique: true,
            fields: ['email']
        },
        {
            fields: ['role']
        }
    ]
});

// Instance methods
User.prototype.toJSON = function () {
    const values = { ...this.get() };
    return values;
};

module.exports = User;
