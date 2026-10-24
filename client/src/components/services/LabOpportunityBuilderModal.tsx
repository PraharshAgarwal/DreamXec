import React, { useState } from "react";
import { 
  X, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Building2, 
  FileText
} from "lucide-react";
import toast from "react-hot-toast";
import { researchServicesApi } from "../../services/researchServicesService";
import { IntakeRequirementField } from "../../data/mockResearcherServices";

interface LabOpportunityBuilderModalProps {
  masterService: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser?: any;
}

export const LabOpportunityBuilderModal: React.FC<LabOpportunityBuilderModalProps> = ({
  masterService,
  isOpen,
  onClose,
  onSuccess,
  currentUser,
}) => {
  const [submitting, setSubmitting] = useState(false);

  // Lab Identity & Pricing
  const [vendorName, setVendorName] = useState(
    currentUser?.activeProfile?.organizationName || "University MakerSpace Core"
  );
  const [vendorAccreditation, setVendorAccreditation] = useState("AICTE & NABL Certified");
  const [vendorLocation, setVendorLocation] = useState("Main Engineering Campus");
  const [basePrice, setBasePrice] = useState<number>(350);
  const [originalPrice] = useState<number>(500);
  const [unit, setUnit] = useState(masterService?.defaultUnit || "per part");
  const [turnaround, setTurnaround] = useState("2 - 3 Business Days");

  // Dynamic Intake Fields
  const [intakeFields, setIntakeFields] = useState<IntakeRequirementField[]>([
    {
      id: "cad_file",
      label: "3D CAD Model / Design Archive",
      type: "file",
      required: true,
      helperText: "Upload CAD model (STL, STEP) or Gerber ZIP archive.",
    },
    {
      id: "material_type",
      label: "Material Choice",
      type: "select",
      required: true,
      options: ["PLA Tough (White)", "PLA Tough (Black)", "PETG (Heat Resistant)", "ABS"],
      helperText: "Select primary material for fabrication.",
    },
    {
      id: "infill_density",
      label: "Infill Density (%)",
      type: "select",
      required: true,
      options: ["20% (Standard)", "50% (Functional)", "100% (Solid)"],
    },
    {
      id: "special_notes",
      label: "Tolerances & Thread Requirements",
      type: "textarea",
      required: false,
      placeholder: "e.g. M3 heat-set inserts or critical bearing press-fits.",
    },
  ]);

  // Quick Templates
  const handleLoadTemplate = (type: "3D" | "PCB" | "TESTING") => {
    if (type === "3D") {
      setIntakeFields([
        {
          id: "cad_file",
          label: "3D CAD Model File (STL, STEP)",
          type: "file",
          required: true,
          helperText: "Upload manifold 3D mesh exported in millimeters (Max 50MB).",
        },
        {
          id: "material_choice",
          label: "Material Selection",
          type: "select",
          required: true,
          options: ["PLA Tough (White)", "PLA Tough (Black)", "PETG", "ABS", "High-Detail Resin"],
        },
        {
          id: "infill_density",
          label: "Infill Density (%)",
          type: "select",
          required: true,
          options: ["20% (Standard)", "50% (Semi-Structural)", "100% (Solid)"],
        },
        {
          id: "special_instructions",
          label: "Dimensional Notes & Tolerances",
          type: "textarea",
          required: false,
          placeholder: "Specify critical fits, heat-set inserts, or print orientation preferences.",
        },
      ]);
      setUnit("per part");
      setBasePrice(350);
      toast.success("Loaded 3D Printing Intake Template!");
    } else if (type === "PCB") {
      setIntakeFields([
        {
          id: "gerber_zip",
          label: "Gerber Archive (.ZIP)",
          type: "file",
          required: true,
          helperText: "Include RS-274X copper, soldermask, drill files in zip archive.",
        },
        {
          id: "layer_count",
          label: "Layer Count",
          type: "select",
          required: true,
          options: ["1 Layer (Single)", "2 Layers (Standard)", "4 Layers (Multi)", "6 Layers (High-Density)"],
        },
        {
          id: "solder_mask_color",
          label: "Solder Mask Color",
          type: "select",
          required: true,
          options: ["Classic Green", "Matte Black", "Royal Blue", "Crimson Red"],
        },
        {
          id: "surface_finish",
          label: "Surface Finish",
          type: "select",
          required: true,
          options: ["HASL (Lead-Free)", "ENIG (Immersion Gold)"],
        },
      ]);
      setUnit("per 5 boards");
      setBasePrice(850);
      toast.success("Loaded PCB Fabrication Intake Template!");
    } else {
      setIntakeFields([
        {
          id: "sample_manifest",
          label: "Sample Description & MSDS",
          type: "file",
          required: false,
          helperText: "Upload safety data sheet or sample manifest.",
        },
        {
          id: "sample_state",
          label: "Sample State",
          type: "select",
          required: true,
          options: ["Dry Powder", "Liquid Solution", "Thin Film / Substrate"],
        },
        {
          id: "solvent_buffer",
          label: "Solvent / Buffer Composition",
          type: "text",
          required: true,
          placeholder: "e.g. CDCl3, DMSO-d6, 50mM Tris buffer",
        },
      ]);
      setUnit("per sample");
      setBasePrice(1200);
      toast.success("Loaded Testing Intake Template!");
    }
  };

  const handleAddField = () => {
    const newField: IntakeRequirementField = {
      id: `field_${Date.now()}`,
      label: "New Specification Field",
      type: "text",
      required: false,
      placeholder: "Enter details...",
    };
    setIntakeFields([...intakeFields, newField]);
  };

  const handleRemoveField = (id: string) => {
    setIntakeFields(intakeFields.filter((f) => f.id !== id));
  };

  const handleUpdateField = (id: string, updates: Partial<IntakeRequirementField>) => {
    setIntakeFields(
      intakeFields.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!basePrice || !vendorName.trim()) {
      toast.error("Please enter lab name and base price.");
      return;
    }

    try {
      setSubmitting(true);
      await researchServicesApi.submitLabOffering({
        masterServiceId: masterService.id,
        organizationId: currentUser?.activeProfile?.organizationId || null,
        vendorName: vendorName.trim(),
        vendorAccreditation: vendorAccreditation.trim(),
        vendorLocation: vendorLocation.trim(),
        basePrice: Number(basePrice),
        originalPrice: Number(originalPrice || basePrice * 1.3),
        unit,
        turnaround,
        dynamicIntakeSchema: intakeFields,
      });

      toast.success(
        "Application submitted! Once approved by DreamXec Admin, your lab will appear on the public comparison listing."
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit offering");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !masterService) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#FCFBF7] w-full max-w-3xl max-h-[90vh] overflow-y-auto border-3 border-[#121316] shadow-[8px_8px_0px_#121316] rounded-none relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-[#0F534A] text-white border-b-3 border-[#121316] flex items-center justify-between">
          <div>
            <span className="px-2.5 py-0.5 bg-[#FFDD33] text-[#121316] font-headline font-black text-xs uppercase tracking-wider border border-[#121316]">
              OUTSOURCE APPLICATION & INTAKE BUILDER
            </span>
            <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight mt-1">
              Offer: {masterService.title}
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
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Service Banner */}
          <div className="p-4 bg-white border-2 border-[#121316] shadow-[2px_2px_0px_#121316] flex items-center gap-4">
            <img
              src={masterService.imageUrl}
              alt={masterService.title}
              className="w-16 h-16 object-cover border-2 border-[#121316]"
            />
            <div>
              <span className="text-[10px] font-headline font-black uppercase tracking-wider text-[#FE4E1A]">
                {masterService.category}
              </span>
              <p className="font-headline font-bold text-sm text-[#121316]">
                {masterService.summary}
              </p>
            </div>
          </div>

          {/* Section 1: Lab Details & Pricing */}
          <div className="p-5 bg-white border-2 border-[#121316] shadow-[3px_3px_0px_#121316] space-y-4">
            <h3 className="font-headline font-black text-xs uppercase tracking-wider text-[#121316] flex items-center gap-1.5 pb-2 border-b border-gray-100">
              <Building2 className="w-4 h-4 text-[#0F534A]" /> 1. Lab Identity & Pricing SLA
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-headline font-bold text-gray-700 block mb-1">
                  Lab / Facility Name *
                </label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#121316] font-body"
                />
              </div>

              <div>
                <label className="font-headline font-bold text-gray-700 block mb-1">
                  Accreditation / Certifications
                </label>
                <input
                  type="text"
                  value={vendorAccreditation}
                  onChange={(e) => setVendorAccreditation(e.target.value)}
                  placeholder="e.g. AICTE Idea Lab / NABL / ISO"
                  className="w-full p-2.5 bg-white border border-[#121316] font-body"
                />
              </div>

              <div>
                <label className="font-headline font-bold text-gray-700 block mb-1">
                  Campus Location / City
                </label>
                <input
                  type="text"
                  value={vendorLocation}
                  onChange={(e) => setVendorLocation(e.target.value)}
                  placeholder="e.g. Kurukshetra, Haryana"
                  className="w-full p-2.5 bg-white border border-[#121316] font-body"
                />
              </div>

              <div>
                <label className="font-headline font-bold text-gray-700 block mb-1">
                  Estimated Turnaround Time *
                </label>
                <input
                  type="text"
                  required
                  value={turnaround}
                  onChange={(e) => setTurnaround(e.target.value)}
                  placeholder="e.g. 2 - 3 Business Days"
                  className="w-full p-2.5 bg-white border border-[#121316] font-body"
                />
              </div>

              <div>
                <label className="font-headline font-bold text-gray-700 block mb-1">
                  Base Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={10}
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-[#121316] font-body font-bold text-[#0F534A]"
                />
              </div>

              <div>
                <label className="font-headline font-bold text-gray-700 block mb-1">
                  Unit of Measure *
                </label>
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. per part, per 5 boards"
                  className="w-full p-2.5 bg-white border border-[#121316] font-body"
                />
              </div>
            </div>
          </div>

          {/* Section 2: 1-Stage Dynamic Intake Builder */}
          <div className="p-5 bg-white border-2 border-[#121316] shadow-[3px_3px_0px_#121316] space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
              <div>
                <h3 className="font-headline font-black text-xs uppercase tracking-wider text-[#121316] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#FE4E1A]" /> 2. Configure 1-Stage Dynamic Intake Form
                </h3>
                <p className="text-[11px] text-gray-500 font-body">
                  Specify the files and technical inputs students must provide when booking this service with your lab.
                </p>
              </div>

              {/* Quick Template Buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Templates:</span>
                <button
                  type="button"
                  onClick={() => handleLoadTemplate("3D")}
                  className="px-2 py-0.5 bg-gray-100 hover:bg-[#FFDD33] text-[10px] font-headline font-bold border border-[#121316]"
                >
                  3D Print
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadTemplate("PCB")}
                  className="px-2 py-0.5 bg-gray-100 hover:bg-[#FFDD33] text-[10px] font-headline font-bold border border-[#121316]"
                >
                  PCB
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadTemplate("TESTING")}
                  className="px-2 py-0.5 bg-gray-100 hover:bg-[#FFDD33] text-[10px] font-headline font-bold border border-[#121316]"
                >
                  Testing
                </button>
              </div>
            </div>

            {/* Field List */}
            <div className="space-y-3">
              {intakeFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-3.5 bg-[#FFF9F2] border-2 border-[#121316] text-xs font-body space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-headline font-black text-xs text-[#121316]">
                      Field #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(field.id)}
                      className="p-1 text-red-600 hover:bg-red-100 border border-transparent hover:border-red-400"
                      title="Remove Field"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-headline font-bold text-gray-600 block">
                        Field Label *
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                        className="w-full p-2 bg-white border border-[#121316] text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-headline font-bold text-gray-600 block">
                        Field Type
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) => handleUpdateField(field.id, { type: e.target.value as any })}
                        className="w-full p-2 bg-white border border-[#121316] text-xs"
                      >
                        <option value="file">File Upload (.STL, .ZIP)</option>
                        <option value="select">Dropdown Select</option>
                        <option value="text">Single-line Text</option>
                        <option value="textarea">Multi-line Notes</option>
                        <option value="number">Numeric</option>
                      </select>
                    </div>
                  </div>

                  {field.type === "select" && (
                    <div>
                      <label className="text-[10px] font-headline font-bold text-gray-600 block">
                        Dropdown Options (comma separated)
                      </label>
                      <input
                        type="text"
                        value={field.options?.join(", ") || ""}
                        onChange={(e) =>
                          handleUpdateField(field.id, {
                            options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        placeholder="Option 1, Option 2, Option 3"
                        className="w-full p-2 bg-white border border-[#121316] text-xs"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer font-headline font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                        className="accent-[#FE4E1A]"
                      />
                      Required Field
                    </label>
                    <input
                      type="text"
                      value={field.helperText || ""}
                      onChange={(e) => handleUpdateField(field.id, { helperText: e.target.value })}
                      placeholder="Optional helper text for students..."
                      className="p-1 px-2 bg-white border border-gray-300 text-[10px] w-2/3"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddField}
                className="w-full py-2.5 bg-white border-2 border-dashed border-[#121316] hover:bg-[#FFF9F2] text-xs font-headline font-bold uppercase text-[#121316] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4 text-[#FE4E1A]" /> Add Another Custom Intake Field
              </button>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t-2 border-gray-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border-2 border-[#121316] text-xs font-headline font-bold uppercase hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-[#0F534A] hover:bg-[#0c423b] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#121316] flex items-center gap-2 disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4 text-[#9EFC5F]" />
              {submitting ? "Submitting Application..." : "Submit Offering for Admin Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
