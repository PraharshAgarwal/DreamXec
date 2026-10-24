import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Clock,
  Send,
  PackageCheck,
  Sparkles,
  Thermometer,
  FileText,
  Building2,
  Workflow,
  Eye,
  ExternalLink,
  Mail,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { researchServicesApi, PartnerOrganizationOption } from '../../services/researchServicesService';
import { ServiceItem, WorkflowStageItem, IntakeRequirementField } from '../../data/mockResearcherServices';

interface ServiceWorkflowBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (service: ServiceItem) => void;
  defaultVendorName?: string;
}

export const ServiceWorkflowBuilderModal: React.FC<ServiceWorkflowBuilderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultVendorName,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);

  // Partner organizations list & redirection state
  const [partnerOrgs, setPartnerOrgs] = useState<PartnerOrganizationOption[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [fulfillmentType, setFulfillmentType] = useState<'DIRECT_DISPATCH' | 'INTERNAL_LAB_PORTAL' | 'EXTERNAL_REDIRECT'>('DIRECT_DISPATCH');
  const [redirectUrl, setRedirectUrl] = useState<string>('');
  const [targetLabEmail, setTargetLabEmail] = useState<string>('');
  const [targetLabAddress, setTargetLabAddress] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      researchServicesApi.getPartnerOrganizations().then((orgs) => {
        setPartnerOrgs(orgs || []);
      }).catch((err) => console.error(err));
    }
  }, [isOpen]);

  const handleOrgSelect = (orgId: string) => {
    setSelectedOrgId(orgId);
    if (!orgId) return;
    const matched = partnerOrgs.find((o) => o.id === orgId);
    if (matched) {
      setVendorName(matched.name);
      setVendorLocation(`${matched.name} Campus & Facilities`);
    }
  };

  // Step 1: Basic Service Identity & Pricing
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'TESTING' | 'CLOUD' | 'FABRICATION' | 'CHEMICALS' | 'LEGAL'>('TESTING');
  const [turnaround, setTurnaround] = useState('3 - 5 Business Days');
  const [price, setPrice] = useState<number>(2500);
  const [originalPrice, setOriginalPrice] = useState<number>(3500);
  const [unit, setUnit] = useState('per sample');
  const [summary, setSummary] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [vendorName, setVendorName] = useState(defaultVendorName || 'Accredited Partner Laboratory');
  const [vendorAccreditation, setVendorAccreditation] = useState('NABL & ISO 17025 Certified');
  const [vendorLocation, setVendorLocation] = useState('Bangalore Bio-Cluster');

  // Step 2: Intake Requirements Builder
  const [sampleState, setSampleState] = useState('Liquid / Frozen Solution');
  const [storageTemp, setStorageTemp] = useState('-20°C (Dry Ice / Cold Pack)');
  const [hazardLevel, setHazardLevel] = useState('Non-Hazardous / BSL-1');
  const [minVolumeMass, setMinVolumeMass] = useState('50 µL or 10 mg dry weight');
  const [shippingGuidelines, setShippingGuidelines] = useState(
    'Ship in insulated styrofoam container with blue ice gel packs. Include manifest printout.'
  );

  const [customFields, setCustomFields] = useState<IntakeRequirementField[]>([
    {
      id: 'field-1',
      label: 'Buffer / Solvent Composition',
      type: 'text',
      required: true,
      placeholder: 'e.g. 50mM Tris-HCl, pH 7.4 or DMSO-d6',
      helperText: 'Required to select proper spectrometer baseline or reagent matrix',
    },
    {
      id: 'field-2',
      label: 'Sample Concentration',
      type: 'text',
      required: true,
      placeholder: 'e.g. 10 µM or 2 mg/mL',
      helperText: 'Indicate spectrophotometric or fluorometric concentration',
    },
  ]);

  // Step 3: Workflow Milestones & Execution Stages
  const [stages, setStages] = useState<WorkflowStageItem[]>([
    {
      id: 'st-1',
      name: 'Courier Arrival & Intake QC',
      estimate: 'Day 1 (Within 6h)',
      description: 'Physical specimen verification, temperature validation, cold-chain confirmation, and dual-custody barcode logging.',
      deliverable: 'Check-in Pass / Barcode Confirmation',
    },
    {
      id: 'st-2',
      name: 'Sample Preparation & Matrix Calibration',
      estimate: 'Day 2',
      description: 'Aliquotting, extraction, spin column purification, or substrate drop-casting per standard operating procedure (SOP).',
      deliverable: 'Pre-flight QC Log',
    },
    {
      id: 'st-3',
      name: 'Instrument Acquisition & Analytical Run',
      estimate: 'Day 3',
      description: 'High-resolution analytical scan on calibrated instrument core under strict environmental controls.',
      deliverable: 'Raw Telemetry & Spectral Files',
    },
    {
      id: 'st-4',
      name: 'Data Verification & Senior QA Sign-off',
      estimate: 'Day 4',
      description: 'Baseline normalization, peak-picking, duplicate cross-verification, and chief scientist digital signature.',
      deliverable: 'Certified PDF Analytical Report',
    },
    {
      id: 'st-5',
      name: 'Encrypted Deliverable Dispatch & Settlement',
      estimate: 'Instant',
      description: 'Automated release of signed reports, raw FID/TIFF datasets to researcher dashboard with escrow payout release.',
      deliverable: 'Full Download Package & Audit Trail',
    },
  ]);

  if (!isOpen) return null;

  // Helpers to add/remove custom intake fields
  const handleAddCustomField = () => {
    const newId = `field-${Date.now()}`;
    setCustomFields([
      ...customFields,
      {
        id: newId,
        label: 'New Intake Requirement Question',
        type: 'text',
        required: true,
        placeholder: 'Specify what researcher needs to describe...',
        helperText: 'Help text for applicant',
      },
    ]);
  };

  const handleUpdateCustomField = (id: string, key: keyof IntakeRequirementField, value: any) => {
    setCustomFields(
      customFields.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
  };

  // Helpers to add/remove workflow stages
  const handleAddStage = () => {
    const nextIdx = stages.length + 1;
    setStages([
      ...stages,
      {
        id: `st-${Date.now()}`,
        name: `Stage ${nextIdx}: Custom Execution Milestone`,
        estimate: `Day ${nextIdx}`,
        description: 'Describe analytical procedures, automated tests, or milestones carried out in this stage.',
        deliverable: 'Milestone Deliverable / Data Sheet',
      },
    ]);
  };

  const handleUpdateStage = (id: string, key: keyof WorkflowStageItem, value: string) => {
    setStages(stages.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  };

  const handleRemoveStage = (id: string) => {
    if (stages.length <= 1) {
      toast.error('At least one milestone stage is required in the workflow.');
      return;
    }
    setStages(stages.filter((s) => s.id !== id));
  };

  // Submit and Persist to DB
  const handlePublishService = async () => {
    if (!title.trim()) {
      toast.error('Please enter a service title in Step 1.');
      setCurrentStep(1);
      return;
    }

    if (fulfillmentType === 'EXTERNAL_REDIRECT' && !redirectUrl.trim()) {
      toast.error('Please enter the external lab redirection URL in Step 1.');
      setCurrentStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const generatedId = `srv-${title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .slice(0, 30)}-${Math.floor(100 + Math.random() * 900)}`;

      const workflowConfig = {
        stages,
        intakeFields: customFields,
        sampleRequirements: {
          sampleState,
          storageTemp,
          hazardLevel,
          minVolumeMass,
          shippingGuidelines,
        },
      };

      const payload = {
        id: generatedId,
        title: title.trim(),
        category,
        categoryLabel:
          category === 'TESTING'
            ? 'Lab Testing'
            : category === 'CLOUD'
            ? 'Cloud & GPUs'
            : category === 'FABRICATION'
            ? 'Hardware Fab'
            : category === 'CHEMICALS'
            ? 'Chemicals'
            : 'Patents & Legal',
        categoryColor:
          category === 'TESTING'
            ? '#FE4E1A'
            : category === 'CLOUD'
            ? '#4717AE'
            : category === 'FABRICATION'
            ? '#0F534A'
            : '#18D7E8',
        turnaround: turnaround.trim(),
        price: Number(price),
        originalPrice: Number(originalPrice || price),
        unit: unit.trim(),
        discountPct: Math.round(((originalPrice - price) / (originalPrice || 1)) * 100) || 0,
        summary: summary.trim() || `${title.trim()} provided with transparent milestone tracking.`,
        fullDescription:
          fullDescription.trim() ||
          summary.trim() ||
          `${title.trim()} provided by ${vendorName}. Includes full structured workflow validation.`,
        whatYouSend: `${sampleState} (${minVolumeMass}). Stored at ${storageTemp}.`,
        whatYouGet: stages[stages.length - 1]?.deliverable || 'Certified analytical report & raw data package',
        vendorName: vendorName.trim(),
        vendorAccreditation: vendorAccreditation.trim(),
        vendorLocation: vendorLocation.trim(),
        vendorRating: 5.0,
        tags: [category, 'Workflow Verified', sampleState.split(' ')[0]],
        workflowConfig,
        organizationId: selectedOrgId || null,
        fulfillmentType,
        redirectUrl: redirectUrl.trim() || null,
        targetLabEmail: targetLabEmail.trim() || null,
        targetLabAddress: targetLabAddress.trim() || null,
      };

      const created = await researchServicesApi.createService(payload);

      toast.success(`Service "${title}" published with workflow builder pipeline!`, {
        icon: '🚀',
        style: {
          border: '2px solid #121316',
          boxShadow: '4px 4px 0px #121316',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 700,
        },
      });

      onSuccess(created);
      onClose();
    } catch (err: any) {
      console.error('[ServiceWorkflowBuilder] Error:', err);
      toast.error(err.message || 'Failed to save service workflow');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#FCFBF7] w-full max-w-4xl max-h-[92vh] overflow-y-auto border-3 border-[#121316] shadow-[10px_10px_0px_#121316] flex flex-col text-[#121316] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-[#0F534A] text-white p-5 sm:p-6 border-b-3 border-[#121316] relative flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-[#FFDD33] text-[#121316] border border-[#121316] font-headline font-black text-[10px] uppercase tracking-wider">
              External Organisation · Workflow Studio
            </span>
            <span className="px-2.5 py-0.5 bg-[#FE4E1A] text-white font-headline font-black text-[10px] uppercase tracking-wider">
              Step {currentStep} of 4
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-white flex items-center gap-2.5">
            <Workflow className="w-6 h-6 text-[#9EFC5F]" />
            Service Workflow & Pipeline Builder
          </h2>

          <p className="font-brush text-lg text-[#FFDD33] mt-0.5">
            "Design required intake forms and execution milestone stages"
          </p>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white text-[#121316] border-2 border-[#121316] hover:bg-[#FE4E1A] hover:text-white transition-colors shadow-[2px_2px_0px_#121316] cursor-pointer"
            aria-label="Close Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard Step Navigation Bar */}
        <div className="bg-white border-b-2 border-[#121316] px-6 py-3 flex items-center justify-between overflow-x-auto no-scrollbar">
          {[
            { num: 1, label: '1. Service Details' },
            { num: 2, label: '2. Intake Form Builder' },
            { num: 3, label: '3. Milestone Pipeline' },
            { num: 4, label: '4. Preview & Publish' },
          ].map((s) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num as any)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-headline font-black uppercase tracking-wider transition-all border-2 ${
                  isActive
                    ? 'bg-[#FE4E1A] text-white border-[#121316] shadow-[2px_2px_0px_#121316]'
                    : isCompleted
                    ? 'bg-[#9EFC5F]/30 text-[#0F534A] border-[#0F534A]'
                    : 'bg-transparent text-gray-500 border-transparent hover:text-gray-900'
                }`}
              >
                <span>{s.label}</span>
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[#0F534A]" />}
              </button>
            );
          })}
        </div>

        {/* Body Content per Step */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
          {/* ══════════ STEP 1: SERVICE DETAILS & ECONOMICS ══════════ */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 bg-[#FFF9F2] border-2 border-[#121316] shadow-[3px_3px_0px_#FE4E1A]/40 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#FE4E1A] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-headline font-black uppercase text-[#FE4E1A] block mb-0.5">
                    Catalog Identity & Grant Pricing
                  </span>
                  <p className="text-gray-700 font-body">
                    Specify title, facility details, and pricing. Researchers can book directly using available grant balances or online Razorpay.
                  </p>
                </div>
              </div>

              {/* Assigned Lab & Redirection Configuration */}
              <div className="p-4 bg-[#FFF9F2] border-2 border-[#121316] shadow-[2px_2px_0px_#121316] space-y-3">
                <div className="flex items-center gap-2 text-xs font-headline font-black uppercase tracking-wider text-[#0F534A]">
                  <Building2 className="w-4 h-4 text-[#0F534A]" />
                  Assigned Lab / Target Organization Redirection
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-headline font-bold uppercase text-gray-700 mb-1">
                      Assigned Partner Organization
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

              <div>
                <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1.5">
                  Service Title <span className="text-[#FE4E1A]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 500 MHz Multinuclear NMR Testing & Purity Verification"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-[#121316] font-body text-sm text-[#121316] placeholder-gray-400 focus:outline-none focus:border-[#FE4E1A] shadow-[2px_2px_0px_#121316]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#121316] font-headline font-bold text-xs uppercase text-[#121316] focus:outline-none focus:border-[#FE4E1A] shadow-[2px_2px_0px_#121316]"
                  >
                    <option value="TESTING">Lab Testing & Assays</option>
                    <option value="CLOUD">Cloud & GPU Compute</option>
                    <option value="FABRICATION">Hardware Fab & PCB</option>
                    <option value="CHEMICALS">Chemicals & Reagents</option>
                    <option value="LEGAL">Patents & Legal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1.5">
                    Turnaround SLA
                  </label>
                  <input
                    type="text"
                    value={turnaround}
                    onChange={(e) => setTurnaround(e.target.value)}
                    placeholder="e.g. 48 Hours or 3 Days"
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#121316] font-body text-sm text-[#121316] focus:outline-none focus:border-[#FE4E1A] shadow-[2px_2px_0px_#121316]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1.5">
                    Pricing Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. per sample, per hour"
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#121316] font-body text-sm text-[#121316] focus:outline-none focus:border-[#FE4E1A] shadow-[2px_2px_0px_#121316]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-1.5">
                    Subsidized Price (₹ INR) <span className="text-[#FE4E1A]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#121316] font-headline font-black text-base text-[#0F534A] focus:outline-none focus:border-[#FE4E1A] shadow-[2px_2px_0px_#121316]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-headline font-black uppercase tracking-wider text-gray-500 mb-1.5">
                    Commercial List Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#121316] font-headline font-bold text-base text-gray-500 focus:outline-none focus:border-[#FE4E1A] shadow-[2px_2px_0px_#121316]"
                  />
                </div>
              </div>

              {/* Provider Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1.5">
                    Facility / Lab Name
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border-2 border-[#121316] font-body text-xs text-[#121316] shadow-[2px_2px_0px_#121316]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1.5">
                    Accreditation
                  </label>
                  <input
                    type="text"
                    value={vendorAccreditation}
                    onChange={(e) => setVendorAccreditation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border-2 border-[#121316] font-body text-xs text-[#121316] shadow-[2px_2px_0px_#121316]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1.5">
                    Facility Location
                  </label>
                  <input
                    type="text"
                    value={vendorLocation}
                    onChange={(e) => setVendorLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border-2 border-[#121316] font-body text-xs text-[#121316] shadow-[2px_2px_0px_#121316]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1.5">
                  One-Line Summary
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="e.g. High-resolution proton & carbon-13 analysis for organic molecules"
                  className="w-full px-3.5 py-2 bg-white border-2 border-[#121316] font-body text-xs text-[#121316] shadow-[2px_2px_0px_#121316]"
                />
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1.5">
                  Detailed Service Description
                </label>
                <textarea
                  rows={3}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Comprehensive description of spectrometer capabilities, detection limits, spectral range, and target applications..."
                  className="w-full px-3.5 py-2 bg-white border-2 border-[#121316] font-body text-xs text-[#121316] shadow-[2px_2px_0px_#121316] resize-none"
                />
              </div>
            </div>
          )}

          {/* ══════════ STEP 2: INTAKE REQUIREMENTS FORM BUILDER ══════════ */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 bg-[#FFF9F2] border-2 border-[#121316] shadow-[3px_3px_0px_#0F534A]/40 flex items-start gap-3">
                <Thermometer className="w-5 h-5 text-[#0F534A] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-headline font-black uppercase text-[#0F534A] block mb-0.5">
                    Custom Intake Requirements Builder
                  </span>
                  <p className="text-gray-700 font-body">
                    Define what the researcher must provide during order submission. Specify sample physics, bio-hazard declarations, and custom questionnaire fields.
                  </p>
                </div>
              </div>

              {/* Standard Sample Protocol */}
              <div className="p-4 bg-white border-2 border-[#121316] shadow-[3px_3px_0px_#121316] space-y-4">
                <h3 className="font-headline font-black text-xs uppercase tracking-wider text-[#121316] flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#FE4E1A]" />
                  Standard Specimen & Storage Specifications
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-headline font-bold uppercase text-gray-700 mb-1">
                      Expected Sample State / Matrix
                    </label>
                    <input
                      type="text"
                      value={sampleState}
                      onChange={(e) => setSampleState(e.target.value)}
                      placeholder="e.g. Lyophilized Powder / Thin Film / DNA Solution"
                      className="w-full px-3 py-2 bg-[#FCFBF7] border border-[#121316] font-body text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-headline font-bold uppercase text-gray-700 mb-1">
                      Minimum Volume or Weight
                    </label>
                    <input
                      type="text"
                      value={minVolumeMass}
                      onChange={(e) => setMinVolumeMass(e.target.value)}
                      placeholder="e.g. 10-15 mg or 1.0 mL"
                      className="w-full px-3 py-2 bg-[#FCFBF7] border border-[#121316] font-body text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-headline font-bold uppercase text-gray-700 mb-1">
                      Storage Temperature Requirement
                    </label>
                    <select
                      value={storageTemp}
                      onChange={(e) => setStorageTemp(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FCFBF7] border border-[#121316] font-headline font-bold text-xs"
                    >
                      <option value="Ambient / Room Temp (20-25°C)">Ambient / Room Temp (20-25°C)</option>
                      <option value="Cold Pack (2-8°C)">Cold Pack (2-8°C)</option>
                      <option value="-20°C (Dry Ice / Frozen)">-20°C (Dry Ice / Frozen)</option>
                      <option value="-80°C (Ultra-Low Dry Ice)">-80°C (Ultra-Low Dry Ice)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-headline font-bold uppercase text-gray-700 mb-1">
                      Hazard / Biosafety Level
                    </label>
                    <select
                      value={hazardLevel}
                      onChange={(e) => setHazardLevel(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FCFBF7] border border-[#121316] font-headline font-bold text-xs"
                    >
                      <option value="Non-Hazardous / BSL-1">Non-Hazardous / BSL-1</option>
                      <option value="BSL-2 (Biological / Infectious)">BSL-2 (Biological / Infectious)</option>
                      <option value="Flammable / Volatile Organic">Flammable / Volatile Organic</option>
                      <option value="Corrosive Acid / Base">Corrosive Acid / Base</option>
                      <option value="Air / Moisture Sensitive (Inert Gas)">Air / Moisture Sensitive (Inert Gas)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-headline font-bold uppercase text-gray-700 mb-1">
                    Courier & Shipping Packaging Guidelines
                  </label>
                  <input
                    type="text"
                    value={shippingGuidelines}
                    onChange={(e) => setShippingGuidelines(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FCFBF7] border border-[#121316] font-body text-xs"
                  />
                </div>
              </div>

              {/* Dynamic Intake Questionnaire Questions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline font-black text-xs uppercase tracking-wider text-[#121316] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#4717AE]" />
                    Custom Intake Form Questions (Researcher Prompts)
                  </h3>

                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="px-3 py-1 bg-[#4717AE] text-white border-2 border-[#121316] font-headline font-black text-[11px] uppercase tracking-wider shadow-[2px_2px_0px_#121316] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#FFDD33]" /> Add Question
                  </button>
                </div>

                <div className="space-y-3">
                  {customFields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="p-4 bg-white border-2 border-[#121316] shadow-[2px_2px_0px_#121316] flex items-start gap-4"
                    >
                      <span className="w-6 h-6 rounded-full bg-[#121316] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-1">
                        {idx + 1}
                      </span>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-headline font-bold uppercase text-gray-600 mb-1">
                            Field Label / Question
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleUpdateCustomField(field.id, 'label', e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#FCFBF7] border border-[#121316] text-xs font-headline font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-headline font-bold uppercase text-gray-600 mb-1">
                            Input Type
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) => handleUpdateCustomField(field.id, 'type', e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#FCFBF7] border border-[#121316] text-xs font-headline font-bold"
                          >
                            <option value="text">Short Text</option>
                            <option value="textarea">Paragraph Description</option>
                            <option value="number">Numeric Value</option>
                            <option value="file">File Upload (.zip, .pdf)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-headline font-bold uppercase text-gray-600 mb-1">
                            Helper Guidance Note for Researcher
                          </label>
                          <input
                            type="text"
                            value={field.helperText || ''}
                            onChange={(e) => handleUpdateCustomField(field.id, 'helperText', e.target.value)}
                            placeholder="Helpful instruction or guidance..."
                            className="w-full px-3 py-1.5 bg-[#FCFBF7] border border-[#121316] text-xs font-body"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(field.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors mt-1"
                        title="Remove question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════ STEP 3: MILESTONE & WORKFLOW TIMELINE BUILDER ══════════ */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 bg-[#FFF9F2] border-2 border-[#121316] shadow-[3px_3px_0px_#4717AE]/40 flex items-start gap-3">
                <Workflow className="w-5 h-5 text-[#4717AE] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-headline font-black uppercase text-[#4717AE] block mb-0.5">
                    Order Execution & Milestone Pipeline
                  </span>
                  <p className="text-gray-700 font-body">
                    Define the sequential stages from sample intake to certified deliverable dispatch. Researchers track live progress along this timeline.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-headline font-black uppercase tracking-wider text-[#121316]">
                  Configured Workflow Stages ({stages.length})
                </span>

                <button
                  type="button"
                  onClick={handleAddStage}
                  className="px-3 py-1.5 bg-[#0F534A] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#121316] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#9EFC5F]" /> Add Milestone Stage
                </button>
              </div>

              {/* Stage Cards */}
              <div className="space-y-4">
                {stages.map((stage, idx) => (
                  <div
                    key={stage.id}
                    className="p-4 bg-white border-2 border-[#121316] shadow-[3px_3px_0px_#121316] relative group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#0F534A] text-white font-headline font-black text-xs uppercase">
                          Stage {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={stage.name}
                          onChange={(e) => handleUpdateStage(stage.id, 'name', e.target.value)}
                          className="font-headline font-black text-sm uppercase text-[#121316] bg-transparent border-b border-dashed border-[#121316] focus:outline-none focus:border-[#FE4E1A] px-1"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-[#FFDD33] px-2 py-0.5 border border-[#121316] text-[11px] font-headline font-bold">
                          <Clock className="w-3 h-3 text-[#121316]" />
                          <input
                            type="text"
                            value={stage.estimate}
                            onChange={(e) => handleUpdateStage(stage.id, 'estimate', e.target.value)}
                            placeholder="Est. Time"
                            className="bg-transparent text-[11px] font-bold w-20 focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveStage(stage.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete stage"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mt-3">
                      <div>
                        <label className="block text-[10px] font-headline font-bold uppercase text-gray-600 mb-0.5">
                          Milestone Procedure & Verification Description
                        </label>
                        <input
                          type="text"
                          value={stage.description}
                          onChange={(e) => handleUpdateStage(stage.id, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#FCFBF7] border border-[#121316] font-body text-xs text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-headline font-bold uppercase text-[#0F534A] mb-0.5">
                          Expected Deliverable / Artifact from this Stage
                        </label>
                        <input
                          type="text"
                          value={stage.deliverable || ''}
                          onChange={(e) => handleUpdateStage(stage.id, 'deliverable', e.target.value)}
                          placeholder="e.g. Raw FID Spectra, Quality Gate Pass, Signed PDF Report..."
                          className="w-full px-2.5 py-1.5 bg-[#FCFBF7] border border-[#121316] font-headline font-bold text-xs text-[#0F534A]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ STEP 4: INTERACTIVE PREVIEW & PUBLISH ══════════ */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 bg-[#FFF9F2] border-2 border-[#121316] shadow-[3px_3px_0px_#9EFC5F]/60 flex items-start gap-3">
                <Eye className="w-5 h-5 text-[#0F534A] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-headline font-black uppercase text-[#0F534A] block mb-0.5">
                    Live Client-Facing Service Preview
                  </span>
                  <p className="text-gray-700 font-body">
                    Review how researchers and faculty will see your structured workflow timeline, intake requirements, and order pipeline before publishing.
                  </p>
                </div>
              </div>

              {/* Service Preview Card */}
              <div className="p-6 bg-white border-3 border-[#121316] shadow-[6px_6px_0px_#121316] space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="px-2.5 py-0.5 bg-[#FE4E1A] text-white font-headline font-black text-[10px] uppercase tracking-wider mb-2 inline-block">
                      {category} · Escrow Backed
                    </span>
                    <h3 className="text-xl sm:text-2xl font-headline font-black uppercase text-[#121316]">
                      {title || 'Untitled Service'}
                    </h3>
                    <p className="text-xs font-body text-gray-600 mt-1 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-[#0F534A]" /> {vendorName} · {vendorAccreditation} · {vendorLocation}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-headline uppercase font-bold text-gray-500 block">
                      Grant Subsidized Price
                    </span>
                    <span className="text-2xl font-headline font-black text-[#0F534A]">
                      ₹{price.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 block">{unit}</span>
                  </div>
                </div>

                {/* Intake Specs Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#FFF9F2] border-2 border-[#121316]">
                  <div>
                    <span className="text-[10px] font-headline font-black uppercase text-[#FE4E1A] block mb-1">
                      Required Specimen Intake:
                    </span>
                    <p className="text-xs font-body text-gray-800">
                      {sampleState} ({minVolumeMass}) · {storageTemp} · {hazardLevel}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-headline font-black uppercase text-[#0F534A] block mb-1">
                      Final Deliverables:
                    </span>
                    <p className="text-xs font-body text-gray-800">
                      {stages[stages.length - 1]?.deliverable || 'Certified analytical report & raw data package'}
                    </p>
                  </div>
                </div>

                {/* Interactive Workflow Timeline Preview */}
                <div>
                  <h4 className="font-headline font-black text-xs uppercase tracking-wider text-[#121316] mb-3 flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-[#4717AE]" />
                    Fulfillment Workflow Stages ({stages.length} Milestones)
                  </h4>

                  <div className="space-y-3 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#121316]">
                    {stages.map((st, i) => (
                      <div key={st.id} className="relative flex items-start gap-3 pl-8">
                        <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-[#0F534A] border-2 border-[#121316]" />
                        <div className="flex-1 p-3 bg-white border border-[#121316] shadow-[2px_2px_0px_#121316]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-headline font-black text-xs uppercase text-[#121316]">
                              {i + 1}. {st.name}
                            </span>
                            <span className="px-1.5 py-0.5 bg-[#FFDD33] text-[10px] font-mono font-bold border border-[#121316]">
                              {st.estimate}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{st.description}</p>
                          {st.deliverable && (
                            <div className="mt-1 text-[11px] font-headline font-bold text-[#0F534A] flex items-center gap-1">
                              <PackageCheck className="w-3.5 h-3.5" /> Output: {st.deliverable}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-5 bg-white border-t-3 border-[#121316] flex items-center justify-between gap-3 flex-shrink-0">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((currentStep - 1) as any)}
                className="px-4 py-2 bg-white border-2 border-[#121316] text-[#121316] font-headline font-bold text-xs uppercase hover:bg-gray-100 shadow-[2px_2px_0px_#121316] flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-white border-2 border-[#121316] text-gray-700 font-headline font-bold text-xs uppercase hover:bg-gray-100 shadow-[2px_2px_0px_#121316] cursor-pointer"
            >
              Cancel
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1 && !title.trim()) {
                    toast.error('Please enter a service title.');
                    return;
                  }
                  setCurrentStep((currentStep + 1) as any);
                }}
                className="px-6 py-2.5 bg-[#0F534A] hover:bg-[#18776b] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#121316] flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4 text-[#9EFC5F]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublishService}
                disabled={submitting}
                className="px-6 py-2.5 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_#121316] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <span>Publishing Service...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Publish Service to Catalog</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
