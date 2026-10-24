import React, { useEffect, useState } from "react";
import { 
  X, 
  CheckCircle2 
} from "lucide-react";
import toast from "react-hot-toast";
import { researchServicesApi } from "../../services/researchServicesService";

interface AdminPendingOfferingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshServices: () => void;
}

export const AdminPendingOfferingsModal: React.FC<AdminPendingOfferingsModalProps> = ({
  isOpen,
  onClose,
  onRefreshServices,
}) => {
  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await researchServicesApi.getPendingOfferings();
      setOfferings(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPending();
    }
  }, [isOpen]);

  const handleApprove = async (id: string, labName: string) => {
    try {
      setProcessingId(id);
      await researchServicesApi.approveOffering(id);
      toast.success(`Approved offering from "${labName}"! Now live on marketplace.`);
      setOfferings((prev) => prev.filter((o) => o.id !== id));
      onRefreshServices();
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve offering");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, labName: string) => {
    const reason = window.prompt(`Enter feedback / rejection reason for ${labName}:`, "Pricing or intake requirements require adjustment.");
    if (reason === null) return;

    try {
      setProcessingId(id);
      await researchServicesApi.rejectOffering(id, reason);
      toast.success(`Offering for "${labName}" rejected.`);
      setOfferings((prev) => prev.filter((o) => o.id !== id));
      onRefreshServices();
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject offering");
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#FCFBF7] w-full max-w-3xl max-h-[90vh] overflow-y-auto border-3 border-[#121316] shadow-[8px_8px_0px_#121316] rounded-none relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-[#121316] text-white border-b-3 border-[#121316] flex items-center justify-between">
          <div>
            <span className="px-2.5 py-0.5 bg-[#FFDD33] text-[#121316] font-headline font-black text-xs uppercase tracking-wider">
              ADMIN MODERATION QUEUE
            </span>
            <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight mt-1">
              Pending Lab Service Offerings ({offerings.length})
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

        {/* Body */}
        <div className="p-6 sm:p-8">
          {loading ? (
            <div className="py-12 text-center text-sm font-headline font-bold text-gray-500">
              Loading pending lab applications...
            </div>
          ) : offerings.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-[#0F534A] mx-auto mb-3" />
              <h3 className="font-headline font-black text-lg text-[#121316] uppercase">
                All Lab Applications Processed
              </h3>
              <p className="font-body text-xs text-gray-600 mt-1">
                There are no pending lab offerings awaiting administrative review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {offerings.map((off) => (
                <div
                  key={off.id}
                  className="p-4 bg-white border-2 border-[#121316] shadow-[3px_3px_0px_#121316] space-y-3"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-2 border-gray-100">
                    <div>
                      <span className="px-2 py-0.5 bg-[#FFF9F2] text-[#FE4E1A] border border-[#121316] text-[10px] font-headline font-black uppercase tracking-wider">
                        {off.masterCategory || "Service"}
                      </span>
                      <h4 className="font-headline font-black text-base text-[#121316] mt-1">
                        {off.masterTitle || "Master Service"}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="font-headline font-black text-lg text-[#0F534A]">
                        ₹{off.basePrice.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 font-body block">
                        {off.unit} &bull; {off.turnaround}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-body">
                    <div>
                      <span className="font-bold text-gray-600 block">Applicant Lab:</span>
                      <span className="font-bold text-[#121316]">{off.vendorName}</span>
                      <p className="text-gray-500 text-[11px]">{off.vendorLocation} &bull; {off.vendorAccreditation}</p>
                    </div>

                    <div>
                      <span className="font-bold text-gray-600 block">Configured Dynamic Intake Fields:</span>
                      <span className="font-bold text-[#4717AE]">
                        {off.dynamicIntakeSchema?.length || 0} Fields Configured
                      </span>
                      <p className="text-gray-500 text-[11px]">
                        {off.dynamicIntakeSchema?.map((f: any) => f.label).join(", ") || "Standard"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={processingId === off.id}
                      onClick={() => handleReject(off.id, off.vendorName)}
                      className="px-4 py-2 bg-white text-red-600 hover:bg-red-50 border border-red-500 text-xs font-headline font-bold uppercase disabled:opacity-60"
                    >
                      Reject with Note
                    </button>
                    <button
                      type="button"
                      disabled={processingId === off.id}
                      onClick={() => handleApprove(off.id, off.vendorName)}
                      className="px-5 py-2 bg-[#0F534A] hover:bg-[#0c423b] text-white border-2 border-[#121316] text-xs font-headline font-black uppercase tracking-wider shadow-[2px_2px_0px_#121316] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-60 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#9EFC5F]" /> Approve & Publish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t-2 border-[#121316] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white border-2 border-[#121316] text-xs font-headline font-bold uppercase hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
