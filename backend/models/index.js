/**
 * MODEL ASSOCIATIONS
 * Define relationships between models
 */

const User = require('./User');
const Company = require('./Company');
const NOCRequest = require('./NOCRequest');
const Signature = require('./Signature');
const EmailLog = require('./EmailLog');

// User associations
User.hasMany(NOCRequest, { foreignKey: 'studentId', as: 'nocRequests' });
User.hasMany(Company, { foreignKey: 'submittedBy', as: 'submittedCompanies' });
User.hasMany(Company, { foreignKey: 'approvedBy', as: 'approvedCompanies' });
User.hasOne(Signature, { foreignKey: 'userId', as: 'signature' });

// Company associations
Company.belongsTo(User, { foreignKey: 'submittedBy', as: 'submitter' });
Company.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
Company.hasMany(NOCRequest, { foreignKey: 'companyId', as: 'nocRequests' });

// NOCRequest associations
NOCRequest.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
NOCRequest.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });
NOCRequest.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
NOCRequest.belongsTo(Signature, { foreignKey: 'signatureId', as: 'signature' });
NOCRequest.hasMany(EmailLog, { foreignKey: 'nocRequestId', as: 'emailLogs' });

// Signature associations
Signature.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// EmailLog associations
EmailLog.belongsTo(NOCRequest, { foreignKey: 'nocRequestId', as: 'nocRequest' });

module.exports = {
    User,
    Company,
    NOCRequest,
    Signature,
    EmailLog
};
