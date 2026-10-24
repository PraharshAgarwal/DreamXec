const express = require('express');
const router = express.Router();
const servicesController = require('./services.controller');
const { protect } = require('../../middleware/auth.middleware');

// Public catalog routes
router.get('/', servicesController.getServices);
router.get('/master-services', servicesController.getServices);
router.get('/partners', servicesController.getPartnerOrganizations);
router.post('/seed', servicesController.seedServices);
router.post('/', servicesController.createService);
router.post('/labs', servicesController.createService);

// Offering details & Tracking (Public/Protected)
router.get('/offerings/:id', servicesController.getOfferingById);
router.get('/orders/tracking/:orderRef', servicesController.getOrderTracking);

// Authenticated user & lab routes
router.get('/balance', protect, servicesController.getUserBalance);
router.get('/address', protect, servicesController.getUserAddress);
router.get('/lab-opportunities', protect, servicesController.getLabOpportunities);
router.post('/lab-offerings', protect, servicesController.submitLabOffering);
router.get('/orders', protect, servicesController.getMyOrders);
router.get('/orders/my-orders', protect, servicesController.getMyOrders);

// Admin Moderation routes
router.get('/admin/pending-offerings', protect, servicesController.getPendingOfferings);
router.post('/admin/offerings/:id/approve', protect, servicesController.approveOffering);
router.post('/admin/offerings/:id/reject', protect, servicesController.rejectOffering);

// Order creation, courier tracking & payment routes
router.post('/orders/pay-balance', protect, servicesController.payWithBalance);
router.post('/orders/create-razorpay-order', protect, servicesController.createRazorpayOrder);
router.post('/orders/verify-razorpay-payment', protect, servicesController.verifyRazorpayPayment);
router.put('/orders/:id/courier', protect, servicesController.updateOrderCourier);
router.post('/orders/:id/accept', protect, servicesController.acceptDeliverable);

// Parametric route for single service - MUST be declared AFTER fixed paths
router.get('/:id', servicesController.getServiceById);

module.exports = router;

