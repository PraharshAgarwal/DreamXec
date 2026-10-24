import React, { useEffect, useState } from "react";
import { 
  X, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ExternalLink, 
  FileText,
  Building2,
  AlertCircle
} from "lucide-react";
import { researchServicesApi } from "../../services/researchServicesService";

interface ShipmentTrackingModalProps {
  orderNumberOrId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShipmentTrackingModal: React.FC<ShipmentTrackingModalProps> = ({
  orderNumberOrId,
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [tracking, setTracking] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderNumberOrId) {
      setLoading(true);
      setError(null);
      researchServicesApi
        .getOrderTracking(orderNumberOrId)
        .then((res) => {
          setTracking(res);
          setLoading(false);
        })
        .catch((err) => {
          setError(err?.message || "Failed to load tracking details");
          setLoading(false);
        });
    }
  }, [isOpen, orderNumberOrId]);

  if (!isOpen || !orderNumberOrId) return null;

  const milestones = [
    { key: "ORDER_PLACED", label: "Order Confirmed", subtext: "Payment received & verified" },
    { key: "PRE_FLIGHT_CHECK", label: "Pre-Flight Check", subtext: "Lab engineer geometry & file review" },
    { key: "IN_PRODUCTION", label: "In Production", subtext: "3D printing / PCB fabrication active" },
    { key: "DISPATCHED", label: "Dispatched", subtext: "Handed over to courier partner" },
    { key: "DELIVERED", label: "Delivered", subtext: "Delivered to target address" },
  ];

  // Determine current milestone index
  const getCurrentMilestoneIndex = () => {
    if (!tracking) return 0;
    const s = tracking.status;
    if (s === "COMPLETED" || s === "DELIVERED") return 4;
    if (s === "DISPATCHED" || tracking.courierDetails?.currentStatus === "DISPATCHED") return 3;
    if (s === "IN_PRODUCTION" || tracking.courierDetails?.currentStatus === "IN_PRODUCTION") return 2;
    if (s === "PRE_FLIGHT_CHECK") return 1;
    return 0;
  };

  const currentIdx = getCurrentMilestoneIndex();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#FCFBF7] w-full max-w-2xl max-h-[90vh] overflow-y-auto border-3 border-[#121316] shadow-[8px_8px_0px_#121316] rounded-none relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-[#0F534A] text-white border-b-3 border-[#121316] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#FFDD33] text-[#121316] font-headline font-black text-xs uppercase tracking-wider border border-[#121316]">
                LIVE SHIPMENT TRACKER
              </span>
              <span className="text-xs font-mono font-bold text-gray-200">
                {orderNumberOrId}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight mt-1">
              {tracking?.serviceTitle || "Fabrication Order Tracking"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white text-[#121316] border-2 border-[#121316] hover:bg-[#FE4E1A] hover:text-white transition-colors shadow-[2px_2px_0px_#121316]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8">
          {loading ? (
            <div className="py-16 text-center">
              <Clock className="w-8 h-8 animate-spin mx-auto text-[#FE4E1A] mb-3" />
              <p className="font-headline font-bold text-sm text-[#121316]">
                Fetching live lab telemetry & shipment status...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border-2 border-red-500 text-red-700 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Courier Status Banner */}
              <div className="p-4 bg-[#FFF9F2] border-2 border-[#121316] shadow-[3px_3px_0px_#121316] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#FE4E1A] text-white border border-[#121316]">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-headline font-black text-sm text-[#121316] block">
                      {tracking.courierDetails?.statusLabel || tracking.statusLabel || "In Progress at Lab"}
                    </span>
                    <span className="text-xs text-gray-600 font-body">
                      Courier: <strong>{tracking.courierDetails?.courierName || "Direct Lab Dispatch"}</strong> • Barcode: <code className="font-mono font-bold text-[#0F534A]">{tracking.trackingCode || tracking.courierDetails?.trackingNumber}</code>
                    </span>
                  </div>
                </div>

                {tracking.courierDetails?.trackingUrl && (
                  <a
                    href={tracking.courierDetails.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-white border-2 border-[#121316] text-xs font-headline font-bold text-[#121316] hover:bg-[#FE4E1A] hover:text-white transition-colors shadow-[2px_2px_0px_#121316] flex items-center gap-1.5"
                  >
                    Track on Courier Portal <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Milestone Progress Stepper */}
              <div className="p-5 bg-white border-2 border-[#121316] shadow-[3px_3px_0px_#121316]">
                <h3 className="text-xs font-headline font-black uppercase text-gray-500 tracking-wider mb-6">
                  Fulfillment Lifecycle
                </h3>

                <div className="relative">
                  {/* Connecting Line */}
                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200" />

                  <div className="space-y-6 relative">
                    {milestones.map((m, idx) => {
                      const isCompleted = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div key={m.key} className="flex items-start gap-4">
                          <div
                            className={`w-8 h-8 rounded-none border-2 border-[#121316] flex items-center justify-center flex-shrink-0 z-10 transition-colors ${
                              isCompleted
                                ? "bg-[#0F534A] text-white"
                                : "bg-white text-gray-300"
                            } ${isCurrent ? "ring-2 ring-[#FE4E1A] ring-offset-2" : ""}`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-[#9EFC5F]" />
                            ) : (
                              <span className="text-xs font-bold">{idx + 1}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-headline font-bold uppercase ${
                                  isCompleted ? "text-[#121316]" : "text-gray-400"
                                }`}
                              >
                                {m.label}
                              </span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 bg-[#FFDD33] text-[#121316] text-[10px] font-headline font-black uppercase border border-[#121316]">
                                  Active Stage
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 font-body mt-0.5">
                              {m.subtext}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Lab Provider & Destination Address Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Lab Info */}
                <div className="p-4 bg-white border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                  <div className="flex items-center gap-1.5 text-xs font-headline font-black uppercase text-[#0F534A] mb-2">
                    <Building2 className="w-3.5 h-3.5" /> Fulfilling Lab Partner
                  </div>
                  <p className="font-headline font-bold text-sm text-[#121316]">
                    {tracking.vendorName}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Certified University / Commercial Fabrication Core
                  </p>
                </div>

                {/* Shipping Destination */}
                <div className="p-4 bg-white border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                  <div className="flex items-center gap-1.5 text-xs font-headline font-black uppercase text-[#FE4E1A] mb-2">
                    <MapPin className="w-3.5 h-3.5" /> Dispatch Destination
                  </div>
                  {tracking.shippingAddress?.addressLine1 ? (
                    <div className="text-xs text-gray-800 font-body leading-snug">
                      <p className="font-bold">{tracking.shippingAddress.recipientName}</p>
                      <p>{tracking.shippingAddress.addressLine1}</p>
                      {tracking.shippingAddress.addressLine2 && <p>{tracking.shippingAddress.addressLine2}</p>}
                      <p>
                        {tracking.shippingAddress.city}, {tracking.shippingAddress.state} - {tracking.shippingAddress.postalCode}
                      </p>
                      <p className="text-gray-500 mt-1">Phone: {tracking.shippingAddress.phone}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Direct digital fulfillment / on-campus collection</p>
                  )}
                </div>
              </div>

              {/* Submitted Technical Specifications & Intake Form */}
              {tracking.dynamicIntakeResponses && Object.keys(tracking.dynamicIntakeResponses).length > 0 && (
                <div className="p-4 bg-[#FCFBF7] border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                  <div className="flex items-center gap-1.5 text-xs font-headline font-black uppercase text-[#121316] mb-3">
                    <FileText className="w-3.5 h-3.5 text-[#4717AE]" /> Submitted Intake Specifications
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(tracking.dynamicIntakeResponses).map(([key, val]) => {
                      if (typeof val === "object" || key === "specialInstructions") return null;
                      return (
                        <div key={key} className="p-2 bg-white border border-gray-300">
                          <span className="font-headline font-bold text-gray-500 uppercase text-[10px] block">
                            {key.replace(/_/g, " ")}:
                          </span>
                          <span className="font-medium text-[#121316] break-words">
                            {String(val)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {tracking.dynamicIntakeResponses?.specialInstructions && (
                    <div className="mt-2 p-2 bg-white border border-gray-300 text-xs">
                      <span className="font-headline font-bold text-gray-500 uppercase text-[10px] block">
                        Special Instructions:
                      </span>
                      <p className="text-gray-800 font-body mt-0.5">
                        {tracking.dynamicIntakeResponses.specialInstructions}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-white border-t-3 border-[#121316] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#121316] hover:bg-gray-800 text-white font-headline font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_#FE4E1A] active:translate-x-[1px] active:translate-y-[1px]"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
