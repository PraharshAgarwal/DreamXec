import React, { useState, useEffect } from "react";
import { X, Plus, Sparkles, Building2, ExternalLink, Mail, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { researchServicesApi, PartnerOrganizationOption } from "../../services/researchServicesService";
import { ServiceItem } from "../../data/mockResearcherServices";

interface AddLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newService: ServiceItem) => void;
}

export const AddLabModal: React.FC<AddLabModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partnerOrgs, setPartnerOrgs] = useState<PartnerOrganizationOption[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Redirection & target lab state
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [fulfillmentType, setFulfillmentType] = useState<"DIRECT_DISPATCH" | "INTERNAL_LAB_PORTAL" | "EXTERNAL_REDIRECT">("DIRECT_DISPATCH");
  const [redirectUrl, setRedirectUrl] = useState<string>("");
  const [targetLabEmail, setTargetLabEmail] = useState<string>("");
  const [targetLabAddress, setTargetLabAddress] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    category: "TESTING" as "TESTING" | "CLOUD" | "FABRICATION" | "CHEMICALS" | "LEGAL",
    vendorName: "",
    vendorAccreditation: "NABL & ISO 17025 Certified",
    vendorLocation: "National Research Park",
    price: "",
    unit: "per sample",
    turnaround: "3 Business Days",
    summary: "",
    fullDescription: "",
    whatYouSend: "",
    whatYouGet: "",
    tags: "",
  });

  // Fetch registered organizations for admin to assign
  useEffect(() => {
    if (isOpen) {
      setLoadingOrgs(true);
      researchServicesApi.getPartnerOrganizations().then((orgs) => {
        setPartnerOrgs(orgs || []);
        setLoadingOrgs(false);
      }).catch(() => setLoadingOrgs(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOrgSelect = (orgId: string) => {
    setSelectedOrgId(orgId);
    if (!orgId) return;

    const matched = partnerOrgs.find((o) => o.id === orgId);
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        vendorName: matched.name,
        vendorLocation: `${matched.name} Campus & Facilities`,
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a service or lab title");
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    if (!formData.vendorName.trim()) {
      toast.error("Please specify the partner vendor / lab facility name");
      return;
    }
    if (fulfillmentType === "EXTERNAL_REDIRECT" && !redirectUrl.trim()) {
      toast.error("Please provide the external lab/portal redirection URL");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        vendorName: formData.vendorName.trim(),
        vendorAccreditation: formData.vendorAccreditation.trim() || "NABL & ISO Certified",
        vendorLocation: formData.vendorLocation.trim() || "National Research Hub",
        price: Number(formData.price),
        unit: formData.unit.trim() || "per sample",
        turnaround: formData.turnaround.trim() || "3 - 5 Days",
        summary: formData.summary.trim() || `${formData.title} provided by accredited facility.`,
        fullDescription: formData.fullDescription.trim() || formData.summary.trim() || `${formData.title} with certified analytical documentation.`,
        whatYouSend: formData.whatYouSend.trim() || "Standard biological sample or design file",
        whatYouGet: formData.whatYouGet.trim() || "Certified analytical spectrum / technical deliverable",
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        organizationId: selectedOrgId || null,
        fulfillmentType,
        redirectUrl: redirectUrl.trim() || null,
        targetLabEmail: targetLabEmail.trim() || null,
        targetLabAddress: targetLabAddress.trim() || null,
      };

      const created = await researchServicesApi.createService(payload);
      toast.success("External lab registered successfully in PostgreSQL database!");
      onSuccess(created);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add external lab");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl my-8 bg-white border-4 border-[#121316] shadow-[8px_8px_0px_#121316] p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 bg-white hover:bg-[#FE4E1A] hover:text-white border-2 border-[#121316] shadow-[2px_2px_0px_#121316] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#FFDD33] border-2 border-[#121316] shadow-[2px_2px_0px_#121316] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#FE4E1A]" />
            <span className="font-headline font-black text-[10px] uppercase tracking-wider text-[#121316]">
              Admin Lab Configuration
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-headline font-black text-[#121316] uppercase tracking-tight">
            Register Service & Lab Redirection
          </h2>
          <p className="text-xs font-body text-gray-600 mt-1">
            Publish a service and configure the assigned partner laboratory or external portal destination.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Organization Assignment Section */}
          <div className="p-4 bg-[#FFF9F2] border-2 border-[#121316] shadow-[2px_2px_0px_#121316] space-y-3">
            <div className="flex items-center gap-2 text-xs font-headline font-black uppercase tracking-wider text-[#0F534A]">
              <Building2 className="w-4 h-4 text-[#0F534A]" />
              Assigned Lab / Target Organization Redirection
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-headline font-bold uppercase text-gray-700 mb-1">
                  Select Registered Organization / Lab
                </label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => handleOrgSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-[#121316] font-body text-xs focus:outline-none focus:border-[#0F534A] shadow-[2px_2px_0px_#121316]"
                >
                  <option value="">-- Custom / Independent Facility --</option>
                  {partnerOrgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.orgType || "INSTITUTION"})
                    </option>
                  ))}
                </select>
                {loadingOrgs && <span className="text-[10px] text-gray-500">Loading organizations...</span>}
              </div>

              <div>
                <label className="block text-[11px] font-headline font-bold uppercase text-gray-700 mb-1">
                  Fulfillment & Redirection Mode
                </label>
                <select
                  value={fulfillmentType}
                  onChange={(e) => setFulfillmentType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border-2 border-[#121316] font-headline font-bold text-xs uppercase tracking-wider focus:outline-none focus:border-[#0F534A] shadow-[2px_2px_0px_#121316]"
                >
                  <option value="DIRECT_DISPATCH">Direct Dispatch (Courier Manifest)</option>
                  <option value="INTERNAL_LAB_PORTAL">Assigned Org Portal (Internal Routing)</option>
                  <option value="EXTERNAL_REDIRECT">External Lab Portal Redirect</option>
                </select>
              </div>
            </div>

            {/* Conditional Redirection Inputs */}
            {fulfillmentType === "EXTERNAL_REDIRECT" && (
              <div className="pt-2">
                <label className="block text-[11px] font-headline font-bold uppercase text-[#FE4E1A] mb-1 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> External Lab Portal URL *
                </label>
                <input
                  type="url"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="https://core-facility.iisc.ac.in/portal/booking"
                  className="w-full px-3.5 py-2 bg-white border-2 border-[#121316] font-body text-xs focus:outline-none focus:border-[#FE4E1A] shadow-[2px_2px_0px_#121316]"
                  required
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block">
                  Researchers clicking &apos;Book Service&apos; will be seamlessly redirected to this URL.
                </span>
              </div>
            )}

            {fulfillmentType === "DIRECT_DISPATCH" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-headline font-bold uppercase text-gray-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-gray-500" /> Lab Intake Notification Email
                  </label>
                  <input
                    type="email"
                    value={targetLabEmail}
                    onChange={(e) => setTargetLabEmail(e.target.value)}
                    placeholder="intake@analyticalcore.ac.in"
                    className="w-full px-3 py-1.5 bg-white border-2 border-[#121316] font-body text-xs shadow-[2px_2px_0px_#121316]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-headline font-bold uppercase text-gray-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" /> Lab Dispatch Receiving Address
                  </label>
                  <input
                    type="text"
                    value={targetLabAddress}
                    onChange={(e) => setTargetLabAddress(e.target.value)}
                    placeholder="Room 104, Central Instrumentation Bldg"
                    className="w-full px-3 py-1.5 bg-white border-2 border-[#121316] font-body text-xs shadow-[2px_2px_0px_#121316]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                Service / Lab Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Cryo-Electron Microscopy (Cryo-EM) Single Particle Analysis"
                className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border-2 border-[#121316] font-body text-sm focus:outline-none focus:border-[#0F534A] focus:bg-white shadow-[2px_2px_0px_#121316]"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border-2 border-[#121316] font-headline font-bold text-xs uppercase tracking-wider focus:outline-none focus:border-[#0F534A] focus:bg-white shadow-[2px_2px_0px_#121316]"
              >
                <option value="TESTING">Lab Testing & Analytics</option>
                <option value="CLOUD">Cloud & AI Compute</option>
                <option value="FABRICATION">Hardware Fab & Prototyping</option>
                <option value="CHEMICALS">Lab Reagents & Chemicals</option>
                <option value="LEGAL">IP, Patent & Legal Counsel</option>
              </select>
            </div>

            {/* Vendor Name */}
            <div>
              <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                Partner Facility / Vendor Display Name *
              </label>
              <input
                type="text"
                name="vendorName"
                value={formData.vendorName}
                onChange={handleChange}
                placeholder="e.g. NCBS Central Analytical Facility"
                className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border-2 border-[#121316] font-body text-sm focus:outline-none focus:border-[#0F534A] focus:bg-white shadow-[2px_2px_0px_#121316]"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                Base Price (₹ INR) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-500 font-bold text-sm">₹</span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="8500"
                  min="1"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-[#FCFBF7] border-2 border-[#121316] font-headline font-black text-sm focus:outline-none focus:border-[#0F534A] focus:bg-white shadow-[2px_2px_0px_#121316]"
                  required
                />
              </div>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                Pricing Unit
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="e.g. per sample, per GPU hour, per board"
                className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border-2 border-[#121316] font-body text-sm focus:outline-none focus:border-[#0F534A] focus:bg-white shadow-[2px_2px_0px_#121316]"
              />
            </div>

            {/* Turnaround Time */}
            <div>
              <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                Estimated Turnaround
              </label>
              <input
                type="text"
                name="turnaround"
                value={formData.turnaround}
                onChange={handleChange}
                placeholder="e.g. 48 Hours, 3 - 5 Days"
                className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border-2 border-[#121316] font-body text-sm focus:outline-none focus:border-[#0F534A] focus:bg-white shadow-[2px_2px_0px_#121316]"
              />
            </div>

            {/* Vendor Accreditation */}
            <div>
              <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                Accreditation / Certification
              </label>
              <input
                type="text"
                name="vendorAccreditation"
                value={formData.vendorAccreditation}
                onChange={handleChange}
                placeholder="e.g. NABL & ISO 17025 Certified"
                className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border-2 border-[#121316] font-body text-sm focus:outline-none focus:border-[#0F534A] focus:bg-white shadow-[2px_2px_0px_#121316]"
              />
            </div>

            {/* Summary */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                Short Summary (1-2 lines for card)
              </label>
              <input
                type="text"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="Mail your synthesized powder or liquid sample. Certified structure report in 48 hours."
                className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border-2 border-[#121316] font-body text-sm focus:outline-none focus:border-[#0F534A] focus:bg-white shadow-[2px_2px_0px_#121316]"
              />
            </div>

            {/* Requirements: What You Send & What You Get */}
            <div>
              <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                What You Send (Sample Requirement)
              </label>
              <input
                type="text"
                name="whatYouSend"
                value={formData.whatYouSend}
                onChange={handleChange}
                placeholder="e.g. 10-15 mg dry sample in sealed vial"
                className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border-2 border-[#121316] font-body text-sm focus:outline-none focus:border-[#0F534A] focus:bg-white shadow-[2px_2px_0px_#121316]"
              />
            </div>

            <div>
              <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                What You Get (Deliverable)
              </label>
              <input
                type="text"
                name="whatYouGet"
                value={formData.whatYouGet}
                onChange={handleChange}
                placeholder="e.g. Raw spectral files + certified PDF report"
                className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border-2 border-[#121316] font-body text-sm focus:outline-none focus:border-[#0F534A] focus:bg-white shadow-[2px_2px_0px_#121316]"
              />
            </div>

            {/* Tags */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                Search Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="Chemistry, NMR, Purity, Organic Synthesis"
                className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border-2 border-[#121316] font-body text-sm focus:outline-none focus:border-[#0F534A] focus:bg-white shadow-[2px_2px_0px_#121316]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t-2 border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-white hover:bg-gray-100 border-2 border-[#121316] font-headline font-bold text-xs uppercase tracking-wider text-gray-700 shadow-[2px_2px_0px_#121316] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#0F534A] hover:bg-[#18776b] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#121316] flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>Saving to Database...</>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Save Lab to Database
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
