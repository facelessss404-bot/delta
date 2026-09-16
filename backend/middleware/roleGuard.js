const { protect, authorize } = require('./authMiddleware');

const requireCommander = [protect, authorize('commander')];
const requireAdminOrCommander = [protect, authorize('admin', 'commander')];
const requireAdmin = [protect, authorize('admin')];
const requireCadet = [protect, authorize('cadet')];

module.exports = {
  requireCommander,
  requireAdminOrCommander,
  requireAdmin,
  requireCadet
};
