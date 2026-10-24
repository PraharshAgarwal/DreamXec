const RazorpayPaymentAdapter = require('../donations/adapters/razorpay-payment.adapter');
const prisma = require('../../config/prisma');
const AppError = require('../../utils/AppError');
const emailService = require('../email/email.service');

class ResearchServicesBackendService {
  constructor() {
    this.razorpayAdapter = new RazorpayPaymentAdapter();
  }

  /**
   * Helper to format DB row to clean frontend schema
   */
  formatServiceRow(r) {
    return {
      id: r.id,
      title: r.title,
      category: r.category,
      categoryLabel: r.category_label,
      categoryColor: r.category_color,
      imageUrl: r.image_url,
      summary: r.summary,
      fullDescription: r.full_description,
      turnaround: r.turnaround,
      whatYouSend: r.what_you_send,
      whatYouGet: r.what_you_get,
      price: Number(r.price),
      originalPrice: Number(r.original_price),
      unit: r.unit,
      discountPct: Number(r.discount_pct || 0),
      vendor: {
        id: `ven-${r.id}`,
        name: r.vendor_name,
        slug: r.id,
        rating: Number(r.vendor_rating || 5.0),
        totalOrders: 100,
        accreditation: r.vendor_accreditation,
        isVerified: true,
        location: r.vendor_location,
      },
      tags: Array.isArray(r.tags) ? r.tags : (typeof r.tags === 'string' ? JSON.parse(r.tags) : []),
      workflowConfig: r.workflow_config && typeof r.workflow_config === 'object' ? r.workflow_config : null,
      organizationId: r.organization_id || null,
      fulfillmentType: r.fulfillment_type || 'DIRECT_DISPATCH',
      redirectUrl: r.redirect_url || null,
      targetLabEmail: r.target_lab_email || null,
      targetLabAddress: r.target_lab_address || null,
      offerings: [],
      offeringsCount: 1,
      minPrice: Number(r.price),
      maxPrice: Number(r.original_price || r.price),
      isPhysicalDelivery: true,
    };
  }

  /**
   * Helper to format offering row
   */
  formatOfferingRow(r) {
    return {
      id: String(r.id),
      masterServiceId: r.master_service_id,
      organizationId: r.organization_id || null,
      vendorName: r.vendor_name,
      vendorAccreditation: r.vendor_accreditation || 'NABL & ISO Certified',
      vendorLocation: r.vendor_location || 'National Center',
      vendorRating: Number(r.vendor_rating || 5.0),
      basePrice: Number(r.base_price),
      originalPrice: Number(r.original_price || Math.round(Number(r.base_price) * 1.3)),
      unit: r.unit || 'per part',
      turnaround: r.turnaround || '3 - 5 Business Days',
      dynamicIntakeSchema: Array.isArray(r.dynamic_intake_schema)
        ? r.dynamic_intake_schema
        : (typeof r.dynamic_intake_schema === 'string' ? JSON.parse(r.dynamic_intake_schema) : []),
      approvalStatus: r.approval_status || 'PENDING',
      adminNotes: r.admin_notes || null,
      isActive: r.is_active !== false,
      createdAt: r.created_at,
    };
  }

  /**
   * Helper to format Master Service row with associated approved lab offerings
   */
  formatMasterServiceRow(r, offerings = []) {
    const activeOfferings = (offerings || []).filter(o => o.approvalStatus === 'APPROVED' && o.isActive);
    const sortedByPrice = [...activeOfferings].sort((a, b) => a.basePrice - b.basePrice);
    const minPrice = sortedByPrice.length > 0 ? sortedByPrice[0].basePrice : 0;
    const maxPrice = sortedByPrice.length > 0 ? sortedByPrice[sortedByPrice.length - 1].basePrice : 0;
    const fastestTurnaround = sortedByPrice.length > 0 ? sortedByPrice[0].turnaround : '3 - 5 Business Days';
    const primaryVendor = sortedByPrice.length > 0 ? {
      id: `ven-${sortedByPrice[0].id}`,
      name: sortedByPrice[0].vendorName,
      slug: r.slug,
      rating: sortedByPrice[0].vendorRating,
      totalOrders: 100,
      accreditation: sortedByPrice[0].vendorAccreditation,
      isVerified: true,
      location: sortedByPrice[0].vendorLocation,
    } : {
      id: `ven-${r.id}`,
      name: "Multiple Verified Partner Labs",
      slug: r.slug,
      rating: 4.9,
      totalOrders: 250,
      accreditation: "ISO & NABL Accredited Facilities",
      isVerified: true,
      location: "Pan-India Lab Network",
    };

    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      category: r.category,
      categoryLabel: r.category_label || (r.category === 'FABRICATION' ? 'Hardware Fab' : r.category === 'TESTING' ? 'Lab Testing' : 'Cloud & AI'),
      categoryColor: r.category_color || (r.category === 'FABRICATION' ? '#0F534A' : r.category === 'TESTING' ? '#FE4E1A' : '#4717AE'),
      imageUrl: r.image_url,
      summary: r.summary,
      fullDescription: r.full_description,
      isPhysicalDelivery: r.is_physical_delivery !== false,
      turnaround: fastestTurnaround,
      whatYouSend: r.category === 'FABRICATION' ? '3D CAD models (STL/STEP) or Gerber files' : 'Physical samples or specifications',
      whatYouGet: r.category === 'FABRICATION' ? 'Manufactured parts with quality inspection certificate' : 'Certified analytical report & raw data',
      price: minPrice,
      originalPrice: sortedByPrice.length > 0 ? (sortedByPrice[0].originalPrice || Math.round(minPrice * 1.3)) : 0,
      unit: sortedByPrice.length > 0 ? sortedByPrice[0].unit : (r.default_unit || 'per part'),
      discountPct: sortedByPrice.length > 0 && sortedByPrice[0].originalPrice ? Math.max(0, Math.round(((sortedByPrice[0].originalPrice - minPrice) / sortedByPrice[0].originalPrice) * 100)) : 25,
      vendor: primaryVendor,
      tags: Array.isArray(r.tags) ? r.tags : (typeof r.tags === 'string' ? JSON.parse(r.tags) : []),
      isGrantEscrowEligible: true,
      offerings: activeOfferings,
      offeringsCount: activeOfferings.length,
      minPrice,
      maxPrice,
      workflowConfig: {
        stages: [
          { id: 'st-1', name: 'Intake File Verification', estimate: 'Day 1', description: 'CAD/Gerber geometry & DFM check by lab engineer.' },
          { id: 'st-2', name: 'Active Fabrication', estimate: 'Day 2-3', description: 'Additive printing / PCB assembly / CNC machining.' },
          { id: 'st-3', name: 'Quality Inspection & Dispatch', estimate: 'Day 4', description: 'Dimensional check, packaging, and courier dispatch.' },
        ],
        intakeFields: activeOfferings.length > 0 ? activeOfferings[0].dynamicIntakeSchema : [],
      },
    };
  }

  /**
   * Helper to format DB order row to clean frontend schema
   */
  formatOrderRow(r) {
    return {
      id: String(r.id),
      orderNumber: r.order_number,
      userId: r.user_id,
      serviceId: r.service_id,
      serviceTitle: r.service_title,
      category: r.category,
      vendorName: r.vendor_name,
      amount: Number(r.amount),
      appliedFromBalance: Number(r.applied_from_balance || 0),
      razorpayAmount: Number(r.razorpay_amount || 0),
      quantity: Number(r.quantity || 1),
      paymentMethod: r.payment_method,
      razorpayOrderId: r.razorpay_order_id,
      razorpayPaymentId: r.razorpay_payment_id,
      status: r.status === 'ESCROW_RELEASED' ? 'COMPLETED' : r.status === 'ESCROW_LOCKED' ? 'CONFIRMED' : r.status,
      statusLabel: r.status_label,
      date: new Date(r.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }),
      sampleTrackingCode: r.sample_tracking_code,
      deliverableFile: r.deliverable_file,
      intakeData: r.intake_data && typeof r.intake_data === 'object' ? r.intake_data : {},
      organizationId: r.organization_id || null,
      fulfillmentType: r.fulfillment_type || 'DIRECT_DISPATCH',
      offeringId: r.offering_id || null,
      shippingAddress: r.shipping_address && typeof r.shipping_address === 'object' ? r.shipping_address : null,
      dynamicIntakeResponses: r.dynamic_intake_responses && typeof r.dynamic_intake_responses === 'object' ? r.dynamic_intake_responses : (r.intake_data || {}),
      courierDetails: r.courier_details && typeof r.courier_details === 'object' ? r.courier_details : null,
      timelineEvents: Array.isArray(r.timeline_events) ? r.timeline_events : [],
    };
  }

  /**
   * Get all services with multi-lab aggregation and fallback
   */
  async getAllServices({ category, query }) {
    try {
      let sql = `SELECT * FROM marketplace.master_services WHERE 1=1`;
      const params = [];

      if (category && category !== "ALL") {
        params.push(category.toUpperCase());
        sql += ` AND UPPER(category) = $${params.length}`;
      }
      sql += ` ORDER BY created_at ASC;`;

      const masterRows = await prisma.$queryRawUnsafe(sql, ...params);

      if (masterRows && masterRows.length > 0) {
        const offeringRows = await prisma.$queryRawUnsafe(`
          SELECT * FROM marketplace.lab_service_offerings
          WHERE approval_status = 'APPROVED' AND is_active = true
          ORDER BY base_price ASC;
        `);

        const offeringsByMaster = {};
        for (const off of (offeringRows || [])) {
          const offFormatted = this.formatOfferingRow(off);
          if (!offeringsByMaster[off.master_service_id]) {
            offeringsByMaster[off.master_service_id] = [];
          }
          offeringsByMaster[off.master_service_id].push(offFormatted);
        }

        let mapped = masterRows.map((r) =>
          this.formatMasterServiceRow(r, offeringsByMaster[r.id] || [])
        );

        if (query && query.trim()) {
          const q = query.toLowerCase().trim();
          mapped = mapped.filter(
            (s) =>
              s.title.toLowerCase().includes(q) ||
              s.summary.toLowerCase().includes(q) ||
              s.vendor.name.toLowerCase().includes(q) ||
              s.tags.some((t) => t.toLowerCase().includes(q))
          );
        }

        return mapped;
      }
    } catch (err) {
      console.warn("[getAllServices] Notice: checking fallback marketplace.service_items:", err.message);
    }

    // Fallback: legacy marketplace.service_items
    let sql = `SELECT * FROM marketplace.service_items WHERE 1=1`;
    const params = [];
    if (category && category !== "ALL") {
      params.push(category.toUpperCase());
      sql += ` AND UPPER(category) = $${params.length}`;
    }
    sql += ` ORDER BY created_at ASC;`;

    const rows = await prisma.$queryRawUnsafe(sql, ...params);
    if (!rows || rows.length === 0) return [];

    let mapped = rows.map((r) => this.formatServiceRow(r));
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      mapped = mapped.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.summary.toLowerCase().includes(q) ||
          s.vendor.name.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return mapped;
  }

  /**
   * Get a single service by ID or Slug with approved lab offerings
   */
  async getServiceById(id) {
    try {
      const masterRows = await prisma.$queryRawUnsafe(
        `SELECT * FROM marketplace.master_services WHERE id = $1 OR slug = $1 LIMIT 1;`,
        id
      );

      if (masterRows && masterRows.length > 0) {
        const ms = masterRows[0];
        const offeringRows = await prisma.$queryRawUnsafe(
          `SELECT * FROM marketplace.lab_service_offerings 
           WHERE master_service_id = $1 AND approval_status = 'APPROVED' AND is_active = true 
           ORDER BY base_price ASC;`,
          ms.id
        );
        const offerings = (offeringRows || []).map((o) => this.formatOfferingRow(o));
        return this.formatMasterServiceRow(ms, offerings);
      }
    } catch (err) {
      console.warn("[getServiceById] Master service lookup notice:", err.message);
    }

    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM marketplace.service_items WHERE id = $1 LIMIT 1;`,
      id
    );
    if (rows && rows.length > 0) {
      return this.formatServiceRow(rows[0]);
    }

    throw new AppError("Research service not found", 404);
  }

  /**
   * Get single lab offering by ID
   */
  async getOfferingById(offeringId) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT o.*, m.title as master_title, m.category as master_category
       FROM marketplace.lab_service_offerings o
       JOIN marketplace.master_services m ON o.master_service_id = m.id
       WHERE o.id = $1::uuid LIMIT 1;`,
      String(offeringId)
    );
    if (!rows || rows.length === 0) {
      throw new AppError("Lab offering not found", 404);
    }
    return {
      ...this.formatOfferingRow(rows[0]),
      masterTitle: rows[0].master_title,
      masterCategory: rows[0].master_category,
    };
  }

  /**
   * Fetch user's saved and last-used shipping addresses
   */
  async getUserAddress(userId) {
    if (!userId) return { lastUsedAddress: null, savedAddresses: [] };
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileMetadata: true, fullName: true, email: true },
    });
    if (!user) return { lastUsedAddress: null, savedAddresses: [] };
    const meta = user.profileMetadata || {};
    return {
      lastUsedAddress: meta.lastUsedAddress || null,
      savedAddresses: Array.isArray(meta.savedAddresses) ? meta.savedAddresses : [],
      fullName: user.fullName,
      email: user.email,
    };
  }

  /**
   * Remember user's shipping address for future one-click checkout
   */
  async saveUserAddressMemory(userId, shippingAddress) {
    if (!userId || !shippingAddress || !shippingAddress.addressLine1) return;
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { profileMetadata: true },
      });
      if (!user) return;
      const meta = user.profileMetadata || {};
      const saved = Array.isArray(meta.savedAddresses) ? meta.savedAddresses : [];
      const newAddr = {
        id: `addr-${Date.now()}`,
        ...shippingAddress,
        lastUsedAt: new Date().toISOString(),
      };
      const updated = [newAddr, ...saved.filter(a => a.addressLine1 !== shippingAddress.addressLine1 || a.postalCode !== shippingAddress.postalCode)].slice(0, 5);
      await prisma.user.update({
        where: { id: userId },
        data: {
          profileMetadata: {
            ...meta,
            savedAddresses: updated,
            lastUsedAddress: newAddr,
          },
        },
      });
    } catch (err) {
      console.warn("[saveUserAddressMemory] Notice:", err.message);
    }
  }

  /**
   * Lab Partner Portal: Browse Outsource Opportunities
   */
  async getLabOpportunities(user) {
    const masterRows = await prisma.$queryRawUnsafe(`
      SELECT * FROM marketplace.master_services ORDER BY created_at ASC;
    `);

    let userOrgOfferings = [];
    let userOrgId = user?.activeProfile?.organizationId || null;

    if (!userOrgId && user?.id) {
      const membership = await prisma.membership.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
        select: { organizationId: true },
      });
      if (membership) userOrgId = membership.organizationId;
    }

    if (userOrgId) {
      userOrgOfferings = await prisma.$queryRawUnsafe(`
        SELECT * FROM marketplace.lab_service_offerings WHERE organization_id = $1::uuid;
      `, userOrgId);
    }

    const offeringsByMaster = {};
    for (const off of (userOrgOfferings || [])) {
      offeringsByMaster[off.master_service_id] = this.formatOfferingRow(off);
    }

    return (masterRows || []).map((ms) => {
      const myOffering = offeringsByMaster[ms.id] || null;
      return {
        masterService: {
          id: ms.id,
          slug: ms.slug,
          title: ms.title,
          category: ms.category,
          categoryLabel: ms.category_label,
          categoryColor: ms.category_color,
          imageUrl: ms.image_url,
          summary: ms.summary,
          fullDescription: ms.full_description,
          defaultUnit: ms.default_unit,
          isPhysicalDelivery: ms.is_physical_delivery,
        },
        myOffering,
        status: myOffering ? myOffering.approvalStatus : 'NOT_OFFERED',
      };
    });
  }

  /**
   * Submit or update a lab service offering
   */
  async submitLabOffering(userId, data) {
    const {
      masterServiceId,
      organizationId,
      vendorName,
      vendorAccreditation,
      vendorLocation,
      basePrice,
      originalPrice,
      unit = 'per part',
      turnaround = '3 - 5 Business Days',
      dynamicIntakeSchema = [],
    } = data;

    if (!masterServiceId || !vendorName || !basePrice) {
      throw new AppError("Master service, vendor name, and base price are required", 400);
    }

    const numBasePrice = Number(basePrice);
    const numOrigPrice = originalPrice ? Number(originalPrice) : Math.round(numBasePrice * 1.3);

    const inserted = await prisma.$queryRawUnsafe(`
      INSERT INTO marketplace.lab_service_offerings (
        master_service_id, organization_id, vendor_name, vendor_accreditation,
        vendor_location, vendor_rating, base_price, original_price, unit,
        turnaround, dynamic_intake_schema, approval_status, is_active, updated_at
      ) VALUES (
        $1, $2::uuid, $3, $4, $5, 5.0, $6, $7, $8, $9, $10::jsonb, 'PENDING', true, NOW()
      )
      ON CONFLICT (master_service_id, organization_id) DO UPDATE SET
        vendor_name = EXCLUDED.vendor_name,
        vendor_accreditation = EXCLUDED.vendor_accreditation,
        vendor_location = EXCLUDED.vendor_location,
        base_price = EXCLUDED.base_price,
        original_price = EXCLUDED.original_price,
        unit = EXCLUDED.unit,
        turnaround = EXCLUDED.turnaround,
        dynamic_intake_schema = EXCLUDED.dynamic_intake_schema,
        approval_status = 'PENDING',
        is_active = true,
        updated_at = NOW()
      RETURNING *;
    `,
      masterServiceId,
      organizationId ? String(organizationId) : null,
      vendorName,
      vendorAccreditation || 'Certified Lab Facility',
      vendorLocation || 'Campus Makerspace',
      numBasePrice,
      numOrigPrice,
      unit,
      turnaround,
      JSON.stringify(dynamicIntakeSchema || [])
    );

    return this.formatOfferingRow(inserted[0]);
  }

  /**
   * Admin: Get all pending lab service offerings
   */
  async getPendingOfferings() {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT o.*, m.title as master_title, m.category as master_category, m.image_url as master_image
      FROM marketplace.lab_service_offerings o
      JOIN marketplace.master_services m ON o.master_service_id = m.id
      WHERE o.approval_status = 'PENDING'
      ORDER BY o.created_at DESC;
    `);

    return (rows || []).map((r) => ({
      ...this.formatOfferingRow(r),
      masterTitle: r.master_title,
      masterCategory: r.master_category,
      masterImage: r.master_image,
    }));
  }

  /**
   * Admin: Approve lab offering
   */
  async approveOffering(offeringId) {
    const rows = await prisma.$queryRawUnsafe(`
      UPDATE marketplace.lab_service_offerings
      SET approval_status = 'APPROVED', is_active = true, updated_at = NOW()
      WHERE id = $1::uuid
      RETURNING *;
    `, String(offeringId));
    if (!rows || rows.length === 0) {
      throw new AppError("Offering not found", 404);
    }
    return this.formatOfferingRow(rows[0]);
  }

  /**
   * Admin: Reject lab offering with feedback notes
   */
  async rejectOffering(offeringId, adminNotes = "") {
    const rows = await prisma.$queryRawUnsafe(`
      UPDATE marketplace.lab_service_offerings
      SET approval_status = 'REJECTED', admin_notes = $2, is_active = false, updated_at = NOW()
      WHERE id = $1::uuid
      RETURNING *;
    `, String(offeringId), adminNotes);
    if (!rows || rows.length === 0) {
      throw new AppError("Offering not found", 404);
    }
    return this.formatOfferingRow(rows[0]);
  }

  /**
   * Create a new external lab / research service in PostgreSQL (Legacy compatibility)
   */
  async createService(data) {
    const {
      title,
      category = "TESTING",
      categoryLabel,
      categoryColor,
      imageUrl,
      summary,
      fullDescription,
      turnaround,
      whatYouSend,
      whatYouGet,
      price,
      originalPrice,
      unit = "per sample",
      discountPct = 0,
      vendorName,
      vendorAccreditation,
      vendorLocation,
      vendorRating = 5.0,
      tags = [],
    } = data;

    if (!title || price === undefined || price === null || price === "") {
      throw new AppError("Service title and price are required", 400);
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 30);
    const id = data.id || `srv-${slug}-${Math.floor(100 + Math.random() * 900)}`;

    const numPrice = Number(price);
    const numOrigPrice = originalPrice ? Number(originalPrice) : Math.round(numPrice * 1.25);
    const numDiscount = discountPct !== undefined && discountPct !== null && discountPct !== ""
      ? Number(discountPct)
      : Math.max(0, Math.round(((numOrigPrice - numPrice) / numOrigPrice) * 100));

    const cat = (category || "TESTING").toUpperCase();
    const catLabel = categoryLabel || (cat === "TESTING" ? "Lab Testing" : cat === "CLOUD" ? "Cloud & AI" : cat === "FABRICATION" ? "Hardware Fab" : cat === "CHEMICALS" ? "Lab Chemicals" : "Legal & IP");
    const catColor = categoryColor || (cat === "CLOUD" ? "#4717AE" : cat === "FABRICATION" ? "#0F534A" : cat === "LEGAL" ? "#18D7E8" : "#FE4E1A");

    const defaultImg = cat === "CLOUD"
      ? "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80"
      : cat === "FABRICATION"
      ? "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"
      : cat === "CHEMICALS"
      ? "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=800&q=80"
      : "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80";

    const cleanTags = Array.isArray(tags)
      ? tags
      : typeof tags === "string"
      ? tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const vendorObj = typeof data.vendor === "object" && data.vendor !== null ? data.vendor : {};
    const vName = vendorName || vendorObj.name || "Accredited Partner Core";
    const vAccred = vendorAccreditation || vendorObj.accreditation || "NABL & ISO Certified";
    const vLoc = vendorLocation || vendorObj.location || "National Innovation Core";
    const vRating = Number(vendorRating || vendorObj.rating || 5.0);

    const workflowConfig = data.workflowConfig || data.workflow_config || null;
    const organizationId = data.organizationId || data.organization_id || null;
    const fulfillmentType = data.fulfillmentType || data.fulfillment_type || "DIRECT_DISPATCH";
    const redirectUrl = data.redirectUrl || data.redirect_url || null;
    const targetLabEmail = data.targetLabEmail || data.target_lab_email || null;
    const targetLabAddress = data.targetLabAddress || data.target_lab_address || null;

    const inserted = await prisma.$queryRawUnsafe(`
      INSERT INTO marketplace.service_items (
        id, title, category, category_label, category_color,
        image_url, summary, full_description, turnaround,
        what_you_send, what_you_get, price, original_price,
        unit, discount_pct, vendor_name, vendor_accreditation,
        vendor_location, vendor_rating, tags, workflow_config,
        organization_id, fulfillment_type, redirect_url, target_lab_email, target_lab_address,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20::jsonb, $21::jsonb,
        $22, $23, $24, $25, $26,
        NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        price = EXCLUDED.price,
        summary = EXCLUDED.summary,
        full_description = EXCLUDED.full_description,
        turnaround = EXCLUDED.turnaround,
        vendor_name = EXCLUDED.vendor_name,
        workflow_config = EXCLUDED.workflow_config,
        organization_id = EXCLUDED.organization_id,
        fulfillment_type = EXCLUDED.fulfillment_type,
        redirect_url = EXCLUDED.redirect_url,
        target_lab_email = EXCLUDED.target_lab_email,
        target_lab_address = EXCLUDED.target_lab_address,
        updated_at = NOW()
      RETURNING *;
    `,
      id,
      title,
      cat,
      catLabel,
      catColor,
      imageUrl || defaultImg,
      summary || `${title} provided by accredited research facility.`,
      fullDescription || summary || `${title} with certified analytical report.`,
      turnaround || "3 - 5 Business Days",
      whatYouSend || "Standard sample or design specifications",
      whatYouGet || "Certified analytical report / telemetry results",
      numPrice,
      numOrigPrice,
      unit,
      numDiscount,
      vName,
      vAccred,
      vLoc,
      vRating,
      JSON.stringify(cleanTags),
      JSON.stringify(workflowConfig || {}),
      organizationId,
      fulfillmentType,
      redirectUrl,
      targetLabEmail,
      targetLabAddress
    );

    if (!inserted || !inserted[0]) {
      throw new AppError("Failed to persist research service in database", 500);
    }

    return this.formatServiceRow(inserted[0]);
  }

  /**
   * Seed initial mock catalog
   */
  async seedMockServices() {
    const results = [];
    for (const item of INITIAL_MOCK_SERVICES) {
      const created = await this.createService(item);
      results.push(created);
    }
    return results;
  }

  /**
   * Get user's available account balance from DB ledger accounts
   */
  async getUserBalance(userId) {
    if (!userId) return 0;
    const isUuid = typeof userId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) return 0;

    try {
      const ledger = await prisma.ledgerAccount.findFirst({
        where: {
          userId: userId,
          accountType: "LIABILITY",
          isActive: true,
        },
        orderBy: { balanceCached: "desc" },
      });

      if (ledger && ledger.balanceCached !== undefined) {
        return Number(ledger.balanceCached);
      }

      const fallbackLedger = await prisma.ledgerAccount.findFirst({
        where: {
          userId: userId,
          isActive: true,
        },
        orderBy: { balanceCached: "desc" },
      });

      if (fallbackLedger && fallbackLedger.balanceCached !== undefined) {
        return Number(fallbackLedger.balanceCached);
      }
    } catch (err) {
      console.error("[getUserBalance] DB ledger query error:", err.message);
    }

    return 0;
  }

  /**
   * Pay directly using available account balance with Dynamic Intake & Shipping Address
   */
  async payWithAccountBalance(userId, { serviceId, offeringId, quantity = 1, sampleIdentifier = "", notes = "", intakeData = {}, shippingAddress = {}, dynamicIntakeResponses = {} }) {
    if (!userId) {
      throw new AppError("Authentication required: Please log in to complete payment.", 401);
    }

    let service = null;
    let selectedOffering = null;

    if (offeringId) {
      const offRows = await prisma.$queryRawUnsafe(
        `SELECT o.*, m.title as master_title, m.category as master_category
         FROM marketplace.lab_service_offerings o
         JOIN marketplace.master_services m ON o.master_service_id = m.id
         WHERE o.id = $1::uuid LIMIT 1;`,
        String(offeringId)
      );
      if (offRows && offRows.length > 0) {
        selectedOffering = this.formatOfferingRow(offRows[0]);
        service = {
          id: selectedOffering.masterServiceId,
          title: offRows[0].master_title,
          category: offRows[0].master_category,
          price: selectedOffering.basePrice,
          unit: selectedOffering.unit,
          vendor: {
            name: selectedOffering.vendorName,
          },
          organizationId: selectedOffering.organizationId,
          fulfillmentType: "DIRECT_DISPATCH",
        };
      }
    }

    if (!service) {
      service = await this.getServiceById(serviceId);
    }

    const currentBalance = await this.getUserBalance(userId);
    const totalAmount = service.price * quantity;

    if (currentBalance < totalAmount) {
      throw new AppError(
        `Insufficient available balance (₹${currentBalance.toLocaleString()}) to cover service cost (₹${totalAmount.toLocaleString()}). Please choose Pay with Razorpay instead.`,
        400
      );
    }

    // Deduct from DB ledger account
    const isUuid = typeof userId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    let newBalance = currentBalance - totalAmount;

    if (isUuid) {
      const ledger = await prisma.ledgerAccount.findFirst({
        where: { userId: userId, isActive: true },
        orderBy: { balanceCached: "desc" },
      });
      if (ledger) {
        newBalance = Number(ledger.balanceCached) - totalAmount;
        await prisma.ledgerAccount.update({
          where: { id: ledger.id },
          data: { balanceCached: newBalance },
        });
      }
    }

    const orderNumber = `DX-SRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const trackingCode = `BLR-${Math.floor(100000 + Math.random() * 900000)}-EXP`;

    const initialTimeline = [
      { step: "ORDER_PLACED", label: "Order Confirmed & Payment Verified", completedAt: new Date().toISOString() },
      { step: "PRE_FLIGHT_CHECK", label: "Files & Geometry Check by Lab", completedAt: null },
      { step: "IN_PRODUCTION", label: "Active Fabrication / Testing", completedAt: null },
      { step: "DISPATCHED", label: "Dispatched with Courier", completedAt: null },
      { step: "DELIVERED", label: "Delivered to Customer", completedAt: null },
    ];

    const initialCourier = {
      currentStatus: "CONFIRMED",
      statusLabel: "Confirmed & Sent to Lab",
      courierName: "Standard Express Courier",
      trackingNumber: trackingCode,
      trackingUrl: "",
      dispatchedAt: null,
      estimatedDelivery: "3 - 5 Business Days",
    };

    const finalIntake = {
      ...(intakeData || {}),
      ...(dynamicIntakeResponses || {}),
      specialInstructions: notes || "",
    };

    const inserted = await prisma.$queryRawUnsafe(`
      INSERT INTO marketplace.service_orders (
        order_number, user_id, service_id, service_title, category, vendor_name,
        amount, applied_from_balance, razorpay_amount, quantity, payment_method,
        status, status_label, sample_tracking_code, deliverable_file, intake_data,
        organization_id, fulfillment_type, offering_id, shipping_address,
        dynamic_intake_responses, courier_details, timeline_events
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb,
        $17, $18, $19::uuid, $20::jsonb, $21::jsonb, $22::jsonb, $23::jsonb
      ) RETURNING *;
    `,
      orderNumber, String(userId), service.id, service.title,
      service.category, service.vendor.name, totalAmount, totalAmount,
      0, quantity, "WALLET_BALANCE", "CONFIRMED",
      "Confirmed & Dispatched to Lab Facility", trackingCode,
      "Processing at facility — manufacturing report and dispatch details will be updated.",
      JSON.stringify(finalIntake),
      service.organizationId || null,
      service.fulfillmentType || "DIRECT_DISPATCH",
      offeringId ? String(offeringId) : null,
      JSON.stringify(shippingAddress || {}),
      JSON.stringify(dynamicIntakeResponses || {}),
      JSON.stringify(initialCourier),
      JSON.stringify(initialTimeline)
    );

    if (!inserted || !inserted[0]) {
      throw new AppError("Failed to save service order to database", 500);
    }

    // Save address memory in user profile
    await this.saveUserAddressMemory(userId, shippingAddress);

    // Send notifications
    (async () => {
      try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, fullName: true } });
        if (user) {
          await emailService.sendServiceOrderConfirmationEmail({
            studentEmail: user.email,
            studentName: user.fullName,
            orderNumber,
            serviceTitle: service.title,
            vendorName: service.vendor.name,
            amount: totalAmount,
            trackingCode,
            shippingAddress,
          });
        }
      } catch (mErr) {
        console.warn("[payWithAccountBalance] Notification notice:", mErr.message);
      }
    })();

    const order = this.formatOrderRow(inserted[0]);

    return {
      order,
      deductedAmount: totalAmount,
      remainingBalance: newBalance,
    };
  }

  /**
   * Create Razorpay payment order with Dynamic Intake & Shipping details
   */
  async createRazorpayOrder(userId, { serviceId, offeringId, quantity = 1, sampleIdentifier = "", notes = "", appliedFromBalance = 0, intakeData = {}, shippingAddress = {}, dynamicIntakeResponses = {} }, req) {
    if (!userId) {
      throw new AppError("Authentication required: Please log in to complete payment.", 401);
    }

    let service = null;
    let selectedOffering = null;

    if (offeringId) {
      const offRows = await prisma.$queryRawUnsafe(
        `SELECT o.*, m.title as master_title, m.category as master_category
         FROM marketplace.lab_service_offerings o
         JOIN marketplace.master_services m ON o.master_service_id = m.id
         WHERE o.id = $1::uuid LIMIT 1;`,
        String(offeringId)
      );
      if (offRows && offRows.length > 0) {
        selectedOffering = this.formatOfferingRow(offRows[0]);
        service = {
          id: selectedOffering.masterServiceId,
          title: offRows[0].master_title,
          category: offRows[0].master_category,
          price: selectedOffering.basePrice,
          unit: selectedOffering.unit,
          vendor: {
            name: selectedOffering.vendorName,
          },
          organizationId: selectedOffering.organizationId,
          fulfillmentType: "DIRECT_DISPATCH",
        };
      }
    }

    if (!service) {
      service = await this.getServiceById(serviceId);
    }

    const totalAmount = service.price * quantity;
    const currentBalance = await this.getUserBalance(userId);

    const balanceDeduction = Math.min(Math.max(0, Number(appliedFromBalance || 0)), currentBalance, totalAmount);
    const razorpayPayableAmount = Math.max(0, totalAmount - balanceDeduction);
    const amountInPaise = Math.round(razorpayPayableAmount * 100);

    const receipt = `srv_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const razorpayOrder = await this.razorpayAdapter.createOrder({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        serviceId: service.id,
        offeringId: offeringId || "",
        serviceTitle: service.title,
        userId: String(userId),
        appliedFromBalance: balanceDeduction,
        domain: "dreamxec.com",
      },
      req,
      origin: req?.headers?.origin || "https://dreamxec.com",
      forcedEntity: "FICPL",
      purpose: "RESEARCH_SERVICE",
    });

    const orderNumber = `DX-SRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const finalIntake = {
      ...(intakeData || {}),
      ...(dynamicIntakeResponses || {}),
      specialInstructions: notes || "",
    };

    const initialTimeline = [
      { step: "ORDER_PLACED", label: "Awaiting Razorpay Payment", completedAt: new Date().toISOString() },
    ];

    const inserted = await prisma.$queryRawUnsafe(`
      INSERT INTO marketplace.service_orders (
        order_number, user_id, service_id, service_title, category, vendor_name,
        amount, applied_from_balance, razorpay_amount, quantity, payment_method,
        razorpay_order_id, status, status_label, intake_data,
        organization_id, fulfillment_type, offering_id, shipping_address,
        dynamic_intake_responses, timeline_events
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb,
        $16, $17, $18::uuid, $19::jsonb, $20::jsonb, $21::jsonb
      ) RETURNING id;
    `,
      orderNumber, String(userId), service.id, service.title,
      service.category, service.vendor.name, totalAmount, balanceDeduction,
      razorpayPayableAmount, quantity, balanceDeduction > 0 ? "SPLIT_BALANCE_RAZORPAY" : "RAZORPAY",
      razorpayOrder.id, "PENDING_PAYMENT", "Awaiting Payment",
      JSON.stringify(finalIntake),
      service.organizationId || null,
      service.fulfillmentType || "DIRECT_DISPATCH",
      offeringId ? String(offeringId) : null,
      JSON.stringify(shippingAddress || {}),
      JSON.stringify(dynamicIntakeResponses || {}),
      JSON.stringify(initialTimeline)
    );

    const orderId = inserted && inserted[0] ? String(inserted[0].id) : null;

    return {
      orderId,
      orderNumber,
      razorpayOrderId: razorpayOrder.id,
      totalAmount,
      appliedFromBalance: balanceDeduction,
      razorpayAmount: razorpayPayableAmount,
      amountInPaise,
      currency: "INR",
      keyId: razorpayOrder.key,
      entity: "dreamxec.com",
    };
  }

  /**
   * Verify Razorpay Payment Signature and finalize order
   */
  async verifyRazorpayPayment(userId, { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }, req) {
    if (!userId) {
      throw new AppError("Authentication required.", 401);
    }

    const isValid = this.razorpayAdapter.verifySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
      req,
    });

    if (!isValid) {
      throw new AppError("Invalid payment signature from Razorpay", 400);
    }

    const trackingCode = `BLR-${Math.floor(100000 + Math.random() * 900000)}-EXP`;

    const rows = await prisma.$queryRawUnsafe(`
      SELECT * FROM marketplace.service_orders
      WHERE (id::text = $1 OR order_number = $1 OR razorpay_order_id = $2)
        AND user_id = $3
      LIMIT 1;
    `, String(orderId), String(razorpayOrderId), String(userId));

    if (!rows || rows.length === 0) {
      throw new AppError("Matching service order not found in database", 404);
    }

    const orderRecord = rows[0];
    const appliedBalance = Number(orderRecord.applied_from_balance || 0);
    const razorpayPaid = Number(orderRecord.razorpay_amount || 0);

    if (appliedBalance > 0) {
      const isUuid = typeof userId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      if (isUuid) {
        const ledger = await prisma.ledgerAccount.findFirst({
          where: { userId: userId, isActive: true },
          orderBy: { balanceCached: "desc" },
        });
        if (ledger) {
          const newBal = Math.max(0, Number(ledger.balanceCached) - appliedBalance);
          await prisma.ledgerAccount.update({
            where: { id: ledger.id },
            data: { balanceCached: newBal },
          });
        }
      }
    }

    const statusLabel = appliedBalance > 0 
      ? `Paid (₹${appliedBalance.toLocaleString()} Balance + ₹${razorpayPaid.toLocaleString()} Razorpay)`
      : "Confirmed & Dispatched to Facility";

    const completedTimeline = [
      { step: "ORDER_PLACED", label: "Order Confirmed & Payment Verified", completedAt: new Date().toISOString() },
      { step: "PRE_FLIGHT_CHECK", label: "Files & Geometry Check by Lab", completedAt: null },
      { step: "IN_PRODUCTION", label: "Active Fabrication / Testing", completedAt: null },
      { step: "DISPATCHED", label: "Dispatched with Courier", completedAt: null },
      { step: "DELIVERED", label: "Delivered to Customer", completedAt: null },
    ];

    const initialCourier = {
      currentStatus: "CONFIRMED",
      statusLabel: "Confirmed & Sent to Lab",
      courierName: "Standard Express Courier",
      trackingNumber: trackingCode,
      trackingUrl: "",
      dispatchedAt: null,
      estimatedDelivery: "3 - 5 Business Days",
    };

    await prisma.$executeRawUnsafe(`
      UPDATE marketplace.service_orders
      SET status = 'CONFIRMED',
          status_label = $1,
          razorpay_payment_id = $2,
          sample_tracking_code = $3,
          deliverable_file = 'Processing at facility — manufacturing report and dispatch details will be updated.',
          courier_details = $4::jsonb,
          timeline_events = $5::jsonb,
          updated_at = NOW()
      WHERE (id::text = $6 OR order_number = $6 OR razorpay_order_id = $7)
        AND user_id = $8;
    `, statusLabel, razorpayPaymentId, trackingCode, JSON.stringify(initialCourier), JSON.stringify(completedTimeline), String(orderId), String(razorpayOrderId), String(userId));

    if (orderRecord.shipping_address) {
      await this.saveUserAddressMemory(userId, orderRecord.shipping_address);
    }

    // Trigger emails
    (async () => {
      try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, fullName: true } });
        if (user) {
          await emailService.sendServiceOrderConfirmationEmail({
            studentEmail: user.email,
            studentName: user.fullName,
            orderNumber: orderRecord.order_number,
            serviceTitle: orderRecord.service_title,
            vendorName: orderRecord.vendor_name,
            amount: orderRecord.amount,
            trackingCode,
            shippingAddress: orderRecord.shipping_address,
          });
        }
      } catch (mErr) {
        console.warn("[verifyRazorpayPayment] Email notification notice:", mErr.message);
      }
    })();

    const remainingBalance = await this.getUserBalance(userId);

    return {
      success: true,
      remainingBalance,
      orderNumber: orderRecord.order_number,
    };
  }

  /**
   * Get orders for the logged-in user
   */
  async getUserOrders(userId) {
    if (!userId) return [];

    const rows = await prisma.$queryRawUnsafe(`
      SELECT * FROM marketplace.service_orders
      WHERE user_id = $1
        AND status NOT IN ('PENDING_PAYMENT', 'PENDING', 'FAILED', 'PAYMENT_FAILED', 'CANCELLED')
      ORDER BY created_at DESC;
    `, String(userId));

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map((r) => this.formatOrderRow(r));
  }

  /**
   * Get live tracking for an order
   */
  async getOrderTracking(orderRef) {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT * FROM marketplace.service_orders
      WHERE id::text = $1 OR order_number = $1 OR sample_tracking_code = $1
      LIMIT 1;
    `, String(orderRef));

    if (!rows || rows.length === 0) {
      throw new AppError("Order tracking record not found", 404);
    }

    const r = rows[0];
    return {
      id: String(r.id),
      orderNumber: r.order_number,
      serviceTitle: r.service_title,
      vendorName: r.vendor_name,
      category: r.category,
      amount: Number(r.amount),
      quantity: Number(r.quantity || 1),
      status: r.status,
      statusLabel: r.status_label,
      trackingCode: r.sample_tracking_code,
      shippingAddress: r.shipping_address || null,
      dynamicIntakeResponses: r.dynamic_intake_responses || r.intake_data || {},
      courierDetails: r.courier_details || {
        currentStatus: r.status,
        statusLabel: r.status_label,
        courierName: "Standard Express Courier",
        trackingNumber: r.sample_tracking_code,
      },
      timelineEvents: Array.isArray(r.timeline_events) && r.timeline_events.length > 0
        ? r.timeline_events
        : [
            { step: "ORDER_PLACED", label: "Order Confirmed", completedAt: r.created_at },
            { step: "PRE_FLIGHT_CHECK", label: "Files & Geometry Check", completedAt: null },
            { step: "IN_PRODUCTION", label: "In Production / Fabrication", completedAt: null },
            { step: "DISPATCHED", label: "Dispatched with Courier", completedAt: null },
            { step: "DELIVERED", label: "Delivered", completedAt: r.status === 'COMPLETED' ? r.updated_at : null },
          ],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  /**
   * Update courier tracking details
   */
  async updateOrderCourier(orderId, { status, courierName, trackingNumber, trackingUrl, estimatedDelivery }) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM marketplace.service_orders WHERE id::text = $1 OR order_number = $1 LIMIT 1;`,
      String(orderId)
    );
    if (!rows || rows.length === 0) {
      throw new AppError("Order not found", 404);
    }
    const order = rows[0];
    const currentCourier = order.courier_details || {};
    const updatedCourier = {
      ...currentCourier,
      currentStatus: status || order.status,
      statusLabel: status === 'DISPATCHED' ? `Dispatched via ${courierName || 'Courier'}` : status === 'DELIVERED' ? 'Delivered to Customer' : 'In Production',
      courierName: courierName || currentCourier.courierName || 'Blue Dart Express',
      trackingNumber: trackingNumber || currentCourier.trackingNumber || order.sample_tracking_code,
      trackingUrl: trackingUrl || currentCourier.trackingUrl || '',
      dispatchedAt: status === 'DISPATCHED' ? new Date().toISOString() : currentCourier.dispatchedAt,
      estimatedDelivery: estimatedDelivery || currentCourier.estimatedDelivery || '2 - 3 Days',
    };

    const currentTimeline = Array.isArray(order.timeline_events) ? order.timeline_events : [];
    const updatedTimeline = currentTimeline.map(ev => {
      if (status === 'IN_PRODUCTION' && ev.step === 'IN_PRODUCTION') return { ...ev, completedAt: new Date().toISOString() };
      if (status === 'DISPATCHED' && ev.step === 'DISPATCHED') return { ...ev, completedAt: new Date().toISOString() };
      if (status === 'DELIVERED' && ev.step === 'DELIVERED') return { ...ev, completedAt: new Date().toISOString() };
      return ev;
    });

    const newStatus = status === 'DELIVERED' ? 'COMPLETED' : order.status;
    const newStatusLabel = status === 'DELIVERED' ? 'Delivered & Complete' : updatedCourier.statusLabel;

    await prisma.$executeRawUnsafe(`
      UPDATE marketplace.service_orders
      SET status = $1,
          status_label = $2,
          courier_details = $3::jsonb,
          timeline_events = $4::jsonb,
          updated_at = NOW()
      WHERE id = $5;
    `, newStatus, newStatusLabel, JSON.stringify(updatedCourier), JSON.stringify(updatedTimeline), order.id);

    return {
      success: true,
      courier: updatedCourier,
      timeline: updatedTimeline,
    };
  }

  /**
   * Mark deliverable completed directly
   */
  async acceptDeliverable(userId, orderId) {
    if (!userId) {
      throw new AppError("Authentication required.", 401);
    }

    const result = await prisma.$executeRawUnsafe(`
      UPDATE marketplace.service_orders
      SET status = 'COMPLETED',
          status_label = 'Completed & Delivered',
          updated_at = NOW()
      WHERE (id::text = $1 OR order_number = $1)
        AND user_id = $2;
    `, String(orderId), String(userId));

    if (result === 0) {
      throw new AppError("Order not found or unauthorized", 404);
    }

    return {
      success: true,
    };
  }

  /**
   * Fetch registered partner organizations & labs for admin selection
   */
  async getPartnerOrganizations() {
    try {
      const orgs = await prisma.organization.findMany({
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          orgType: true,
        },
        orderBy: { name: 'asc' },
      });
      return orgs;
    } catch (err) {
      console.error("[getPartnerOrganizations] Error:", err.message);
      return [];
    }
  }
}

const INITIAL_MOCK_SERVICES = [
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
    vendorName: "National Chemical Analytical Core",
    vendorAccreditation: "NABL & ISO 17025 Certified",
    vendorLocation: "Pune Science Park",
    vendorRating: 4.95,
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
    vendorName: "Centre for Nano Science & Imaging",
    vendorAccreditation: "DST & NABL Recognized",
    vendorLocation: "Bangalore Innovation Hub",
    vendorRating: 5.0,
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
    vendorName: "BioGen Analytical Testing Core",
    vendorAccreditation: "NABL & ISO 17025 Certified",
    vendorLocation: "Hyderabad Genome Valley",
    vendorRating: 4.95,
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
    vendorName: "DreamXec Research Cloud",
    vendorAccreditation: "SOC2 Type II & Tier-4 DC",
    vendorLocation: "Mumbai Cloud Datacenter",
    vendorRating: 4.98,
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
    vendorName: "Apex Hardware Prototyping Labs",
    vendorAccreditation: "IPC-A-610 Class 3 & ISO 9001",
    vendorLocation: "Hyderabad Electronics Hub",
    vendorRating: 4.88,
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
    vendorName: "Analytical Science Core Institute",
    vendorAccreditation: "NABL & GLP Certified",
    vendorLocation: "Ahmedabad Pharma Cluster",
    vendorRating: 4.9,
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
    vendorName: "BioChem Direct Procurement",
    vendorAccreditation: "ACS & ISO 9001 Certified",
    vendorLocation: "National Chemical Logistics Hub",
    vendorRating: 4.9,
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
    vendorName: "LexInnovate Academic IP Counsel",
    vendorAccreditation: "Patent Agent Bar Certified",
    vendorLocation: "New Delhi & Bangalore",
    vendorRating: 5.0,
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

module.exports = new ResearchServicesBackendService();
