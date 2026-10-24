import React, { useState } from "react";
import { MockOrderRecord } from "../../data/mockResearcherServices";
import { 
  X, 
  FileCheck, 
  ShieldCheck, 
  Download, 
  AlertCircle,
  Truck
} from "lucide-react";
import toast from "react-hot-toast";

interface MyOrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orders: MockOrderRecord[];
  onAcceptDeliverable: (orderId: string) => void;
  onOpenTracking?: (orderNumber: string) => void;
}

export const MyOrdersDrawer: React.FC<MyOrdersDrawerProps> = ({
  isOpen,
  onClose,
  orders,
  onAcceptDeliverable,
  onOpenTracking,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<MockOrderRecord | null>(orders[0] || null);

  if (!isOpen) return null;

  const handleAccept = (order: MockOrderRecord) => {
    onAcceptDeliverable(order.id);
    toast.success(`Escrow released to ${order.vendorName}! Utilization certificate generated.`);
  };

  const getStatusColor = (status: MockOrderRecord["status"]) => {
    switch (status) {
      case "DELIVERABLE_SUBMITTED":
        return "bg-[#FFDD33] text-[#121316]";
      case "ESCROW_RELEASED":
        return "bg-[#9EFC5F] text-[#0F534A]";
      case "ESCROW_LOCKED":
        return "bg-[#18D7E8] text-[#121316]";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#FCFBF7] w-full max-w-2xl h-full overflow-y-auto border-l-4 border-[#121316] shadow-2xl p-6 flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-3 border-[#121316] mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-brush text-xl text-[#FE4E1A]">Researcher Workstation</span>
              <span className="px-2 py-0.5 text-[10px] font-headline font-black bg-[#0F534A] text-white">
                {orders.length} Active Orders
              </span>
            </div>
            <h2 className="text-2xl font-headline font-black text-[#121316] uppercase tracking-tight">
              Service Escrow Orders
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white border-2 border-[#121316] hover:bg-[#FE4E1A] hover:text-white transition-colors shadow-[2px_2px_0px_#121316]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orders List / Split View */}
        <div className="flex-1 space-y-4">
          {orders.map((order) => {
            const isSelected = selectedOrder?.id === order.id;

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`p-4 border-2 border-[#121316] cursor-pointer transition-all ${
                  isSelected
                    ? "bg-white shadow-[4px_4px_0px_#FE4E1A]"
                    : "bg-[#FFF9F2] hover:bg-white shadow-[2px_2px_0px_#121316]"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-gray-500">
                      {order.orderNumber} • {order.date}
                    </span>
                    <h3 className="font-headline font-black text-sm text-[#121316]">
                      {order.serviceTitle}
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider border border-[#121316] ${getStatusColor(order.status)}`}>
                    {order.statusLabel}
                  </span>
                </div>

                <div className="text-xs font-body text-gray-600 mb-2">
                  <strong>Grant Source:</strong> {order.campaignTitle}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs">
                  <span className="font-headline font-bold text-[#0F534A]">
                    ₹{order.amount.toLocaleString()} (Held in Escrow)
                  </span>
                  <span className="text-gray-500 font-mono text-[11px]">
                    Vendor: {order.vendorName}
                  </span>
                </div>

                {/* Expanded Details when Selected */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300 space-y-4 animate-fadeIn">
                    {/* Live Order Timeline */}
                    <div>
                      <h4 className="text-[11px] font-headline font-bold uppercase text-gray-500 mb-2">
                        Escrow & Execution Milestones
                      </h4>
                      <div className="grid grid-cols-4 gap-1 text-center">
                        <div className="p-1.5 bg-[#9EFC5F]/30 border border-[#0F534A] text-[10px] font-headline font-bold text-[#0F534A]">
                          1. Locked ✓
                        </div>
                        <div className={`p-1.5 border text-[10px] font-headline font-bold ${
                          order.status !== "ESCROW_LOCKED"
                            ? "bg-[#9EFC5F]/30 border-[#0F534A] text-[#0F534A]"
                            : "bg-white border-gray-300 text-gray-400"
                        }`}>
                          2. Dispatched
                        </div>
                        <div className={`p-1.5 border text-[10px] font-headline font-bold ${
                          order.status === "DELIVERABLE_SUBMITTED" || order.status === "ESCROW_RELEASED"
                            ? "bg-[#9EFC5F]/30 border-[#0F534A] text-[#0F534A]"
                            : "bg-white border-gray-300 text-gray-400"
                        }`}>
                          3. Analyzed
                        </div>
                        <div className={`p-1.5 border text-[10px] font-headline font-bold ${
                          order.status === "ESCROW_RELEASED"
                            ? "bg-[#9EFC5F] border-[#0F534A] text-[#0F534A]"
                            : "bg-white border-gray-300 text-gray-400"
                        }`}>
                          4. Released
                        </div>
                      </div>
                    </div>

                    {/* Live Tracking CTA */}
                    {onOpenTracking && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTracking(order.orderNumber);
                        }}
                        className="w-full py-2 px-3 bg-[#18D7E8] hover:bg-[#12b9c7] text-[#121316] border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#121316] transition-transform active:translate-x-[1px] active:translate-y-[1px]"
                      >
                        <Truck className="w-4 h-4" /> Track Live Shipment & Milestones
                      </button>
                    )}

                    {/* Sample Tracking Code */}
                    {order.sampleTrackingCode && (
                      <div className="p-3 bg-white border border-[#121316] flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-headline uppercase font-bold text-gray-500">
                            Courier Sample Barcode / Tracking
                          </p>
                          <p className="font-mono text-xs font-black text-[#121316]">
                            {order.sampleTrackingCode}
                          </p>
                        </div>
                        <span className="text-[10px] font-headline font-bold text-[#0F534A] bg-[#9EFC5F]/40 px-2 py-0.5 border border-[#0F534A]">
                          Cold-Chain Active
                        </span>
                      </div>
                    )}

                    {/* Deliverable File */}
                    {order.deliverableFile && (
                      <div className="p-3 bg-white border-2 border-[#0F534A] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-5 h-5 text-[#0F534A]" />
                          <div>
                            <p className="text-xs font-headline font-bold text-[#121316]">
                              {order.deliverableFile}
                            </p>
                            <p className="text-[10px] font-body text-gray-500">
                              Certified Spectral / Telemetry Data Uploaded
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.success(`Downloading ${order.deliverableFile}...`);
                          }}
                          className="p-1.5 bg-[#F4F2EC] hover:bg-[#FE4E1A] hover:text-white border border-[#121316] transition-colors"
                          title="Download Test Deliverable"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Deliverable Acceptance CTA */}
                    {order.status === "DELIVERABLE_SUBMITTED" && (
                      <div className="p-4 bg-[#FFDD33]/20 border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                        <div className="flex items-center gap-2 text-xs font-headline font-black text-[#121316] mb-1">
                          <AlertCircle className="w-4 h-4 text-[#FE4E1A]" /> Inspection & Payout Release
                        </div>
                        <p className="text-xs font-body text-gray-700 mb-3">
                          Have you inspected the analytical results and found them satisfactory? Confirming will disburse the held escrow funds to the vendor and record utilization proof in your campaign audit trail.
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccept(order);
                          }}
                          className="w-full py-2.5 bg-[#0F534A] hover:bg-[#18776b] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#121316] active:translate-x-[1px] active:translate-y-[1px]"
                        >
                          Accept Deliverables & Release Escrow Funds (₹{order.amount.toLocaleString()})
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t-3 border-[#121316] mt-4 flex items-center justify-between text-xs font-body text-gray-600">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#0F534A]" /> Zero reimbursement paperwork.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border-2 border-[#121316] font-headline font-bold uppercase text-xs hover:bg-gray-100 shadow-[2px_2px_0px_#121316]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
