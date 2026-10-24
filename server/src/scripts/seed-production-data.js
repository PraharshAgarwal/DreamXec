/**
 * Production-Ready Data Seeding Script
 * 
 * Seeds:
 * 1. Organizations & Purposeful Clubs (4 campus-affiliated under NITKKR + 4 open/independent)
 * 2. Tiered Workflows:
 *    - NITKKR Student ID Verification via Official Mail (@nitkkr.ac.in) -> Zero manual review
 *    - Low-friction Donor & Member workflows -> Instant activation
 *    - High-stakes roles (Org Admin, Corporate Admin, Gov Official, Student President, Researcher)
 *      with 3 lean stages routed directly to Site Admin (dx.admin@dreamxec.com)
 * 3. Domain-Aligned Genuine Campaigns:
 *    - Realistic targets (₹1,50,000 - ₹4,50,000)
 *    - Structured multi-tranche milestones
 *    - Active double-entry LedgerAccount for escrow tracking
 * 4. Cleanup of dead 0-stage templates and stale timestamped test artifacts.
 */

const prisma = require('../config/prisma');

async function seedProductionData() {
  console.log('===========================================================');
  console.log('🚀 STARTING PRODUCTION-READY DATA SEEDING');
  console.log('===========================================================');

  // --------------------------------------------------------------------------
  // STEP 0: FETCH CORE SYSTEM USERS
  // --------------------------------------------------------------------------
  console.log('\n[1/5] Resolving System Users for Ownership & Leads...');
  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true },
  });

  const findUserByEmail = (email) => users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  const dxAdmin = findUserByEmail('dx.admin@dreamxec.com') || users[0];
  const anshNitkkr = findUserByEmail('12212115@nitkkr.ac.in') || users[0];
  const anshGoel = findUserByEmail('anshgoel2580@gmail.com') || anshNitkkr;
  const jayKumar = findUserByEmail('jaynrk2002@gmail.com') || findUserByEmail('jaystrp2022@gmail.com') || users[0];
  const ashishTrivedi = findUserByEmail('ashish.5core@gmail.com') || users[0];
  const omMohanGaur = findUserByEmail('ommohangaur029@gmail.com') || users[0];
  const rajaRam = findUserByEmail('iamom515@gmail.com') || users[0];
  const niharika = findUserByEmail('niharika08anand@gmail.com') || users[0];

  console.log(`✓ Resolved users: Admin (${dxAdmin?.email}), Ansh (${anshNitkkr?.email}), Jay (${jayKumar?.email}), Ashish (${ashishTrivedi?.email}), etc.`);

  // --------------------------------------------------------------------------
  // STEP 1: ORGANIZATIONS & PURPOSEFUL CLUBS
  // --------------------------------------------------------------------------
  console.log('\n[2/5] Seeding Organizations & Purposeful Clubs...');

  // 1.1 NITKKR Organization
  let nitkkr = await prisma.organization.findFirst({
    where: {
      OR: [
        { id: '9c297f57-d379-4c80-bcc1-6e4fa389d286' },
        { slug: 'nit-kkr' },
      ],
    },
  });

  if (!nitkkr) {
    nitkkr = await prisma.organization.create({
      data: {
        id: '9c297f57-d379-4c80-bcc1-6e4fa389d286',
        name: 'NITKKR',
        slug: 'nit-kkr',
        orgType: 'COLLEGE',
        depth: 0,
        hierarchyPath: 'nit-kkr',
        lifecycleStatus: 'ACTIVE',
        allowedRoles: ['STUDENT', 'ORG_ADMIN', 'PROFESSOR', 'RESEARCHER', 'STUDENT_PRESIDENT'],
      },
    });
    console.log(`✓ Created primary institution: ${nitkkr.name} (${nitkkr.slug})`);
  } else {
    nitkkr = await prisma.organization.update({
      where: { id: nitkkr.id },
      data: {
        name: 'NITKKR',
        lifecycleStatus: 'ACTIVE',
        allowedRoles: ['STUDENT', 'ORG_ADMIN', 'PROFESSOR', 'RESEARCHER', 'STUDENT_PRESIDENT'],
      },
    });
    console.log(`✓ Updated primary institution: ${nitkkr.name} (${nitkkr.slug})`);
  }

  // 1.2 Corporate Funding Trust
  let fundingOrg = await prisma.organization.upsert({
    where: { slug: 'dreamx-funding-trust' },
    update: {
      name: 'DreamX Funding & Capital Trust',
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['DONOR', 'CORPORATE_ADMIN', 'MENTOR', 'ORG_ADMIN'],
    },
    create: {
      id: '7c6a393b-25f7-4898-b4b4-9149cf1b0d48',
      name: 'DreamX Funding & Capital Trust',
      slug: 'dreamx-funding-trust',
      orgType: 'CORPORATE',
      depth: 0,
      hierarchyPath: 'dreamx-funding-trust',
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['DONOR', 'CORPORATE_ADMIN', 'MENTOR', 'ORG_ADMIN'],
    },
  });
  console.log(`✓ Upserted Corporate Trust: ${fundingOrg.name}`);

  // 1.3 Government Research Authority
  let govOrg = await prisma.organization.upsert({
    where: { slug: 'national-gov-authority' },
    update: {
      name: 'National Innovation & Research Authority',
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['GOV_OFFICIAL', 'COMPLIANCE_OFFICER', 'RESEARCHER', 'ORG_ADMIN'],
    },
    create: {
      id: 'e0b7e091-a35c-424b-be42-f7b0902b32ca',
      name: 'National Innovation & Research Authority',
      slug: 'national-gov-authority',
      orgType: 'RESEARCH_INSTITUTION',
      depth: 0,
      hierarchyPath: 'national-gov-authority',
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['GOV_OFFICIAL', 'COMPLIANCE_OFFICER', 'RESEARCHER', 'ORG_ADMIN'],
    },
  });
  console.log(`✓ Upserted Gov Authority: ${govOrg.name}`);

  // 1.4 Purposeful Clubs
  const clubsToSeed = [
    // --- CAMPUS AFFILIATED UNDER NITKKR ---
    {
      name: 'NITKKR Robotics & Autonomous Systems Club',
      slug: 'nitkkr-robotics-club',
      orgType: 'CLUB',
      parentId: nitkkr.id,
      depth: 1,
      hierarchyPath: `${nitkkr.slug}.nitkkr-robotics-club`,
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'],
      metadata: {
        motto: '"Engineering next-gen autonomous field rovers for Indian precision agriculture 🌾"',
        tagline: 'Autonomous Field Robotics, ROS2 Navigation & Edge-AI Perception Chapter',
        category: 'Field Robotics & Autonomy',
        labLocation: 'Robotics & Mechatronics Innovation Lab, Block B, NITKKR',
        meetingSchedule: 'Wednesdays & Saturdays, 5:30 PM IST',
        facultyAdvisor: {
          name: 'Dr. P. K. Sharma',
          designation: 'Professor & Head of Mechatronics',
          department: 'Dept. of Mechanical & Robotics, NITKKR',
        },
        technicalStacks: [
          { name: 'ROS2 Humble & Gazebo', description: 'Real-time robot kinematics simulation and autonomous path planning.', tag: 'Framework' },
          { name: 'Nvidia Jetson Orin Nano', description: 'On-device edge AI inferencing for sub-second weed and crop classification.', tag: 'Edge Compute' },
          { name: 'RTK-GPS & Stereoscopic Vision', description: 'Centimeter-level geofencing and depth perception in rugged terrain.', tag: 'Perception' },
          { name: 'Brushless 4WD & Custom BMS', description: 'All-terrain high-torque traction with regenerative LiFePO4 battery management.', tag: 'Mobility' },
        ],
        facilities: [
          'Industrial 5-Axis CNC Milling Center (Central Workshop Block)',
          'Prusa MK4 3D Prototyping Cluster (4 Units)',
          'Stereoscopic Vision & LiDAR Calibration Rig',
          'Solar DC Charging & Micro-Grid Station',
        ],
      },
    },
    {
      name: 'NITKKR Quantum Computing & AI Guild',
      slug: 'nitkkr-quantum-ai-guild',
      orgType: 'CLUB',
      parentId: nitkkr.id,
      depth: 1,
      hierarchyPath: `${nitkkr.slug}.nitkkr-quantum-ai-guild`,
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'],
      metadata: {
        motto: '"Simulating quantum circuits & accelerating student-led AI compilers ⚛️"',
        tagline: 'Open Quantum Computation, Qiskit Circuit Design & Deep Learning Guild',
        category: 'Quantum Computing & AI',
        labLocation: 'High Performance Computing Center (HPCC), Central Library 3rd Floor, NITKKR',
        meetingSchedule: 'Tuesdays & Fridays, 6:00 PM IST',
        facultyAdvisor: {
          name: 'Dr. Rajesh Verma',
          designation: 'Associate Professor',
          department: 'Dept. of Computer Engineering, NITKKR',
        },
        technicalStacks: [
          { name: 'Qiskit & PennyLane', description: 'Quantum circuit construction, statevector simulators, and VQE algorithms.', tag: 'Quantum SDK' },
          { name: 'PyTorch & TensorRT', description: 'Model compression, 8-bit quantization, and low-latency inference compilation.', tag: 'AI Engine' },
          { name: 'CUDA Quantum Kernels', description: 'Accelerated hybrid classical-quantum simulations on cluster GPUs.', tag: 'Compute' },
        ],
        facilities: [
          'Access to NITKKR HPC GPU Cluster (Nvidia A100 Nodes)',
          'IBM Quantum Cloud Educational Simulator Workstations',
          'Quantum Algorithm Code Review Sandbox',
        ],
      },
    },
    {
      name: 'NITKKR Clean Mobility & EV Powertrain Club',
      slug: 'nitkkr-clean-mobility-ev',
      orgType: 'CLUB',
      parentId: nitkkr.id,
      depth: 1,
      hierarchyPath: `${nitkkr.slug}.nitkkr-clean-mobility-ev`,
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'],
      metadata: {
        motto: '"Pioneering modular regenerative EV powertrains & telemetry for racing ⚡"',
        tagline: 'Electric Racing, Regenerative Powertrains & Formula Student Chapter',
        category: 'Clean Mobility & EV',
        labLocation: 'Automotive Innovation Center, Central Workshop Wing C, NITKKR',
        meetingSchedule: 'Mondays, Thursdays & Weekends',
        facultyAdvisor: {
          name: 'Dr. Surender Singh',
          designation: 'Faculty Advisor, SAE Collegiate Club',
          department: 'Dept. of Mechanical Engineering, NITKKR',
        },
        technicalStacks: [
          { name: 'Custom Modular BMS', description: 'Active cell-balancing, thermal cutoff telemetry, and CAN-bus reporting.', tag: 'Battery Electronics' },
          { name: 'Permanent Magnet Motors', description: 'High-torque liquid-cooled EV motor with field-oriented control (FOC).', tag: 'Drivetrain' },
          { name: 'Telemetry Over LoRa & 4G', description: 'Live track telemetry streaming voltage, throttle, and RPM to pit wall.', tag: 'Telemetry' },
        ],
        facilities: [
          'Chassis Jig & TIG/MIG Welding Bays',
          'Dynamometer & Motor Test Bench (up to 25kW)',
          'High-Voltage Battery Enclosure Assembly Room',
        ],
      },
    },
    {
      name: 'NITKKR Assistive Bioengineering Chapter',
      slug: 'nitkkr-assistive-bioeng',
      orgType: 'CLUB',
      parentId: nitkkr.id,
      depth: 1,
      hierarchyPath: `${nitkkr.slug}.nitkkr-assistive-bioeng`,
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'],
      metadata: {
        motto: '"Building sub-₹15,000 myoelectric bionic limbs for rural amputees 🦾"',
        tagline: 'Affordable Prosthetics, EMG Signal Processing & Assistive Robotics Chapter',
        category: 'Biomedical & Assistive Robotics',
        labLocation: 'Assistive Bioengineering Laboratory, Department of Electronics, NITKKR',
        meetingSchedule: 'Wednesdays & Saturdays, 4:00 PM IST',
        facultyAdvisor: {
          name: 'Dr. Amit Kumar Gupta',
          designation: 'Professor of Bio-Instrumentation',
          department: 'Dept. of Electronics & Communication, NITKKR',
        },
        technicalStacks: [
          { name: 'Surface EMG Signal Filtering', description: 'Differential analog front-end with Butterworth active filtering for muscle intent.', tag: 'Biosensing' },
          { name: 'Micro-Actuation & Tendons', description: 'High-reduction metal-gear micro servos with nylon tendon flexure joints.', tag: 'Biomechanics' },
          { name: 'Lightweight SLA/PLA Sockets', description: 'Patient-custom 3D-scanned modular prosthetic sockets.', tag: 'Additives' },
        ],
        facilities: [
          'Multi-Channel Bio-Potential Acquisition Systems',
          'Formlabs SLA Resin 3D Printers for Biocompatible Interfaces',
          'Grip Strength Dynamometer & Force Testing Station',
        ],
      },
    },

    // --- OPEN & INDEPENDENT COLLECTIVES (parentId = null) ---
    {
      name: 'All-India Open Aerospace & Rocketry Collective',
      slug: 'open-aerospace-rocketry',
      orgType: 'CLUB',
      parentId: null,
      depth: 0,
      hierarchyPath: 'open-aerospace-rocketry',
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'],
      metadata: {
        motto: '"Developing suborbital hybrid motors and open CanSat atmospheric deployers 🚀"',
        tagline: 'Decentralized Student Aerospace, Propulsion R&D & CanSat Initiative',
        category: 'Aerospace & Propulsion',
        labLocation: 'Open Propulsion Test Field & Virtual Avionics Guild',
        meetingSchedule: 'Bi-weekly Sunday Virtual All-Hands + Field Launches',
        facultyAdvisor: {
          name: 'Dr. K. S. Ramanathan',
          designation: 'Advisor, Open Aerospace Foundation',
          department: 'Aero-Propulsion Collective',
        },
        technicalStacks: [
          { name: 'N2O / HTPB Hybrid Motors', description: 'Nitrous oxide liquid oxidizer with solid paraffin/HTPB grain fuel.', tag: 'Propulsion' },
          { name: 'Barometric & IMU Flight Computer', description: 'Redundant pyrotechnic ejection controllers for dual-stage parachutes.', tag: 'Avionics' },
          { name: 'CanSat Telemetry Payloads', description: 'Atmospheric pressure, VOC gas sensors, and UHF packet radio downlinks.', tag: 'Payloads' },
        ],
        facilities: [
          'Static Test Stand with 5000N Load Cell & Blast Bunkering',
          'High-Pressure Pneumatic Filling System',
          'Wind Tunnel Aerodynamic Characterization Bench',
        ],
      },
    },
    {
      name: 'Indie Biotech & CleanTech Innovation Lab',
      slug: 'indie-biotech-cleantech',
      orgType: 'CLUB',
      parentId: null,
      depth: 0,
      hierarchyPath: 'indie-biotech-cleantech',
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'],
      metadata: {
        motto: '"Converting agricultural crop waste into home-compostable barrier films 🌿"',
        tagline: 'Circular Biomaterials, Agricultural Residue Valorization & CleanTech Lab',
        category: 'Biotech & Circular Materials',
        labLocation: 'Open Bio-Innovation Shed & Virtual Material Collective',
        meetingSchedule: 'Tuesdays & Saturdays, 7:00 PM IST',
        facultyAdvisor: {
          name: 'Dr. Sunita Deshmukh',
          designation: 'Principal Researcher',
          department: 'Bioprocess Engineering Alliance',
        },
        technicalStacks: [
          { name: 'Cellulose Extraction & Nanofibrils', description: 'Eco-friendly enzymatic breakdown of paddy straw into nanoscale cellulose.', tag: 'Bioprocessing' },
          { name: 'Hot-Press Film Extrusion', description: 'Plasticizer compounding for water-resistant home-compostable food packaging.', tag: 'Materials' },
        ],
        facilities: [
          'Heated Hydraulic Platen Press (25 Ton)',
          'Tensile Strength Testing Machine',
          'Controlled Soil Burial Degradation Chambers',
        ],
      },
    },
    {
      name: 'Open Climate Tech & Atmospheric Grid',
      slug: 'open-climate-atmospheric-grid',
      orgType: 'CLUB',
      parentId: null,
      depth: 0,
      hierarchyPath: 'open-climate-atmospheric-grid',
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'],
      metadata: {
        motto: '"Deploying real-time LoRaWAN water & microclimate sensing grids across Indian rivers 🌊"',
        tagline: 'Environmental IoT, Open Atmospheric Sensing & Solar Telemetry Grid',
        category: 'Climate Tech & IoT',
        labLocation: 'Decentralized Microclimate Telemetry Grid',
        meetingSchedule: 'Every Thursday, 6:30 PM IST',
        facultyAdvisor: {
          name: 'Dr. Arvind Mehra',
          designation: 'Advisor, Open Water Consortium',
          department: 'Environmental Telemetry',
        },
        technicalStacks: [
          { name: 'LoRaWAN Long-Range Transceivers', description: 'Solar-powered buoys broadcasting turbidity, pH, and dissolved oxygen over 15km.', tag: 'IoT Mesh' },
          { name: 'Open River Telemetry Dashboard', description: 'Real-time public timeseries visualization with anomaly detection.', tag: 'Telemetry' },
        ],
        facilities: [
          'Submersible Sonde Water Sensor Calibration Station',
          'Solar MPPT Environmental Enclosure Testing Rigs',
        ],
      },
    },
    {
      name: 'Decentralized AI & Open Robotics Alliance',
      slug: 'decentralized-ai-edge-robotics',
      orgType: 'CLUB',
      parentId: null,
      depth: 0,
      hierarchyPath: 'decentralized-ai-edge-robotics',
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'],
      metadata: {
        motto: '"Democratizing on-device TinyML inferencing & multi-agent ROS2 swarm coordination 🤖"',
        tagline: 'Open Robotics Alliance, Multi-Agent Swarms & TinyML Edge Compute',
        category: 'AI & Open Robotics',
        labLocation: 'Open Robotics Foundry & Distributed ROS2 Mesh',
        meetingSchedule: 'Fridays & Sundays, 8:00 PM IST',
        facultyAdvisor: {
          name: 'Prof. Devendra Joshi',
          designation: 'Director, Open Robotics Network',
          department: 'Edge AI Systems',
        },
        technicalStacks: [
          { name: 'ROS2 Zenoh & Micro-ROS', description: 'Ultra-low overhead multi-robot discovery and swarm consensus over WiFi mesh.', tag: 'Swarm Robotics' },
          { name: 'TinyML on STM32 / ESP32-S3', description: 'Running int8 vision and acoustic anomaly models under 250mW power.', tag: 'Edge Compute' },
        ],
        facilities: [
          'Multi-Rover Vicon OptiTrack Ground Test Arena',
          'Embedded Logic Analyzer & Power Profiling Workbenches',
        ],
      },
    },
  ];

  const seededClubsMap = {};
  for (const c of clubsToSeed) {
    const existing = await prisma.organization.findUnique({ where: { slug: c.slug } });
    let clubRecord;
    if (!existing) {
      clubRecord = await prisma.organization.create({ data: c });
      console.log(`  + Created Club: "${clubRecord.name}" [${clubRecord.parentId ? 'Campus: NITKKR' : 'Open / Independent'}]`);
    } else {
      clubRecord = await prisma.organization.update({
        where: { id: existing.id },
        data: {
          name: c.name,
          parentId: c.parentId,
          depth: c.depth,
          hierarchyPath: c.hierarchyPath,
          lifecycleStatus: 'ACTIVE',
          allowedRoles: c.allowedRoles,
          metadata: c.metadata || {},
        },
      });
      console.log(`  • Updated Club: "${clubRecord.name}" [${clubRecord.parentId ? 'Campus: NITKKR' : 'Open / Independent'}]`);
    }
    seededClubsMap[c.slug] = clubRecord;
  }

  // 1.5 Seed Active Memberships with Leadership for Clubs
  console.log('\n  • Seeding Active Club Memberships & Core Leads...');
  const clubMemberships = [
    { clubSlug: 'nitkkr-robotics-club', user: anshNitkkr, role: 'STUDENT_PRESIDENT', designation: 'President & Rover Systems Lead', department: 'Dept. of Mechanical & Robotics, NITKKR' },
    { clubSlug: 'nitkkr-robotics-club', user: jayKumar, role: 'RESEARCHER', designation: 'Autonomous Navigation Lead', department: 'Dept. of Computer Engg, NITKKR' },
    { clubSlug: 'nitkkr-robotics-club', user: ashishTrivedi, role: 'STUDENT', designation: 'Embedded Firmware Contributor', department: 'Dept. of Electrical Engg, NITKKR' },

    { clubSlug: 'nitkkr-quantum-ai-guild', user: jayKumar, role: 'STUDENT_PRESIDENT', designation: 'Lead Quantum Researcher', department: 'Dept. of Computer Engg, NITKKR' },
    { clubSlug: 'nitkkr-quantum-ai-guild', user: omMohanGaur, role: 'RESEARCHER', designation: 'Quantum Compiler Developer', department: 'Mathematics & Computing, NITKKR' },

    { clubSlug: 'nitkkr-clean-mobility-ev', user: anshNitkkr, role: 'STUDENT_PRESIDENT', designation: 'Powertrain & Chassis Lead', department: 'Dept. of Mechanical Engg, NITKKR' },
    { clubSlug: 'nitkkr-clean-mobility-ev', user: rajaRam, role: 'RESEARCHER', designation: 'BMS & Telemetry Engineer', department: 'Dept. of Electrical Engg, NITKKR' },

    { clubSlug: 'nitkkr-assistive-bioeng', user: niharika, role: 'STUDENT_PRESIDENT', designation: 'Bionic Prosthetics Lead', department: 'Assistive Tech Lab, NITKKR' },
    { clubSlug: 'nitkkr-assistive-bioeng', user: ashishTrivedi, role: 'RESEARCHER', designation: 'EMG Signal Processing Lead', department: 'Dept. of Electronics, NITKKR' },

    { clubSlug: 'open-aerospace-rocketry', user: anshGoel, role: 'STUDENT_PRESIDENT', designation: 'Hybrid Propulsion Lead', department: 'Aerospace Propulsion Group' },
    { clubSlug: 'open-aerospace-rocketry', user: jayKumar, role: 'RESEARCHER', designation: 'Avionics & Telemetry Engineer', department: 'Flight Software Group' },

    { clubSlug: 'indie-biotech-cleantech', user: niharika, role: 'STUDENT_PRESIDENT', designation: 'Biomaterials Lab Lead', department: 'Circular Biomaterials Lab' },
    { clubSlug: 'open-climate-atmospheric-grid', user: omMohanGaur, role: 'STUDENT_PRESIDENT', designation: 'Telemetry Architect', department: 'Microclimate Sensing Grid' },
    { clubSlug: 'decentralized-ai-edge-robotics', user: jayKumar, role: 'STUDENT_PRESIDENT', designation: 'Swarm & Edge Robotics Lead', department: 'Decentralized Robotics Alliance' },
  ];

  for (const cm of clubMemberships) {
    const club = seededClubsMap[cm.clubSlug];
    if (club && cm.user?.id) {
      const existing = await prisma.membership.findFirst({
        where: { organizationId: club.id, userId: cm.user.id },
      });
      if (!existing) {
        await prisma.membership.create({
          data: {
            organizationId: club.id,
            userId: cm.user.id,
            role: cm.role,
            designation: cm.designation,
            department: cm.department,
            status: 'ACTIVE',
            joinedAt: new Date(Date.now() - 30 * 86400000),
          },
        });
      } else {
        await prisma.membership.update({
          where: { id: existing.id },
          data: {
            role: cm.role,
            designation: cm.designation,
            department: cm.department,
            status: 'ACTIVE',
          },
        });
      }
    }
  }
  console.log(`  ✓ Seeded active members and leaders across all 8 clubs.`);

  // --------------------------------------------------------------------------
  // STEP 2: WORKFLOW TEMPLATES CLEANUP & SEEDING (TIERED VERIFICATION)
  // --------------------------------------------------------------------------
  console.log('\n[3/5] Seeding Tiered Production Workflows & Pruning Clutter...');

  // 2.1 Prune dead 0-stage templates with 0 instances
  const deadTemplates = await prisma.workflowTemplate.findMany({
    where: {
      stages: { none: {} },
      instances: { none: {} },
    },
  });
  for (const dt of deadTemplates) {
    await prisma.workflowTemplate.delete({ where: { id: dt.id } });
    console.log(`  x Pruned 0-stage dead template: "${dt.slug}"`);
  }

  // 2.2 Archive stale dynamic test templates with timestamped slugs
  await prisma.workflowTemplate.updateMany({
    where: {
      slug: { contains: '-1788' },
    },
    data: { status: 'ARCHIVED' },
  });

  // 2.2 Define Canonical Tiered Workflows
  const workflowsToSeed = [
    // -------------------------------------------------------------
    // TIER 1: AUTOMATED VALIDATION (ZERO MANUAL REVIEW)
    // -------------------------------------------------------------
    // A. NITKKR Student ID Verification via Official Mail (@nitkkr.ac.in)
    {
      tenantId: nitkkr.id,
      name: 'NITKKR Student Verification & Onboarding',
      slug: 'nit-kkr-student-workflow',
      description: 'Instant student verification via academic ID credentials and official @nitkkr.ac.in email OTP validation.',
      stages: [
        {
          name: 'Academic Student Details',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'rollNumber', label: 'University Roll Number / Student ID', required: true, type: 'text' },
              { id: 'degreeProgram', label: 'Degree Program', required: true, type: 'select', options: ['B.Tech', 'M.Tech', 'MCA', 'Ph.D.'] },
              { id: 'department', label: 'Academic Department', required: true, type: 'select', options: ['Computer Engineering', 'Information Technology', 'Electronics & Comm.', 'Electrical', 'Mechanical', 'Civil'] },
              { id: 'graduationYear', label: 'Expected Graduation Year', required: true, type: 'number' },
            ],
          },
        },
        {
          name: 'Institutional Email OTP Verification',
          stageType: 'EMAIL_VERIFICATION',
          executionOrder: 2,
          config: {
            requiredDomain: 'nitkkr.ac.in',
            emailField: 'studentEmail',
            instructions: 'Enter your official @nitkkr.ac.in email address. We will verify your student credentials via OTP.',
          },
        },
      ],
    },

    // B. DreamX Donor Instant Onboarding (Zero manual review)
    {
      tenantId: fundingOrg.id,
      name: 'DreamX Funding & Capital Trust - Donor Onboarding',
      slug: 'dreamx-funding-trust-donor-workflow',
      description: 'Streamlined donor registration and tax identification for direct project backing.',
      stages: [
        {
          name: 'Donor Profile & Giving Intent',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'donorType', label: 'Donor Category', required: true, type: 'select', options: ['Individual Supporter', 'Alumni Benefactor', 'Corporate CSR Foundation', 'Institutional Grantor'] },
              { id: 'taxId', label: 'PAN / Tax Identification Number', required: true, type: 'text' },
              { id: 'primaryFocus', label: 'Primary Funding Area of Interest', required: false, type: 'select', options: ['Clean Energy & Climate Tech', 'Robotics & Hardware Automation', 'Biomedical & Assistive Tech', 'Open Source Software'] },
            ],
          },
        },
      ],
    },

    // C. Open Community / Club Member (Zero manual review)
    {
      tenantId: nitkkr.id,
      name: 'Open Community & Club Member Onboarding',
      slug: 'open-community-member-workflow',
      description: 'Instant registration for collegiate and open collective club participants.',
      stages: [
        {
          name: 'Member Profile & Skills',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'interests', label: 'Technical Domain & Interests', required: true, type: 'text' },
              { id: 'githubUrl', label: 'GitHub / Portfolio URL', required: false, type: 'url' },
            ],
          },
        },
      ],
    },

    // -------------------------------------------------------------
    // TIER 2: HIGH-STAKES ROLES (FORM -> DOCUMENT -> SITE ADMIN MANUAL REVIEW)
    // -------------------------------------------------------------
    // D. NITKKR College Administrator
    {
      tenantId: nitkkr.id,
      name: 'NITKKR College Administrator Onboarding',
      slug: 'nit-kkr-org-admin-workflow',
      description: 'Institutional administrator authorization for campus tenant governance.',
      stages: [
        {
          name: 'Administrator Credentials',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'adminDesignation', label: 'Administrative Title / Office', required: true, type: 'text' },
              { id: 'officialPhone', label: 'Institutional Contact Number', required: true, type: 'text' },
            ],
          },
        },
        {
          name: 'Institutional Appointment Proof',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 2,
          config: {
            requiredDocuments: [
              { id: 'appointmentLetter', name: 'Dean / Registrar Authorization Order', required: true },
            ],
          },
        },
        {
          name: 'Site Admin Verification',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 3,
          config: {
            reviewRequired: true,
            assignedTo: 'SITE_ADMIN',
            reviewRole: 'DX_PLATFORM_ADMIN',
            reviewerEmail: 'dx.admin@dreamxec.com',
            instructions: 'DX Site Admin verification of institutional dean/admin credentials.',
          },
        },
      ],
    },

    // E. NITKKR Student Club President
    {
      tenantId: nitkkr.id,
      name: 'NITKKR Student Club President Authorization',
      slug: 'nit-kkr-student-president-workflow',
      description: 'Authorization for student club leaders to create verified campaigns and manage milestone disbursements.',
      stages: [
        {
          name: 'Club Leadership Mandate',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'clubName', label: 'Club / Chapter Name', required: true, type: 'text' },
              { id: 'facultyMentorName', label: 'Faculty Advisor Full Name', required: true, type: 'text' },
              { id: 'facultyMentorEmail', label: 'Faculty Advisor Official Email', required: true, type: 'email' },
            ],
          },
        },
        {
          name: 'Faculty Sponsorship Letter',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 2,
          config: {
            requiredDocuments: [
              { id: 'sponsorshipLetter', name: 'Signed Faculty Advisor Sponsorship & Recommendation Letter', required: true },
            ],
          },
        },
        {
          name: 'Site Admin Verification',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 3,
          config: {
            reviewRequired: true,
            assignedTo: 'SITE_ADMIN',
            reviewRole: 'DX_PLATFORM_ADMIN',
            reviewerEmail: 'dx.admin@dreamxec.com',
            instructions: 'DX Site Admin verification of faculty sponsorship and student leadership credentials.',
          },
        },
      ],
    },

    // F. NITKKR Research Scholar / PI
    {
      tenantId: nitkkr.id,
      name: 'NITKKR Faculty & Research Scholar Onboarding',
      slug: 'nit-kkr-researcher-workflow',
      description: 'Accreditation for faculty members and research scholars to submit institutional research grants.',
      stages: [
        {
          name: 'Academic Rank & Specialization',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'academicRank', label: 'Academic Designation (Professor / Postdoc / Scholar)', required: true, type: 'text' },
              { id: 'orcidId', label: 'ORCID iD / Google Scholar Link', required: false, type: 'text' },
            ],
          },
        },
        {
          name: 'Faculty Credential Proof',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 2,
          config: {
            requiredDocuments: [
              { id: 'facultyId', name: 'Institutional Faculty ID / Appointment Document', required: true },
            ],
          },
        },
        {
          name: 'Site Admin Verification',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 3,
          config: {
            reviewRequired: true,
            assignedTo: 'SITE_ADMIN',
            reviewRole: 'DX_PLATFORM_ADMIN',
            reviewerEmail: 'dx.admin@dreamxec.com',
            instructions: 'DX Site Admin review of faculty accreditation and scholarly background.',
          },
        },
      ],
    },

    // G. Corporate Trust Administrator
    {
      tenantId: fundingOrg.id,
      name: 'DreamX Funding & Capital Trust - Corporate Executive Onboarding',
      slug: 'dreamx-funding-trust-corporate-admin-workflow',
      description: 'Corporate executive verification for capital trust management.',
      stages: [
        {
          name: 'Corporate Executive Details',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'designation', label: 'Executive Title', required: true, type: 'text' },
              { id: 'department', label: 'Corporate CSR / Foundation Division', required: true, type: 'text' },
            ],
          },
        },
        {
          name: 'Corporate Authorization Document',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 2,
          config: {
            requiredDocuments: [
              { id: 'boardLetter', name: 'Board Authorization Letter or Corporate ID Card', required: true },
            ],
          },
        },
        {
          name: 'Site Admin Verification',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 3,
          config: {
            reviewRequired: true,
            assignedTo: 'SITE_ADMIN',
            reviewRole: 'DX_PLATFORM_ADMIN',
            reviewerEmail: 'dx.admin@dreamxec.com',
            instructions: 'DX Site Admin verification of corporate executive mandate.',
          },
        },
      ],
    },

    // H. Government Authority Official
    {
      tenantId: govOrg.id,
      name: 'National Innovation & Research Authority - Government Official Onboarding',
      slug: 'national-gov-authority-gov-official-workflow',
      description: 'Official credential verification for gazetted officers and ministry representatives.',
      stages: [
        {
          name: 'Government Official Credentials',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'ministry', label: 'Ministry / Nodal Agency', required: true, type: 'text' },
              { id: 'designation', label: 'Official Designation', required: true, type: 'text' },
            ],
          },
        },
        {
          name: 'Official Agency ID Proof',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 2,
          config: {
            requiredDocuments: [
              { id: 'govId', name: 'Gazetted Officer Identification / Ministry Badge', required: true },
            ],
          },
        },
        {
          name: 'Site Admin Verification',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 3,
          config: {
            reviewRequired: true,
            assignedTo: 'SITE_ADMIN',
            reviewRole: 'DX_PLATFORM_ADMIN',
            reviewerEmail: 'dx.admin@dreamxec.com',
            instructions: 'DX Site Admin verification of government authority representation.',
          },
        },
      ],
    },

    // I. Government Compliance Officer
    {
      tenantId: govOrg.id,
      name: 'National Innovation & Research Authority - Compliance Officer Onboarding',
      slug: 'national-gov-authority-compliance-officer-workflow',
      description: 'Regulatory auditor and compliance ethics verification.',
      stages: [
        {
          name: 'Regulatory Specialization',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'specialization', label: 'Regulatory Compliance Specialization', required: true, type: 'text' },
              { id: 'barNumber', label: 'Bar Registration / Auditor License Number', required: true, type: 'text' },
            ],
          },
        },
        {
          name: 'Auditor Credentials',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 2,
          config: {
            requiredDocuments: [
              { id: 'auditorCert', name: 'Professional Auditor / Legal Bar Certificate', required: true },
            ],
          },
        },
        {
          name: 'Site Admin Verification',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 3,
          config: {
            reviewRequired: true,
            assignedTo: 'SITE_ADMIN',
            reviewRole: 'DX_PLATFORM_ADMIN',
            reviewerEmail: 'dx.admin@dreamxec.com',
            instructions: 'DX Site Admin review of legal and compliance qualifications.',
          },
        },
      ],
    },

    // J. Government Research Grant Scholar
    {
      tenantId: govOrg.id,
      name: 'National Innovation & Research Authority - National Research Scholar Onboarding',
      slug: 'national-gov-authority-researcher-workflow',
      description: 'Grant scholar accreditation for national R&D projects.',
      stages: [
        {
          name: 'Research Grant Details',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'researchArea', label: 'National R&D Thrust Area', required: true, type: 'text' },
              { id: 'affilInstitution', label: 'Affiliated Academic / Research Institute', required: true, type: 'text' },
            ],
          },
        },
        {
          name: 'Institutional Endorsement',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 2,
          config: {
            requiredDocuments: [
              { id: 'instEndorsement', name: 'Institutional Research Endorsement Letter', required: true },
            ],
          },
        },
        {
          name: 'Site Admin Verification',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 3,
          config: {
            reviewRequired: true,
            assignedTo: 'SITE_ADMIN',
            reviewRole: 'DX_PLATFORM_ADMIN',
            reviewerEmail: 'dx.admin@dreamxec.com',
            instructions: 'DX Site Admin review of research scholar project proposal.',
          },
        },
      ],
    },
  ];

  for (const wf of workflowsToSeed) {
    let tpl = await prisma.workflowTemplate.findFirst({
      where: {
        tenantId: wf.tenantId,
        slug: wf.slug,
      },
      include: { stages: true },
    });

    if (!tpl) {
      tpl = await prisma.workflowTemplate.create({
        data: {
          tenantId: wf.tenantId,
          name: wf.name,
          slug: wf.slug,
          description: wf.description,
          status: 'PUBLISHED',
          stages: {
            create: wf.stages.map((st) => ({
              name: st.name,
              stageType: st.stageType,
              executionOrder: st.executionOrder,
              config: st.config,
            })),
          },
        },
        include: { stages: true },
      });
      console.log(`  + Created Workflow: "${tpl.name}" (${tpl.stages.length} lean stages)`);
    } else {
      // Re-sync stages in place to preserve foreign key references
      for (const st of wf.stages) {
        const existingStage = tpl.stages.find((s) => s.executionOrder === st.executionOrder);
        if (existingStage) {
          await prisma.workflowStage.update({
            where: { id: existingStage.id },
            data: {
              name: st.name,
              stageType: st.stageType,
              config: st.config,
            },
          });
        } else {
          await prisma.workflowStage.create({
            data: {
              templateId: tpl.id,
              name: st.name,
              stageType: st.stageType,
              executionOrder: st.executionOrder,
              config: st.config,
            },
          });
        }
      }

      // Clean up extra surplus stages if they have no submissions
      const surplusStages = tpl.stages.filter((s) => s.executionOrder > wf.stages.length);
      for (const ss of surplusStages) {
        const submissionCount = await prisma.stageSubmission.count({ where: { workflowStageId: ss.id } });
        if (submissionCount === 0) {
          await prisma.workflowStage.delete({ where: { id: ss.id } }).catch(() => {});
        }
      }

      tpl = await prisma.workflowTemplate.update({
        where: { id: tpl.id },
        data: {
          name: wf.name,
          description: wf.description,
          status: 'PUBLISHED',
        },
        include: { stages: { orderBy: { executionOrder: 'asc' } } },
      });
      console.log(`  • Synchronized Workflow: "${tpl.name}" (${tpl.stages.length} lean stages)`);
    }
  }

  // --------------------------------------------------------------------------
  // STEP 3: DOMAIN-ALIGNED PRODUCTION CAMPAIGNS & MILESTONES
  // --------------------------------------------------------------------------
  console.log('\n[4/5] Seeding Domain-Aligned Genuine Campaigns & Milestones...');

  const campaignsToSeed = [
    // 1. NITKKR Robotics Club
    {
      title: 'KrishiBot: Autonomous Multipurpose Field Rover for Smallholder Farmers',
      slug: 'krishibot-autonomous-field-rover',
      tenantId: seededClubsMap['nitkkr-robotics-club']?.id || nitkkr.id,
      studentUserId: anshNitkkr.id,
      category: 'STARTUP_INNOVATION',
      campaignType: 'TEAM',
      stage: 'PROTOTYPE',
      shortDescription: 'Solar-assisted, GPS-guided autonomous agricultural rover equipped with multispectral weed detection and targeted micro-spraying to reduce chemical herbicide usage by 85%.',
      description: `### Empowering Sustainable Agriculture with Open Robotics
Agricultural runoff and excessive chemical spraying in Haryana and Punjab have led to severe soil degradation, groundwater toxicity, and rising input costs for smallholder farmers.

**KrishiBot** is an open-source, solar-assisted 4WD autonomous agricultural rover built by students at **NITKKR Robotics & Autonomous Systems Club**. Utilizing low-cost RTK-GPS centimeter-accurate positioning and an onboard Nvidia Jetson Orin Nano, KrishiBot identifies invasive weeds in real time using edge computer vision and applies precise micro-doses of organic bio-herbicide directly to weed foliage, saving up to 85% of chemical costs.

#### Key Engineering Deliverables:
- **Chassis & Mobility**: Sealed IP66 tubular aluminum chassis with independent high-torque brushless hub motors.
- **Perception System**: Stereoscopic depth camera + high-resolution RGB sensor running TensorRT-optimized YOLOv8 model at 30 FPS.
- **Power Subsystem**: 48V 30Ah LiFePO4 battery pack with 120W auxiliary bifacial solar canopy for extended 8-hour field runtime.
- **Smart Actuation**: 3-axis delta arm micro-nozzle capable of sub-second targeted spraying.`,
      coverImageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
      galleryImageUrls: [
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=800&q=80',
      ],
      targetAmount: 250000.0,
      currentRaisedAmount: 135000.0,
      minDonationAmount: 100.0,
      donorCount: 28,
      status: 'LIVE',
      beneficiaryDetails: {
        recipientType: 'ORGANIZATION',
        accountHolderName: 'NITKKR Robotics Club Innovation Fund',
        bankAccountNumber: '91802001928374',
        ifscCode: 'SBIN0006261',
        upiId: 'nitkkr.robotics@sbi',
      },
      teamMembers: [
        { name: 'Ansh', role: 'Project Lead & Robotics Engineer', email: anshNitkkr.email },
        { name: 'Ashish Trivedi', role: 'Embedded Systems & AI Specialist', email: ashishTrivedi.email },
      ],
      faqs: [
        { question: 'Is KrishiBot open source?', answer: 'Yes! All CAD files, ROS2 control packages, and weed classification models will be released openly on GitHub under MIT/CERN OHL licenses.' },
        { question: 'How are funds managed?', answer: 'All donations flow through the DreamX double-entry escrow ledger and are released only upon faculty and platform milestone proof verification.' },
      ],
      milestones: [
        {
          sequenceOrder: 1,
          title: 'Chassis Fabrication, Powertrain & RTK-GPS Navigation',
          description: 'Assembly of the IP66 weatherproof chassis, brushless hub motor integration, motor driver calibration, and dual-antenna RTK-GPS centimeter navigation testing.',
          durationDays: 30,
          targetAmount: 90000.0,
          releasedAmount: 90000.0,
          utilizedAmount: 88500.0,
          status: 'COMPLETED',
          acceptanceCriteria: ['CAD blueprints published', 'Chassis dynamic load test video verified', 'Motor driver telemetry logs submitted'],
          requiredEvidenceTypes: ['INVOICE', 'ON_SITE_PHOTO', 'VIDEO_WALKTHROUGH'],
        },
        {
          sequenceOrder: 2,
          title: 'Edge-AI Weed Classification & Delta-Arm Micro-Sprayer',
          description: 'Deployment of the TensorRT YOLOv8 inference model on Jetson Orin Nano and integration with the 3-axis high-speed micro-nozzle actuator.',
          durationDays: 45,
          targetAmount: 100000.0,
          releasedAmount: 0.0,
          utilizedAmount: 0.0,
          status: 'ACTIVE',
          acceptanceCriteria: ['90%+ real-time weed detection accuracy in laboratory test bench', 'Sub-second nozzle actuation demonstrated'],
          requiredEvidenceTypes: ['VIDEO_WALKTHROUGH', 'INSPECTION_REPORT'],
        },
        {
          sequenceOrder: 3,
          title: '10-Acre Cooperative Field Pilot & Farmer Trials',
          description: 'Live field deployment across 10 acres of wheat fields in Kurukshetra in partnership with a local agricultural cooperative.',
          durationDays: 45,
          targetAmount: 60000.0,
          releasedAmount: 0.0,
          utilizedAmount: 0.0,
          status: 'PLANNED',
          acceptanceCriteria: ['Signed farmer evaluation report', 'Field chemical reduction audit certificate', 'Final open source release documentation'],
          requiredEvidenceTypes: ['INSPECTION_REPORT', 'ON_SITE_PHOTO'],
        },
      ],
    },

    // 2. NITKKR Assistive Bioengineering Chapter
    {
      title: 'Sparsh-Arm: Sub-₹15,000 Myoelectric Bionic Prosthetic for Rural Amputees',
      slug: 'sparsh-myoelectric-prosthetic-arm',
      tenantId: seededClubsMap['nitkkr-assistive-bioeng']?.id || nitkkr.id,
      studentUserId: jayKumar.id,
      category: 'RESEARCH_GRANT',
      campaignType: 'TEAM',
      stage: 'PROTOTYPE',
      shortDescription: 'Open-source 3D-printable bionic arm utilizing dual-channel surface EMG sensors and tendon-driven compliant fingers, bringing active multi-grip prosthetics to economically vulnerable amputees.',
      description: `### Accessible Human Dignity through Biomechatronics
Advanced myoelectric prosthetic hands in India cost upwards of ₹3,00,000 to ₹12,00,000, making them completely inaccessible to 95% of amputees—most of whom lost their limbs in agricultural or factory machinery accidents.

**Sparsh-Arm** is an open-source active myoelectric prosthesis designed by students at the **NITKKR Assistive Bioengineering Chapter**. By combining parametric 3D printing, compliant flexure finger joints, and custom dual-channel analog EMG signal conditioning circuits, Sparsh-Arm achieves 5 distinct grasp modes at a bill of materials under ₹12,500.

#### Core Innovations:
- **Compliant Flexure Hinges**: Uses durable TPU flexures instead of expensive metallic miniature pins, making fingers shock-resistant.
- **Dual-Channel Surface EMG**: Captures natural muscle contractions from the forearm stump to dynamically control grip patterns.
- **Parametric Socket Generator**: Web-based tool that accepts 3D photogrammetry scans of an amputee's residual limb to 3D-print a custom, breathable socket in under 12 hours.`,
      coverImageUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80',
      galleryImageUrls: [
        'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
      ],
      targetAmount: 180000.0,
      currentRaisedAmount: 120000.0,
      minDonationAmount: 100.0,
      donorCount: 34,
      status: 'LIVE',
      beneficiaryDetails: {
        recipientType: 'ORGANIZATION',
        accountHolderName: 'NITKKR Assistive Tech Chapter',
        bankAccountNumber: '91802005829103',
        ifscCode: 'SBIN0006261',
        upiId: 'sparsh.nitkkr@sbi',
      },
      teamMembers: [
        { name: 'Jay Kumar', role: 'Lead Biomechatronics Researcher', email: jayKumar.email },
        { name: 'Ansh Goel', role: 'Embedded Firmware Developer', email: anshGoel.email },
      ],
      faqs: [
        { question: 'Who will receive the prototype arms?', answer: 'We are partnering with the Kurukshetra District Red Cross Society and local rehabilitation clinics to fit 5 pre-screened amputees free of charge.' },
      ],
      milestones: [
        {
          sequenceOrder: 1,
          title: 'CAD Optimization & High-Cycle Finger Fatigue Testing',
          description: 'Refining 3D parametric finger geometry and testing flexure joint endurance to 250,000 continuous grip cycles.',
          durationDays: 30,
          targetAmount: 60000.0,
          releasedAmount: 60000.0,
          utilizedAmount: 58200.0,
          status: 'COMPLETED',
          acceptanceCriteria: ['Endurance cycle testing report completed', 'CAD parametric files uploaded to repository'],
          requiredEvidenceTypes: ['INVOICE', 'VIDEO_WALKTHROUGH'],
        },
        {
          sequenceOrder: 2,
          title: 'Custom EMG Signal Filter PCB & Grip Classifier Firmware',
          description: 'Fabrication of low-noise 4-layer EMG acquisition PCBs and real-time grip intention classification on ESP32-S3.',
          durationDays: 45,
          targetAmount: 70000.0,
          releasedAmount: 0.0,
          utilizedAmount: 0.0,
          status: 'ACTIVE',
          acceptanceCriteria: ['Signal-to-noise ratio > 20 dB demonstrated', 'Sub-80ms grip response latency'],
          requiredEvidenceTypes: ['ON_SITE_PHOTO', 'INSPECTION_REPORT'],
        },
        {
          sequenceOrder: 3,
          title: 'Clinical Fitment & Patient Quality-of-Life Trials',
          description: 'Custom socket printing and supervised fitment with 5 amputee participants in collaboration with local medical advisors.',
          durationDays: 60,
          targetAmount: 50000.0,
          releasedAmount: 0.0,
          utilizedAmount: 0.0,
          status: 'PLANNED',
          acceptanceCriteria: ['Signed clinical trial observation forms', 'User satisfaction survey audit'],
          requiredEvidenceTypes: ['INSPECTION_REPORT', 'VIDEO_WALKTHROUGH'],
        },
      ],
    },

    // 3. NITKKR Clean Mobility & EV Club
    {
      title: 'Vidyut-X: Student Electric Racing Kart with Modular Regenerative BMS',
      slug: 'vidyut-x-modular-ev-racing-kart',
      tenantId: seededClubsMap['nitkkr-clean-mobility-ev']?.id || nitkkr.id,
      studentUserId: anshGoel.id,
      category: 'COMPETITION_TRAVEL',
      campaignType: 'TEAM',
      stage: 'PROTOTYPE',
      shortDescription: 'High-performance 72V electric kart featuring custom active cell-balancing battery management system, telemetry CAN-bus data logging, and lightweight tubular chromoly chassis.',
      description: `### Accelerating Indigenous Clean Mobility Engineering
Sustainable electric mobility requires deep engineering talent skilled in battery safety, thermal modeling, and motor control electronics.

**Vidyut-X** is an electric competition kart developed by students of the **NITKKR Clean Mobility & EV Powertrain Club**. Built from the ground up to represent NITKKR at national student EV engineering challenges, Vidyut-X incorporates a custom-designed 72V LiFePO4 battery pack, active cell balancing, regenerative braking, and real-time telemetry transmitted via CAN-bus to the pit wall.

#### Technical Highlights:
- **Powertrain**: 15 kW peak liquid-cooled IPM synchronous motor delivering 65 Nm instantaneous torque.
- **Custom BMS**: Active bidirectional cell balancing preventing thermal runaway with sub-millivolt sensing accuracy.
- **Telemetry**: Onboard telemetry transmitting cell temperatures, RPM, and motor inverter flux data at 50 Hz.`,
      coverImageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
      galleryImageUrls: [
        'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80',
      ],
      targetAmount: 200000.0,
      currentRaisedAmount: 140000.0,
      minDonationAmount: 100.0,
      donorCount: 42,
      status: 'LIVE',
      beneficiaryDetails: {
        recipientType: 'ORGANIZATION',
        accountHolderName: 'NITKKR Clean Mobility Club',
        bankAccountNumber: '91802009182374',
        ifscCode: 'SBIN0006261',
        upiId: 'vidyut.nitkkr@sbi',
      },
      teamMembers: [
        { name: 'Ansh Goel', role: 'Powertrain & Battery Systems Lead', email: anshGoel.email },
        { name: 'Om Mohan Gaur', role: 'Chassis & Dynamics Specialist', email: omMohanGaur.email },
      ],
      faqs: [
        { question: 'What competition is the vehicle targeting?', answer: 'Formula Green and National Karting Championship Student Electric Division.' },
      ],
      milestones: [
        {
          sequenceOrder: 1,
          title: 'Chromoly Spaceframe Chassis Fabrication & Steering Geometry',
          description: 'Precision laser cutting of AISI 4130 chromoly tubes, TIG welding of main roll hoop, and steering Ackerman geometry alignment.',
          durationDays: 30,
          targetAmount: 80000.0,
          releasedAmount: 80000.0,
          utilizedAmount: 79200.0,
          status: 'COMPLETED',
          acceptanceCriteria: ['Torsional stiffness test report', 'Material certs verified', 'Chassis build photos'],
          requiredEvidenceTypes: ['INVOICE', 'ON_SITE_PHOTO'],
        },
        {
          sequenceOrder: 2,
          title: '4.8 kWh Battery Pack Assembly & Active BMS Testing',
          description: 'Pouch cell busbar laser welding, thermal paste application, and BMS overcurrent / thermal cutoff bench validation.',
          durationDays: 45,
          targetAmount: 70000.0,
          releasedAmount: 0.0,
          utilizedAmount: 0.0,
          status: 'ACTIVE',
          acceptanceCriteria: ['Thermal dissipation bench report', 'Emergency disconnect switch test video'],
          requiredEvidenceTypes: ['VIDEO_WALKTHROUGH', 'INSPECTION_REPORT'],
        },
        {
          sequenceOrder: 3,
          title: 'Track Dyno Calibration & Competition Registration',
          description: 'Dynamometer power curve tuning, track brake test validation, and official entry into the national championship.',
          durationDays: 30,
          targetAmount: 50000.0,
          releasedAmount: 0.0,
          utilizedAmount: 0.0,
          status: 'PLANNED',
          acceptanceCriteria: ['Track test telemetry logs', 'Championship registration confirmation'],
          requiredEvidenceTypes: ['INSPECTION_REPORT', 'INVOICE'],
        },
      ],
    },

    // 4. National Innovation & Research Authority (Gov Authority)
    {
      title: 'JalNet: Real-Time IoT Micro-Sensing Grid for Yamuna River Tributaries',
      slug: 'jalnet-realtime-yamuna-sensing-grid',
      tenantId: govOrg.id,
      studentUserId: ashishTrivedi.id,
      category: 'RESEARCH_GRANT',
      campaignType: 'TEAM',
      stage: 'PILOT',
      shortDescription: 'Solar-floating sensor buoys monitoring dissolved oxygen, pH, turbidity, and heavy-metal conductivity with LoRaWAN telemetry to detect illegal industrial effluent dumps.',
      description: `### Data-Driven Environmental Governance & River Health
Industrial wastewater dumping into river tributaries often occurs during late-night hours when physical inspections are impossible, resulting in acute toxic pollution before municipal water treatment plants can react.

**JalNet** is a decentralized river water telemetry grid funded under the **National Innovation & Research Authority**. Each autonomous solar-floating buoy continuously monitors dissolved oxygen (DO), oxidation-reduction potential (ORP), turbidity, pH, and electrical conductivity, transmitting cryptographically signed telemetry over a 15 km LoRaWAN mesh network to an open municipal dashboard.

#### System Specifications:
- **Sensors**: Industrial-grade galvanic DO probes and glass-electrode pH transmitters with automatic anti-fouling mechanical wiper blades.
- **Communications**: Long-range 868 MHz LoRaWAN with fall-back 4G LTE cellular data uplink.
- **Open Data Feed**: Real-time publicly queryable REST/GraphQL endpoints for universities and pollution control boards.`,
      coverImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
      galleryImageUrls: [
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80',
      ],
      targetAmount: 450000.0,
      currentRaisedAmount: 280000.0,
      minDonationAmount: 250.0,
      donorCount: 65,
      status: 'LIVE',
      beneficiaryDetails: {
        recipientType: 'ORGANIZATION',
        accountHolderName: 'National Innovation JalNet Project',
        bankAccountNumber: '91802008291044',
        ifscCode: 'SBIN0001428',
        upiId: 'jalnet.gov@sbi',
      },
      teamMembers: [
        { name: 'Ashish Trivedi', role: 'Principal Investigator', email: ashishTrivedi.email },
        { name: 'DX Platform Admin', role: 'Compliance & Data Steward', email: dxAdmin.email },
      ],
      faqs: [
        { question: 'Who has access to the pollution data?', answer: 'The raw telemetry data is published openly under the Open Data Commons Open Database License (ODbL) for all citizens and research scholars.' },
      ],
      milestones: [
        {
          sequenceOrder: 1,
          title: 'Sensor Buoy Hydrodynamic Prototyping & LoRaWAN Gateway',
          description: 'Design of non-capsizable rotational molded buoys with solar charging and deployment of 2 base station LoRaWAN gateways.',
          durationDays: 45,
          targetAmount: 150000.0,
          releasedAmount: 150000.0,
          utilizedAmount: 148200.0,
          status: 'COMPLETED',
          acceptanceCriteria: ['Gateway packet reception logs verified', 'Buoy water immersion seal test passed'],
          requiredEvidenceTypes: ['INVOICE', 'ON_SITE_PHOTO'],
        },
        {
          sequenceOrder: 2,
          title: 'Automated Wiper Anti-Fouling & Real-Time Sensor Telemetry',
          description: 'Integration of motorized mechanical cleaning wipers to prevent biofilm buildup on optical sensors, and live telemetry streaming.',
          durationDays: 60,
          targetAmount: 180000.0,
          releasedAmount: 0.0,
          utilizedAmount: 0.0,
          status: 'ACTIVE',
          acceptanceCriteria: ['30-day continuous submerged test without sensor drift', 'Live API dashboard operational'],
          requiredEvidenceTypes: ['VIDEO_WALKTHROUGH', 'INSPECTION_REPORT'],
        },
        {
          sequenceOrder: 3,
          title: 'Sonipat-Panipat River Corridor 6-Month Field Trial',
          description: 'Deployment of 10 active buoys along an active industrial tributary and delivery of the final pollution anomaly detection report.',
          durationDays: 90,
          targetAmount: 120000.0,
          releasedAmount: 0.0,
          utilizedAmount: 0.0,
          status: 'PLANNED',
          acceptanceCriteria: ['10-buoy continuous deployment audit', 'Final regulatory report delivered to authority'],
          requiredEvidenceTypes: ['INSPECTION_REPORT', 'ON_SITE_PHOTO'],
        },
      ],
    },

    // 5. DreamX Funding & Capital Trust (Corporate Impact)
    {
      title: 'SuryaShiksha: Solar DC Microgrid & STEM Digital Labs for Off-Grid Village Schools',
      slug: 'suryashiksha-solar-microgrid-village-schools',
      tenantId: fundingOrg.id,
      studentUserId: rajaRam.id,
      category: 'STARTUP_INNOVATION',
      campaignType: 'TEAM',
      stage: 'PILOT',
      shortDescription: 'Turnkey 2.5 kW rooftop solar microgrids paired with 10 ruggedized low-power Raspberry Pi computing terminals to deliver uninterrupted STEM education to remote schools.',
      description: `### Lighting Futures: Reliable Clean Power for Rural Classrooms
Frequent power outages in rural schools interrupt computer education and digital literacy for thousands of young learners.

**SuryaShiksha**, backed by **DreamX Funding & Capital Trust**, implements self-contained 2.5 kW rooftop solar microgrids paired with high-efficiency direct-current (DC) power distribution. Instead of inefficient DC-AC inverters, the lab powers low-wattage Raspberry Pi terminals, offline digital STEM servers (Khan Academy, Wikipedia, PhET interactive simulations), and high-efficiency LED illumination directly from a 48V LiFePO4 battery bank.

#### Impact Metrics:
- **Zero Carbon Footprint**: Displaces noisy, polluting diesel generators previously used during examination periods.
- **100% Offline Digital Access**: Students access millions of educational resources without requiring expensive cellular internet.
- **Community Longevity**: Local teachers trained in basic maintenance, with remote telemetry monitoring battery state of health.`,
      coverImageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
      galleryImageUrls: [
        'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
      ],
      targetAmount: 350000.0,
      currentRaisedAmount: 350000.0,
      minDonationAmount: 500.0,
      donorCount: 88,
      status: 'FULLY_FUNDED',
      beneficiaryDetails: {
        recipientType: 'ORGANIZATION',
        accountHolderName: 'DreamX SuryaShiksha Foundation',
        bankAccountNumber: '91802003719201',
        ifscCode: 'HDFC0001827',
        upiId: 'suryashiksha@hdfcbank',
      },
      teamMembers: [
        { name: 'Raja Ram', role: 'Clean Energy Project Director', email: rajaRam.email },
        { name: 'Om Mohan Gaur', role: 'Hardware Infrastructure Engineer', email: omMohanGaur.email },
      ],
      faqs: [
        { question: 'Which schools were selected?', answer: 'Two rural government primary schools in Mahendragarh district with frequent load-shedding.' },
      ],
      milestones: [
        {
          sequenceOrder: 1,
          title: 'Solar Panel Array & LiFePO4 Battery Bank Installation',
          description: 'Procurement and mounting of 6x 450W monocrystalline panels, MPPT controller, and 48V 100Ah battery enclosure.',
          durationDays: 30,
          targetAmount: 120000.0,
          releasedAmount: 120000.0,
          utilizedAmount: 120000.0,
          status: 'COMPLETED',
          acceptanceCriteria: ['Solar generation telemetry active', 'Electrical inspection certificate signed'],
          requiredEvidenceTypes: ['INVOICE', 'ON_SITE_PHOTO'],
        },
        {
          sequenceOrder: 2,
          title: 'STEM Digital Terminals & Offline Educational Server',
          description: 'Setup of 10 low-power computing stations with offline digital curriculum servers and student work desks.',
          durationDays: 30,
          targetAmount: 130000.0,
          releasedAmount: 130000.0,
          utilizedAmount: 128500.0,
          status: 'COMPLETED',
          acceptanceCriteria: ['Classroom photo verification', 'Student user account provisioning verified'],
          requiredEvidenceTypes: ['ON_SITE_PHOTO', 'VIDEO_WALKTHROUGH'],
        },
        {
          sequenceOrder: 3,
          title: 'Teacher Training & 1-Year Remote Battery Telemetry',
          description: 'Conducting teacher digital pedagogy workshops and activating the remote cloud health monitor.',
          durationDays: 30,
          targetAmount: 100000.0,
          releasedAmount: 100000.0,
          utilizedAmount: 98000.0,
          status: 'COMPLETED',
          acceptanceCriteria: ['Teacher feedback forms signed', 'System operational audit completed'],
          requiredEvidenceTypes: ['INSPECTION_REPORT', 'ON_SITE_PHOTO'],
        },
      ],
    },

    // 6. All-India Open Aerospace & Rocketry Collective (Independent Club)
    {
      title: 'Navik-1: Suborbital Hybrid Rocket Propulsion & CanSat Deployer',
      slug: 'navik-1-suborbital-hybrid-rocket',
      tenantId: seededClubsMap['open-aerospace-rocketry']?.id || nitkkr.id,
      studentUserId: omMohanGaur.id,
      category: 'RESEARCH_GRANT',
      campaignType: 'TEAM',
      stage: 'FEASIBILITY',
      shortDescription: 'Nitrous oxide / paraffin wax hybrid rocket engine capable of delivering a 1 kg student scientific payload to 3 km altitude with dual-stage parachute recovery.',
      description: `### Democratizing Aerospace Hardware for Student Pioneers
Rocketry research in India has historically been restricted behind government walls, leaving aspiring aerospace students without opportunities to conduct physical propulsion experiments.

**Navik-1** is an open-source hybrid sounding rocket initiative organized by the **All-India Open Aerospace & Rocketry Collective**. The vehicle uses an inherently safe solid paraffin fuel grain with liquid nitrous oxide oxidizer, delivering 1,800 N of thrust to propel atmospheric CanSat scientific experiments into the lower stratosphere before descending safely under dual redundant parachutes.

#### Open Engineering Goals:
- **Hybrid Injector Head**: Custom 3D-printed inconel vortex injector for stable, acoustic-resonance-free combustion.
- **Flight Computer**: Dual IMU telemetry board with barometric pressure sensors, GPS, and redundant pyro channels.
- **Public Test Stand Data**: All static test fire thrust curves and chamber pressure traces published openly for aerospace researchers.`,
      coverImageUrl: 'https://images.unsplash.com/photo-1517976487588-466f9a0c102a?auto=format&fit=crop&w=1200&q=80',
      galleryImageUrls: [
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=800&q=80',
      ],
      targetAmount: 220000.0,
      currentRaisedAmount: 95000.0,
      minDonationAmount: 100.0,
      donorCount: 22,
      status: 'LIVE',
      beneficiaryDetails: {
        recipientType: 'ORGANIZATION',
        accountHolderName: 'Open Aerospace Collective Navik Project',
        bankAccountNumber: '91802004819203',
        ifscCode: 'ICIC0000104',
        upiId: 'navik.rocketry@icici',
      },
      teamMembers: [
        { name: 'Om Mohan Gaur', role: 'Propulsion Lead', email: omMohanGaur.email },
        { name: 'Ansh', role: 'Avionics & Parachute Recovery', email: anshNitkkr.email },
      ],
      faqs: [
        { question: 'Where will the test fires occur?', answer: 'Static test firings are conducted at a licensed rural industrial testing site with strict safety barricades and fire suppression.' },
      ],
      milestones: [
        {
          sequenceOrder: 1,
          title: 'Static Test Stand Construction & Load Cell Instrumentation',
          description: 'Fabrication of heavy-duty horizontal thrust stand, 5 kN S-type load cell calibration, and remote pneumatic valve actuation.',
          durationDays: 30,
          targetAmount: 80000.0,
          releasedAmount: 80000.0,
          utilizedAmount: 78000.0,
          status: 'COMPLETED',
          acceptanceCriteria: ['Test stand load calibration certificate', 'Remote firing circuit bench test passed'],
          requiredEvidenceTypes: ['INVOICE', 'ON_SITE_PHOTO'],
        },
        {
          sequenceOrder: 2,
          title: 'Full-Duration Hot Fire Test & Combustion Stability Verification',
          description: 'Conducting a 6-second static hot fire test recording thrust curve, specific impulse, and chamber temperature data.',
          durationDays: 45,
          targetAmount: 80000.0,
          releasedAmount: 0.0,
          utilizedAmount: 0.0,
          status: 'ACTIVE',
          acceptanceCriteria: ['Video recording of static test fire', 'Processed thrust curve telemetry data published'],
          requiredEvidenceTypes: ['VIDEO_WALKTHROUGH', 'INSPECTION_REPORT'],
        },
        {
          sequenceOrder: 3,
          title: 'Airframe Layup, Avionics Integration & Flight Trial',
          description: 'Carbon fiber fuselage winding, dual ejection parachute testing, and 3 km altitude launch test.',
          durationDays: 60,
          targetAmount: 60000.0,
          releasedAmount: 0.0,
          utilizedAmount: 0.0,
          status: 'PLANNED',
          acceptanceCriteria: ['Civil aviation launch clearance document', 'In-flight camera footage and recovery report'],
          requiredEvidenceTypes: ['INSPECTION_REPORT', 'VIDEO_WALKTHROUGH'],
        },
      ],
    },

    // 7. Indie Biotech & CleanTech Innovation Lab (Independent Club)
    {
      title: 'BioPlastix: Agricultural Crop Waste to Home-Compostable Packaging Films',
      slug: 'bioplastix-crop-waste-compostable-films',
      tenantId: seededClubsMap['indie-biotech-cleantech']?.id || nitkkr.id,
      studentUserId: niharika.id,
      category: 'STARTUP_INNOVATION',
      campaignType: 'TEAM',
      stage: 'PROTOTYPE',
      shortDescription: 'Converting post-harvest paddy straw cellulose and fungal mycelium into 100% water-resistant, biodegradable packaging alternatives to single-use Styrofoam.',
      description: `### Turning Agricultural Smoke into Circular Biomaterials
Every winter, millions of tons of stubble (parali) are burned across northern India, causing hazardous air pollution. At the same time, e-commerce and retail packaging generates billions of tons of non-biodegradable expanded polystyrene (Styrofoam) waste.

**BioPlastix** is an open clean-biotech research project by the **Indie Biotech & CleanTech Innovation Lab**. The student research team utilizes safe, non-pathogenic fungal mycelium (Pleurotus ostreatus) grown upon steam-pasteurized paddy straw substrate to create durable, shock-absorbing packaging blocks. When mixed with natural bacterial cellulose and citric acid cross-linkers, the process also yields thin, flexible waterproof films that fully degrade in garden soil in 45 days.

#### Sustainable Impact:
- **True Circularity**: Directly incentivizes farmers by purchasing crop stubble instead of burning it.
- **100% Home Compostable**: Degrades into nutrient-rich organic soil amendment with zero toxic microplastics.
- **Non-Toxic Production**: Requires no petrochemical catalysts or high-pressure toxic chemical processes.`,
      coverImageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80',
      galleryImageUrls: [
        'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&w=800&q=80',
      ],
      targetAmount: 150000.0,
      currentRaisedAmount: 65000.0,
      minDonationAmount: 100.0,
      donorCount: 19,
      status: 'LIVE',
      beneficiaryDetails: {
        recipientType: 'ORGANIZATION',
        accountHolderName: 'BioPlastix Circular Innovation Team',
        bankAccountNumber: '91802005918274',
        ifscCode: 'PUNB0021000',
        upiId: 'bioplastix@pnb',
      },
      teamMembers: [
        { name: 'Niharika', role: 'Biomaterials Research Lead', email: niharika.email },
        { name: 'Jay Kumar', role: 'Mechanical Extrusion Engineer', email: jayKumar.email },
      ],
      faqs: [
        { question: 'How long does the packaging take to decompose?', answer: 'Between 30 to 45 days in ordinary garden soil without requiring industrial high-temperature composting.' },
      ],
      milestones: [
        {
          sequenceOrder: 1,
          title: 'Stubble Pre-treatment Protocol & Mycelium Inoculation Tuning',
          description: 'Optimizing mild alkaline washing and sterilization protocols for paddy straw and measuring mycelium colonization velocity.',
          durationDays: 30,
          targetAmount: 50000.0,
          releasedAmount: 50000.0,
          utilizedAmount: 48500.0,
          status: 'COMPLETED',
          acceptanceCriteria: ['Lab sterilization logbook verified', 'Mycelium growth rate benchmark report'],
          requiredEvidenceTypes: ['INVOICE', 'ON_SITE_PHOTO'],
        },
        {
          sequenceOrder: 2,
          title: 'Benchtop Hydraulic Press Molds & Water-Resistance Coating',
          description: 'Fabrication of heated mold dies to press consistent packaging inserts with natural beeswax / shellac waterproof coating.',
          durationDays: 45,
          targetAmount: 60000.0,
          releasedAmount: 0.0,
          utilizedAmount: 0.0,
          status: 'ACTIVE',
          acceptanceCriteria: ['Compressive strength test > 250 kPa', 'Water contact angle > 90 degrees'],
          requiredEvidenceTypes: ['VIDEO_WALKTHROUGH', 'INSPECTION_REPORT'],
        },
        {
          sequenceOrder: 3,
          title: 'Soil Ecotoxicity & Commercial Drop-Impact Testing',
          description: 'Standardized 1-meter drop testing with electronic components and plant seed germination toxicity assessment in degraded soil.',
          durationDays: 45,
          targetAmount: 40000.0,
          releasedAmount: 0.0,
          utilizedAmount: 0.0,
          status: 'PLANNED',
          acceptanceCriteria: ['Certified drop test impact log', 'Plant germination comparative growth index report'],
          requiredEvidenceTypes: ['INSPECTION_REPORT', 'ON_SITE_PHOTO'],
        },
      ],
    },
  ];

  // 3.1 Preserve and enhance the existing 'solar' campaign if present
  const existingSolar = await prisma.campaign.findUnique({ where: { slug: 'solar' } });
  if (existingSolar) {
    await prisma.campaign.update({
      where: { id: existingSolar.id },
      data: {
        title: 'Solar: Next-Gen Bifacial Perovskite Solar Cells',
        shortDescription: 'Developing high-efficiency, moisture-stable tandem perovskite-silicon solar cells in collegiate cleanrooms to exceed 28% laboratory power conversion efficiency.',
        coverImageUrl: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=1200&q=80',
        verifiedByUserId: dxAdmin.id,
        verifiedAt: new Date(),
      },
    });
    console.log(`✓ Enhanced existing campaign: "Solar" (${existingSolar.id})`);
  }

  // 3.2 Seed the 7 domain-aligned campaigns with milestones & double-entry ledger accounts
  for (const c of campaignsToSeed) {
    let campaign = await prisma.campaign.findUnique({
      where: { slug: c.slug },
      include: { milestones: true, escrowAccount: true },
    });

    const campaignData = {
      tenantId: c.tenantId,
      studentUserId: c.studentUserId,
      title: c.title,
      slug: c.slug,
      category: c.category,
      campaignType: c.campaignType,
      stage: c.stage,
      shortDescription: c.shortDescription,
      description: c.description,
      coverImageUrl: c.coverImageUrl,
      galleryImageUrls: c.galleryImageUrls,
      targetAmount: c.targetAmount,
      currentRaisedAmount: c.currentRaisedAmount,
      minDonationAmount: c.minDonationAmount,
      donorCount: c.donorCount,
      currency: 'INR',
      status: c.status,
      verifiedByUserId: dxAdmin.id,
      verifiedAt: new Date(),
      beneficiaryDetails: c.beneficiaryDetails,
      teamMembers: c.teamMembers,
      faqs: c.faqs,
    };

    if (!campaign) {
      campaign = await prisma.campaign.create({
        data: campaignData,
      });
      console.log(`  + Created Campaign: "${campaign.title}" (Target: ₹${c.targetAmount.toLocaleString()}, Raised: ₹${c.currentRaisedAmount.toLocaleString()})`);
    } else {
      campaign = await prisma.campaign.update({
        where: { id: campaign.id },
        data: campaignData,
      });
      console.log(`  • Updated Campaign: "${campaign.title}" (Target: ₹${c.targetAmount.toLocaleString()})`);
    }

    // 3.3 Ensure Double-Entry LedgerAccount
    const accountNumber = `2010_CAMP_${campaign.id.replace(/-/g, '').substring(0, 12).toUpperCase()}`;
    const accountName = `Campaign Escrow (${campaign.title.substring(0, 20)})`;

    let ledgerAccount = await prisma.ledgerAccount.findFirst({
      where: {
        OR: [
          { id: campaign.escrowAccountId || '00000000-0000-0000-0000-000000000000' },
          { accountNumber },
          { ownerId: campaign.id, ownerType: 'CAMPAIGN' },
        ],
      },
    });

    if (!ledgerAccount) {
      ledgerAccount = await prisma.ledgerAccount.create({
        data: {
          scopeType: 'ORGANIZATION',
          tenantId: campaign.tenantId,
          accountNumber,
          name: accountName,
          accountType: 'LIABILITY',
          currency: 'INR',
          balanceCached: c.currentRaisedAmount,
          ownerType: 'CAMPAIGN',
          ownerId: campaign.id,
          isActive: true,
        },
      });
      console.log(`    ↳ Created Escrow Ledger Account: ${ledgerAccount.accountNumber}`);
    } else {
      ledgerAccount = await prisma.ledgerAccount.update({
        where: { id: ledgerAccount.id },
        data: {
          tenantId: campaign.tenantId,
          balanceCached: c.currentRaisedAmount,
          ownerId: campaign.id,
          ownerType: 'CAMPAIGN',
          isActive: true,
        },
      });
      console.log(`    ↳ Verified Escrow Ledger Account: ${ledgerAccount.accountNumber} (Balance: ₹${c.currentRaisedAmount.toLocaleString()})`);
    }

    if (campaign.escrowAccountId !== ledgerAccount.id) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { escrowAccountId: ledgerAccount.id },
      });
    }

    // 3.4 Seed Milestones safely (in place)
    for (const m of c.milestones) {
      await prisma.campaignMilestone.upsert({
        where: {
          campaignId_sequenceOrder: {
            campaignId: campaign.id,
            sequenceOrder: m.sequenceOrder,
          },
        },
        update: {
          title: m.title,
          description: m.description,
          durationDays: m.durationDays,
          targetAmount: m.targetAmount,
          releasedAmount: m.releasedAmount,
          utilizedAmount: m.utilizedAmount,
          status: m.status,
          acceptanceCriteria: m.acceptanceCriteria,
          requiredEvidenceTypes: m.requiredEvidenceTypes,
        },
        create: {
          campaignId: campaign.id,
          sequenceOrder: m.sequenceOrder,
          currentVersion: 1,
          title: m.title,
          description: m.description,
          durationDays: m.durationDays,
          targetAmount: m.targetAmount,
          releasedAmount: m.releasedAmount,
          utilizedAmount: m.utilizedAmount,
          status: m.status,
          acceptanceCriteria: m.acceptanceCriteria,
          requiredEvidenceTypes: m.requiredEvidenceTypes,
        },
      });
    }
    console.log(`    ↳ Seeded/Synced ${c.milestones.length} milestones for "${campaign.title}"`);
  }

  console.log('\n===========================================================');
  console.log('🎉 PRODUCTION-READY SEEDING COMPLETED SUCCESSFULLY!');
  console.log('===========================================================');
}

seedProductionData()
  .catch((err) => {
    console.error('\n❌ SEEDING FAILED WITH ERROR:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
