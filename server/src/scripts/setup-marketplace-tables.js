const prisma = require('../config/prisma');

async function setupMarketplaceTables() {
  console.log('🚀 Setting up DreamXec Marketplace Tables and Initial Master Catalog...');

  try {
    // 1. Ensure Schema
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS marketplace;`);
    console.log('✅ Schema "marketplace" ensured.');

    // 2. Master Services Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS marketplace.master_services (
        id VARCHAR(60) PRIMARY KEY,
        slug VARCHAR(80) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        category_label VARCHAR(100),
        category_color VARCHAR(20),
        image_url TEXT NOT NULL,
        summary TEXT NOT NULL,
        full_description TEXT NOT NULL,
        is_physical_delivery BOOLEAN DEFAULT TRUE,
        default_unit VARCHAR(50) DEFAULT 'per part',
        tags JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table "marketplace.master_services" ensured.');

    // 3. Lab Service Offerings Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS marketplace.lab_service_offerings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        master_service_id VARCHAR(60) NOT NULL REFERENCES marketplace.master_services(id) ON DELETE CASCADE,
        organization_id UUID REFERENCES organization.organizations(id) ON DELETE SET NULL,
        vendor_name VARCHAR(255) NOT NULL,
        vendor_accreditation VARCHAR(255),
        vendor_location VARCHAR(255),
        vendor_rating NUMERIC(3, 2) DEFAULT 5.0,
        base_price NUMERIC(12, 2) NOT NULL,
        original_price NUMERIC(12, 2),
        unit VARCHAR(50) NOT NULL DEFAULT 'per part',
        turnaround VARCHAR(100) NOT NULL DEFAULT '3 - 5 Business Days',
        dynamic_intake_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
        approval_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        admin_notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table "marketplace.lab_service_offerings" ensured.');

    // Add unique constraint if not exists
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'unique_lab_master_offering'
        ) THEN
          ALTER TABLE marketplace.lab_service_offerings 
          ADD CONSTRAINT unique_lab_master_offering UNIQUE (master_service_id, organization_id);
        END IF;
      END $$;
    `);

    // 4. Update service_orders with fulfillment & address columns
    await prisma.$executeRawUnsafe(`
      ALTER TABLE marketplace.service_orders
        ADD COLUMN IF NOT EXISTS offering_id UUID,
        ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS dynamic_intake_responses JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS courier_details JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS timeline_events JSONB DEFAULT '[]'::jsonb;
    `);
    console.log('✅ Table "marketplace.service_orders" extended with shipping & intake columns.');

    // 5. Seed Master Services
    const masterServices = [
      {
        id: 'srv-3d-printing',
        slug: '3d-rapid-prototyping',
        title: '3D Rapid Prototyping (FDM / SLA / SLS)',
        category: 'FABRICATION',
        category_label: 'Hardware & 3D Fab',
        category_color: '#0F534A',
        image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
        summary: 'Precision additive manufacturing in PLA, ABS, PETG, Nylon, or High-Detail Photopolymer Resin. Upload your 3D CAD files.',
        full_description: 'Industrial-grade 3D printing for functional prototypes, enclosures, and test fixtures. Supporting layer resolutions down to 25 microns for SLA resin and tough engineering thermoplastics for FDM.',
        is_physical_delivery: true,
        default_unit: 'per part',
        tags: ['3D Printing', 'FDM', 'SLA Resin', 'Additive Manufacturing', 'Rapid Prototyping'],
      },
      {
        id: 'srv-pcb-fab',
        slug: 'pcb-fabrication-assembly',
        title: 'Precision Multi-Layer PCB Fabrication & Assembly',
        category: 'FABRICATION',
        category_label: 'Electronics & PCB',
        category_color: '#0F534A',
        image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        summary: 'Turnkey printed circuit board manufacturing: 1-6 layers, flying-probe testing, surface finishes (HASL/ENIG), and SMT assembly.',
        full_description: 'Accredited electronics prototyping core offering quick-turn PCB fabrication. From simple single-sided microcontrollers to high-speed impedance-controlled 6-layer RF designs with automatic optical inspection (AOI).',
        is_physical_delivery: true,
        default_unit: 'per 5 boards',
        tags: ['PCB', 'PCBA', 'Hardware', 'SMT', 'Electronics', 'Fabrication'],
      },
      {
        id: 'srv-cnc-machining',
        slug: 'cnc-precision-machining',
        title: '5-Axis CNC Precision Machining & Milling',
        category: 'FABRICATION',
        category_label: 'Hardware Fab',
        category_color: '#0F534A',
        image_url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80',
        summary: 'High-tolerance subtractive milling and turning in 6061-T6 Aluminum, Stainless Steel, Delrin, and Brass.',
        full_description: 'Advanced 5-axis CNC machining centers delivering precision tolerances (+/- 0.02 mm). Perfect for aerospace linkages, custom heat sinks, robotics chassis, and high-strength mechanical assemblies.',
        is_physical_delivery: true,
        default_unit: 'per part',
        tags: ['CNC', 'Milling', 'Metal Machining', 'Aluminum', 'Prototyping'],
      },
      {
        id: 'srv-nmr-testing',
        slug: '500-mhz-nmr-spectroscopy',
        title: '500 MHz NMR Chemical Structure Analysis',
        category: 'TESTING',
        category_label: 'Lab Testing',
        category_color: '#FE4E1A',
        image_url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80',
        summary: 'Multinuclear 1H, 13C, 31P, 19F NMR testing on a Bruker 500 MHz spectrometer with peak-picked interpretation reports.',
        full_description: 'NABL accredited analytical spectroscopy facility providing comprehensive structural elucidation and purity assessment. Ship your dry or dissolved chemical sample in a standard vial.',
        is_physical_delivery: false,
        default_unit: 'per sample',
        tags: ['Chemistry', 'NMR', 'Spectroscopy', 'Purity', 'Pharma'],
      },
      {
        id: 'srv-sem-imaging',
        slug: 'sem-edx-microscopy',
        title: 'High-Res SEM Imaging & EDX Elemental Mapping',
        category: 'TESTING',
        category_label: 'Lab Testing',
        category_color: '#FE4E1A',
        image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        summary: 'Field Emission Scanning Electron Microscopy (FE-SEM) up to 500,000x magnification with quantitative energy-dispersive X-ray spectroscopy.',
        full_description: 'Characterize nanostructures, cross-sectional thin films, wear patterns, and surface morphology. Includes gold/carbon sputter coating and high-resolution digital micrograph export.',
        is_physical_delivery: false,
        default_unit: 'per sample',
        tags: ['SEM', 'EDX', 'Nanotechnology', 'Materials Science', 'Imaging'],
      },
      {
        id: 'srv-cloud-gpu',
        slug: 'dedicated-ai-gpu-cluster',
        title: 'Dedicated NVIDIA H100 / A100 AI Compute Cluster',
        category: 'CLOUD',
        category_label: 'Cloud & GPUs',
        category_color: '#4717AE',
        image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
        summary: 'On-demand 80GB SXM5 H100 GPU compute nodes with NVLink and pre-configured PyTorch/CUDA environments.',
        full_description: 'High-performance cloud infrastructure for deep learning training, LLM fine-tuning, and molecular dynamics simulations. Instant SSH access with 3.2 Tbps InfiniBand interconnect.',
        is_physical_delivery: false,
        default_unit: 'per 20 GPU hours',
        tags: ['AI', 'GPU', 'H100', 'Cloud Compute', 'Deep Learning'],
      },
    ];

    for (const ms of masterServices) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO marketplace.master_services (
          id, slug, title, category, category_label, category_color,
          image_url, summary, full_description, is_physical_delivery,
          default_unit, tags, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          summary = EXCLUDED.summary,
          full_description = EXCLUDED.full_description,
          image_url = EXCLUDED.image_url,
          is_physical_delivery = EXCLUDED.is_physical_delivery,
          default_unit = EXCLUDED.default_unit,
          tags = EXCLUDED.tags,
          updated_at = NOW();
      `,
        ms.id, ms.slug, ms.title, ms.category, ms.category_label, ms.category_color,
        ms.image_url, ms.summary, ms.full_description, ms.is_physical_delivery,
        ms.default_unit, JSON.stringify(ms.tags)
      );
    }
    console.log(`✅ Seeded ${masterServices.length} canonical Master Services.`);

    // 6. Find NIT KKR organization to seed approved offerings
    const nitKkrOrg = await prisma.organization.findFirst({
      where: {
        OR: [
          { slug: 'nit-kkr' },
          { name: { contains: 'NIT KKR', mode: 'insensitive' } },
        ],
      },
    });

    const nitKkrOrgId = nitKkrOrg ? nitKkrOrg.id : null;

    // 7. Dynamic Intake Schemas
    const threeDPrintingIntakeSchema = [
      {
        id: 'cad_model_file',
        label: '3D CAD Model (STL, STEP, OBJ)',
        type: 'file',
        required: true,
        placeholder: 'Upload your 3D CAD design file (.stl, .step, .obj)',
        helperText: 'Export in millimeters (mm) with manifold mesh geometry (Max 50MB).',
      },
      {
        id: 'material_choice',
        label: 'Printing Material',
        type: 'select',
        required: true,
        options: [
          'PLA Tough (Standard Prototype - White)',
          'PLA Tough (Standard Prototype - Black)',
          'PETG (High Strength & Chemical Resistant)',
          'ABS (Heat Resistant & Impact Tolerant)',
          'High-Detail Photopolymer Resin (Grey)',
        ],
        helperText: 'PLA is best for fit checks; PETG/ABS for functional stress-bearing parts.',
      },
      {
        id: 'infill_density',
        label: 'Infill Density (%)',
        type: 'select',
        required: true,
        options: [
          '20% (Standard Prototype / Visual Model)',
          '45% (Semi-Structural Functional Part)',
          '80% (Heavy Duty / Load-Bearing Assembly)',
          '100% (Solid Solid Solid Plastic)',
        ],
        helperText: 'Higher infill increases part strength and rigidity.',
      },
      {
        id: 'layer_resolution',
        label: 'Layer Resolution',
        type: 'select',
        required: true,
        options: [
          '0.20 mm (Draft / Fast Turnaround)',
          '0.12 mm (Fine Detail / Smooth Surface)',
          '0.05 mm (Ultra-Fine / Resin Only)',
        ],
      },
      {
        id: 'project_notes',
        label: 'Dimensional Notes & Critical Fits',
        type: 'textarea',
        required: false,
        placeholder: 'Specify critical bearing bores, heat-set insert locations (e.g. M3), or orientation preferences.',
      },
    ];

    const pcbIntakeSchema = [
      {
        id: 'gerber_zip_file',
        label: 'Gerber Archive (.ZIP)',
        type: 'file',
        required: true,
        placeholder: 'Upload Gerber archive containing RS-274X and Excellon drill files',
        helperText: 'Ensure top/bottom copper, solder mask, silk screen, and drill files are included (Max 30MB).',
      },
      {
        id: 'layer_count',
        label: 'Layer Count',
        type: 'select',
        required: true,
        options: ['1 Layer (Single-Sided)', '2 Layers (Standard Double-Sided)', '4 Layers (Multilayer with Power Planes)', '6 Layers (High-Density / RF)'],
      },
      {
        id: 'copper_weight',
        label: 'Copper Weight',
        type: 'select',
        required: true,
        options: ['1 oz (Standard Logic / Signal)', '2 oz (Power Electronics / Motor Driver)'],
      },
      {
        id: 'solder_mask_color',
        label: 'Solder Mask Color',
        type: 'select',
        required: true,
        options: ['Classic Green', 'Matte Black', 'Royal Blue', 'Clean White', 'Crimson Red'],
      },
      {
        id: 'surface_finish',
        label: 'Surface Finish',
        type: 'select',
        required: true,
        options: ['HASL (Lead-Free Hot Air Leveling)', 'ENIG (Electroless Nickel Immersion Gold)', 'OSP (Organic Solderability Preservative)'],
      },
      {
        id: 'electrical_test',
        label: '100% Flying Probe Electrical Continuity Testing',
        type: 'select',
        required: true,
        options: ['Yes (Certified Flying Probe Test Included)', 'No (Visual Inspection Only)'],
      },
    ];

    // Seed multiple competitive lab offerings for 3D Printing and PCB
    const offerings = [
      // 3D Printing: Lab 1 (NIT KKR)
      {
        master_service_id: 'srv-3d-printing',
        organization_id: nitKkrOrgId,
        vendor_name: 'NIT KKR Advanced MakerSpace & Robotics Core',
        vendor_accreditation: 'AICTE Idea Lab & MoE Certified',
        vendor_location: 'Kurukshetra, Haryana',
        vendor_rating: 4.95,
        base_price: 340,
        original_price: 500,
        unit: 'per part',
        turnaround: '2 - 3 Business Days',
        dynamic_intake_schema: threeDPrintingIntakeSchema,
        approval_status: 'APPROVED',
        is_active: true,
      },
      // 3D Printing: Lab 2 (Bangalore Rapid Core)
      {
        master_service_id: 'srv-3d-printing',
        organization_id: null,
        vendor_name: 'Bangalore Additive Tech Park',
        vendor_accreditation: 'ISO 9001:2015 & Stratasys Certified',
        vendor_location: 'Electronic City, Bengaluru',
        vendor_rating: 4.88,
        base_price: 420,
        original_price: 600,
        unit: 'per part',
        turnaround: '1 - 2 Business Days (Express)',
        dynamic_intake_schema: threeDPrintingIntakeSchema,
        approval_status: 'APPROVED',
        is_active: true,
      },
      // 3D Printing: Lab 3 (Pune FabLab)
      {
        master_service_id: 'srv-3d-printing',
        organization_id: null,
        vendor_name: 'Western Innovation FabLab',
        vendor_accreditation: 'Fab Foundation International',
        vendor_location: 'Pune Science Park, Maharashtra',
        vendor_rating: 4.80,
        base_price: 290,
        original_price: 450,
        unit: 'per part',
        turnaround: '4 - 5 Business Days (Budget)',
        dynamic_intake_schema: threeDPrintingIntakeSchema,
        approval_status: 'APPROVED',
        is_active: true,
      },

      // PCB Fab: Lab 1 (NIT KKR)
      {
        master_service_id: 'srv-pcb-fab',
        organization_id: nitKkrOrgId,
        vendor_name: 'NIT KKR Embedded Systems & VLSI Lab',
        vendor_accreditation: 'Department of Electronics & IT',
        vendor_location: 'Kurukshetra, Haryana',
        vendor_rating: 4.92,
        base_price: 780,
        original_price: 1100,
        unit: 'per 5 boards',
        turnaround: '3 - 4 Business Days',
        dynamic_intake_schema: pcbIntakeSchema,
        approval_status: 'APPROVED',
        is_active: true,
      },
      // PCB Fab: Lab 2 (Hyderabad Circuit Fab)
      {
        master_service_id: 'srv-pcb-fab',
        organization_id: null,
        vendor_name: 'Deccan MicroCircuits & SMT Facility',
        vendor_accreditation: 'IPC-A-610 Class 3 Certified',
        vendor_location: 'HITEC City, Hyderabad',
        vendor_rating: 4.96,
        base_price: 890,
        original_price: 1350,
        unit: 'per 5 boards',
        turnaround: '2 - 3 Business Days',
        dynamic_intake_schema: pcbIntakeSchema,
        approval_status: 'APPROVED',
        is_active: true,
      },

      // CNC Machining: Lab 1 (Pune Precision Core)
      {
        master_service_id: 'srv-cnc-machining',
        organization_id: null,
        vendor_name: 'National Precision Tooling Center',
        vendor_accreditation: 'AS9100D Aerospace Certified',
        vendor_location: 'Bhosari Industrial Core, Pune',
        vendor_rating: 4.94,
        base_price: 1850,
        original_price: 2600,
        unit: 'per part',
        turnaround: '4 - 6 Business Days',
        dynamic_intake_schema: [
          {
            id: 'cad_step_file',
            label: '3D CAD Model (STEP / IGES)',
            type: 'file',
            required: true,
            placeholder: 'Upload STEP AP214 or IGES solid model file',
          },
          {
            id: 'material_spec',
            label: 'Raw Material Stock',
            type: 'select',
            required: true,
            options: ['Aluminum 6061-T6 (Standard Aircraft Grade)', 'Aluminum 7075-T6 (High Strength)', 'Stainless Steel 304', 'Brass C360', 'Delrin / POM Plastic (Black)'],
          },
          {
            id: 'surface_treatment',
            label: 'Surface Treatment / Anodizing',
            type: 'select',
            required: true,
            options: ['As-Milled (Ra 1.6 µm)', 'Bead Blasted (Matte Satin)', 'Type II Anodize - Matte Black', 'Type II Anodize - Clear Silver', 'Electroless Nickel Plating'],
          },
        ],
        approval_status: 'APPROVED',
        is_active: true,
      },

      // NMR Testing: Lab 1 (National Chemical Core)
      {
        master_service_id: 'srv-nmr-testing',
        organization_id: null,
        vendor_name: 'National Chemical Analytical Core',
        vendor_accreditation: 'NABL & ISO 17025 Certified',
        vendor_location: 'Pune Science Park',
        vendor_rating: 4.98,
        base_price: 1560,
        original_price: 2400,
        unit: 'per sample',
        turnaround: '48 Hours',
        dynamic_intake_schema: [
          {
            id: 'sample_nuclei',
            label: 'NMR Experiment Nuclei',
            type: 'select',
            required: true,
            options: ['1H 1D Proton NMR', '13C 1D Carbon NMR', '1H & 13C Dual Package', '2D COSY & HSQC Correlation'],
          },
          {
            id: 'solvent_preference',
            label: 'Deuterated Solvent',
            type: 'select',
            required: true,
            options: ['CDCl3 (Chloroform-d)', 'DMSO-d6', 'D2O (Deuterium Oxide)', 'Methanol-d4', 'Acetone-d6'],
          },
          {
            id: 'sample_mass_mg',
            label: 'Estimated Mass (mg) or Concentration',
            type: 'text',
            required: true,
            placeholder: 'e.g. 15 mg dry powder or 10 mM solution',
          },
        ],
        approval_status: 'APPROVED',
        is_active: true,
      },
    ];

    for (const off of offerings) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO marketplace.lab_service_offerings (
          master_service_id, organization_id, vendor_name, vendor_accreditation,
          vendor_location, vendor_rating, base_price, original_price, unit,
          turnaround, dynamic_intake_schema, approval_status, is_active, updated_at
        ) VALUES (
          $1, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, NOW()
        )
        ON CONFLICT DO NOTHING;
      `,
        off.master_service_id, off.organization_id, off.vendor_name, off.vendor_accreditation,
        off.vendor_location, off.vendor_rating, off.base_price, off.original_price, off.unit,
        off.turnaround, JSON.stringify(off.dynamic_intake_schema), off.approval_status, off.is_active
      );
    }
    console.log(`✅ Seeded ${offerings.length} Approved Lab Offerings with Dynamic Intake Schemas.`);

    // 9. Seed Demo Service Order for Live Shipment Tracking Demonstration
    const sampleCourier = {
      courierName: "Blue Dart Express",
      trackingNumber: "BD-982184910IN",
      trackingUrl: "https://www.bluedart.com/tracking",
      currentStatus: "DISPATCHED",
      statusLabel: "Dispatched via Blue Dart Air Cargo",
      estimatedDelivery: "Tomorrow by 6:00 PM",
      dispatchedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    };

    const sampleAddress = {
      fullName: "Arjun Verma (Student Researcher)",
      email: "arjun.verma@nitkkr.ac.in",
      phoneNumber: "+91 98765 43210",
      organizationName: "NIT Kurukshetra Robotics Lab",
      addressLine1: "Advanced Manufacturing Core, Dept of Mechanical Engineering",
      addressLine2: "National Institute of Technology",
      city: "Kurukshetra",
      state: "Haryana",
      postalCode: "136119",
      country: "India",
    };

    const sampleIntake = {
      cad_model_file: "drone_motor_bracket_v3_manifold.stl (4.8 MB)",
      material_choice: "PETG (High Strength & Chemical Resistant)",
      infill_density: "45% (Semi-Structural Functional Part)",
      layer_resolution: "0.12 mm (Fine Detail / Smooth Surface)",
      tolerances_notes: "Requires M3 brass heat-set threaded insert cavities with +0.15mm allowance.",
    };

    const sampleTimeline = [
      { step: "ORDER_PLACED", label: "Order Confirmed", completedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString() },
      { step: "PRE_FLIGHT_CHECK", label: "Geometry & Slicing Pass", completedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString() },
      { step: "IN_PRODUCTION", label: "Fabrication Complete (Fused Deposition)", completedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString() },
      { step: "DISPATCHED", label: "Dispatched with Blue Dart", completedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString() },
      { step: "DELIVERED", label: "Expected Delivery", completedAt: null },
    ];

    await prisma.$executeRawUnsafe(`
      INSERT INTO marketplace.service_orders (
        order_number, user_id, service_id, service_title, vendor_name,
        category, amount, quantity, payment_method,
        status, status_label, sample_tracking_code, shipping_address,
        dynamic_intake_responses, courier_details, timeline_events, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13::jsonb,
        $14::jsonb, $15::jsonb, $16::jsonb, NOW() - INTERVAL '36 hours', NOW()
      )
      ON CONFLICT DO NOTHING;
    `,
      "ORD-DEMO-3D",
      "00000000-0000-0000-0000-000000000001",
      "srv-3d-printing",
      "Industrial FDM & Resin 3D Rapid Prototyping",
      "Western Innovation FabLab",
      "FABRICATION",
      290,
      1,
      "RAZORPAY",
      "DISPATCHED",
      "Dispatched via Blue Dart Air Cargo",
      "BD-982184910IN",
      JSON.stringify(sampleAddress),
      JSON.stringify(sampleIntake),
      JSON.stringify(sampleCourier),
      JSON.stringify(sampleTimeline)
    );
    console.log('✅ Seeded Live Demonstration Order: ORD-DEMO-3D with tracking code BD-982184910IN');

    console.log('\n================================================================');
    console.log('🎉 MARKETPLACE TABLES & CATALOG SUCCESSFULLY INITIALIZED!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('❌ Error setting up marketplace tables:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  setupMarketplaceTables().catch(() => process.exit(1));
}

module.exports = { setupMarketplaceTables };
