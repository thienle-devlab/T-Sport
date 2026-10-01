const express = require('express');
const router = express.Router();

router.use(require('./cartRoutes'));
router.use(require('./reviewRoutes'));
router.use(require('./orderRoutes'));
router.use(require('./recommendationRoutes'));
router.use(require('./statsRoutes'));
router.use(require('./authRoutes'));
router.use(require('./accountRoutes'));
router.use(require('./userRoutes'));
router.use(require('./productRoutes'));
router.use(require('./categoryRoutes'));
router.use(require('./productSampleRoutes'));
router.use(require('./cartAdminRoutes'));
router.use(require('./orderAdminRoutes'));

module.exports = router;
