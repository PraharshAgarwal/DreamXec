import React, { useState, useMemo } from "react";
import { ServiceItem, LabOfferingItem } from "../../data/mockResearcherServices";
import { 
  X, 
  CheckCircle, 
  Shield, 
  Clock, 
  Send, 
  PackageCheck, 
  DollarSign, 
  MapPin, 
  ExternalLink,
  Building2,
  ArrowUpDown
} from "lucide-react";

interface ServiceDetailModalProps {
  service: ServiceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onBookWithEscrow: (service: ServiceItem, selectedOffering?: LabOfferingItem) => void;
  onOfferThisService?: (service: ServiceItem) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  isOpen,
  onClose,
  onBookWithEscrow,
  onOfferThisService,
}) => {
  const [labSortBy, setLabSortBy] = useState<"PRICE" | "FASTEST" | "RATING">("PRICE");
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);

  const sortedOfferings = useMemo(() => {
    if (!service?.offerings || service.offerings.length === 0) return [];
    const list = [...service.offerings];
    if (labSortBy === "PRICE") {
      list.sort((a, b) => a.basePrice - b.basePrice);
    } else if (labSortBy === "RATING") {
      list.sort((a, b) => b.vendorRating - a.vendorRating);
    } else if (labSortBy === "FASTEST") {
      list.sort((a, b) => a.turnaround.localeCompare(b.turnaround));
    }
    return list;
  }, [service?.offerings, labSortBy]);

  if (!isOpen || !service) return null;

  const currentSelectedOffering = sortedOfferings.find((o) => o.id === selectedLabId) || sortedOfferings[0] || null;
  const activePrice = currentSelectedOffering ? currentSelectedOffering.basePrice : service.price;
  const activeUnit = currentSelectedOffering ? currentSelectedOffering.unit : service.unit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#FCFBF7] w-full max-w-3xl max-h-[90vh] overflow-y-auto border-3 border-[#121316] shadow-[8px_8px_0px_#121316] rounded-none relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover Photo */}
        <div className="relative h-48 sm:h-56 w-full border-b-3 border-[#121316] overflow-hidden bg-gray-900">
          <img
            src={service.imageUrl}
            alt={service.title}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white text-[#121316] border-2 border-[#121316] hover:bg-[#FE4E1A] hover:text-white transition-colors shadow-[2px_2px_0px_#121316]"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Category & Subsidy Badge on Image */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
            <span 
              className="px-3 py-1 text-xs font-headline font-black uppercase tracking-wider text-white border-2 border-[#121316] shadow-[2px_2px_0px_#121316]"
              style={{ backgroundColor: service.categoryColor }}
            >
              {service.categoryLabel}
            </span>

            {sortedOfferings.length > 1 ? (
              <span className="px-3 py-1 text-xs font-headline font-black uppercase tracking-wider bg-[#FFDD33] text-[#121316] border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                {sortedOfferings.length} Certified Labs Available
              </span>
            ) : service.discountPct > 0 ? (
              <span className="px-3 py-1 text-xs font-headline font-black uppercase tracking-wider bg-[#FFDD33] text-[#121316] border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                {service.discountPct}% Grant Subsidy Applied
              </span>
            ) : null}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8">
          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-headline font-black text-[#121316] uppercase tracking-tight mb-2">
            {service.title}
          </h2>

          {/* One-line summary */}
          <p className="font-body text-sm sm:text-base text-gray-700 leading-relaxed mb-6">
            {service.fullDescription}
          </p>

          {/* Multi-Lab Comparison Matrix */}
          {sortedOfferings.length > 0 ? (
            <div className="mb-6 p-4 sm:p-5 bg-white border-3 border-[#121316] shadow-[4px_4px_0px_#121316]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 pb-3 border-b-2 border-gray-100">
                <div>
                  <h3 className="font-headline font-black text-sm uppercase text-[#121316] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#FE4E1A]" /> Compare Approved Fulfillment Labs
                  </h3>
                  <p className="text-xs text-gray-500 font-body">
                    Choose the lab that fits your budget, turnaround time, and quality needs.
                  </p>
                </div>

                {/* Sort controls */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <span className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3" /> Sort:
                  </span>
                  <button
                    onClick={() => setLabSortBy("PRICE")}
                    className={`px-2.5 py-1 text-[11px] font-headline font-bold uppercase border border-[#121316] ${
                      labSortBy === "PRICE" ? "bg-[#121316] text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Lowest Price
                  </button>
                  <button
                    onClick={() => setLabSortBy("FASTEST")}
                    className={`px-2.5 py-1 text-[11px] font-headline font-bold uppercase border border-[#121316] ${
                      labSortBy === "FASTEST" ? "bg-[#121316] text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Fastest
                  </button>
                  <button
                    onClick={() => setLabSortBy("RATING")}
                    className={`px-2.5 py-1 text-[11px] font-headline font-bold uppercase border border-[#121316] ${
                      labSortBy === "RATING" ? "bg-[#121316] text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Top Rated
                  </button>
                </div>
              </div>

              {/* Lab List */}
              <div className="space-y-3">
                {sortedOfferings.map((lab) => {
                  const isSelected = (currentSelectedOffering?.id === lab.id);
                  return (
                    <div
                      key={lab.id}
                      onClick={() => setSelectedLabId(lab.id)}
                      className={`p-3.5 border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#FFF9F2] border-[#FE4E1A] shadow-[3px_3px_0px_#FE4E1A]"
                          : "bg-white border-[#121316] hover:bg-gray-50 shadow-[2px_2px_0px_#121316]"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-headline font-black text-sm text-[#121316]">
                              {lab.vendorName}
                            </span>
                            <CheckCircle className="w-4 h-4 text-[#0F534A]" />
                            {isSelected && (
                              <span className="px-2 py-0.5 bg-[#FE4E1A] text-white text-[10px] font-headline font-black uppercase">
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 font-body flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3 h-3 text-[#FE4E1A]" /> {lab.vendorLocation} • ★ {lab.vendorRating} • <span className="font-medium text-[#0F534A]">{lab.vendorAccreditation}</span>
                          </p>
                        </div>

                        {/* Price & Turnaround */}
                        <div className="flex items-center gap-4 self-end sm:self-auto">
                          <div className="text-right">
                            <div className="flex items-baseline gap-1 justify-end">
                              <span className="font-headline font-black text-lg text-[#0F534A]">
                                ₹{lab.basePrice.toLocaleString()}
                              </span>
                              <span className="text-[11px] text-gray-500 font-body">
                                {lab.unit}
                              </span>
                            </div>
                            <span className="text-[11px] font-headline font-bold text-gray-600 flex items-center gap-1 justify-end">
                              <Clock className="w-3 h-3 text-[#FE4E1A]" /> {lab.turnaround}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose();
                              onBookWithEscrow(service, lab);
                            }}
                            className={`px-3.5 py-2 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] transition-transform active:translate-x-[1px] active:translate-y-[1px] ${
                              isSelected
                                ? "bg-[#FE4E1A] text-white shadow-[2px_2px_0px_#121316]"
                                : "bg-white hover:bg-[#FE4E1A] hover:text-white text-[#121316] shadow-[2px_2px_0px_#121316]"
                            }`}
                          >
                            Book This Lab
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {onOfferThisService && (
                <div className="mt-3 p-3 bg-[#FCFBF7] border border-dashed border-[#121316] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#0F534A]" />
                    <span className="text-xs font-headline font-bold text-gray-800">
                      Are you an accredited lab or university core?
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOfferThisService(service);
                    }}
                    className="px-3 py-1 bg-[#0F534A] hover:bg-[#18776b] text-white border border-[#121316] text-[11px] font-headline font-black uppercase tracking-wider shadow-[2px_2px_0px_#121316] transition-transform active:translate-x-[1px] cursor-pointer"
                  >
                    + Offer This Service
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Single Provider Fallback */
            <div className="flex items-center justify-between p-3.5 bg-[#FFF9F2] border-2 border-[#121316] shadow-[3px_3px_0px_#121316] mb-6">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-headline font-bold text-sm text-[#121316]">{service.vendor.name}</span>
                  <CheckCircle className="w-4 h-4 text-[#0F534A]" />
                </div>
                <p className="text-xs font-body text-gray-600 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-[#FE4E1A]" /> {service.vendor.location} • ★ {service.vendor.rating}
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-white border border-[#121316] text-[#0F534A]">
                {service.vendor.accreditation}
              </span>
            </div>
          )}

          {/* What you send vs What you get */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div className="p-4 bg-white border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
              <div className="flex items-center gap-1.5 text-xs font-headline font-black uppercase text-[#FE4E1A] mb-1.5">
                <Send className="w-3.5 h-3.5" /> What You Provide
              </div>
              <p className="font-body text-xs text-gray-800 leading-snug">
                {service.whatYouSend}
              </p>
            </div>

            <div className="p-4 bg-white border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
              <div className="flex items-center gap-1.5 text-xs font-headline font-black uppercase text-[#0F534A] mb-1.5">
                <PackageCheck className="w-3.5 h-3.5" /> What You Receive
              </div>
              <p className="font-body text-xs text-gray-800 leading-snug">
                {service.whatYouGet}
              </p>
            </div>
          </div>

          {/* Turnaround & Facility Fulfillment Notice */}
          <div className="flex items-center justify-between p-3 bg-white border-2 border-[#121316] mb-6 text-xs">
            <span className="flex items-center gap-1.5 font-headline font-bold text-gray-700">
              <Clock className="w-4 h-4 text-[#FE4E1A]" /> Turnaround: <strong className="text-[#121316]">{currentSelectedOffering?.turnaround || service.turnaround}</strong>
            </span>
            <span className="flex items-center gap-1.5 font-headline font-bold text-[#0F534A]">
              <Shield className="w-4 h-4 text-[#0F534A]" /> Verified Facility Fulfillment
            </span>
          </div>

          {/* Pricing & CTA */}
          <div className="pt-4 border-t-3 border-[#121316] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-headline uppercase font-bold text-gray-500 block">
                {currentSelectedOffering ? `Price from ${currentSelectedOffering.vendorName}` : "Subsidized Grant Price"}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline font-black text-2xl sm:text-3xl text-[#0F534A]">
                  ₹{activePrice.toLocaleString()}
                </span>
                {service.discountPct > 0 && (
                  <span className="text-sm font-headline text-gray-400 line-through">
                    ₹{service.originalPrice.toLocaleString()}
                  </span>
                )}
                <span className="text-xs font-body text-gray-600">
                  {activeUnit}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-3 bg-white border-2 border-[#121316] text-[#121316] font-headline font-bold text-xs uppercase hover:bg-gray-100 shadow-[2px_2px_0px_#121316]"
              >
                Close
              </button>
              {service.fulfillmentType === "EXTERNAL_REDIRECT" && service.redirectUrl ? (
                <a
                  href={service.redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-6 py-3 bg-[#4717AE] hover:bg-[#39128f] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_#121316] active:translate-x-[2px] active:translate-y-[2px] flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4 text-[#9EFC5F]" /> Open Official Portal
                </a>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onBookWithEscrow(service, currentSelectedOffering || undefined);
                  }}
                  className="flex-1 sm:flex-none px-6 py-3 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_#121316] active:translate-x-[2px] active:translate-y-[2px] flex items-center justify-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4" /> Book with {currentSelectedOffering ? currentSelectedOffering.vendorName.split(' ')[0] : 'Service'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

