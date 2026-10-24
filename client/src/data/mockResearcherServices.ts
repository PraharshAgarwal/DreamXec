export interface ServiceVendor {
  id: string;
  name: string;
  slug: string;
  rating: number;
  totalOrders: number;
  accreditation: string;
  isVerified: boolean;
  location: string;
}

export interface WorkflowStageItem {
  id: string;
  name: string;
  estimate: string;
  description: string;
  deliverable?: string;
  iconName?: string;
}

export interface IntakeRequirementField {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "file" | "textarea";
  required: boolean;
  placeholder?: string;
  options?: string[];
  helperText?: string;
}

export interface ServiceWorkflowConfig {
  stages: WorkflowStageItem[];
  intakeFields: IntakeRequirementField[];
  sampleRequirements?: {
    storageTemp?: string;
    hazardLevel?: string;
    shippingNotes?: string;
  };
}

export interface LabOfferingItem {
  id: string;
  masterServiceId: string;
  organizationId?: string | null;
  vendorName: string;
  vendorAccreditation?: string;
  vendorLocation?: string;
  vendorRating: number;
  basePrice: number;
  originalPrice?: number;
  unit: string;
  turnaround: string;
  dynamicIntakeSchema: IntakeRequirementField[];
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes?: string | null;
  isActive: boolean;
  masterTitle?: string;
  masterCategory?: string;
  masterImage?: string;
}

export interface UserAddressRecord {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

export interface CourierTrackingDetails {
  currentStatus?: string;
  statusLabel?: string;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  dispatchedAt?: string | null;
  estimatedDelivery?: string;
  milestones?: Array<{ step: string; label: string; completedAt: string | null }>;
}

export interface TimelineEventItem {
  step: string;
  label: string;
  completedAt?: string | null;
  timestamp?: string;
}

export interface ServiceItem {
  id: string;
  slug?: string;
  title: string;
  category: "TESTING" | "CLOUD" | "FABRICATION" | "CHEMICALS" | "LEGAL";
  categoryLabel: string;
  categoryColor: string;
  imageUrl: string;
  summary: string; // 1-2 human lines
  fullDescription: string;
  turnaround: string;
  whatYouSend: string;
  whatYouGet: string;
  price: number;
  originalPrice: number;
  unit: string;
  discountPct: number;
  vendor: ServiceVendor;
  isGrantEscrowEligible: boolean;
  tags: string[];
  workflowConfig?: ServiceWorkflowConfig | null;
  organizationId?: string | null;
  fulfillmentType?: "DIRECT_DISPATCH" | "INTERNAL_LAB_PORTAL" | "EXTERNAL_REDIRECT";
  redirectUrl?: string | null;
  targetLabEmail?: string | null;
  targetLabAddress?: string | null;
  offerings?: LabOfferingItem[];
  offeringsCount?: number;
  minPrice?: number;
  maxPrice?: number;
  isPhysicalDelivery?: boolean;
}

export const MOCK_RESEARCH_SERVICES: ServiceItem[] = [
  {
    id: "srv-nmr",
    title: "Chemical Structure & 500 MHz NMR Testing",
    category: "TESTING",
    categoryLabel: "Lab Testing",
    categoryColor: "#FE4E1A",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80",
    summary: "Mail your synthesized powder or liquid sample. Get certified 500 MHz molecular structure and purity reports in 48 hours.",
    fullDescription: "Accredited multinuclear NMR testing (1H, 13C, 31P, 19F) on a Bruker Avance 500 MHz spectrometer. Perfect for organic chemists and pharma researchers verifying synthetic yields and stereochemistry.",
    turnaround: "48 Hours",
    whatYouSend: "15 mg dry sample or 0.6 mL solution in vial",
    whatYouGet: "Raw FID spectral files + Peak-picked PDF interpretation report",
    price: 1560,
    originalPrice: 2400,
    unit: "per sample",
    discountPct: 35,
    vendor: {
      id: "ven-ncl",
      name: "National Chemical Analytical Core",
      slug: "ncac-pune",
      rating: 4.95,
      totalOrders: 342,
      accreditation: "NABL & ISO 17025 Certified",
      isVerified: true,
      location: "Pune Science Park"
    },
    isGrantEscrowEligible: true,
    tags: ["Chemistry", "NMR", "Purity", "Organic Synthesis"],
    workflowConfig: {
      stages: [
        { id: "st-1", name: "Sample Receipt & Tube Inspection", estimate: "Day 1 (Within 6h)", description: "Solubility inspection, volume check, and barcoded tube verification.", deliverable: "Intake Pass & Tube Barcode" },
        { id: "st-2", name: "Deuterated Solvation & Sonic Degassing", estimate: "Day 1 (12h)", description: "Solvent addition (CDCl3/DMSO-d6), dissolution check, and filtration.", deliverable: "Solvation Check Log" },
        { id: "st-3", name: "500 MHz RF Acquisition & Locking", estimate: "Day 2", description: "Automated probe shimming and multichannel RF pulse sequence execution.", deliverable: "Raw Acquisition Telemetry" },
        { id: "st-4", name: "Spectral Baseline & Peak-Picking QA", estimate: "Day 2", description: "Phase correction, TMS shift calibration, and multiplet J-coupling calculation.", deliverable: "Certified PDF Interpretation Report" },
        { id: "st-5", name: "Deliverable Release & Settlement", estimate: "Instant", description: "Upload of raw FID data and signed report to client dashboard.", deliverable: "Full Spectral ZIP + Signed Report" }
      ],
      intakeFields: [
        { id: "f-matrix", label: "Sample Matrix / Physical State", type: "text", required: true, placeholder: "e.g. Dry Crystalline Powder or Liquid Solution" },
        { id: "f-solvent", label: "Preferred Deuterated Solvent", type: "text", required: true, placeholder: "e.g. CDCl3, DMSO-d6, D2O, or Methanol-d4" },
        { id: "f-nuclei", label: "Target Nuclei for Acquisition", type: "text", required: true, placeholder: "e.g. 1H, 13C, 1H-13C HSQC, or 31P" },
        { id: "f-hazard", label: "Hazard / Sensitivity Declaration", type: "text", required: false, placeholder: "e.g. Air-sensitive under Argon, or Non-hazardous" }
      ],
      sampleRequirements: {
        storageTemp: "Ambient / Room Temp (20-25°C)",
        hazardLevel: "Non-Hazardous / Standard Organic",
        shippingNotes: "Pack vial in secondary plastic tube with bubble cushioning."
      }
    }
  },
  {
    id: "srv-fesem",
    title: "Electron Microscopy & Surface Analysis (FESEM & EDX)",
    category: "TESTING",
    categoryLabel: "Lab Testing",
    categoryColor: "#FE4E1A",
    imageUrl: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=80",
    summary: "Inspect nanomaterials, battery electrodes, or cell tissue at up to 200,000x magnification with elemental EDX mapping.",
    fullDescription: "Ultra-high resolution field-emission scanning electron microscopy (FESEM) capable of 0.8nm resolution. Includes noble metal sputter coating and multi-element EDX compositional maps.",
    turnaround: "3 Business Days",
    whatYouSend: "Solid chip (< 10mm) or powder drop-cast on stub",
    whatYouGet: "High-res TIFF micrographs (up to 200,000x) + EDX elemental CSV",
    price: 2280,
    originalPrice: 3800,
    unit: "per hour session",
    discountPct: 40,
    vendor: {
      id: "ven-nano",
      name: "Centre for Nano Science & Imaging",
      slug: "cnsi-bangalore",
      rating: 5.0,
      totalOrders: 512,
      accreditation: "DST & NABL Recognized",
      isVerified: true,
      location: "Bangalore Innovation Hub"
    },
    isGrantEscrowEligible: true,
    tags: ["Nanotech", "SEM", "Microscopy", "Materials"],
    workflowConfig: {
      stages: [
        { id: "st-1", name: "Sample Mounting & Vacuum Desiccation", estimate: "Day 1", description: "Conductive carbon tape mounting and outgassing under high vacuum.", deliverable: "Stub Mount ID & Vacuum Log" },
        { id: "st-2", name: "Platinum / Gold Sputter Coating", estimate: "Day 1", description: "Plasma sputter deposition (10nm thickness) for non-conductive charge dissipation.", deliverable: "Coating Thickness Cert" },
        { id: "st-3", name: "Electron Beam Scanning & Imaging", estimate: "Day 2", description: "In-lens SE and BSE imaging across progressive magnifications (5k to 200k).", deliverable: "Calibrated TIFF Micrographs" },
        { id: "st-4", name: "Quantitative EDX Elemental Mapping", estimate: "Day 3", description: "Energy dispersive X-ray spectral collection and atomic ratio quantitation.", deliverable: "EDX Elemental CSV & Spatial Overlay" },
        { id: "st-5", name: "Deliverable Dispatch & Escrow Settlement", estimate: "Instant", description: "Dispatch of high-resolution image package and analysis report.", deliverable: "Micrograph Package & Analysis Report" }
      ],
      intakeFields: [
        { id: "f-dimensions", label: "Specimen Dimensions (Max 10mm x 10mm)", type: "text", required: true, placeholder: "e.g. 5mm x 5mm silicon chip or dry powder" },
        { id: "f-conductivity", label: "Sample Electrical Conductivity", type: "text", required: true, placeholder: "e.g. Conductive Metal, Semiconductor, or Insulator" },
        { id: "f-elements", label: "Target Elements for EDX Mapping", type: "text", required: true, placeholder: "e.g. C, O, Si, Ti, Au, Fe" },
        { id: "f-target-mag", label: "Desired Magnification Range", type: "text", required: false, placeholder: "e.g. 50,000x and 100,000x" }
      ],
      sampleRequirements: {
        storageTemp: "Ambient / Dry Desiccator",
        hazardLevel: "Non-Hazardous Solid",
        shippingNotes: "Keep in clean antistatic wafer box or sealed polypropylene vial."
      }
    }
  },
  {
    id: "srv-biogen-seq",
    title: "Next-Gen RNA-Seq & Transcriptome Profiling",
    category: "TESTING",
    categoryLabel: "Lab Testing",
    categoryColor: "#FE4E1A",
    imageUrl: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80",
    summary: "Illumina NovaSeq 6000 150bp paired-end RNA sequencing with certified differential expression volcano heatmaps.",
    fullDescription: "End-to-end stranded mRNA library prep, sequencing (30 Million PE reads/sample), HISAT2 genome alignment, and DESeq2 differential expression analysis.",
    turnaround: "4 Business Days",
    whatYouSend: "1 ug total RNA in nuclease-free water on dry ice",
    whatYouGet: "FASTQ.gz raw reads + Volcano plot HTML + Count matrix CSV",
    price: 4500,
    originalPrice: 6500,
    unit: "per sample library",
    discountPct: 30,
    vendor: {
      id: "ven-omics",
      name: "BioGen Analytical Testing Core",
      slug: "biogen-testing",
      rating: 4.95,
      totalOrders: 280,
      accreditation: "NABL & ISO 17025 Certified",
      isVerified: true,
      location: "Hyderabad Genome Valley"
    },
    isGrantEscrowEligible: true,
    tags: ["Genomics", "RNA-Seq", "BioTech", "Illumina", "Bioinformatics"],
    workflowConfig: {
      stages: [
        { id: "st-1", name: "Cold-Chain Sample Receipt & TapeStation QC", estimate: "Day 1", description: "Verification of dry-ice transit and Bioanalyzer RNA Integrity Number (RIN >= 7.0).", deliverable: "TapeStation Electropherogram Pass" },
        { id: "st-2", name: "Stranded mRNA Library Synthesis", estimate: "Day 2", description: "Oligo-dT magnetic capture, fragmentation, cDNA synthesis, and unique dual-index ligation.", deliverable: "Molar Library Quality Log" },
        { id: "st-3", name: "NovaSeq 6000 PE150 Sequencing Run", estimate: "Day 3", description: "Flow cell clustering and sequencing-by-synthesis (30 Million paired-end reads).", deliverable: "Demultiplexed Raw FASTQ Datasets" },
        { id: "st-4", name: "Bioinformatics Differential Expression QA", estimate: "Day 4", description: "Quality trimming, HISAT2 alignment, and DESeq2 log2 fold change calculation.", deliverable: "Interactive Volcano Plot & CSV Matrix" },
        { id: "st-5", name: "Complete Genomic Archive Delivery", estimate: "Instant", description: "Encrypted cloud release of all FASTQ reads and certified analysis dossier.", deliverable: "Full Genomic Archive Release" }
      ],
      intakeFields: [
        { id: "f-organism", label: "Organism & Reference Genome Build", type: "text", required: true, placeholder: "e.g. Homo sapiens (hg38) or Mus musculus (mm10)" },
        { id: "f-extraction", label: "Total RNA Extraction Method", type: "text", required: true, placeholder: "e.g. TRIzol / Qiagen RNeasy Column" },
        { id: "f-rin", label: "Known or Estimated RIN Score", type: "text", required: true, placeholder: "e.g. RIN 8.2 or Measure in Lab" },
        { id: "f-groups", label: "Experimental Comparison Groups", type: "text", required: false, placeholder: "e.g. Control (n=3) vs Treated (n=3)" }
      ],
      sampleRequirements: {
        storageTemp: "-80°C (Ultra-Low Cold Chain with Dry Ice)",
        hazardLevel: "Non-Infectious Purified RNA",
        shippingNotes: "Must ship in thick styrofoam cooler packed with minimum 4 kg dry ice pellets."
      }
    }
  },
  {
    id: "srv-h100",
    title: "Dedicated NVIDIA H100 GPU Cluster",
    category: "CLOUD",
    categoryLabel: "Cloud & AI",
    categoryColor: "#4717AE",
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    summary: "Instantly spin up 80GB SXM5 H100 GPUs for deep learning training, protein folding (AlphaFold), or fluid simulations.",
    fullDescription: "Dedicated cloud instance with NVIDIA H100 SXM5 80GB VRAM, NVLink 900 GB/s inter-GPU bandwidth, PyTorch 2.4, CUDA 12.4, and JupyterLab pre-installed. Billed straight to your grant balance.",
    turnaround: "Instant (< 2 mins)",
    whatYouSend: "Docker container, GitHub repo, or SSH public key",
    whatYouGet: "Web SSH terminal + JupyterLab access link + Tensorboard telemetry",
    price: 315,
    originalPrice: 450,
    unit: "per GPU hour",
    discountPct: 30,
    vendor: {
      id: "ven-supercloud",
      name: "DreamXec Research Cloud",
      slug: "dx-cloud",
      rating: 4.98,
      totalOrders: 1840,
      accreditation: "SOC2 Type II & Tier-4 DC",
      isVerified: true,
      location: "Mumbai Cloud Datacenter"
    },
    isGrantEscrowEligible: true,
    tags: ["AI", "PyTorch", "H100", "Deep Learning", "Compute"],
    workflowConfig: {
      stages: [
        { id: "st-1", name: "Bare-Metal H100 SXM5 Allocation", estimate: "Instant (< 1 min)", description: "Dynamic PCI-e passthrough of NVIDIA H100 80GB tensor core node.", deliverable: "Node IP & SSH Port Allocation" },
        { id: "st-2", name: "NVLink & Hardware Diagnostics Check", estimate: "1 min", description: "900 GB/s interconnect validation and NCCL communication benchmark.", deliverable: "Hardware Health Diagnostic" },
        { id: "st-3", name: "Container Ingestion & SSH Injection", estimate: "1 min", description: "Automated injection of authorized SSH public key and base container start.", deliverable: "Rootless Terminal Handshake" },
        { id: "st-4", name: "Live Model Training & VRAM Monitoring", estimate: "Duration of Run", description: "Streaming telemetry of GPU power, thermals, and tensor core utilization.", deliverable: "Real-time Telemetry Dashboard" },
        { id: "st-5", name: "Checkpoint Archive & Node Teardown", estimate: "Instant", description: "Secure transfer of trained model weights to your cloud vault and escrow unlock.", deliverable: "Model Weights & Training Logs" }
      ],
      intakeFields: [
        { id: "f-framework", label: "Deep Learning Framework / Runtime", type: "text", required: true, placeholder: "e.g. PyTorch 2.4 + CUDA 12.4, JAX, or AlphaFold 3" },
        { id: "f-repo", label: "Container Registry or GitHub Repository", type: "text", required: false, placeholder: "e.g. nvcr.io/nvidia/pytorch:24.07-py3 or github.com/user/repo" },
        { id: "f-sshkey", label: "SSH Public Key for Direct Terminal Access", type: "text", required: true, placeholder: "e.g. ssh-ed25519 AAAAC3NzaC1lZDI1NTE5..." },
        { id: "f-hours", label: "Requested Initial GPU Hours", type: "text", required: true, placeholder: "e.g. 10 Hours or 48 Hours" }
      ],
      sampleRequirements: {
        storageTemp: "Cloud Hosted (Tier-4 Datacenter)",
        hazardLevel: "Cybersecurity Hardened / Zero Physical Sample",
        shippingNotes: "Instant provisioning over encrypted TLS connection."
      }
    }
  },
  {
    id: "srv-pcb",
    title: "Custom PCB Prototyping & SMT Assembly",
    category: "FABRICATION",
    categoryLabel: "Hardware Fab",
    categoryColor: "#0F534A",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    summary: "Upload your Gerber design. We manufacture the boards, source components, assemble, and ship 5 tested prototypes.",
    fullDescription: "Turnkey hardware prototyping for robotics, IoT, biomedical devices, and electric vehicle controllers. Includes automated optical inspection, gold ENIG surface finish, and components sourced from authorized distributors.",
    turnaround: "5 Business Days",
    whatYouSend: "Gerber ZIP file + Pick & Place BOM Excel",
    whatYouGet: "5 Fully assembled & inspected PCBA boards in ESD box",
    price: 9800,
    originalPrice: 12500,
    unit: "for 5 assembled boards",
    discountPct: 22,
    vendor: {
      id: "ven-apex-pcb",
      name: "Apex Hardware Prototyping Labs",
      slug: "apex-hardware",
      rating: 4.88,
      totalOrders: 290,
      accreditation: "IPC-A-610 Class 3 & ISO 9001",
      isVerified: true,
      location: "Hyderabad Electronics Hub"
    },
    isGrantEscrowEligible: true,
    tags: ["Electronics", "PCB", "Hardware", "Robotics", "IoT"],
    workflowConfig: {
      stages: [
        { id: "st-1", name: "Design for Manufacturability (DFM) Audit", estimate: "Day 1", description: "CAM validation of trace clearances, annular rings, and solder mask bridges.", deliverable: "DFM Engineering Report" },
        { id: "st-2", name: "High-Precision Photolithography & Etching", estimate: "Day 2", description: "FR-4 core etching, CNC multi-axis via drilling, and copper electroplating.", deliverable: "Drill & Plating Inspection Log" },
        { id: "st-3", name: "Electroless Nickel Immersion Gold (ENIG)", estimate: "Day 3", description: "Gold immersion surface finish and matte solder mask application.", deliverable: "Surface Passivation Check" },
        { id: "st-4", name: "High-Speed SMT Component Pick & Place", estimate: "Day 4", description: "Solder paste jet printing, component placement, reflow oven, and 3D AOI inspection.", deliverable: "3D AOI Assembly Report" },
        { id: "st-5", name: "ESD Safe Packaging & Express Dispatch", estimate: "Day 5", description: "Continuity testing, anti-static vacuum packaging, and courier tracking issuance.", deliverable: "5 Assembled Boards + Dispatch Code" }
      ],
      intakeFields: [
        { id: "f-layers", label: "Layer Count & Thickness", type: "text", required: true, placeholder: "e.g. 2-Layer (1.6mm) or 4-Layer Controlled Impedance" },
        { id: "f-surface", label: "Surface Finish & Color", type: "text", required: true, placeholder: "e.g. ENIG Gold (Matte Black Solder Mask)" },
        { id: "f-assembly", label: "Assembly Scope (BOM Sourcing)", type: "text", required: true, placeholder: "e.g. Full Turnkey Assembly (All components sourced)" },
        { id: "f-gerber", label: "Gerber ZIP File Link or Reference", type: "text", required: true, placeholder: "e.g. Link to Gerber zip (or type 'Provided in chat')" }
      ],
      sampleRequirements: {
        storageTemp: "Room Temperature (ESD Safe)",
        hazardLevel: "Non-Hazardous Electronics",
        shippingNotes: "Shipped in ESD protective shielding pouches with moisture-absorbing desiccant."
      }
    }
  },
  {
    id: "srv-hplc",
    title: "Analytical & Preparative HPLC Chromatography",
    category: "TESTING",
    categoryLabel: "Lab Testing",
    categoryColor: "#FE4E1A",
    imageUrl: "https://images.unsplash.com/photo-1579165466791-788226ab77b6?auto=format&fit=crop&w=800&q=80",
    summary: "High-pressure liquid chromatography for purity verification, peptide quantification, and fraction purification.",
    fullDescription: "Reverse-phase and normal-phase HPLC with photodiode array (PDA) detection. Perfect for natural products, synthetic peptides, and organic synthesis fractions requiring precise purity curves.",
    turnaround: "3 Business Days",
    whatYouSend: "5-10 mg dissolved or dry fraction",
    whatYouGet: "Chromatogram absorbance traces + Purity % integration table",
    price: 1850,
    originalPrice: 2800,
    unit: "per sample run",
    discountPct: 34,
    vendor: {
      id: "ven-hplc-lab",
      name: "Analytical Science Core Institute",
      slug: "asci-ahmedabad",
      rating: 4.9,
      totalOrders: 160,
      accreditation: "NABL & GLP Certified",
      isVerified: true,
      location: "Ahmedabad Pharma Cluster"
    },
    isGrantEscrowEligible: true,
    tags: ["Chemistry", "HPLC", "Chromatography", "Pharma"],
    workflowConfig: {
      stages: [
        { id: "st-1", name: "Sample Micro-Filtration & Solubility Check", estimate: "Day 1", description: "0.22 µm PTFE filtration and autosampler vial aliquoting.", deliverable: "Solubility Pass Log" },
        { id: "st-2", name: "Mobile Phase Gradient Equilibration", estimate: "Day 1", description: "Binary degassed mobile phase stabilization and baseline drift check.", deliverable: "Baseline Drift Validation" },
        { id: "st-3", name: "High-Pressure Column Injection", estimate: "Day 2", description: "Analytical C18 column separation with multi-wavelength PDA detection.", deliverable: "Raw Absorbance Profile" },
        { id: "st-4", name: "Peak Integration & Retention Time QA", estimate: "Day 3", description: "Quantitative area integration and theoretical plate determination.", deliverable: "Certified Chromatogram Report" },
        { id: "st-5", name: "Deliverable Dispatch & Escrow Release", estimate: "Instant", description: "Release of calibrated chromatogram PDF and integration data table.", deliverable: "Full Data Package Release" }
      ],
      intakeFields: [
        { id: "f-column", label: "Preferred Column Chemistry", type: "text", required: true, placeholder: "e.g. C18 Reverse-Phase, C8, or Chiral" },
        { id: "f-wavelength", label: "Detection Wavelength (nm)", type: "text", required: true, placeholder: "e.g. 254 nm, 214 nm, or Full PDA Spectrum" },
        { id: "f-solvent", label: "Sample Dissolution Solvent", type: "text", required: true, placeholder: "e.g. 100% Acetonitrile, Methanol, or Water" }
      ],
      sampleRequirements: {
        storageTemp: "4°C Cold Pack",
        hazardLevel: "Non-Hazardous Organic Fraction",
        shippingNotes: "Send in sealed glass amber autosampler vial."
      }
    }
  },
  {
    id: "srv-chemicals",
    title: "Ultra-Pure Spectroscopic Solvents & Reagents Delivery",
    category: "CHEMICALS",
    categoryLabel: "Lab Chemicals",
    categoryColor: "#FE4E1A",
    imageUrl: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=800&q=80",
    summary: "Order HPLC/ACS grade solvents, catalysts, and pure reagents delivered directly to your campus lab with EHS clearance.",
    fullDescription: "Streamlined procurement for university researchers. Eliminates months of institutional purchasing delays. Includes Certificate of Analysis (COA) and Material Safety Data Sheet (MSDS). Direct cold-chain delivery.",
    turnaround: "2 - 3 Days",
    whatYouSend: "Chemical list, CAS numbers & campus lab address",
    whatYouGet: "Sealed manufacturer bottles with certified purity batch logs",
    price: 3400,
    originalPrice: 4200,
    unit: "standard chemical bundle",
    discountPct: 20,
    vendor: {
      id: "ven-reagents",
      name: "BioChem Direct Procurement",
      slug: "biochem-direct",
      rating: 4.9,
      totalOrders: 420,
      accreditation: "ACS & ISO 9001 Certified",
      isVerified: true,
      location: "National Chemical Logistics Hub"
    },
    isGrantEscrowEligible: true,
    tags: ["Chemicals", "Reagents", "Solvents", "Wet Lab"],
    workflowConfig: {
      stages: [
        { id: "st-1", name: "EHS Regulatory & Dual-Custody Check", estimate: "Day 1 (Within 4h)", description: "Academic institution permit verification and security clearance.", deliverable: "EHS Clearance Permit" },
        { id: "st-2", name: "Anhydrous Septum Sealing & Batch COA", estimate: "Day 1", description: "Nitrogen purge packaging and Certificate of Analysis attachment.", deliverable: "Manufacturer Batch COA" },
        { id: "st-3", name: "Hazmat Certified Express Courier", estimate: "Day 2", description: "UN-approved dangerous goods transport with temperature telemetry.", deliverable: "Courier Waybill & Tracking" },
        { id: "st-4", name: "Direct Lab Handover & Delivery Pass", estimate: "Day 3", description: "Physical delivery directly into university lab room with handover signoff.", deliverable: "Signed Campus Delivery Pass" }
      ],
      intakeFields: [
        { id: "f-cas", label: "Chemical Name & CAS Number", type: "text", required: true, placeholder: "e.g. Acetonitrile HPLC Grade (CAS 75-05-8)" },
        { id: "f-lab-room", label: "University Campus, Department & Lab Room", type: "text", required: true, placeholder: "e.g. Dept of Chemistry, Lab Room 304, Academic Block 2" },
        { id: "f-emergency-phone", label: "Lab In-Charge Emergency Contact Phone", type: "text", required: true, placeholder: "e.g. +91 98765 43210" }
      ],
      sampleRequirements: {
        storageTemp: "Regulated Hazmat Transport",
        hazardLevel: "Flammable / Chemical Grade",
        shippingNotes: "Direct delivery to registered university department address."
      }
    }
  },
  {
    id: "srv-patent",
    title: "Patent Prior-Art Search & Provisional Drafting",
    category: "LEGAL",
    categoryLabel: "IP & Legal",
    categoryColor: "#18D7E8",
    imageUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80",
    summary: "Protect your university research before you publish. Registered patent attorneys draft and file your provisional application.",
    fullDescription: "Full worldwide patent database clearance (USPTO, WIPO, Indian Patent Office) and complete Form 1 drafting under a strict mutual Non-Disclosure Agreement (NDA). Retain 100% intellectual property ownership.",
    turnaround: "8 Business Days",
    whatYouSend: "1-page invention disclosure summary or manuscript draft",
    whatYouGet: "Prior-art search report + Complete filed provisional patent package",
    price: 12600,
    originalPrice: 18000,
    unit: "per patent application",
    discountPct: 30,
    vendor: {
      id: "ven-lex",
      name: "LexInnovate Academic IP Counsel",
      slug: "lexinnovate",
      rating: 5.0,
      totalOrders: 128,
      accreditation: "Patent Agent Bar Certified",
      isVerified: true,
      location: "New Delhi & Bangalore"
    },
    isGrantEscrowEligible: true,
    tags: ["Patent", "Legal", "IP", "Publishing", "Innovation"],
    workflowConfig: {
      stages: [
        { id: "st-1", name: "Invention Disclosure & Mutual NDA Execution", estimate: "Day 1", description: "Bilateral Non-Disclosure Agreement execution and invention scope review.", deliverable: "Executed Bilateral NDA" },
        { id: "st-2", name: "Worldwide Prior-Art Clearance Search", estimate: "Day 3", description: "Deep Boolean search across USPTO, EPO, WIPO, and Indian Patent Office.", deliverable: "Comprehensive Prior-Art Matrix" },
        { id: "st-3", name: "Provisional Specification & Claim 1 Drafting", estimate: "Day 6", description: "Technical specification drafting, architectural diagrams, and claims.", deliverable: "Draft Specification Dossier" },
        { id: "st-4", name: "Inventor Review & Statutory Formalities Pass", estimate: "Day 7", description: "Incorporation of inventor revisions and Form 1 / Form 2 statutory preparation.", deliverable: "Final Approved Application" },
        { id: "st-5", name: "Indian Patent Office Electronic Filing", estimate: "Day 8", description: "Official electronic submission to patent office and CBR issuance.", deliverable: "Official CBR Filing Receipt & App Number" }
      ],
      intakeFields: [
        { id: "f-title", label: "Proposed Patent Invention Title", type: "text", required: true, placeholder: "e.g. Low-Cost Microfluidic Biosensor for Pathogen Detection" },
        { id: "f-novelty", label: "Core Technical Novelty & Breakthrough", type: "textarea", required: true, placeholder: "Describe what makes your technique unique compared to existing methods..." },
        { id: "f-inventors", label: "Lead Inventor & University Affiliation", type: "text", required: true, placeholder: "e.g. Rahul Sharma, Dept of Nanotechnology, IIT Bombay" }
      ],
      sampleRequirements: {
        storageTemp: "Encrypted Digital Repository (NDA Protected)",
        hazardLevel: "Intellectual Property / Non-Physical",
        shippingNotes: "Digital disclosure uploaded under end-to-end encryption."
      }
    }
  }
];

export interface MockUserCampaign {
  id: string;
  title: string;
  code: string;
  milestones: {
    id: string;
    title: string;
    allocatedFunds: number;
    remainingFunds: number;
    status: "APPROVED" | "IN_PROGRESS" | "COMPLETED";
  }[];
}

export const MOCK_USER_CAMPAIGNS: MockUserCampaign[] = [
  {
    id: "camp-01",
    title: "Biodegradable Nano-Polymer for Agricultural Soil",
    code: "DX-AGRI-2026",
    milestones: [
      {
        id: "m-01",
        title: "Milestone 1: Monomer Extraction & Assays",
        allocatedFunds: 50000,
        remainingFunds: 14200,
        status: "IN_PROGRESS"
      },
      {
        id: "m-02",
        title: "Milestone 2: Synthesis, NMR Analysis & Field Prototypes",
        allocatedFunds: 120000,
        remainingFunds: 98500,
        status: "APPROVED"
      }
    ]
  },
  {
    id: "camp-02",
    title: "Low-Cost Wearable Biosensor for Continuous Lactate Monitoring",
    code: "DX-MED-8491",
    milestones: [
      {
        id: "m-201",
        title: "Milestone 1: Electrochemical Enzyme Formulation",
        allocatedFunds: 65000,
        remainingFunds: 32000,
        status: "IN_PROGRESS"
      },
      {
        id: "m-202",
        title: "Milestone 2: Flexible PCB Fabrication & Bluetooth Telemetry",
        allocatedFunds: 140000,
        remainingFunds: 115000,
        status: "APPROVED"
      }
    ]
  }
];

export interface MockOrderRecord {
  id: string;
  orderNumber: string;
  serviceTitle: string;
  category: string;
  vendorName: string;
  amount: number;
  appliedFromBalance?: number;
  paidViaOnline?: number;
  quantity?: number;
  status: "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "ESCROW_LOCKED" | "SAMPLE_DISPATCHED" | "IN_EXECUTION" | "DELIVERABLE_SUBMITTED" | "ESCROW_RELEASED" | "PENDING_PAYMENT";
  statusLabel: string;
  date: string;
  campaignTitle?: string;
  milestoneTitle?: string;
  sampleTrackingCode?: string;
  deliverableFile?: string;
  organizationId?: string | null;
  fulfillmentType?: "DIRECT_DISPATCH" | "INTERNAL_LAB_PORTAL" | "EXTERNAL_REDIRECT";
  offeringId?: string | null;
  shippingAddress?: UserAddressRecord | null;
  dynamicIntakeResponses?: Record<string, any>;
  intakeData?: Record<string, any>;
  courierDetails?: CourierTrackingDetails | null;
  timelineEvents?: TimelineEventItem[];
}

export const MOCK_ORDER_HISTORY: MockOrderRecord[] = [
  {
    id: "ord-8812",
    orderNumber: "DX-SRV-2026-0881",
    serviceTitle: "Chemical Structure & NMR Testing",
    category: "TESTING",
    vendorName: "National Chemical Analytical Core",
    amount: 1560,
    status: "DELIVERABLE_SUBMITTED",
    statusLabel: "Report Ready (Click to Inspect & Release)",
    date: "17 Oct 2026",
    campaignTitle: "Biodegradable Nano-Polymer for Agricultural Soil",
    milestoneTitle: "Milestone 2: Synthesis, NMR Analysis & Field Prototypes",
    sampleTrackingCode: "BLR-NCL-8921-EXP",
    deliverableFile: "NMR_Sample_DX_Polymer_Report.pdf (2.4 MB)"
  },
  {
    id: "ord-8740",
    orderNumber: "DX-SRV-2026-0874",
    serviceTitle: "Dedicated NVIDIA H100 GPU Cluster",
    category: "CLOUD",
    vendorName: "DreamXec Research Cloud",
    amount: 6300,
    status: "ESCROW_RELEASED",
    statusLabel: "Completed & Settled",
    date: "12 Oct 2026",
    campaignTitle: "Low-Cost Wearable Biosensor",
    milestoneTitle: "Milestone 1: Electrochemical Enzyme Formulation",
    deliverableFile: "Slurm_Telemetry_WandB_Export.zip (14.8 MB)"
  }
];
