"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireBUAccess = exports.requireRole = void 0;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to access this resource'
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
const requireBUAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    // CEO and Admin can access all BUs
    if (req.user.role === 'CEO' || req.user.role === 'ADMIN') {
        return next();
    }
    // Check if user is accessing their own BU
    const requestedBuId = req.params.buId || req.query.buId || req.body.businessUnitId;
    if (requestedBuId && requestedBuId !== req.user.buId) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'You can only access data from your own business unit'
        });
    }
    next();
};
exports.requireBUAccess = requireBUAccess;
