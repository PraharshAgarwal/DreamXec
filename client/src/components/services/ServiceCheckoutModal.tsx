import React, { useState, useEffect } from "react";
import { ServiceItem, LabOfferingItem, MockOrderRecord, IntakeRequirementField, UserAddressRecord } from "../../data/mockResearcherServices";
import { researchServicesApi } from "../../services/researchServicesService";
import { loadRazorpayScript, setupRazorpaySandboxFallback } from "../../utils/loadRazorpay";
import { 
  X, 
  Wallet, 
  CreditCard, 
  CheckCircle2, 
  Lock, 
  Edit2, 
  MapPin, 
  Upload, 
  ArrowRight, 
  ArrowLeft, 
  Truck, 
  User, 
  Phone
} from "lucide-react";
import toast from "react-hot-toast";

interface ServiceCheckoutModalProps {
  service: ServiceItem | null;
  selectedOffering?: LabOfferingItem | null;
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onBalanceUpdated: (newBalance: number) => void;
  onOrderSuccess: (orderData: MockOrderRecord) => void;
  onOpenTracking?: (orderNumber: string) => void;
  currentUser?: any;
  onLogin?: () => void;
}

export const ServiceCheckoutModal: React.FC<ServiceCheckoutModalProps> = ({
  service,
  selectedOffering,
  isOpen,
  onClose,
  availableBalance,
  onBalanceUpdated,
  onOrderSuccess,
  onOpenTracking,
  currentUser,
  onLogin,
}) => {
  // Wizard Steps: 1 = Dynamic Intake Form, 2 = Price & Address Confirmation, 3 = Payment
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form & Pricing State
  const [quantity, setQuantity] = useState<number>(1);
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  const [intakeResponses, setIntakeResponses] = useState<Record<string, any>>({});

  // Shipping Address State
  const [shippingAddress, setShippingAddress] = useState<UserAddressRecord>({
    recipientName: currentUser?.fullName || "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });
  const [hasStoredAddress, setHasStoredAddress] = useState<boolean>(false);
  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(false);

  // Balance & Payment State
  const [useBalance, setUseBalance] = useState<boolean>(availableBalance > 0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [confirmedOrder, setConfirmedOrder] = useState<MockOrderRecord | null>(null);

  // Resolve dynamic intake fields
  const intakeFields: IntakeRequirementField[] = 
    selectedOffering?.dynamicIntakeSchema && selectedOffering.dynamicIntakeSchema.length > 0
      ? selectedOffering.dynamicIntakeSchema
      : service?.workflowConfig?.intakeFields && service.workflowConfig.intakeFields.length > 0
      ? service.workflowConfig.intakeFields
      : [
          {
            id: "project_files",
            label: "Engineering CAD or Specification File",
            type: "file",
            required: true,
            helperText: "Upload your CAD file (STL, STEP) or Gerber ZIP archive.",
          },
          {
            id: "material_preference",
            label: "Material or Standard",
            type: "text",
            required: false,
            placeholder: "e.g., PLA Tough, ABS, FR4, or standard sample matrix",
          },
        ];

  // Fetch saved user address when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      researchServicesApi.getUserAddress().then((addrData) => {
        if (addrData.lastUsedAddress && addrData.lastUsedAddress.addressLine1) {
          setShippingAddress({
            ...addrData.lastUsedAddress,
            recipientName: addrData.lastUsedAddress.recipientName || currentUser.fullName || "",
          });
          setHasStoredAddress(true);
          setIsEditingAddress(false);
        } else {
          setShippingAddress((prev) => ({
            ...prev,
            recipientName: currentUser.fullName || "",
            phone: currentUser.phone || prev.phone,
          }));
          setIsEditingAddress(true);
        }
      });
    }
  }, [isOpen, currentUser]);

  // Reset state when closing or changing service
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setIsSuccess(false);
      setConfirmedOrder(null);
    }
  }, [isOpen]);

  if (!isOpen || !service) return null;

  // Active pricing calculations
  const unitPrice = selectedOffering ? selectedOffering.basePrice : service.price;
  const vendorName = selectedOffering ? selectedOffering.vendorName : service.vendor.name;
  const totalAmount = unitPrice * quantity;
  const appliedFromBalance = useBalance ? Math.min(availableBalance, totalAmount) : 0;
  const remainingPayable = totalAmount - appliedFromBalance;
  const remainingBalanceAfter = Math.max(0, availableBalance - appliedFromBalance);

  const generateTrackingCode = () => {
    const categoryPrefix = (service.category || "SRV").slice(0, 3).toUpperCase();
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `DX-${categoryPrefix}-${randomNum}`;
  };

  const compileIntakeData = (trackingCode: string) => {
    return {
      serviceId: service.id,
      offeringId: selectedOffering?.id || null,
      serviceTitle: service.title,
      vendorName,
      category: service.category,
      sampleIdentifier: trackingCode,
      specialInstructions: specialInstructions.trim(),
      quantity,
      unit: selectedOffering?.unit || service.unit,
      submittedAt: new Date().toISOString(),
      ...intakeResponses,
    };
  };

  // Step 1 Validation
  const handleValidateIntakeAndProceed = () => {
    for (const field of intakeFields) {
      if (field.required && !intakeResponses[field.id]) {
        toast.error(`Please provide a value for "${field.label}"`);
        return;
      }
    }
    setCurrentStep(2);
  };

  // Step 2 Validation
  const handleValidateAddressAndProceed = () => {
    if (service.isPhysicalDelivery !== false) {
      if (!shippingAddress.recipientName?.trim()) {
        toast.error("Please enter the recipient full name.");
        return;
      }
      if (!shippingAddress.addressLine1?.trim()) {
        toast.error("Please enter the delivery street address.");
        return;
      }
      if (!shippingAddress.city?.trim() || !shippingAddress.state?.trim() || !shippingAddress.postalCode?.trim()) {
        toast.error("Please complete city, state, and postal code.");
        return;
      }
      if (!shippingAddress.phone?.trim()) {
        toast.error("Please enter a contact phone number for the courier.");
        return;
      }
    }
    setCurrentStep(3);
  };

  // Full Payment via Available Account Balance
  const handleConfirmFullBalancePayment = async () => {
    if (!currentUser) {
      toast.error("Please log in to your account to complete payment.");
      onLogin?.();
      return;
    }
    try {
      setIsSubmitting(true);
      const trackingCode = generateTrackingCode();
      const intakeData = compileIntakeData(trackingCode);

      const res = await researchServicesApi.payWithBalance({
        serviceId: service.id,
        offeringId: selectedOffering?.id,
        quantity,
        sampleIdentifier: trackingCode,
        notes: specialInstructions.trim(),
        intakeData,
        shippingAddress,
        dynamicIntakeResponses: intakeResponses,
      });

      onBalanceUpdated(res.remainingBalance);
      setConfirmedOrder(res.order);
      onOrderSuccess(res.order);
      setIsSuccess(true);
      toast.success("Payment confirmed! Work order transmitted to lab.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to complete payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment via Razorpay Gateway (full or remaining)
  const handlePayRemainingViaRazorpay = async () => {
    if (!currentUser) {
      toast.error("Please log in to your account to complete payment.");
      onLogin?.();
      return;
    }
    try {
      setIsSubmitting(true);
      const trackingCode = generateTrackingCode();
      const intakeData = compileIntakeData(trackingCode);

      const orderData = await researchServicesApi.createRazorpayOrder({
        serviceId: service.id,
        offeringId: selectedOffering?.id,
        quantity,
        sampleIdentifier: trackingCode,
        notes: specialInstructions.trim(),
        appliedFromBalance,
        intakeData,
        shippingAddress,
        dynamicIntakeResponses: intakeResponses,
      });

      await loadRazorpayScript();

      const isSimulatedOrder = !orderData.razorpayOrderId?.match(/^order_[a-zA-Z0-9]{14,}$/) || orderData.keyId?.includes('dummy');
      if (isSimulatedOrder) {
        setupRazorpaySandboxFallback();
      }

      const RazorpayConstructor = (window as any).Razorpay;
      if (!RazorpayConstructor) {
        throw new Error("Unable to load Razorpay payment gateway.");
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amountInPaise,
        currency: orderData.currency || "INR",
        name: "DreamXec Technologies",
        description: `Order: ${service.title} (${appliedFromBalance > 0 ? `₹${appliedFromBalance} Balance + ` : ''}₹${remainingPayable} online)`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: currentUser.fullName || shippingAddress.recipientName,
          email: currentUser.email,
          contact: shippingAddress.phone || "",
        },
        notes: {
          serviceId: service.id,
          offeringId: selectedOffering?.id || "",
          orderNumber: orderData.orderNumber,
          appliedFromBalance,
          domain: "dreamxec.com",
        },
        theme: {
          color: "#FE4E1A",
        },
        handler: async (response: any) => {
          try {
            await researchServicesApi.verifyRazorpayPayment({
              orderId: orderData.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (appliedFromBalance > 0) {
              onBalanceUpdated(remainingBalanceAfter);
            }

            const completedOrder: MockOrderRecord = {
              id: orderData.orderId,
              orderNumber: orderData.orderNumber,
              serviceTitle: service.title,
              category: service.category,
              vendorName,
              amount: totalAmount,
              appliedFromBalance,
              paidViaOnline: remainingPayable,
              status: "CONFIRMED",
              statusLabel: "Confirmed & Dispatched to Lab",
              date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
              sampleTrackingCode: trackingCode,
              deliverableFile: "Work order active at facility",
              organizationId: selectedOffering?.organizationId || service.organizationId,
              fulfillmentType: "DIRECT_DISPATCH",
              shippingAddress,
              dynamicIntakeResponses: intakeResponses,
            };

            setConfirmedOrder(completedOrder);
            onOrderSuccess(completedOrder);
            setIsSuccess(true);
            toast.success("Payment verified! Work order confirmed.");
          } catch (verifyErr: any) {
            toast.error(verifyErr?.message || "Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          },
        },
      };

      const rzp = new RazorpayConstructor(options);
      rzp.on("payment.failed", (failedRes: any) => {
        toast.error(`Payment failed: ${failedRes.error?.description || "Card or UPI declined"}`);
        setIsSubmitting(false);
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err?.message || "Failed to initialize payment.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#FCFBF7] w-full max-w-2xl max-h-[92vh] overflow-y-auto border-3 border-[#121316] shadow-[8px_8px_0px_#121316] rounded-none relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with 3-Step Wizard Progress Bar */}
        <div className="p-5 bg-white border-b-3 border-[#121316] relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[#121316] hover:bg-gray-100 border border-[#121316] shadow-[2px_2px_0px_#121316]"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <span className="text-[11px] font-headline font-black uppercase text-[#FE4E1A] tracking-wider block mb-1">
            Service Booking & Fulfillment
          </span>
          <h2 className="text-xl sm:text-2xl font-headline font-black text-[#121316] uppercase tracking-tight">
            {service.title}
          </h2>
          <p className="text-xs text-gray-600 font-body flex items-center gap-1.5 mt-0.5">
            Fulfilling Lab: <strong className="text-[#0F534A]">{vendorName}</strong>
          </p>

          {!isSuccess && (
            <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs font-headline font-bold uppercase">
              <div className={`flex items-center gap-1.5 ${currentStep >= 1 ? "text-[#FE4E1A]" : "text-gray-400"}`}>
                <span className="w-5 h-5 rounded-none border border-current flex items-center justify-center text-[11px]">1</span>
                <span>Intake Specs</span>
              </div>
              <div className="h-0.5 w-8 bg-gray-200" />
              <div className={`flex items-center gap-1.5 ${currentStep >= 2 ? "text-[#FE4E1A]" : "text-gray-400"}`}>
                <span className="w-5 h-5 rounded-none border border-current flex items-center justify-center text-[11px]">2</span>
                <span>Address & Price</span>
              </div>
              <div className="h-0.5 w-8 bg-gray-200" />
              <div className={`flex items-center gap-1.5 ${currentStep >= 3 ? "text-[#FE4E1A]" : "text-gray-400"}`}>
                <span className="w-5 h-5 rounded-none border border-current flex items-center justify-center text-[11px]">3</span>
                <span>Payment</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8">
          {/* SUCCESS SCREEN */}
          {isSuccess && confirmedOrder ? (
            <div className="py-4 text-center">
              <div className="w-16 h-16 bg-[#0F534A] text-white border-3 border-[#121316] shadow-[4px_4px_0px_#121316] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-9 h-9 text-[#9EFC5F]" />
              </div>

              <span className="px-3 py-1 bg-[#9EFC5F] text-[#121316] text-xs font-headline font-black uppercase border border-[#121316] inline-block mb-2">
                Order Confirmed & Verified
              </span>
              <h3 className="text-2xl font-headline font-black text-[#121316] uppercase tracking-tight mb-2">
                Work Order Sent to {vendorName}
              </h3>
              <p className="font-body text-sm text-gray-700 max-w-md mx-auto mb-6">
                Your order receipt has been sent to <strong>{currentUser?.email || "your email"}</strong>. The lab has received your CAD/Gerber intake specifications.
              </p>

              <div className="p-4 bg-[#FFF9F2] border-2 border-[#121316] shadow-[3px_3px_0px_#121316] max-w-md mx-auto mb-6 text-left text-xs font-body">
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="font-bold text-gray-600">Order ID:</span>
                  <span className="font-mono font-bold text-[#121316]">{confirmedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="font-bold text-gray-600">Sample Tracking Barcode:</span>
                  <span className="font-mono font-bold text-[#0F534A]">{confirmedOrder.sampleTrackingCode}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="font-bold text-gray-600">Total Paid:</span>
                  <span className="font-headline font-bold text-sm text-[#121316]">₹{confirmedOrder.amount.toLocaleString()}</span>
                </div>
                {confirmedOrder.shippingAddress?.addressLine1 && (
                  <div className="pt-2 text-gray-600">
                    <span className="font-bold block text-gray-700">Dispatch Target:</span>
                    {confirmedOrder.shippingAddress.addressLine1}, {confirmedOrder.shippingAddress.city} ({confirmedOrder.shippingAddress.postalCode})
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenTracking) {
                      onOpenTracking(confirmedOrder.orderNumber);
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-[#0F534A] hover:bg-[#0c423b] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#121316] flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4 text-[#9EFC5F]" /> Track Shipment & Live Progress
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-gray-100 text-[#121316] border-2 border-[#121316] font-headline font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#121316]"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: DYNAMIC INTAKE FORM */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="p-3 bg-[#FFF9F2] border-2 border-[#121316] text-xs font-body text-gray-800">
                    <span className="font-headline font-bold uppercase text-[#FE4E1A] block mb-0.5">
                      Lab Intake Requirements:
                    </span>
                    <strong>{vendorName}</strong> requires these exact parameters and design files to execute this order.
                  </div>

                  {/* Quantity Selector */}
                  <div className="p-4 bg-white border-2 border-[#121316] shadow-[2px_2px_0px_#121316] flex items-center justify-between">
                    <div>
                      <span className="font-headline font-black text-xs uppercase tracking-wide text-[#121316] block">
                        Order Quantity
                      </span>
                      <span className="text-[11px] text-gray-500">Unit: {selectedOffering?.unit || service.unit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 bg-gray-100 hover:bg-gray-200 border-2 border-[#121316] font-headline font-black text-sm"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-headline font-black text-base text-[#121316]">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 bg-gray-100 hover:bg-gray-200 border-2 border-[#121316] font-headline font-black text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Render Dynamic Intake Fields */}
                  <div className="space-y-4">
                    {intakeFields.map((field) => (
                      <div key={field.id} className="p-4 bg-white border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                        <label className="font-headline font-black text-xs uppercase text-[#121316] flex items-center justify-between mb-1">
                          <span>
                            {field.label} {field.required && <span className="text-[#FE4E1A]">*</span>}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono lowercase">
                            {field.type}
                          </span>
                        </label>
                        {field.helperText && (
                          <p className="text-[11px] text-gray-500 font-body mb-2 leading-relaxed">
                            {field.helperText}
                          </p>
                        )}

                        {/* File Upload Field */}
                        {field.type === "file" && (
                          <div className="mt-2 p-4 border-2 border-dashed border-gray-400 bg-gray-50 hover:bg-[#FFF9F2] transition-colors text-center relative cursor-pointer">
                            <input
                              type="file"
                              id={`file-${field.id}`}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setIntakeResponses((prev) => ({
                                    ...prev,
                                    [field.id]: file.name,
                                    [`${field.id}_size`]: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                                  }));
                                  toast.success(`Attached: ${file.name}`);
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <Upload className="w-6 h-6 mx-auto text-[#FE4E1A] mb-1.5" />
                            <p className="font-headline font-bold text-xs text-[#121316]">
                              {intakeResponses[field.id] ? (
                                <span className="text-[#0F534A]">✓ Attached: {intakeResponses[field.id]}</span>
                              ) : (
                                <span>Click to Browse or Drag File Here</span>
                              )}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {field.placeholder || "CAD models (STL, STEP) or Gerber archives (ZIP)"}
                            </p>
                          </div>
                        )}

                        {/* Select Dropdown */}
                        {field.type === "select" && (
                          <select
                            value={intakeResponses[field.id] || ""}
                            onChange={(e) =>
                              setIntakeResponses((prev) => ({ ...prev, [field.id]: e.target.value }))
                            }
                            className="w-full p-2.5 bg-white border-2 border-[#121316] text-xs font-body font-medium text-[#121316] focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                          >
                            <option value="">-- Select Option --</option>
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Text Input */}
                        {field.type === "text" && (
                          <input
                            type="text"
                            value={intakeResponses[field.id] || ""}
                            placeholder={field.placeholder || "Enter specification..."}
                            onChange={(e) =>
                              setIntakeResponses((prev) => ({ ...prev, [field.id]: e.target.value }))
                            }
                            className="w-full p-2.5 bg-white border-2 border-[#121316] text-xs font-body text-[#121316] focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                          />
                        )}

                        {/* Textarea */}
                        {field.type === "textarea" && (
                          <textarea
                            rows={3}
                            value={intakeResponses[field.id] || ""}
                            placeholder={field.placeholder || "Enter notes..."}
                            onChange={(e) =>
                              setIntakeResponses((prev) => ({ ...prev, [field.id]: e.target.value }))
                            }
                            className="w-full p-2.5 bg-white border-2 border-[#121316] text-xs font-body text-[#121316] focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                          />
                        )}
                      </div>
                    ))}

                    {/* Special Instructions */}
                    <div className="p-4 bg-white border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                      <label className="font-headline font-black text-xs uppercase text-[#121316] block mb-1">
                        Additional Notes or Engineering Directives
                      </label>
                      <textarea
                        rows={2}
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="Any additional notes for the lab technicians..."
                        className="w-full p-2.5 bg-white border-2 border-[#121316] text-xs font-body text-[#121316] focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-gray-200 flex justify-end">
                    <button
                      type="button"
                      onClick={handleValidateIntakeAndProceed}
                      className="px-6 py-3 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#121316] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-2"
                    >
                      Confirm Specs & Shipping <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PRICE CONFIRMATION, BILLING & SHIPPING ADDRESS */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Price Summary Card */}
                  <div className="p-4 bg-white border-3 border-[#121316] shadow-[3px_3px_0px_#121316]">
                    <span className="text-[10px] font-headline font-black uppercase text-gray-400 tracking-wider block mb-2">
                      Cost Breakdown
                    </span>
                    <div className="flex justify-between items-baseline py-1 text-xs font-body text-gray-700">
                      <span>Rate ({unitPrice.toLocaleString()} × {quantity} {selectedOffering?.unit || service.unit}):</span>
                      <span className="font-bold text-[#121316]">₹{totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline py-1 text-xs font-body text-gray-700 border-b border-gray-200 pb-2">
                      <span>Standard Courier Dispatch:</span>
                      <span className="font-bold text-[#0F534A]">Free (Included)</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2">
                      <span className="font-headline font-black text-sm uppercase text-[#121316]">Total Payable:</span>
                      <span className="font-headline font-black text-xl text-[#0F534A]">₹{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Customer Billing Info (Auto-consumed from Profile) */}
                  <div className="p-4 bg-white border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                    <div className="flex items-center gap-1.5 text-xs font-headline font-black uppercase text-[#121316] mb-2">
                      <User className="w-3.5 h-3.5 text-[#FE4E1A]" /> Customer Billing Details
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-body">
                      <div className="p-2.5 bg-gray-50 border border-gray-200">
                        <span className="text-[10px] font-headline font-bold text-gray-500 uppercase block">Name:</span>
                        <span className="font-bold text-[#121316]">{currentUser?.fullName || "Guest Innovator"}</span>
                      </div>
                      <div className="p-2.5 bg-gray-50 border border-gray-200">
                        <span className="text-[10px] font-headline font-bold text-gray-500 uppercase block">Email:</span>
                        <span className="font-bold text-[#121316]">{currentUser?.email || "Not specified"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery / Shipping Address (Read-Only Summary with Edit Icon) */}
                  {service.isPhysicalDelivery !== false && (
                    <div className="p-4 bg-white border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-headline font-black text-xs uppercase text-[#121316] flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#FE4E1A]" /> Physical Delivery Destination
                        </span>

                        {hasStoredAddress && !isEditingAddress && (
                          <button
                            type="button"
                            onClick={() => setIsEditingAddress(true)}
                            className="px-2.5 py-1 text-[11px] font-headline font-bold text-[#121316] border border-[#121316] hover:bg-[#FFDD33] flex items-center gap-1 shadow-[1px_1px_0px_#121316]"
                          >
                            <Edit2 className="w-3 h-3" /> Edit Address
                          </button>
                        )}
                      </div>

                      {hasStoredAddress && !isEditingAddress ? (
                        /* Clean Read-Only Address Card */
                        <div className="p-3.5 bg-[#FFF9F2] border-2 border-[#121316] text-xs font-body relative">
                          <span className="px-2 py-0.5 bg-[#0F534A] text-white text-[9px] font-headline font-black uppercase inline-block mb-1.5">
                            Last Used Address
                          </span>
                          <p className="font-headline font-bold text-sm text-[#121316]">
                            {shippingAddress.recipientName}
                          </p>
                          <p className="text-gray-700 mt-0.5">{shippingAddress.addressLine1}</p>
                          {shippingAddress.addressLine2 && <p className="text-gray-700">{shippingAddress.addressLine2}</p>}
                          <p className="text-gray-700 font-semibold mt-0.5">
                            {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.postalCode}
                          </p>
                          <p className="text-gray-500 mt-1 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {shippingAddress.phone || "No phone provided"}
                          </p>
                        </div>
                      ) : (
                        /* Address Edit Form */
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="font-headline font-bold text-gray-700 text-[11px] block mb-1">
                                Recipient Full Name *
                              </label>
                              <input
                                type="text"
                                value={shippingAddress.recipientName}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, recipientName: e.target.value })}
                                placeholder="e.g. Aarav Sharma"
                                className="w-full p-2 bg-white border border-[#121316] text-xs font-body"
                              />
                            </div>
                            <div>
                              <label className="font-headline font-bold text-gray-700 text-[11px] block mb-1">
                                Contact Phone Number *
                              </label>
                              <input
                                type="tel"
                                value={shippingAddress.phone}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                                placeholder="e.g. +91 98765 43210"
                                className="w-full p-2 bg-white border border-[#121316] text-xs font-body"
                              />
                            </div>
                          </div>

                          <div className="text-xs">
                            <label className="font-headline font-bold text-gray-700 text-[11px] block mb-1">
                              Street Address / Hostel / Department *
                            </label>
                            <input
                              type="text"
                              value={shippingAddress.addressLine1}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                              placeholder="e.g. Room 304, Mega Boys Hostel 7, NIT Kurukshetra Campus"
                              className="w-full p-2 bg-white border border-[#121316] text-xs font-body"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <label className="font-headline font-bold text-gray-700 text-[11px] block mb-1">City *</label>
                              <input
                                type="text"
                                value={shippingAddress.city}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                placeholder="Kurukshetra"
                                className="w-full p-2 bg-white border border-[#121316] text-xs font-body"
                              />
                            </div>
                            <div>
                              <label className="font-headline font-bold text-gray-700 text-[11px] block mb-1">State *</label>
                              <input
                                type="text"
                                value={shippingAddress.state}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                                placeholder="Haryana"
                                className="w-full p-2 bg-white border border-[#121316] text-xs font-body"
                              />
                            </div>
                            <div>
                              <label className="font-headline font-bold text-gray-700 text-[11px] block mb-1">PIN Code *</label>
                              <input
                                type="text"
                                value={shippingAddress.postalCode}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                                placeholder="136119"
                                className="w-full p-2 bg-white border border-[#121316] text-xs font-body"
                              />
                            </div>
                          </div>

                          {hasStoredAddress && (
                            <button
                              type="button"
                              onClick={() => setIsEditingAddress(false)}
                              className="text-[11px] font-bold text-gray-500 hover:text-[#121316] underline"
                            >
                              Cancel & Use Stored Address
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="pt-4 border-t-2 border-gray-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2.5 bg-white border-2 border-[#121316] text-xs font-headline font-bold uppercase hover:bg-gray-100 flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Specs
                    </button>
                    <button
                      type="button"
                      onClick={handleValidateAddressAndProceed}
                      className="px-6 py-3 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#121316] flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px]"
                    >
                      Proceed to Payment <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PAYMENT METHOD */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Final Order Review Card */}
                  <div className="p-4 bg-[#FFF9F2] border-2 border-[#121316] text-xs font-body flex justify-between items-center">
                    <div>
                      <span className="font-headline font-black text-sm text-[#121316] block">{service.title}</span>
                      <span className="text-gray-600">Lab: {vendorName} • Qty: {quantity}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 font-bold block uppercase">Payable</span>
                      <span className="font-headline font-black text-lg text-[#0F534A]">₹{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Account Balance Toggle */}
                  {availableBalance > 0 && (
                    <div className="p-4 bg-white border-2 border-[#121316] shadow-[2px_2px_0px_#121316] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#0F534A] text-white border border-[#121316]">
                          <Wallet className="w-5 h-5 text-[#9EFC5F]" />
                        </div>
                        <div>
                          <span className="font-headline font-black text-xs uppercase tracking-wide text-[#121316] block">
                            Use Stored Balance (₹{availableBalance.toLocaleString()})
                          </span>
                          <span className="text-[11px] text-gray-600 font-body">
                            {appliedFromBalance >= totalAmount
                              ? `Covers full ₹${totalAmount.toLocaleString()} — Zero online payment needed.`
                              : `Applies ₹${appliedFromBalance.toLocaleString()}; remaining ₹${remainingPayable.toLocaleString()} via Razorpay.`}
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={useBalance}
                        onChange={(e) => setUseBalance(e.target.checked)}
                        className="w-5 h-5 accent-[#0F534A] border-2 border-[#121316] cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Payment Action */}
                  <div className="space-y-3 pt-2">
                    {useBalance && appliedFromBalance >= totalAmount ? (
                      /* Full Payment via Account Balance */
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleConfirmFullBalancePayment}
                        className="w-full py-4 bg-[#0F534A] hover:bg-[#0c423b] text-white border-2 border-[#121316] font-headline font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_#121316] flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        <Wallet className="w-4 h-4 text-[#9EFC5F]" />
                        {isSubmitting ? "Processing Balance Debit..." : `Confirm Payment with Balance (₹${totalAmount.toLocaleString()})`}
                      </button>
                    ) : (
                      /* Online Razorpay Payment */
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handlePayRemainingViaRazorpay}
                        className="w-full py-4 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white border-2 border-[#121316] font-headline font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_#121316] flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        <CreditCard className="w-4 h-4" />
                        {isSubmitting
                          ? "Connecting to Razorpay..."
                          : `Pay ₹${remainingPayable.toLocaleString()} via Razorpay (UPI / Card)`}
                      </button>
                    )}

                    <div className="flex items-center justify-center gap-1.5 text-center text-xs text-gray-500 font-body pt-1">
                      <Lock className="w-3.5 h-3.5 text-[#0F534A]" />
                      <span>256-bit encrypted transaction &bull; Automatic email receipt</span>
                    </div>
                  </div>

                  {/* Back Button */}
                  <div className="pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-4 py-2 bg-white border border-[#121316] text-xs font-headline font-bold uppercase hover:bg-gray-100 flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Address Review
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
