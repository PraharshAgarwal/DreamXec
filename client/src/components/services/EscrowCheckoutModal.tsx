import React, { useState } from "react";
import { ServiceItem, MOCK_USER_CAMPAIGNS, MockUserCampaign } from "../../data/mockResearcherServices";
import { X, ShieldCheck, CheckCircle2, ArrowRight, DollarSign, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

interface EscrowCheckoutModalProps {
  service: ServiceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderData: any) => void;
}

export const EscrowCheckoutModal: React.FC<EscrowCheckoutModalProps> = ({
  service,
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(MOCK_USER_CAMPAIGNS[0]?.id || "");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(MOCK_USER_CAMPAIGNS[0]?.milestones[1]?.id || "");
  const [quantity, setQuantity] = useState<number>(1);
  const [sampleIdentifier, setSampleIdentifier] = useState<string>("EXP-BATCH-01A");
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [generatedOrderNumber, setGeneratedOrderNumber] = useState<string>("");

  if (!isOpen || !service) return null;

  const currentCampaign: MockUserCampaign | undefined = MOCK_USER_CAMPAIGNS.find((c) => c.id === selectedCampaignId);
  const currentMilestone = currentCampaign?.milestones.find((m) => m.id === selectedMilestoneId);

  const unitPrice = service.price;
  const subtotal = unitPrice * quantity;
  const taxAmount = Math.round(subtotal * 0.18); // 18% GST (academic input tax credit)
  const totalAmount = subtotal + taxAmount;

  const hasSufficientFunds = currentMilestone ? currentMilestone.remainingFunds >= totalAmount : false;

  const handleCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCampId = e.target.value;
    setSelectedCampaignId(newCampId);
    const camp = MOCK_USER_CAMPAIGNS.find((c) => c.id === newCampId);
    if (camp && camp.milestones.length > 0) {
      setSelectedMilestoneId(camp.milestones[0].id);
    }
  };

  const handleSubmitOrder = () => {
    if (!hasSufficientFunds) {
      toast.error("Insufficient milestone grant balance. Please select another milestone or adjust quantity.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const orderNo = `DX-SRV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setGeneratedOrderNumber(orderNo);
      setIsSubmitting(false);
      setIsSuccess(true);

      const orderPayload = {
        id: `ord-${Date.now()}`,
        orderNumber: orderNo,
        serviceTitle: service.title,
        category: service.category,
        vendorName: service.vendor.name,
        amount: totalAmount,
        status: "ESCROW_LOCKED" as const,
        statusLabel: "Escrow Locked (Awaiting Sample Dispatch)",
        date: "Today",
        campaignTitle: currentCampaign?.title || "Research Grant",
        milestoneTitle: currentMilestone?.title || "Milestone",
        sampleTrackingCode: `BLR-${Math.floor(100000 + Math.random() * 900000)}`
      };

      onOrderSuccess(orderPayload);
      toast.success("Order confirmed! Escrow funds reserved successfully.");
    }, 1200);
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#FCFBF7] w-full max-w-2xl max-h-[92vh] overflow-y-auto border-3 border-[#121316] shadow-[8px_8px_0px_#121316] rounded-none p-6 sm:p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 p-2 bg-white border-2 border-[#121316] hover:bg-[#FE4E1A] hover:text-white transition-colors shadow-[2px_2px_0px_#121316] active:translate-x-[1px] active:translate-y-[1px]"
          aria-label="Close Checkout"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          /* Success Screen */
          <div className="text-center py-6 animate-fadeIn">
            <div className="w-16 h-16 bg-[#9EFC5F] border-3 border-[#121316] shadow-[4px_4px_0px_#121316] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-[#0F534A]" />
            </div>

            <span className="font-brush text-2xl text-[#FE4E1A] block mb-1">
              Zero Out-of-Pocket Success!
            </span>
            <h2 className="text-2xl sm:text-3xl font-headline font-black text-[#121316] uppercase tracking-tight mb-2">
              Grant Escrow Reserved
            </h2>
            <p className="font-body text-sm text-gray-700 max-w-md mx-auto mb-6">
              Order <strong className="font-mono text-[#0F534A]">{generatedOrderNumber}</strong> has been created.
              ₹{totalAmount.toLocaleString()} has been placed in secure escrow from <strong className="text-gray-900">{currentMilestone?.title}</strong>.
            </p>

            {/* Escrow Guarantee Box */}
            <div className="p-4 bg-[#FFF9F2] border-2 border-[#121316] shadow-[3px_3px_0px_#121316] text-left mb-6 max-w-md mx-auto">
              <div className="flex items-center gap-2 text-xs font-headline font-bold text-[#0F534A] uppercase mb-1">
                <ShieldCheck className="w-4 h-4 text-[#FE4E1A]" /> Milestone Escrow Protection
              </div>
              <p className="text-xs font-body text-gray-700 leading-relaxed">
                Vendor <strong>{service.vendor.name}</strong> will execute the work. Funds will remain securely frozen and will <em>only</em> be disbursed once you review and accept the deliverable report.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleResetAndClose}
                className="w-full sm:w-auto px-6 py-3 bg-[#0F534A] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider hover:bg-[#18776b] shadow-[4px_4px_0px_#121316] active:translate-x-[2px] active:translate-y-[2px]"
              >
                Track in My Active Orders
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <div>
            {/* Header */}
            <div className="mb-5 pr-8">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider bg-[#0F534A] text-white border border-[#121316]">
                  Milestone Escrow Checkout
                </span>
                <span className="text-xs font-brush text-[#FE4E1A]">
                  Direct Grant Utilization
                </span>
              </div>
              <h2 className="text-2xl font-headline font-black text-[#121316] uppercase tracking-tight">
                Book: {service.title}
              </h2>
              <p className="text-xs font-body text-gray-600 mt-1">
                Fulfilled by: <strong>{service.vendor.name}</strong> ({service.vendor.accreditation})
              </p>
            </div>

            {/* Step 1: Select Funding Campaign & Milestone */}
            <div className="p-4 bg-[#FFF9F2] border-2 border-[#121316] shadow-[3px_3px_0px_#121316] mb-5">
              <h3 className="text-xs font-headline font-black text-[#121316] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#FE4E1A]" /> 1. Select Grant Funding Source
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-headline font-bold text-gray-700 uppercase mb-1">
                    Your Approved Campaign:
                  </label>
                  <select
                    value={selectedCampaignId}
                    onChange={handleCampaignChange}
                    className="w-full p-2.5 bg-white border-2 border-[#121316] font-body text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                  >
                    {MOCK_USER_CAMPAIGNS.map((camp) => (
                      <option key={camp.id} value={camp.id}>
                        {camp.title} ({camp.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-headline font-bold text-gray-700 uppercase mb-1">
                    Target Milestone Tranche:
                  </label>
                  <select
                    value={selectedMilestoneId}
                    onChange={(e) => setSelectedMilestoneId(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-[#121316] font-body text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                  >
                    {currentCampaign?.milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} — Available Balance: ₹{m.remainingFunds.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Milestone Balance Pill */}
                {currentMilestone && (
                  <div className={`p-2.5 border-2 ${hasSufficientFunds ? "bg-[#9EFC5F]/20 border-[#0F534A] text-[#0F534A]" : "bg-red-50 border-[#F4002C] text-[#F4002C]"} flex items-center justify-between text-xs font-headline font-bold`}>
                    <span>Available Milestone Budget: ₹{currentMilestone.remainingFunds.toLocaleString()}</span>
                    <span>{hasSufficientFunds ? "✓ Sufficient" : "✗ Over Budget"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Service Parameters & Sample Details */}
            <div className="p-4 bg-white border-2 border-[#121316] shadow-[3px_3px_0px_#121316] mb-5">
              <h3 className="text-xs font-headline font-black text-[#121316] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#4717AE]" /> 2. Configuration & Sample Parameters
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] font-headline font-bold text-gray-700 uppercase mb-1">
                    Units / Samples:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 bg-gray-100 border-2 border-[#121316] font-headline font-bold hover:bg-gray-200"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-headline font-black text-sm">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 bg-gray-100 border-2 border-[#121316] font-headline font-bold hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-headline font-bold text-gray-700 uppercase mb-1">
                    Sample / Batch ID:
                  </label>
                  <input
                    type="text"
                    value={sampleIdentifier}
                    onChange={(e) => setSampleIdentifier(e.target.value)}
                    placeholder="e.g. LAB-SPEC-01"
                    className="w-full p-2 bg-white border-2 border-[#121316] font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>


              <div>
                <label className="block text-[11px] font-headline font-bold text-gray-700 uppercase mb-1">
                  Special Instructions / Handling Notes:
                </label>
                <textarea
                  rows={2}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Hygroscopic sample, store at -20°C until measurement, run 13C overnight."
                  className="w-full p-2 bg-white border-2 border-[#121316] font-body text-xs focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="p-4 bg-[#F4F2EC] border-2 border-[#121316] mb-5">
              <div className="flex justify-between text-xs font-body text-gray-700 mb-1">
                <span>Subsidized Unit Cost ({quantity} × ₹{unitPrice.toLocaleString()}):</span>
                <span className="font-bold">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-body text-gray-700 mb-1">
                <span>GST (18% input credit eligible):</span>
                <span>₹{taxAmount.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-gray-300 flex justify-between items-baseline font-headline font-black text-base text-[#121316]">
                <span>Total Escrow Deduction:</span>
                <span className="text-[#0F534A] text-lg">₹{totalAmount.toLocaleString()}</span>
              </div>
              <p className="text-[10px] font-body text-gray-500 mt-1">
                * Zero personal expenditure. Directly debited from Milestone Escrow upon final acceptance.
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full sm:w-auto px-4 py-3 bg-white border-2 border-[#121316] text-[#121316] font-headline font-bold text-xs uppercase tracking-wider hover:bg-gray-100 shadow-[2px_2px_0px_#121316]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!hasSufficientFunds || isSubmitting}
                onClick={handleSubmitOrder}
                className={`w-full sm:w-auto px-6 py-3 border-2 border-[#121316] text-white font-headline font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_#121316] flex items-center justify-center gap-2 ${
                  hasSufficientFunds && !isSubmitting
                    ? "bg-[#FE4E1A] hover:bg-[#e03d0d] active:translate-x-[2px] active:translate-y-[2px]"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Locking Escrow Funds...
                  </>
                ) : (
                  <>
                    Confirm & Lock Escrow Funds <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
