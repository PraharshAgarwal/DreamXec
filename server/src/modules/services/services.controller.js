const servicesService = require('./services.service');
const catchAsync = require('../../utils/catchAsync');

exports.getServices = catchAsync(async (req, res) => {
  const { category, query } = req.query;
  const services = await servicesService.getAllServices({ category, query });
  res.status(200).json({
    status: 'success',
    results: services.length,
    data: { services },
  });
});

exports.createService = catchAsync(async (req, res) => {
  const service = await servicesService.createService(req.body);
  res.status(201).json({
    status: 'success',
    message: 'External lab service created successfully in database',
    data: { service },
  });
});

exports.seedServices = catchAsync(async (req, res) => {
  const seeded = await servicesService.seedMockServices();
  res.status(200).json({
    status: 'success',
    message: 'Mock external lab services seeded successfully to database',
    results: seeded.length,
    data: { services: seeded },
  });
});

exports.getPartnerOrganizations = catchAsync(async (req, res) => {
  const partners = await servicesService.getPartnerOrganizations();
  res.status(200).json({
    status: 'success',
    results: partners.length,
    data: { partners },
  });
});

exports.getServiceById = catchAsync(async (req, res) => {
  const service = await servicesService.getServiceById(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { service },
  });
});

exports.getUserBalance = catchAsync(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const balance = await servicesService.getUserBalance(userId);
  res.status(200).json({
    status: 'success',
    data: { balance },
  });
});

exports.getUserAddress = catchAsync(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const addressData = await servicesService.getUserAddress(userId);
  res.status(200).json({
    status: 'success',
    data: addressData,
  });
});

exports.getLabOpportunities = catchAsync(async (req, res) => {
  const opportunities = await servicesService.getLabOpportunities(req.user);
  res.status(200).json({
    status: 'success',
    results: opportunities.length,
    data: { opportunities },
  });
});

exports.submitLabOffering = catchAsync(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const offering = await servicesService.submitLabOffering(userId, req.body);
  res.status(201).json({
    status: 'success',
    message: 'Lab offering submitted successfully for administrative review',
    data: { offering },
  });
});

exports.getOfferingById = catchAsync(async (req, res) => {
  const offering = await servicesService.getOfferingById(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { offering },
  });
});

exports.getPendingOfferings = catchAsync(async (req, res) => {
  const offerings = await servicesService.getPendingOfferings();
  res.status(200).json({
    status: 'success',
    results: offerings.length,
    data: { offerings },
  });
});

exports.approveOffering = catchAsync(async (req, res) => {
  const offering = await servicesService.approveOffering(req.params.id);
  res.status(200).json({
    status: 'success',
    message: 'Lab service offering approved and published to public marketplace',
    data: { offering },
  });
});

exports.rejectOffering = catchAsync(async (req, res) => {
  const { notes } = req.body;
  const offering = await servicesService.rejectOffering(req.params.id, notes);
  res.status(200).json({
    status: 'success',
    message: 'Lab service offering rejected with feedback notes',
    data: { offering },
  });
});

exports.getOrderTracking = catchAsync(async (req, res) => {
  const tracking = await servicesService.getOrderTracking(req.params.orderRef);
  res.status(200).json({
    status: 'success',
    data: { tracking },
  });
});

exports.updateOrderCourier = catchAsync(async (req, res) => {
  const result = await servicesService.updateOrderCourier(req.params.id, req.body);
  res.status(200).json({
    status: 'success',
    message: 'Courier tracking details updated successfully',
    data: result,
  });
});

exports.payWithBalance = catchAsync(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const {
    serviceId,
    offeringId,
    quantity,
    sampleIdentifier,
    notes,
    intakeData,
    shippingAddress,
    dynamicIntakeResponses,
  } = req.body;

  const result = await servicesService.payWithAccountBalance(userId, {
    serviceId,
    offeringId,
    quantity,
    sampleIdentifier,
    notes,
    intakeData,
    shippingAddress,
    dynamicIntakeResponses,
  });

  res.status(201).json({
    status: 'success',
    message: 'Payment completed successfully from available account balance',
    data: result,
  });
});

exports.createRazorpayOrder = catchAsync(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const {
    serviceId,
    offeringId,
    quantity,
    sampleIdentifier,
    notes,
    appliedFromBalance,
    intakeData,
    shippingAddress,
    dynamicIntakeResponses,
  } = req.body;

  const result = await servicesService.createRazorpayOrder(
    userId,
    {
      serviceId,
      offeringId,
      quantity,
      sampleIdentifier,
      notes,
      appliedFromBalance,
      intakeData,
      shippingAddress,
      dynamicIntakeResponses,
    },
    req
  );

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

exports.verifyRazorpayPayment = catchAsync(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const result = await servicesService.verifyRazorpayPayment(
    userId,
    { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature },
    req
  );

  res.status(200).json({
    status: 'success',
    message: 'Payment verified successfully and order placed',
    data: result,
  });
});

exports.getMyOrders = catchAsync(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const orders = await servicesService.getUserOrders(userId);
  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: { orders },
  });
});

exports.acceptDeliverable = catchAsync(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const { id } = req.params;
  const result = await servicesService.acceptDeliverable(userId, id);

  res.status(200).json({
    status: 'success',
    message: 'Deliverable accepted and order settled',
    data: result,
  });
});
