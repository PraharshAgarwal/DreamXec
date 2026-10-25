/**
 * Master Demo Seeder for DreamXec Platform
 * 
 * Seeds EVERYTHING required for a 100% complete showcase demo:
 * 1. Endangered Species taxonomy & avatars (110 species)
 * 2. Permissions & RBAC matrix for all system and org roles
 * 3. Parent institutions, colleges, research authorities, incubators, trusts & corporates
 * 4. Campus-affiliated clubs (VIT Chennai) & open/independent clubs
 * 5. Complete test user personas from docs/USER_CREDENTIALS.md with password: Password@123
 * 6. Active memberships across all organizations & clubs with respective roles
 * 7. Tiered, multi-stage workflow templates (Form, Document Upload, Automated Check, Review)
 * 8. Live workflow instances & verification queue tasks (both COMPLETED and IN_PROGRESS)
 * 9. 8 Domain-aligned high-impact campaigns across clubs and research domains
 * 10. Multi-tranche milestones (COMPLETED with settled payouts, ACTIVE with pending submissions)
 * 11. Escrow double-entry ledger accounts, transactions, and entries
 * 12. Maker-checker milestone disbursements and vendor utilization proofs (invoices)
 * 13. Live donations with completed payment intents and donor messages
 * 14. Academic endorsements from professors & mentors
 * 15. Community campaign comments and discussion threads
 * 16. User document vault items (Student ID, Research NOC, Tax Exemption certificates)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { PrismaClient, OrgType, OrgRole, Role, LifecycleStatus, MembershipStatus, AccountStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const redis = require('../config/redis');
const { DX_SYSTEM_ORG_SLUG } = require('../constants/orgRoles.constants');
const { PERMISSIONS, PERMISSION_MATRIX } = require('../permissions/matrix');
const { ENDANGERED_SPECIES_DATA } = require('../modules/species/data/endangered-species.data');

const DEFAULT_PASSWORD = 'Password@123';

async function seedMasterDemo() {
  console.log('================================================================');
  console.log('🌟 STARTING DREAMXEC MASTER DEMO SEEDING');
  console.log('================================================================\n');

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // --------------------------------------------------------------------------
  // STEP 1: ENDANGERED SPECIES TAXONOMY & AVATARS
  // --------------------------------------------------------------------------
  console.log('[1/12] Seeding Endangered Species Taxonomy & Fun Avatars...');
  const existingSpeciesCount = await prisma.endangeredSpecies.count();
  if (existingSpeciesCount < 100) {
    for (const item of ENDANGERED_SPECIES_DATA) {
      const avatarUrl = `/api/species/${item.slug}/avatar.svg`;
      await prisma.endangeredSpecies.upsert({
        where: { slug: item.slug },
        update: {
          commonName: item.commonName,
          scientificName: item.scientificName,
          taxonomicGroup: item.taxonomicGroup,
          category: item.category,
          estimatedCount: item.estimatedCount,
          avatarUrl,
          thumbnailUrl: avatarUrl,
          habitat: item.habitat,
          region: item.region,
          description: item.description,
          isActive: true,
        },
        create: {
          commonName: item.commonName,
          scientificName: item.scientificName,
          slug: item.slug,
          taxonomicGroup: item.taxonomicGroup,
          category: item.category,
          estimatedCount: item.estimatedCount,
          assignedCount: 0,
          avatarUrl,
          thumbnailUrl: avatarUrl,
          habitat: item.habitat,
          region: item.region,
          description: item.description,
          isActive: true,
        },
      });
    }
  }
  const allSpecies = await prisma.endangeredSpecies.findMany({ select: { id: true, slug: true, commonName: true } });
  console.log(`✓ Seeded ${allSpecies.length} endangered species.`);

  // --------------------------------------------------------------------------
  // STEP 2: RBAC PERMISSIONS & ROLE MATRIX
  // --------------------------------------------------------------------------
  console.log('\n[2/12] Seeding RBAC Permissions & Role Matrix...');
  const permissionEntries = Object.entries(PERMISSIONS).map(([nameKey, permValue]) => ({
    key: permValue,
    name: nameKey.replace(/_/g, ' '),
    description: `Permission for ${permValue}`,
    category: permValue.split(':')[0].toUpperCase(),
  }));

  const existingRolePermCount = await prisma.rolePermission.count();
  if (existingRolePermCount < 50) {
    for (const entry of permissionEntries) {
      await prisma.permission.upsert({
        where: { key: entry.key },
        update: entry,
        create: entry,
      });
    }

    for (const [permKey, allowedRoles] of Object.entries(PERMISSION_MATRIX)) {
      for (const role of allowedRoles) {
        await prisma.rolePermission.upsert({
          where: {
            role_permissionKey: {
              role,
              permissionKey: permKey,
            },
          },
          update: {},
          create: {
            role,
            permissionKey: permKey,
          },
        });
      }
    }
  }
  console.log('✓ Seeded system permissions and role permission mappings.');

  // --------------------------------------------------------------------------
  // STEP 3: ORGANIZATIONS & INSTITUTIONS
  // --------------------------------------------------------------------------
  console.log('\n[3/12] Seeding Core Institutions, Authorities & Corporates...');

  // 3.1 DX Platform Governance
  const platformOrg = await prisma.organization.upsert({
    where: { slug: DX_SYSTEM_ORG_SLUG },
    update: {
      name: 'DX Platform Governance',
      orgType: 'CORPORATE',
      allowedRoles: ['ORG_ADMIN', 'COMPLIANCE_OFFICER', 'CORPORATE_ADMIN', 'DONOR', 'MENTOR'],
      hierarchyPath: 'dx_platform_org',
      depth: 0,
      lifecycleStatus: 'ACTIVE',
      metadata: {
        description: 'DreamXec Platform Governance & Double-Entry Escrow Custody',
        website: 'https://dreamxec.com',
      },
    },
    create: {
      name: 'DX Platform Governance',
      slug: DX_SYSTEM_ORG_SLUG,
      orgType: 'CORPORATE',
      allowedRoles: ['ORG_ADMIN', 'COMPLIANCE_OFFICER', 'CORPORATE_ADMIN', 'DONOR', 'MENTOR'],
      hierarchyPath: 'dx_platform_org',
      depth: 0,
      lifecycleStatus: 'ACTIVE',
      metadata: {
        description: 'DreamXec Platform Governance & Double-Entry Escrow Custody',
        website: 'https://dreamxec.com',
      },
    },
  });

  // 3.2 VIT Chennai (COLLEGE)
  const nitkkr = await prisma.organization.upsert({
    where: { slug: 'nit-kkr' },
    update: {
      name: 'Vellore Institute of Technology, Chennai',
      orgType: 'COLLEGE',
      allowedRoles: ['STUDENT', 'ORG_ADMIN', 'PROFESSOR', 'RESEARCHER', 'STUDENT_PRESIDENT', 'MENTOR'],
      hierarchyPath: 'nit-kkr',
      depth: 0,
      lifecycleStatus: 'ACTIVE',
      metadata: {
        location: 'Vandalur-Kelambakkam Road, Chennai, Tamil Nadu, India',
        domain: 'vit.ac.in',
        website: 'https://chennai.vit.ac.in',
        established: 1963,
        accreditation: 'NIRF Tier-1 Institute of National Importance',
      },
    },
    create: {
      id: '9c297f57-d379-4c80-bcc1-6e4fa389d286',
      name: 'Vellore Institute of Technology, Chennai',
      slug: 'nit-kkr',
      orgType: 'COLLEGE',
      allowedRoles: ['STUDENT', 'ORG_ADMIN', 'PROFESSOR', 'RESEARCHER', 'STUDENT_PRESIDENT', 'MENTOR'],
      hierarchyPath: 'nit-kkr',
      depth: 0,
      lifecycleStatus: 'ACTIVE',
      metadata: {
        location: 'Vandalur-Kelambakkam Road, Chennai, Tamil Nadu, India',
        domain: 'vit.ac.in',
        website: 'https://chennai.vit.ac.in',
        established: 1963,
        accreditation: 'NIRF Tier-1 Institute of National Importance',
      },
    },
  });

  // Also ensure alias/duplicate slug 'nit-kurukshetra' points cleanly
  await prisma.organization.upsert({
    where: { slug: 'nit-kurukshetra' },
    update: {
      name: 'Vellore Institute of Technology, Chennai',
      orgType: 'COLLEGE',
      allowedRoles: ['STUDENT', 'ORG_ADMIN', 'PROFESSOR', 'RESEARCHER', 'STUDENT_PRESIDENT', 'MENTOR'],
      hierarchyPath: 'nit-kurukshetra',
      depth: 0,
      lifecycleStatus: 'ACTIVE',
    },
    create: {
      name: 'Vellore Institute of Technology, Chennai',
      slug: 'nit-kurukshetra',
      orgType: 'COLLEGE',
      allowedRoles: ['STUDENT', 'ORG_ADMIN', 'PROFESSOR', 'RESEARCHER', 'STUDENT_PRESIDENT', 'MENTOR'],
      hierarchyPath: 'nit-kurukshetra',
      depth: 0,
      lifecycleStatus: 'ACTIVE',
    },
  });

  // 3.3 Indian Institute of Science (IISc Bangalore)
  const iisc = await prisma.organization.upsert({
    where: { slug: 'iisc-bangalore' },
    update: {
      name: 'Indian Institute of Science (IISc)',
      orgType: 'RESEARCH_INSTITUTION',
      allowedRoles: ['RESEARCHER', 'PROFESSOR', 'COMPLIANCE_OFFICER', 'ORG_ADMIN'],
      hierarchyPath: 'iisc-bangalore',
      depth: 0,
      lifecycleStatus: 'ACTIVE',
      metadata: {
        location: 'Bengaluru, Karnataka, India',
        website: 'https://iisc.ac.in',
        focusAreas: ['Quantum Technologies', 'Artificial Intelligence', 'Clean Energy'],
      },
    },
    create: {
      name: 'Indian Institute of Science (IISc)',
      slug: 'iisc-bangalore',
      orgType: 'RESEARCH_INSTITUTION',
      allowedRoles: ['RESEARCHER', 'PROFESSOR', 'COMPLIANCE_OFFICER', 'ORG_ADMIN'],
      hierarchyPath: 'iisc-bangalore',
      depth: 0,
      lifecycleStatus: 'ACTIVE',
      metadata: {
        location: 'Bengaluru, Karnataka, India',
        website: 'https://iisc.ac.in',
        focusAreas: ['Quantum Technologies', 'Artificial Intelligence', 'Clean Energy'],
      },
    },
  });

  // 3.4 National Innovation & Research Authority (Gov Authority)
  const govOrg = await prisma.organization.upsert({
    where: { slug: 'national-gov-authority' },
    update: {
      name: 'National Innovation & Research Authority',
      orgType: 'RESEARCH_INSTITUTION',
      allowedRoles: ['GOV_OFFICIAL', 'COMPLIANCE_OFFICER', 'RESEARCHER', 'ORG_ADMIN'],
      hierarchyPath: 'national-gov-authority',
      depth: 0,
      lifecycleStatus: 'ACTIVE',
      metadata: {
        ministry: 'Ministry of Science & Technology',
        jurisdiction: 'National Frontier R&D Grants',
      },
    },
    create: {
      id: 'e0b7e091-a35c-424b-be42-f7b0902b32ca',
      name: 'National Innovation & Research Authority',
      slug: 'national-gov-authority',
      orgType: 'RESEARCH_INSTITUTION',
      allowedRoles: ['GOV_OFFICIAL', 'COMPLIANCE_OFFICER', 'RESEARCHER', 'ORG_ADMIN'],
      hierarchyPath: 'national-gov-authority',
      depth: 0,
      lifecycleStatus: 'ACTIVE',
      metadata: {
        ministry: 'Ministry of Science & Technology',
        jurisdiction: 'National Frontier R&D Grants',
      },
    },
  });

  // 3.5 DreamX Funding & Capital Trust (CORPORATE)
  const fundingOrg = await prisma.organization.upsert({
    where: { slug: 'dreamx-funding-trust' },
    update: {
      name: 'DreamX Funding & Capital Trust',
      orgType: 'CORPORATE',
      allowedRoles: ['DONOR', 'CORPORATE_ADMIN', 'MENTOR', 'ORG_ADMIN'],
      hierarchyPath: 'dreamx-funding-trust',
      depth: 0,
      lifecycleStatus: 'ACTIVE',
      metadata: {
        focus: 'Catalytic Philanthropy & DeepTech Co-Funding',
        annualDisbursementBudget: '₹50,00,00,000',
      },
    },
    create: {
      id: '7c6a393b-25f7-4898-b4b4-9149cf1b0d48',
      name: 'DreamX Funding & Capital Trust',
      slug: 'dreamx-funding-trust',
      orgType: 'CORPORATE',
      allowedRoles: ['DONOR', 'CORPORATE_ADMIN', 'MENTOR', 'ORG_ADMIN'],
      hierarchyPath: 'dreamx-funding-trust',
      depth: 0,
      lifecycleStatus: 'ACTIVE',
      metadata: {
        focus: 'Catalytic Philanthropy & DeepTech Co-Funding',
        annualDisbursementBudget: '₹50,00,00,000',
      },
    },
  });

  // 3.6 Acme Ventures & Philanthropy (CORPORATE Donor)
  const acmeOrg = await prisma.organization.upsert({
    where: { slug: 'acme-ventures' },
    update: {
      name: 'Acme Ventures & Philanthropy',
      orgType: 'CORPORATE',
      allowedRoles: ['DONOR', 'CORPORATE_ADMIN', 'MENTOR'],
      hierarchyPath: 'acme-ventures',
      depth: 0,
      lifecycleStatus: 'ACTIVE',
      metadata: {
        type: 'Corporate CSR & Venture Philanthropy Foundation',
        csrRegistration: 'CSR00029104',
        focus: ['STEM Education', 'CleanTech Innovation', 'Assistive Technology'],
      },
    },
    create: {
      name: 'Acme Ventures & Philanthropy',
      slug: 'acme-ventures',
      orgType: 'CORPORATE',
      allowedRoles: ['DONOR', 'CORPORATE_ADMIN', 'MENTOR'],
      hierarchyPath: 'acme-ventures',
      depth: 0,
      lifecycleStatus: 'ACTIVE',
      metadata: {
        type: 'Corporate CSR & Venture Philanthropy Foundation',
        csrRegistration: 'CSR00029104',
        focus: ['STEM Education', 'CleanTech Innovation', 'Assistive Technology'],
      },
    },
  });

  // 3.7 DreamX DeepTech Innovation Hub (INCUBATOR)
  const incubatorOrg = await prisma.organization.upsert({
    where: { slug: 'dreamx-deeptech-hub' },
    update: {
      name: 'DreamX DeepTech Innovation Hub',
      orgType: 'INCUBATOR',
      allowedRoles: ['INCUBATOR_MANAGER', 'MENTOR', 'ORG_ADMIN'],
      hierarchyPath: 'dreamx-deeptech-hub',
      depth: 0,
      lifecycleStatus: 'ACTIVE',
      metadata: {
        location: 'Bengaluru Innovation Corridor, India',
        focusSectors: ['Robotics & Hardware', 'AI Systems', 'SpaceTech', 'BioTech'],
        supportedCohortsPerYear: 4,
      },
    },
    create: {
      name: 'DreamX DeepTech Innovation Hub',
      slug: 'dreamx-deeptech-hub',
      orgType: 'INCUBATOR',
      allowedRoles: ['INCUBATOR_MANAGER', 'MENTOR', 'ORG_ADMIN'],
      hierarchyPath: 'dreamx-deeptech-hub',
      depth: 0,
      lifecycleStatus: 'ACTIVE',
      metadata: {
        location: 'Bengaluru Innovation Corridor, India',
        focusSectors: ['Robotics & Hardware', 'AI Systems', 'SpaceTech', 'BioTech'],
        supportedCohortsPerYear: 4,
      },
    },
  });

  console.log('✓ Core organizations and institutions verified.');

  // --------------------------------------------------------------------------
  // STEP 4: PURPOSEFUL CLUBS (CAMPUS & INDEPENDENT)
  // --------------------------------------------------------------------------
  console.log('\n[4/12] Seeding Purposeful Campus & Independent Clubs...');

  const clubsToSeed = [
    // 4.1 Aero Club VIT Chennai (Featured in USER_CREDENTIALS.md)
    {
      name: 'Aero Club VIT Chennai',
      slug: 'aero-club-vit',
      orgType: 'CLUB',
      parentId: nitkkr.id,
      depth: 1,
      hierarchyPath: `${nitkkr.slug}.aero-club-vit`,
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER', 'MENTOR'],
      metadata: {
        motto: '"Pushing the frontiers of subscale autonomous flight & aerial robotics ✈️"',
        tagline: 'Autonomous Fixed-Wing, VTOL Drones & Atmospheric Flight Dynamics Guild',
        category: 'Aeronautics & Drone Robotics',
        labLocation: 'Aerodynamics & Flight Dynamics Lab, Central Workshop Wing A, VIT Chennai',
        meetingSchedule: 'Tuesdays, Thursdays & Saturdays, 5:00 PM IST',
        facultyAdvisor: {
          name: 'Prof. Rajesh Kumar',
          designation: 'Professor & Dean of Student Welfare',
          department: 'Dept. of Mechanical Engineering, VIT Chennai',
        },
        technicalStacks: [
          { name: 'PX4 & ArduPilot Autopilot', description: 'Custom firmware integration for autonomous waypoint tracking and VTOL transition.', tag: 'Flight Stack' },
          { name: 'Carbon Composite Layup', description: 'Vacuum-infused carbon fiber airframe fabrication for high strength-to-weight ratio.', tag: 'Airframe' },
          { name: 'LoRaWAN Long-Range Telemetry', description: 'AES-256 encrypted flight telemetry up to 25 km line-of-sight.', tag: 'Communications' },
        ],
        facilities: [
          'Subsonic Wind Tunnel Test Bench (Velocity up to 45 m/s)',
          'Carbon Fiber Vacuum Bagging Chamber',
          'Avionics Bench & Hardware-in-the-Loop (HIL) Flight Simulator',
          'Authorized Outdoor Test Flight Field (Kurukshetra Airfield Proximity)',
        ],
      },
    },
    // 4.2 VIT Chennai Robotics & Autonomous Systems Club
    {
      name: 'VIT Chennai Robotics & Autonomous Systems Club',
      slug: 'vit-robotics-club',
      orgType: 'CLUB',
      parentId: nitkkr.id,
      depth: 1,
      hierarchyPath: `${nitkkr.slug}.vit-robotics-club`,
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER', 'MENTOR'],
      metadata: {
        motto: '"Engineering next-gen autonomous field rovers for Indian precision agriculture 🌾"',
        tagline: 'Autonomous Field Robotics, ROS2 Navigation & Edge-AI Perception Chapter',
        category: 'Field Robotics & Autonomy',
        labLocation: 'Robotics & Mechatronics Innovation Lab, Block B, VIT Chennai',
        meetingSchedule: 'Wednesdays & Saturdays, 5:30 PM IST',
        facultyAdvisor: {
          name: 'Dr. P. K. Sharma',
          designation: 'Professor & Head of Mechatronics',
          department: 'Dept. of Mechanical & Robotics, VIT Chennai',
        },
      },
    },
    // 4.3 VIT Chennai Quantum Computing & AI Guild
    {
      name: 'VIT Chennai Quantum Computing & AI Guild',
      slug: 'vit-quantum-ai-guild',
      orgType: 'CLUB',
      parentId: nitkkr.id,
      depth: 1,
      hierarchyPath: `${nitkkr.slug}.vit-quantum-ai-guild`,
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'],
      metadata: {
        motto: '"Simulating quantum circuits & accelerating student-led AI compilers ⚛️"',
        tagline: 'Open Quantum Computation, Qiskit Circuit Design & Deep Learning Guild',
        category: 'Quantum Computing & AI',
        labLocation: 'High Performance Computing Center (HPCC), Central Library 3rd Floor, VIT Chennai',
      },
    },
    // 4.4 VIT Chennai Clean Mobility & EV Powertrain Club
    {
      name: 'VIT Chennai Clean Mobility & EV Powertrain Club',
      slug: 'vit-clean-mobility-ev',
      orgType: 'CLUB',
      parentId: nitkkr.id,
      depth: 1,
      hierarchyPath: `${nitkkr.slug}.vit-clean-mobility-ev`,
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'],
      metadata: {
        motto: '"Pioneering modular regenerative EV powertrains & telemetry for racing ⚡"',
        tagline: 'Electric Racing, Regenerative Powertrains & Formula Student Chapter',
        category: 'Clean Mobility & EV',
        labLocation: 'Automotive Innovation Center, Central Workshop Wing C, VIT Chennai',
      },
    },
    // 4.5 VIT Chennai Assistive Bioengineering Chapter
    {
      name: 'VIT Chennai Assistive Bioengineering Chapter',
      slug: 'vit-assistive-bioeng',
      orgType: 'CLUB',
      parentId: nitkkr.id,
      depth: 1,
      hierarchyPath: `${nitkkr.slug}.vit-assistive-bioeng`,
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'],
      metadata: {
        motto: '"Building sub-₹15,000 myoelectric bionic limbs for rural amputees 🦾"',
        tagline: 'Affordable Prosthetics, EMG Signal Processing & Assistive Robotics Chapter',
        category: 'Biomedical & Assistive Robotics',
        labLocation: 'Assistive Bioengineering Laboratory, Department of Electronics, VIT Chennai',
      },
    },
    // 4.6 VIT Chennai Robotics & Mechatronics Guild
    {
      name: 'VIT Chennai Robotics & Mechatronics Guild',
      slug: 'vit-robotics-mechatronics',
      orgType: 'CLUB',
      parentId: nitkkr.id,
      depth: 1,
      hierarchyPath: `${nitkkr.slug}.vit-robotics-mechatronics`,
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'],
      metadata: {
        tagline: 'Autonomous Field Robotics, ROS2 Navigation & Drone Systems',
        motto: 'Engineering autonomous physical systems for sustainable agriculture and space exploration',
      },
    },
    // 4.7 Open Aerospace & Rocketry Collective (Independent)
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
        motto: '"Democratizing suborbital sounding rocketry & open propulsion for student engineers 🚀"',
        tagline: 'Open-Source Hybrid Rocket Propulsion, CanSat & Stratospheric Recovery',
        category: 'Aerospace & Suborbital Systems',
        labLocation: 'Open Innovation Workshop, Sonipat Aerospace Research Corridor',
      },
    },
    // 4.8 Indie Biotech & CleanTech Innovation Lab (Independent)
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
        motto: '"Transforming agricultural parali smoke waste into home-compostable packaging 🌿"',
        tagline: 'Circular Bio-Economy, Mycelium Composites & Microbial Clean Energy Lab',
        category: 'CleanTech & BioMaterials',
        labLocation: 'Bio-Polymer Innovation Center, Industrial Area Phase II, Panchkula',
      },
    },
    // 4.9 Open Climate Tech & Atmospheric Grid (Independent)
    {
      name: 'Open Climate Tech & Atmospheric Grid',
      slug: 'open-climate-grid',
      orgType: 'CLUB',
      parentId: null,
      depth: 0,
      hierarchyPath: 'open-climate-grid',
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'],
      metadata: {
        motto: '"Decentralized hyper-local greenhouse gas & AQI sensor mesh across India 🛰️"',
        tagline: 'Open Atmospheric Telemetry & Distributed Climate Intelligence',
        category: 'Climate & Atmospheric Tech',
      },
    },
    // 4.10 Decentralized AI & Open Robotics Alliance (Independent)
    {
      name: 'Decentralized AI & Open Robotics Alliance',
      slug: 'decentralized-ai-alliance',
      orgType: 'CLUB',
      parentId: null,
      depth: 0,
      hierarchyPath: 'decentralized-ai-alliance',
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'],
      metadata: {
        motto: '"Open-weights edge AI foundation models for humanoid & robotic manipulation 🤖"',
        tagline: 'Community-Governed Physical AI & Embodied Intelligence',
        category: 'Embodied AI & Robotics',
      },
    },
  ];

  const clubsMap = {};
  for (const c of clubsToSeed) {
    const clubRecord = await prisma.organization.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        orgType: c.orgType,
        parentId: c.parentId,
        depth: c.depth,
        hierarchyPath: c.hierarchyPath,
        lifecycleStatus: c.lifecycleStatus,
        allowedRoles: c.allowedRoles,
        metadata: c.metadata,
      },
      create: c,
    });
    clubsMap[c.slug] = clubRecord;
    console.log(`  + Club: "${clubRecord.name}" [${c.parentId ? 'Campus: ' + nitkkr.name : 'Open / Independent'}]`);
  }

  // --------------------------------------------------------------------------
  // STEP 5: TEST USER PERSONAS (FROM docs/USER_CREDENTIALS.md & LEADS)
  // --------------------------------------------------------------------------
  console.log('\n[5/12] Seeding Standard User Personas (Password: Password@123)...');

  const testUserDefs = [
    // 1. Platform Super Admin
    {
      email: 'dx.admin@dreamxec.com',
      fullName: 'DX Platform Admin',
      username: 'dx_admin',
      role: Role.ADMIN,
      bio: 'DX Platform Super Admin & Governance Lead with all system permissions',
      isDxAdmin: true,
      speciesSlug: 'snow-leopard',
      membership: { orgId: platformOrg.id, role: OrgRole.ORG_ADMIN },
    },
    // 2. Chief Compliance Officer
    {
      email: 'compliance@dreamxec.com',
      fullName: 'Chief Compliance Officer',
      username: 'compliance_officer',
      role: Role.ADMIN,
      bio: 'Platform Chief Compliance & Maker-Checker Financial Audit Officer',
      isDxAdmin: false,
      speciesSlug: 'great-indian-bustard',
      membership: { orgId: platformOrg.id, role: OrgRole.COMPLIANCE_OFFICER },
    },
    // 3. Student President (Club Lead) - Aero Club VIT Chennai
    {
      email: 'aarav.sharma@vit.ac.in',
      fullName: 'Aarav Sharma',
      username: 'aarav_sharma',
      role: Role.USER,
      bio: 'President of Aero Club VIT Chennai | Autonomous VTOL & Fixed-Wing Drone Engineer',
      speciesSlug: 'bengal-tiger',
      membership: { orgId: clubsMap['aero-club-vit'].id, role: OrgRole.STUDENT_PRESIDENT },
      studentVerified: true,
    },
    // 4. Student Member - Aero Club VIT Chennai
    {
      email: 'student.member@vit.ac.in',
      fullName: 'Rohan Mehta',
      username: 'rohan_mehta',
      role: Role.USER,
      bio: 'Undergraduate Aerospace Engineering Student & Avionics Lead at Aero Club VIT Chennai',
      speciesSlug: 'gharial',
      membership: { orgId: clubsMap['aero-club-vit'].id, role: OrgRole.STUDENT },
      studentVerified: true,
    },
    // 5. College / University Admin - VIT Chennai
    {
      email: 'registrar@vit.ac.in',
      fullName: 'Dean & Registrar Admin',
      username: 'vit_registrar',
      role: Role.USER,
      bio: 'Registrar & Dean of Student Affairs, Vellore Institute of Technology, Chennai',
      speciesSlug: 'indian-rhinoceros',
      membership: { orgId: nitkkr.id, role: OrgRole.ORG_ADMIN },
    },
    // 6. Professor / Faculty Mentor - VIT Chennai
    {
      email: 'prof.rajesh@vit.ac.in',
      fullName: 'Prof. Rajesh Kumar',
      username: 'prof_rajesh',
      role: Role.USER,
      bio: 'Professor of Mechanical Engineering & Dean of Student Welfare, VIT Chennai',
      speciesSlug: 'asian-elephant',
      membership: { orgId: nitkkr.id, role: OrgRole.PROFESSOR },
    },
    // 7. Principal Investigator / Researcher - VIT Chennai & IISc
    {
      email: 'sneha.verma@vit.ac.in',
      fullName: 'Dr. Sneha Verma',
      username: 'dr_sneha_verma',
      role: Role.USER,
      bio: 'Principal Investigator & Senior Research Scientist in AI & Sensor Systems',
      speciesSlug: 'kashmir-stag',
      membership: { orgId: nitkkr.id, role: OrgRole.RESEARCHER },
    },
    // 8. Incubator Manager - DreamX DeepTech Innovation Hub
    {
      email: 'incubator.manager@vit.ac.in',
      fullName: 'Dr. Ramesh Chandra',
      username: 'ramesh_incubator',
      role: Role.USER,
      bio: 'Head of Incubation & Venture Catalyst, DreamX DeepTech Innovation Hub',
      speciesSlug: 'red-panda',
      membership: { orgId: incubatorOrg.id, role: OrgRole.INCUBATOR_MANAGER },
    },
    // 9. Industry Mentor - Aero Club VIT Chennai
    {
      email: 'vikram.mentor@vit.ac.in',
      fullName: 'Vikram Aditya',
      username: 'vikram_aditya',
      role: Role.USER,
      bio: 'Aerospace Systems Architect & Veteran Flight Controls Mentor',
      speciesSlug: 'lion-tailed-macaque',
      membership: { orgId: clubsMap['aero-club-vit'].id, role: OrgRole.MENTOR },
    },
    // 10. Individual Donor (Philanthropist)
    {
      email: 'donor@dreamxec.com',
      fullName: 'Ananya Singhania',
      username: 'ananya_singhania',
      role: Role.USER,
      bio: 'Technology Philanthropist & Angel Investor supporting student frontier tech',
      speciesSlug: 'nilgiri-tahr',
      membership: { orgId: fundingOrg.id, role: OrgRole.DONOR },
    },
    // 11. Corporate CSR Partner - Acme Ventures & Philanthropy
    {
      email: 'donor.corporate@dreamxec.com',
      fullName: 'Acme Philanthropic Trust',
      username: 'acme_corporate',
      role: Role.USER,
      bio: 'Corporate Social Responsibility & Frontier Innovation Grant Allocation Committee',
      speciesSlug: 'gangetic-dolphin',
      membership: { orgId: acmeOrg.id, role: OrgRole.CORPORATE_ADMIN },
    },
    // 12. Project Lead: KrishiBot (Robotics Club)
    {
      email: '21bce1001@vit.ac.in',
      fullName: 'Ansh',
      username: 'ansh_vit',
      role: Role.USER,
      bio: 'Robotics Team Lead & Field Rover Systems Architect at VIT Chennai Robotics Club',
      speciesSlug: 'snow-leopard',
      membership: { orgId: clubsMap['vit-robotics-club'].id, role: OrgRole.STUDENT_PRESIDENT },
      studentVerified: true,
    },
    // 13. Project Lead: Vidyut-X (Clean Mobility)
    {
      email: 'anshgoel2580@gmail.com',
      fullName: 'Ansh Goel',
      username: 'ansh_goel',
      role: Role.USER,
      bio: 'Electric Powertrain & BMS Engineer at VIT Chennai Clean Mobility Club',
      speciesSlug: 'bengal-tiger',
      membership: { orgId: clubsMap['vit-clean-mobility-ev'].id, role: OrgRole.STUDENT_PRESIDENT },
      studentVerified: true,
    },
    // 14. Project Lead: Sparsh-Arm (Assistive Bioengineering)
    {
      email: 'jaynrk2002@gmail.com',
      fullName: 'Jay Kumar',
      username: 'jay_kumar',
      role: Role.USER,
      bio: 'Lead Biomechatronics Researcher & Affordable Prosthetics Developer',
      speciesSlug: 'asian-elephant',
      membership: { orgId: clubsMap['vit-assistive-bioeng'].id, role: OrgRole.STUDENT_PRESIDENT },
      studentVerified: true,
    },
    // 15. Project Lead: JalNet (National Innovation Authority)
    {
      email: 'ashish.5core@gmail.com',
      fullName: 'Ashish Trivedi',
      username: 'ashish_trivedi',
      role: Role.USER,
      bio: 'Principal Environmental Telemetry Specialist & IoT LoRaWAN Mesh Architect',
      speciesSlug: 'indian-rhinoceros',
      membership: { orgId: govOrg.id, role: OrgRole.RESEARCHER },
    },
    // 16. Project Lead: Navik-1 (Open Aerospace)
    {
      email: 'ommohangaur029@gmail.com',
      fullName: 'Om Mohan Gaur',
      username: 'om_mohan_gaur',
      role: Role.USER,
      bio: 'Propulsion & Combustion Engineer at All-India Open Aerospace Collective',
      speciesSlug: 'great-indian-bustard',
      membership: { orgId: clubsMap['open-aerospace-rocketry'].id, role: OrgRole.STUDENT_PRESIDENT },
      studentVerified: true,
    },
    // 17. Project Lead: BioPlastix (Indie Biotech)
    {
      email: 'niharika08anand@gmail.com',
      fullName: 'Niharika Anand',
      username: 'niharika_anand',
      role: Role.USER,
      bio: 'Biomaterials Chemist & Circular Mycelium Packaging Researcher',
      speciesSlug: 'red-panda',
      membership: { orgId: clubsMap['indie-biotech-cleantech'].id, role: OrgRole.RESEARCHER },
    },
    // 18. Project Lead: SuryaShiksha (Clean Energy)
    {
      email: 'iamom515@gmail.com',
      fullName: 'Raja Ram',
      username: 'raja_ram',
      role: Role.USER,
      bio: 'Rural Off-Grid DC Microgrid & Solar Infrastructure Specialist',
      speciesSlug: 'nilgiri-tahr',
      membership: { orgId: fundingOrg.id, role: OrgRole.ORG_ADMIN },
    },
  ];

  const userMap = {};
  for (let idx = 0; idx < testUserDefs.length; idx++) {
    const uDef = testUserDefs[idx];
    const species = allSpecies.find((s) => s.slug === uDef.speciesSlug) || allSpecies[idx % allSpecies.length];

    const profileMetadata = {
      bio: uDef.bio,
      isDxAdmin: Boolean(uDef.isDxAdmin),
      isAdmin: uDef.role === Role.ADMIN,
      emailVerified: true,
      studentVerified: Boolean(uDef.studentVerified),
      institution: uDef.email.endsWith('@vit.ac.in') ? 'VIT Chennai' : 'DreamXec Ecosystem',
    };

    if (uDef.username) {
      const existingByUsername = await prisma.user.findUnique({
        where: { username: uDef.username },
      });
      if (existingByUsername && existingByUsername.email !== uDef.email) {
        await prisma.user.update({
          where: { id: existingByUsername.id },
          data: { email: uDef.email },
        });
      }
    }

    const userRecord = await prisma.user.upsert({
      where: { email: uDef.email },
      update: {
        fullName: uDef.fullName,
        username: uDef.username,
        role: uDef.role,
        passwordHash,
        accountStatus: AccountStatus.ACTIVE,
        profileMetadata,
        speciesId: species?.id,
        speciesNumber: (idx + 1) * 7,
      },
      create: {
        email: uDef.email,
        fullName: uDef.fullName,
        username: uDef.username,
        role: uDef.role,
        passwordHash,
        accountStatus: AccountStatus.ACTIVE,
        profileMetadata,
        speciesId: species?.id,
        speciesNumber: (idx + 1) * 7,
      },
    });

    userMap[uDef.email] = userRecord;

    // Seed Active Membership for user
    if (uDef.membership) {
      await prisma.membership.upsert({
        where: {
          userId_organizationId_role: {
            userId: userRecord.id,
            organizationId: uDef.membership.orgId,
            role: uDef.membership.role,
          },
        },
        update: {
          status: MembershipStatus.ACTIVE,
          joinedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
        },
        create: {
          userId: userRecord.id,
          organizationId: uDef.membership.orgId,
          role: uDef.membership.role,
          status: MembershipStatus.ACTIVE,
          joinedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
        },
      });
    }

    console.log(`  ✓ [User] ${uDef.fullName} <${uDef.email}> (${uDef.role}) -> ${uDef.membership?.role || 'USER'}`);
  }

  // Cross-enroll Aarav Sharma & Rohan Mehta in VIT Chennai parent college as well
  await prisma.membership.upsert({
    where: {
      userId_organizationId_role: {
        userId: userMap['aarav.sharma@vit.ac.in'].id,
        organizationId: nitkkr.id,
        role: OrgRole.STUDENT,
      },
    },
    update: { status: MembershipStatus.ACTIVE },
    create: {
      userId: userMap['aarav.sharma@vit.ac.in'].id,
      organizationId: nitkkr.id,
      role: OrgRole.STUDENT,
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date(),
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId_role: {
        userId: userMap['student.member@vit.ac.in'].id,
        organizationId: nitkkr.id,
        role: OrgRole.STUDENT,
      },
    },
    update: { status: MembershipStatus.ACTIVE },
    create: {
      userId: userMap['student.member@vit.ac.in'].id,
      organizationId: nitkkr.id,
      role: OrgRole.STUDENT,
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date(),
    },
  });

  // --------------------------------------------------------------------------
  // STEP 6: USER DOC VAULT (KYC & CREDENTIALS)
  // --------------------------------------------------------------------------
  console.log('\n[6/12] Seeding User Document Vault Credentials & Proofs...');

  const sampleVaultDocs = [
    {
      userEmail: 'aarav.sharma@vit.ac.in',
      documentType: 'STUDENT_ID',
      title: 'VIT Chennai Student Identity Card',
      fileName: 'aarav_nitkkr_id_card.pdf',
      fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
      isVerified: true,
    },
    {
      userEmail: 'aarav.sharma@vit.ac.in',
      documentType: 'UNIVERSITY_ENDORSEMENT',
      title: 'Dean of Student Affairs Club Presidential Authorization Letter',
      fileName: 'aero_club_president_endorsement.pdf',
      fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      isVerified: true,
    },
    {
      userEmail: 'student.member@vit.ac.in',
      documentType: 'STUDENT_ID',
      title: 'VIT Chennai Enrolled Student Identity Proof',
      fileName: 'rohan_student_id.pdf',
      fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
      isVerified: true,
    },
    {
      userEmail: 'prof.rajesh@vit.ac.in',
      documentType: 'GOVT_ID',
      title: 'Faculty Employee Identity Card & Gazette Notification',
      fileName: 'prof_rajesh_faculty_id.pdf',
      fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      isVerified: true,
    },
    {
      userEmail: 'donor.corporate@dreamxec.com',
      documentType: 'ORGANIZATION_REGISTRATION',
      title: 'Ministry of Corporate Affairs CSR-1 Registration Certificate',
      fileName: 'acme_csr1_certificate.pdf',
      fileUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
      isVerified: true,
    },
  ];

  for (const doc of sampleVaultDocs) {
    const targetUser = userMap[doc.userEmail];
    if (targetUser) {
      const existing = await prisma.userDocVault.findFirst({
        where: { userId: targetUser.id, title: doc.title },
      });
      if (!existing) {
        await prisma.userDocVault.create({
          data: {
            userId: targetUser.id,
            documentType: doc.documentType,
            title: doc.title,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            fileSizeBytes: 1048576,
            mimeType: 'application/pdf',
            isVerified: doc.isVerified,
          },
        });
      }
    }
  }
  console.log('✓ Seeded secure Doc Vault items.');

  // --------------------------------------------------------------------------
  // STEP 7: WORKFLOW TEMPLATES & TIERED STAGES
  // --------------------------------------------------------------------------
  console.log('\n[7/12] Seeding Role-Based Workflow Templates & Stages...');

  const workflowDefinitions = [
    // Aero Club Student Workflow
    {
      tenantId: clubsMap['aero-club-vit'].id,
      slug: 'aero-club-vit-student-workflow',
      name: 'Aero Club VIT Chennai - Student Member Induction',
      description: 'Technical division selection and enrolled student verification for Aero Club',
      stages: [
        {
          name: 'Technical Division & UAV Interest',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'division', label: 'Technical Division', type: 'select', options: ['Autonomous Flight Avionics', 'Aerodynamics & CFD', 'Airframe Composites', 'Ground Control Telemetry'], required: true },
              { id: 'rollNumber', label: 'VIT Chennai Roll Number', type: 'text', required: true },
              { id: 'pilotExperience', label: 'Do you have RC or drone flight simulator experience?', type: 'select', options: ['Beginner', 'Intermediate (10+ hours)', 'Experienced Pilot'], required: true },
            ],
          },
        },
        {
          name: 'Student ID Proof & Safety Agreement',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 2,
          config: {
            requiredDocuments: [
              { id: 'studentIdCard', name: 'Institute ID Card (Front & Back)', required: true },
              { id: 'safetyWaiver', name: 'Signed Flight Safety Compliance Agreement', required: false },
            ],
          },
        },
        {
          name: 'Club President Verification & Induction',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 3,
          config: { reviewRequired: true, reviewerRole: 'STUDENT_PRESIDENT' },
        },
      ],
    },
    // Aero Club President Workflow
    {
      tenantId: clubsMap['aero-club-vit'].id,
      slug: 'aero-club-vit-student-president-workflow',
      name: 'Aero Club VIT Chennai - Club President Authorization',
      description: 'Presidential accreditation endorsed by Faculty Advisor and Dean of Student Welfare',
      stages: [
        {
          name: 'Executive Committee Declaration',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'tenureYear', label: 'Tenure Year', type: 'text', required: true },
              { id: 'executiveCouncilEmails', label: 'Core Team Official Emails', type: 'textarea', required: true },
            ],
          },
        },
        {
          name: 'Faculty Advisor Appointment Letter',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 2,
          config: {
            requiredDocuments: [
              { id: 'appointmentLetter', name: 'Signed Faculty Advisor Recommendation', required: true },
            ],
          },
        },
        {
          name: 'Dean of Student Welfare Authorization',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 3,
          config: { reviewRequired: true, reviewerRole: 'ORG_ADMIN' },
        },
      ],
    },
    // VIT Chennai Student Institutional Workflow
    {
      tenantId: nitkkr.id,
      slug: 'nit-kkr-student-workflow',
      name: 'VIT Chennai Student Verification & Onboarding',
      description: 'Zero-friction student onboarding via official institutional email (@vit.ac.in)',
      stages: [
        {
          name: 'Official Email Verification',
          stageType: 'EMAIL_VERIFICATION',
          executionOrder: 1,
          config: {
            allowedDomains: ['vit.ac.in'],
            instruction: 'Verify your @vit.ac.in student email for instant institutional access.',
          },
        },
        {
          name: 'Academic Department & Roll Number',
          stageType: 'FORM',
          executionOrder: 2,
          config: {
            fields: [
              { id: 'rollNumber', label: 'Institute Roll Number', type: 'text', required: true },
              { id: 'degreeProgram', label: 'Program', type: 'select', options: ['B.Tech', 'M.Tech', 'Ph.D.'], required: true },
              { id: 'department', label: 'Department', type: 'select', options: ['Computer Engg', 'Mechanical Engg', 'Electronics Engg', 'Electrical Engg'], required: true },
            ],
          },
        },
      ],
    },
    // VIT Chennai Faculty / Professor Workflow
    {
      tenantId: nitkkr.id,
      slug: 'nit-kkr-professor-workflow',
      name: 'VIT Chennai Faculty & Research Supervisor Onboarding',
      description: 'Academic appointment verification for professors and research supervisors',
      stages: [
        {
          name: 'Department Designation & Faculty ID',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'employeeId', label: 'Faculty Employee Code', type: 'text', required: true },
              { id: 'designation', label: 'Designation', type: 'select', options: ['Assistant Professor', 'Associate Professor', 'Professor', 'Dean'], required: true },
              { id: 'department', label: 'Academic Department', type: 'text', required: true },
            ],
          },
        },
        {
          name: 'Faculty ID Card & Appointment Letter',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 2,
          config: {
            requiredDocuments: [
              { id: 'facultyIdCard', name: 'Institute Faculty ID Card', required: true },
            ],
          },
        },
        {
          name: 'Institutional Compliance Verification',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 3,
          config: { reviewRequired: true, reviewerRole: 'ORG_ADMIN' },
        },
      ],
    },
    // Funding Trust Donor Workflow
    {
      tenantId: fundingOrg.id,
      slug: 'dreamx-funding-trust-donor-workflow',
      name: 'DreamX Funding & Capital Trust - Donor Onboarding',
      description: 'Frictionless accreditation for philanthropic contributors',
      stages: [
        {
          name: 'Donor Profile & Escrow Preferences',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'donorType', label: 'Contribution Capacity', type: 'select', options: ['Individual Angel', 'Family Office', 'Corporate Foundation'], required: true },
              { id: 'taxExemptionRequired', label: 'Request Section 80G Tax Exemption Receipt?', type: 'select', options: ['Yes', 'No'], required: true },
            ],
          },
        },
      ],
    },
  ];

  const templateMap = {};
  for (const wf of workflowDefinitions) {
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
          slug: wf.slug,
          name: wf.name,
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
      console.log(`  + Created Workflow Template: "${tpl.name}" (${tpl.stages.length} stages)`);
    } else {
      // Sync stages
      for (const st of wf.stages) {
        const existingStage = tpl.stages.find((s) => s.executionOrder === st.executionOrder);
        if (existingStage) {
          await prisma.workflowStage.update({
            where: { id: existingStage.id },
            data: { name: st.name, stageType: st.stageType, config: st.config },
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
      tpl = await prisma.workflowTemplate.update({
        where: { id: tpl.id },
        data: { name: wf.name, description: wf.description, status: 'PUBLISHED' },
        include: { stages: { orderBy: { executionOrder: 'asc' } } },
      });
      console.log(`  • Synchronized Workflow Template: "${tpl.name}" (${tpl.stages.length} stages)`);
    }
    templateMap[wf.slug] = tpl;
  }

  // --------------------------------------------------------------------------
  // STEP 8: WORKFLOW INSTANCES & VERIFICATION QUEUE
  // --------------------------------------------------------------------------
  console.log('\n[8/12] Seeding Live Workflow Instances & Verification Review Queue...');

  // 8.1 Completed Workflow for Aarav Sharma (President of Aero Club)
  const aeroPresidentTpl = templateMap['aero-club-vit-student-president-workflow'];
  if (aeroPresidentTpl) {
    const aaravUser = userMap['aarav.sharma@vit.ac.in'];
    const existingInstance = await prisma.workflowInstance.findFirst({
      where: {
        templateId: aeroPresidentTpl.id,
        applicantEmail: aaravUser.email,
      },
    });

    if (!existingInstance) {
      const instance = await prisma.workflowInstance.create({
        data: {
          templateId: aeroPresidentTpl.id,
          tenantId: clubsMap['aero-club-vit'].id,
          applicantId: aaravUser.id,
          applicantEmail: aaravUser.email,
          applicantName: aaravUser.fullName,
          orgType: 'CLUB',
          status: 'COMPLETED',
          completedAt: new Date(Date.now() - 14 * 24 * 3600 * 1000),
          instanceData: {
            tenureYear: '2026-2027',
            executiveCouncilEmails: 'rohan_mehta@vit.ac.in, avionics@vit.ac.in',
            selectedRole: 'STUDENT_PRESIDENT',
            status: 'APPROVED',
          },
        },
      });

      // Seed stage executions
      for (const st of aeroPresidentTpl.stages) {
        await prisma.stageExecution.create({
          data: {
            workflowInstanceId: instance.id,
            workflowStageId: st.id,
            stageName: st.name,
            stageType: st.stageType,
            executionOrder: st.executionOrder,
            executionStatus: 'COMPLETED',
            startedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000),
            completedAt: new Date(Date.now() - 14 * 24 * 3600 * 1000),
          },
        });
      }

      await prisma.verification.create({
        data: {
          instanceId: instance.id,
          tenantId: clubsMap['aero-club-vit'].id,
          verificationType: 'STUDENT_PRESIDENT_AUTHORIZATION',
          status: 'VERIFIED',
          evidenceUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
          verificationData: { approvedBy: 'dx.admin@dreamxec.com', notes: 'Tenure authorization endorsed by Dean.' },
          completedAt: new Date(Date.now() - 14 * 24 * 3600 * 1000),
        },
      });
      console.log('  ✓ Seeded COMPLETED Presidential Verification for Aarav Sharma');
    }
  }

  // 8.2 LIVE IN-PROGRESS Workflow Instance for Rohan Mehta (Pending Review in Admin Queue!)
  const aeroStudentTpl = templateMap['aero-club-vit-student-workflow'];
  if (aeroStudentTpl && aeroStudentTpl.stages.length >= 3) {
    const rohanUser = userMap['student.member@vit.ac.in'];
    const reviewStage = aeroStudentTpl.stages[2]; // Stage 3: MANUAL_REVIEW

    const existingPending = await prisma.workflowInstance.findFirst({
      where: {
        templateId: aeroStudentTpl.id,
        applicantEmail: rohanUser.email,
        status: 'IN_PROGRESS',
      },
    });

    if (!existingPending) {
      const pendingInstance = await prisma.workflowInstance.create({
        data: {
          templateId: aeroStudentTpl.id,
          tenantId: clubsMap['aero-club-vit'].id,
          applicantId: rohanUser.id,
          applicantEmail: rohanUser.email,
          applicantName: rohanUser.fullName,
          orgType: 'CLUB',
          status: 'IN_PROGRESS',
          currentStageId: reviewStage.id,
          instanceData: {
            division: 'Autonomous Flight Avionics',
            rollNumber: '12212089',
            pilotExperience: 'Intermediate (10+ hours)',
            selectedRole: 'STUDENT',
          },
        },
      });

      // Stage 1 executed
      await prisma.stageExecution.create({
        data: {
          workflowInstanceId: pendingInstance.id,
          workflowStageId: aeroStudentTpl.stages[0].id,
          stageName: aeroStudentTpl.stages[0].name,
          stageType: aeroStudentTpl.stages[0].stageType,
          executionOrder: 1,
          executionStatus: 'COMPLETED',
          completedAt: new Date(Date.now() - 2 * 3600 * 1000),
        },
      });

      // Stage 1 submission
      await prisma.stageSubmission.create({
        data: {
          workflowInstanceId: pendingInstance.id,
          workflowStageId: aeroStudentTpl.stages[0].id,
          submittedById: rohanUser.id,
          status: 'APPROVED',
          formData: {
            division: 'Autonomous Flight Avionics',
            rollNumber: '12212089',
            pilotExperience: 'Intermediate (10+ hours)',
          },
        },
      });

      // Stage 2 executed
      await prisma.stageExecution.create({
        data: {
          workflowInstanceId: pendingInstance.id,
          workflowStageId: aeroStudentTpl.stages[1].id,
          stageName: aeroStudentTpl.stages[1].name,
          stageType: aeroStudentTpl.stages[1].stageType,
          executionOrder: 2,
          executionStatus: 'COMPLETED',
          completedAt: new Date(Date.now() - 1 * 3600 * 1000),
        },
      });

      // Stage 2 document submission
      await prisma.stageSubmission.create({
        data: {
          workflowInstanceId: pendingInstance.id,
          workflowStageId: aeroStudentTpl.stages[1].id,
          submittedById: rohanUser.id,
          status: 'SUBMITTED',
          formData: {
            studentIdCardUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
            safetyWaiverSigned: true,
          },
        },
      });

      // Stage 3 in progress (Review)
      await prisma.stageExecution.create({
        data: {
          workflowInstanceId: pendingInstance.id,
          workflowStageId: reviewStage.id,
          stageName: reviewStage.name,
          stageType: reviewStage.stageType,
          executionOrder: 3,
          executionStatus: 'IN_PROGRESS',
        },
      });

      // Add to Verification Queue!
      await prisma.verification.create({
        data: {
          instanceId: pendingInstance.id,
          tenantId: clubsMap['aero-club-vit'].id,
          verificationType: 'CLUB_MEMBER_ONBOARDING',
          status: 'PENDING',
          evidenceUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
          verificationData: {
            applicantName: rohanUser.fullName,
            applicantEmail: rohanUser.email,
            clubName: 'Aero Club VIT Chennai',
            division: 'Autonomous Flight Avionics',
            rollNumber: '12212089',
          },
        },
      });

      console.log('  🌟 Seeded LIVE PENDING Student Verification for Rohan Mehta (Visible in Admin Review Queue!)');
    }
  }

  // 8.3 Completed Faculty Verification for Prof. Rajesh Kumar
  const profTpl = templateMap['nit-kkr-professor-workflow'];
  if (profTpl) {
    const profUser = userMap['prof.rajesh@vit.ac.in'];
    const existingProf = await prisma.workflowInstance.findFirst({
      where: { templateId: profTpl.id, applicantEmail: profUser.email },
    });
    if (!existingProf) {
      const profInst = await prisma.workflowInstance.create({
        data: {
          templateId: profTpl.id,
          tenantId: nitkkr.id,
          applicantId: profUser.id,
          applicantEmail: profUser.email,
          applicantName: profUser.fullName,
          orgType: 'COLLEGE',
          status: 'COMPLETED',
          completedAt: new Date(Date.now() - 20 * 24 * 3600 * 1000),
          instanceData: {
            employeeId: 'NITK-FAC-2014-089',
            designation: 'Professor & Dean of Student Welfare',
            department: 'Mechanical Engineering',
            selectedRole: 'PROFESSOR',
          },
        },
      });

      await prisma.verification.create({
        data: {
          instanceId: profInst.id,
          tenantId: nitkkr.id,
          verificationType: 'FACULTY_CREDENTIAL_VERIFICATION',
          status: 'VERIFIED',
          evidenceUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
          verificationData: { verifiedBy: 'registrar@vit.ac.in', verifiedAt: new Date() },
          completedAt: new Date(Date.now() - 20 * 24 * 3600 * 1000),
        },
      });
      console.log('  ✓ Seeded COMPLETED Faculty Verification for Prof. Rajesh Kumar');
    }
  }

  // --------------------------------------------------------------------------
  // STEP 9: DOMAIN-ALIGNED CAMPAIGNS & ESCROW LEDGERS
  // --------------------------------------------------------------------------
  console.log('\n[9/12] Seeding Domain-Aligned Production Campaigns & Escrow Accounts...');

  const campaignsMaster = [
    // 1. Aero Club VIT Chennai (Lead: Aarav Sharma)
    {
      title: 'Garuda: Subscale Autonomous VTOL Disaster Response Drone',
      slug: 'garuda-autonomous-vtol-disaster-drone',
      tenantId: clubsMap['aero-club-vit'].id,
      studentUserId: userMap['aarav.sharma@vit.ac.in'].id,
      category: 'STARTUP_INNOVATION',
      campaignType: 'TEAM',
      stage: 'PROTOTYPE',
      shortDescription: 'Long-range hybrid VTOL drone capable of 90-minute autonomous flight carrying a 2.5 kg emergency medical payload and thermal imaging for flood/disaster reconnaissance.',
      description: `### Rapid Emergency Airborne Delivery for Crisis Zones
When flash floods or natural disasters strike rural regions, bridges and roads are frequently washed out, cutting off critical medical supplies (insulin, snake venom antivenom, blood units) during the golden hour.

**Garuda** is an autonomous hybrid Vertical Take-Off & Landing (VTOL) unmanned aerial vehicle engineered from the ground up by student aerospace engineers at **Aero Club VIT Chennai**.

Combining the runway-independent vertical hover of a quadcopter with the aerodynamic lift and high cruise efficiency of a carbon-fiber flying wing, Garuda delivers 90 minutes of continuous operational endurance across a 45 km operational radius.

#### Key Engineering Deliverables:
- **Tilt-Rotor VTOL Transition**: Aerodynamically optimized transition firmware using PX4 Autopilot and dual IMU flight controller.
- **Payload Bay**: Quick-release active climate-regulated thermo-capsule maintaining 2°C - 8°C for sensitive bio-therapeutics.
- **Perception & Mapping**: Downward gimbal-stabilized FLIR thermal camera with edge-AI object detection to locate stranded victims in zero-visibility conditions.
- **Fail-Safe Recovery**: Ballistic emergency parachute deployment system with automated telemetry beacon.`,
      coverImageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80',
      galleryImageUrls: [
        'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80',
      ],
      targetAmount: 300000.0,
      currentRaisedAmount: 210000.0,
      minDonationAmount: 100.0,
      donorCount: 48,
      status: 'LIVE',
      beneficiaryDetails: {
        recipientType: 'ORGANIZATION',
        accountHolderName: 'Aero Club VIT Chennai Garuda Project',
        bankAccountNumber: '91802007819201',
        ifscCode: 'SBIN0006261',
        upiId: 'aeroclub.garuda@sbi',
      },
      teamMembers: [
        { name: 'Aarav Sharma', role: 'Project Lead & Aerodynamics Engineer', email: 'aarav.sharma@vit.ac.in' },
        { name: 'Rohan Mehta', role: 'Avionics & Embedded Firmware Lead', email: 'student.member@vit.ac.in' },
        { name: 'Vikram Aditya', role: 'Industry Flight Controls Advisor', email: 'vikram.mentor@vit.ac.in' },
      ],
      faqs: [
        { question: 'What is the flight testing plan?', answer: 'Initial tethered hover tests take place at VIT Chennai outdoor sports grounds, followed by DGCA-cleared long-range test flights.' },
        { question: 'Who owns the intellectual property?', answer: 'The airframe blueprints and PX4 flight controller mixing packages are released openly under open hardware CERN licenses.' },
      ],
      milestones: [
        {
          sequenceOrder: 1,
          title: 'Composite Wing Spar Layup & Wind Tunnel Dynamic Balancing',
          description: 'Fabrication of the vacuum-infused carbon fiber fuselage, high-aspect ratio wing spar dynamic stress testing, and wind tunnel calibration up to 35 m/s.',
          durationDays: 30,
          targetAmount: 110000.0,
          releasedAmount: 110000.0,
          utilizedAmount: 108500.0,
          status: 'COMPLETED',
          acceptanceCriteria: ['CAD structural FEA report verified', 'Wind tunnel dynamic load video uploaded', 'Composite supplier tax invoices verified'],
          requiredEvidenceTypes: ['INVOICE', 'ON_SITE_PHOTO', 'VIDEO_WALKTHROUGH'],
        },
        {
          sequenceOrder: 2,
          title: 'VTOL Transition Flight Firmware & Climate-Controlled Payload Pod',
          description: 'Tuning tilt-motor transition PID loops in flight simulator and thermal payload capsule bench testing with mock medical payloads.',
          durationDays: 45,
          targetAmount: 100000.0,
          releasedAmount: 0.0,
          utilizedAmount: 0.0,
          status: 'ACTIVE',
          acceptanceCriteria: ['Autonomous transition from hover to forward wing-borne flight demonstrated', 'Active temperature telemetry logs maintained for 3 hours'],
          requiredEvidenceTypes: ['VIDEO_WALKTHROUGH', 'INSPECTION_REPORT'],
        },
        {
          sequenceOrder: 3,
          title: '25 km BVLOS Field Demonstration with Disaster Response Unit',
          description: 'Live field exercise partnering with Haryana State Disaster Management Authority simulating medical airdrop to an isolated outpost.',
          durationDays: 60,
          targetAmount: 90000.0,
          releasedAmount: 0.0,
          utilizedAmount: 0.0,
          status: 'PLANNED',
          acceptanceCriteria: ['Signed field observation report from disaster response officer', 'Full BVLOS flight telemetry logs verified'],
          requiredEvidenceTypes: ['INSPECTION_REPORT', 'ON_SITE_PHOTO'],
        },
      ],
    },
    // 2. VIT Chennai Robotics: KrishiBot (Lead: Ansh)
    {
      title: 'KrishiBot: Autonomous Multipurpose Field Rover for Smallholder Farmers',
      slug: 'krishibot-autonomous-field-rover',
      tenantId: clubsMap['vit-robotics-club'].id,
      studentUserId: userMap['21bce1001@vit.ac.in'].id,
      category: 'STARTUP_INNOVATION',
      campaignType: 'TEAM',
      stage: 'PROTOTYPE',
      shortDescription: 'Solar-assisted, GPS-guided autonomous agricultural rover equipped with multispectral weed detection and targeted micro-spraying to reduce chemical herbicide usage by 85%.',
      description: `### Empowering Sustainable Agriculture with Open Robotics
Agricultural runoff and excessive chemical spraying in Haryana and Punjab have led to severe soil degradation, groundwater toxicity, and rising input costs for smallholder farmers.

**KrishiBot** is an open-source, solar-assisted 4WD autonomous agricultural rover built by students at **VIT Chennai Robotics & Autonomous Systems Club**. Utilizing low-cost RTK-GPS centimeter-accurate positioning and an onboard Nvidia Jetson Orin Nano, KrishiBot identifies invasive weeds in real time using edge computer vision and applies precise micro-doses of organic bio-herbicide directly to weed foliage, saving up to 85% of chemical costs.`,
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
        accountHolderName: 'VIT Chennai Robotics Club Innovation Fund',
        bankAccountNumber: '91802001928374',
        ifscCode: 'SBIN0006261',
        upiId: 'nitkkr.robotics@sbi',
      },
      teamMembers: [
        { name: 'Ansh', role: 'Project Lead & Robotics Engineer', email: '21bce1001@vit.ac.in' },
        { name: 'Ashish Trivedi', role: 'Embedded Systems & AI Specialist', email: 'ashish.5core@gmail.com' },
      ],
      faqs: [
        { question: 'Is KrishiBot open source?', answer: 'Yes! All CAD files, ROS2 control packages, and weed classification models are released under MIT license.' },
      ],
      milestones: [
        {
          sequenceOrder: 1,
          title: 'Chassis Fabrication, Powertrain & RTK-GPS Navigation',
          description: 'Assembly of IP66 weatherproof tubular chassis, brushless hub motor integration, and dual-antenna RTK-GPS navigation testing.',
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
          description: 'Deployment of TensorRT YOLOv8 inference model on Jetson Orin Nano and integration with 3-axis high-speed micro-nozzle actuator.',
          durationDays: 45,
          targetAmount: 100000.0,
          releasedAmount: 0.0,
          utilizedAmount: 0.0,
          status: 'ACTIVE',
          acceptanceCriteria: ['90%+ real-time weed detection accuracy in test bench', 'Sub-second nozzle actuation demonstrated'],
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
          acceptanceCriteria: ['Signed farmer evaluation report', 'Field chemical reduction audit certificate'],
          requiredEvidenceTypes: ['INSPECTION_REPORT', 'ON_SITE_PHOTO'],
        },
      ],
    },
    // 3. Assistive Bioeng: Sparsh-Arm (Lead: Jay Kumar)
    {
      title: 'Sparsh-Arm: Sub-₹15,000 Myoelectric Bionic Prosthetic for Rural Amputees',
      slug: 'sparsh-myoelectric-prosthetic-arm',
      tenantId: clubsMap['vit-assistive-bioeng'].id,
      studentUserId: userMap['jaynrk2002@gmail.com'].id,
      category: 'RESEARCH_GRANT',
      campaignType: 'TEAM',
      stage: 'PROTOTYPE',
      shortDescription: 'Open-source 3D-printable bionic arm utilizing dual-channel surface EMG sensors and tendon-driven compliant fingers, bringing active multi-grip prosthetics to economically vulnerable amputees.',
      description: `### Accessible Human Dignity through Biomechatronics
Advanced myoelectric prosthetic hands in India cost upwards of ₹3,00,000 to ₹12,00,000, making them completely inaccessible to 95% of amputees—most of whom lost their limbs in agricultural or factory machinery accidents.

**Sparsh-Arm** combines parametric 3D printing, compliant flexure finger joints, and custom dual-channel analog EMG signal conditioning circuits to achieve 5 distinct grasp modes at a bill of materials under ₹12,500.`,
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
        accountHolderName: 'VIT Chennai Assistive Tech Chapter',
        bankAccountNumber: '91802005829103',
        ifscCode: 'SBIN0006261',
        upiId: 'sparsh.nitkkr@sbi',
      },
      teamMembers: [
        { name: 'Jay Kumar', role: 'Lead Biomechatronics Researcher', email: 'jaynrk2002@gmail.com' },
        { name: 'Ansh Goel', role: 'Embedded Firmware Developer', email: 'anshgoel2580@gmail.com' },
      ],
      faqs: [
        { question: 'Who will receive the prototype arms?', answer: 'We are partnering with the District Red Cross Society to fit 5 pre-screened amputees free of cost.' },
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
    // 4. EV Club: Vidyut-X (Lead: Ansh Goel)
    {
      title: 'Vidyut-X: Student Electric Racing Kart with Modular Regenerative BMS',
      slug: 'vidyut-x-modular-ev-racing-kart',
      tenantId: clubsMap['vit-clean-mobility-ev'].id,
      studentUserId: userMap['anshgoel2580@gmail.com'].id,
      category: 'COMPETITION_TRAVEL',
      campaignType: 'TEAM',
      stage: 'PROTOTYPE',
      shortDescription: 'High-performance 72V electric kart featuring custom active cell-balancing battery management system, telemetry CAN-bus data logging, and lightweight tubular chromoly chassis.',
      description: `### Accelerating Indigenous Clean Mobility Engineering
Sustainable electric mobility requires deep engineering talent skilled in battery safety, thermal modeling, and motor control electronics.

**Vidyut-X** is an electric competition kart developed by students of the **VIT Chennai Clean Mobility & EV Powertrain Club**. Built from the ground up to represent VIT Chennai at national student EV engineering challenges, Vidyut-X incorporates a custom-designed 72V LiFePO4 battery pack, active cell balancing, regenerative braking, and real-time telemetry transmitted via CAN-bus to the pit wall.`,
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
        accountHolderName: 'VIT Chennai Clean Mobility Club',
        bankAccountNumber: '91802009182374',
        ifscCode: 'SBIN0006261',
        upiId: 'vidyut.nitkkr@sbi',
      },
      teamMembers: [
        { name: 'Ansh Goel', role: 'Powertrain & Battery Systems Lead', email: 'anshgoel2580@gmail.com' },
        { name: 'Om Mohan Gaur', role: 'Chassis & Dynamics Specialist', email: 'ommohangaur029@gmail.com' },
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
    // 5. Gov Authority: JalNet (Lead: Ashish Trivedi)
    {
      title: 'JalNet: Real-Time IoT Micro-Sensing Grid for Yamuna River Tributaries',
      slug: 'jalnet-realtime-yamuna-sensing-grid',
      tenantId: govOrg.id,
      studentUserId: userMap['ashish.5core@gmail.com'].id,
      category: 'RESEARCH_GRANT',
      campaignType: 'TEAM',
      stage: 'PILOT',
      shortDescription: 'Solar-floating sensor buoys monitoring dissolved oxygen, pH, turbidity, and heavy-metal conductivity with LoRaWAN telemetry to detect illegal industrial effluent dumps.',
      description: `### Data-Driven Environmental Governance & River Health
Industrial wastewater dumping into river tributaries often occurs during late-night hours when physical inspections are impossible, resulting in acute toxic pollution before municipal water treatment plants can react.

**JalNet** is a decentralized river water telemetry grid funded under the **National Innovation & Research Authority**. Each autonomous solar-floating buoy continuously monitors dissolved oxygen (DO), oxidation-reduction potential (ORP), turbidity, pH, and electrical conductivity, transmitting cryptographically signed telemetry over a 15 km LoRaWAN mesh network to an open municipal dashboard.`,
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
        { name: 'Ashish Trivedi', role: 'Principal Investigator', email: 'ashish.5core@gmail.com' },
        { name: 'Dr. Sneha Verma', role: 'Sensor Calibration Lead', email: 'sneha.verma@vit.ac.in' },
      ],
      faqs: [
        { question: 'Who has access to the pollution data?', answer: 'The raw telemetry data is published openly under the Open Data Commons license for all citizens.' },
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
    // 6. Corporate Impact: SuryaShiksha (Lead: Raja Ram)
    {
      title: 'SuryaShiksha: Solar DC Microgrid & STEM Digital Labs for Off-Grid Village Schools',
      slug: 'suryashiksha-solar-microgrid-village-schools',
      tenantId: fundingOrg.id,
      studentUserId: userMap['iamom515@gmail.com'].id,
      category: 'STARTUP_INNOVATION',
      campaignType: 'TEAM',
      stage: 'PILOT',
      shortDescription: 'Turnkey 2.5 kW rooftop solar microgrids paired with 10 ruggedized low-power Raspberry Pi computing terminals to deliver uninterrupted STEM education to remote schools.',
      description: `### Lighting Futures: Reliable Clean Power for Rural Classrooms
Frequent power outages in rural schools interrupt computer education and digital literacy for thousands of young learners.

**SuryaShiksha**, backed by **DreamX Funding & Capital Trust**, implements self-contained 2.5 kW rooftop solar microgrids paired with high-efficiency direct-current (DC) power distribution. Instead of inefficient DC-AC inverters, the lab powers low-wattage Raspberry Pi terminals, offline digital STEM servers, and high-efficiency LED illumination directly from a 48V LiFePO4 battery bank.`,
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
        { name: 'Raja Ram', role: 'Clean Energy Project Director', email: 'iamom515@gmail.com' },
        { name: 'Om Mohan Gaur', role: 'Hardware Infrastructure Engineer', email: 'ommohangaur029@gmail.com' },
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
          description: 'Conducting teacher digital pedagogy workshops and activating remote cloud health monitor.',
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
    // 7. Open Rocketry: Navik-1 (Lead: Om Mohan Gaur)
    {
      title: 'Navik-1: Suborbital Hybrid Rocket Propulsion & CanSat Deployer',
      slug: 'navik-1-suborbital-hybrid-rocket',
      tenantId: clubsMap['open-aerospace-rocketry'].id,
      studentUserId: userMap['ommohangaur029@gmail.com'].id,
      category: 'RESEARCH_GRANT',
      campaignType: 'TEAM',
      stage: 'FEASIBILITY',
      shortDescription: 'Nitrous oxide / paraffin wax hybrid rocket engine capable of delivering a 1 kg student scientific payload to 3 km altitude with dual-stage parachute recovery.',
      description: `### Democratizing Aerospace Hardware for Student Pioneers
**Navik-1** is an open-source hybrid sounding rocket initiative organized by the **All-India Open Aerospace & Rocketry Collective**. The vehicle uses an inherently safe solid paraffin fuel grain with liquid nitrous oxide oxidizer, delivering 1,800 N of thrust to propel atmospheric CanSat scientific experiments into the lower stratosphere.`,
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
        { name: 'Om Mohan Gaur', role: 'Propulsion Lead', email: 'ommohangaur029@gmail.com' },
        { name: 'Aarav Sharma', role: 'Avionics & Parachute Recovery', email: 'aarav.sharma@vit.ac.in' },
      ],
      faqs: [
        { question: 'Where will test fires occur?', answer: 'Static test firings are conducted at a licensed industrial testing site with strict safety barricades.' },
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
    // 8. Indie CleanTech: BioPlastix (Lead: Niharika Anand)
    {
      title: 'BioPlastix: Agricultural Crop Waste to Home-Compostable Packaging Films',
      slug: 'bioplastix-crop-waste-compostable-films',
      tenantId: clubsMap['indie-biotech-cleantech'].id,
      studentUserId: userMap['niharika08anand@gmail.com'].id,
      category: 'STARTUP_INNOVATION',
      campaignType: 'TEAM',
      stage: 'PROTOTYPE',
      shortDescription: 'Converting post-harvest paddy straw cellulose and fungal mycelium into 100% water-resistant, biodegradable packaging alternatives to single-use Styrofoam.',
      description: `### Turning Agricultural Smoke into Circular Biomaterials
Every winter, millions of tons of stubble (parali) are burned across northern India, causing hazardous air pollution.

**BioPlastix** utilizes non-pathogenic fungal mycelium (Pleurotus ostreatus) grown upon steam-pasteurized paddy straw substrate to create durable, shock-absorbing packaging blocks that replace non-biodegradable Styrofoam and degrade in garden soil in 45 days.`,
      coverImageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
      galleryImageUrls: [
        'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      ],
      targetAmount: 150000.0,
      currentRaisedAmount: 65000.0,
      minDonationAmount: 100.0,
      donorCount: 18,
      status: 'LIVE',
      beneficiaryDetails: {
        recipientType: 'ORGANIZATION',
        accountHolderName: 'Indie Biotech Innovation Lab',
        bankAccountNumber: '91802006192837',
        ifscCode: 'HDFC0000240',
        upiId: 'bioplastix@hdfcbank',
      },
      teamMembers: [
        { name: 'Niharika Anand', role: 'Lead Biomaterials Researcher', email: 'niharika08anand@gmail.com' },
        { name: 'Jay Kumar', role: 'Biochemical Process Advisor', email: 'jaynrk2002@gmail.com' },
      ],
      faqs: [
        { question: 'Is the material water resistant?', answer: 'Yes, coated with a natural bee-propolis and plant-wax composite layer that repels moisture while allowing complete home composting.' },
      ],
      milestones: [
        {
          sequenceOrder: 1,
          title: 'Mycelium Strain Inoculation & Autoclave Optimization',
          description: 'Bench isolation of vigorous Pleurotus mycelium strains and steam-pasteurization protocol development on agricultural stubble.',
          durationDays: 30,
          targetAmount: 50000.0,
          releasedAmount: 50000.0,
          utilizedAmount: 48500.0,
          status: 'COMPLETED',
          acceptanceCriteria: ['Mycelium colonization density report verified', 'Substrate preparation protocol published'],
          requiredEvidenceTypes: ['INVOICE', 'ON_SITE_PHOTO'],
        },
        {
          sequenceOrder: 2,
          title: 'Compression Molding & Drop-Impact Cushioning Testing',
          description: 'Hydraulic heated mold press fabrication and standard ASTM drop-cushioning validation against standard polystyrene foam.',
          durationDays: 45,
          targetAmount: 55000.0,
          releasedAmount: 0.0,
          utilizedAmount: 0.0,
          status: 'ACTIVE',
          acceptanceCriteria: ['ASTM D1596 cushioning curve report certified', 'Water immersion test video recorded'],
          requiredEvidenceTypes: ['VIDEO_WALKTHROUGH', 'INSPECTION_REPORT'],
        },
        {
          sequenceOrder: 3,
          title: 'Pilot Brand Packaging Trial & Soil Degradation Audit',
          description: 'Supply of 500 custom protective corner inserts to an ethical D2C electronics brand and 45-day soil burial audit.',
          durationDays: 45,
          targetAmount: 45000.0,
          releasedAmount: 0.0,
          utilizedAmount: 0.0,
          status: 'PLANNED',
          acceptanceCriteria: ['Pilot partner satisfaction certificate', 'Photographic time-lapse soil biodegradation report'],
          requiredEvidenceTypes: ['INSPECTION_REPORT', 'ON_SITE_PHOTO'],
        },
      ],
    },
  ];

  const campaignMap = {};
  for (const c of campaignsMaster) {
    let campaign = await prisma.campaign.findUnique({
      where: { slug: c.slug },
    });

    const campaignPayload = {
      title: c.title,
      slug: c.slug,
      tenantId: c.tenantId,
      studentUserId: c.studentUserId,
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
      status: c.status,
      beneficiaryDetails: c.beneficiaryDetails,
      teamMembers: c.teamMembers,
      faqs: c.faqs,
    };

    if (!campaign) {
      campaign = await prisma.campaign.create({
        data: campaignPayload,
      });
      console.log(`  + Created Campaign: "${campaign.title}" (Target: ₹${c.targetAmount.toLocaleString()}, Raised: ₹${c.currentRaisedAmount.toLocaleString()})`);
    } else {
      campaign = await prisma.campaign.update({
        where: { id: campaign.id },
        data: campaignPayload,
      });
      console.log(`  • Updated Campaign: "${campaign.title}" (Target: ₹${c.targetAmount.toLocaleString()}, Raised: ₹${c.currentRaisedAmount.toLocaleString()})`);
    }

    campaignMap[c.slug] = campaign;

    // Seed Campaign Double-Entry Escrow Ledger Account
    let ledgerAccount = await prisma.ledgerAccount.findFirst({
      where: {
        ownerId: campaign.id,
        ownerType: 'CAMPAIGN',
      },
    });

    const sanitizedNum = `2010_CAMP_${campaign.id.replace(/-/g, '').slice(0, 12).toUpperCase()}`;
    const accountName = `Campaign Escrow (${campaign.slug.slice(0, 30)})`;

    if (!ledgerAccount) {
      ledgerAccount = await prisma.ledgerAccount.create({
        data: {
          scopeType: 'ORGANIZATION',
          tenantId: campaign.tenantId,
          accountNumber: sanitizedNum,
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
      console.log(`    ↳ Verified Escrow Ledger Account: ${ledgerAccount.accountNumber}`);
    }

    if (campaign.escrowAccountId !== ledgerAccount.id) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { escrowAccountId: ledgerAccount.id },
      });
    }

    // Seed Milestones
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
  }

  // --------------------------------------------------------------------------
  // STEP 10: MILESTONE PROOFS, DISBURSEMENTS & MAKER-CHECKER AUDIT
  // --------------------------------------------------------------------------
  console.log('\n[10/12] Seeding Milestone Proof Submissions, Settled Disbursements & Utilization Invoices...');

  const dxAdminUser = userMap['dx.admin@dreamxec.com'];
  const complianceUser = userMap['compliance@dreamxec.com'];
  const profRajeshUser = userMap['prof.rajesh@vit.ac.in'];

  for (const campaign of Object.values(campaignMap)) {
    const milestones = await prisma.campaignMilestone.findMany({
      where: { campaignId: campaign.id },
      orderBy: { sequenceOrder: 'asc' },
    });

    const m1 = milestones.find((m) => m.sequenceOrder === 1);
    const m2 = milestones.find((m) => m.sequenceOrder === 2);

    // 10.1 Milestone 1: Completed & Settled Payout with Utilization Proof
    if (m1 && Number(m1.releasedAmount) > 0) {
      // 1. Milestone Submission
      let sub = await prisma.campaignMilestoneSubmission.findFirst({
        where: { milestoneId: m1.id },
      });
      if (!sub) {
        sub = await prisma.campaignMilestoneSubmission.create({
          data: {
            milestoneId: m1.id,
            submissionNumber: 1,
            narrative: 'Milestone 1 completed successfully. All testing documentation and invoices uploaded.',
            studentNotes: 'CAD blueprints, load test records, and vendor invoices verified.',
            status: 'APPROVED',
            reviewedByUserId: profRajeshUser.id,
            reviewedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
            createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000),
          },
        });
      }

      // 2. Settled Maker-Checker Disbursement
      let disb = await prisma.milestoneDisbursement.findFirst({
        where: { milestoneId: m1.id },
      });
      if (!disb) {
        disb = await prisma.milestoneDisbursement.create({
          data: {
            milestoneId: m1.id,
            amount: m1.releasedAmount,
            currency: 'INR',
            status: 'SETTLED',
            makerUserId: dxAdminUser.id,
            checkerUserId: complianceUser.id,
            payoutReference: `PAYOUT_DX_TR_00${m1.sequenceOrder}_${m1.id.slice(0, 8).toUpperCase()}`,
            authorizedAt: new Date(Date.now() - 9 * 24 * 3600 * 1000),
            settledAt: new Date(Date.now() - 8 * 24 * 3600 * 1000),
          },
        });
      }

      // 3. Utilization Proof with Vendor Invoice
      const existingProof = await prisma.utilizationProof.findFirst({
        where: { disbursementId: disb.id },
      });
      if (!existingProof) {
        await prisma.utilizationProof.create({
          data: {
            disbursementId: disb.id,
            vendorName: 'Apex Precision Fabrication & Components Ltd.',
            invoiceNumber: `INV-2026-DX-${Math.floor(1000 + Math.random() * 9000)}`,
            amountClaimed: m1.utilizedAmount,
            receiptFileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
            verified: true,
            verifiedByUserId: complianceUser.id,
            verifiedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
          },
        });
      }
    }

    // 10.2 Milestone 2: Active with a Pending Submission for Demo (Garuda & KrishiBot)
    if (m2 && (campaign.slug.includes('garuda') || campaign.slug.includes('krishibot'))) {
      const existingM2Sub = await prisma.campaignMilestoneSubmission.findFirst({
        where: { milestoneId: m2.id },
      });
      if (!existingM2Sub) {
        await prisma.campaignMilestoneSubmission.create({
          data: {
            milestoneId: m2.id,
            submissionNumber: 1,
            narrative: 'Milestone 2 deliverable package submitted for faculty review. Firmware benchmark tests and thermal camera telemetry attached.',
            studentNotes: 'Pending faculty and platform review.',
            status: 'PENDING_REVIEW',
            createdAt: new Date(Date.now() - 6 * 3600 * 1000),
          },
        });

        // Also add a pending maker disbursement awaiting checker approval!
        const existingM2Disb = await prisma.milestoneDisbursement.findFirst({
          where: { milestoneId: m2.id },
        });
        if (!existingM2Disb) {
          await prisma.milestoneDisbursement.create({
            data: {
              milestoneId: m2.id,
              amount: m2.targetAmount,
              currency: 'INR',
              status: 'PENDING_CHECKER',
              makerUserId: dxAdminUser.id,
              payoutReference: `PAYOUT_PENDING_DX_${m2.id.slice(0, 8).toUpperCase()}`,
              authorizedAt: new Date(Date.now() - 2 * 3600 * 1000),
            },
          });
        }
        console.log(`  🌟 Created LIVE Pending Milestone Submission & Maker-Checker Payout on "${campaign.title}"`);
      }
    }
  }
  console.log('✓ Seeded milestone submissions, settled disbursements & utilization proofs.');

  // --------------------------------------------------------------------------
  // STEP 11: DONATIONS, PAYMENT INTENTS & LEDGER ENTRIES
  // --------------------------------------------------------------------------
  console.log('\n[11/12] Seeding Live Donations, Payment Intents & Ledger Double-Entries...');

  const donorAnanya = userMap['donor@dreamxec.com'];
  const donorAcme = userMap['donor.corporate@dreamxec.com'];

  const sampleDonations = [
    {
      campaignSlug: 'garuda-autonomous-vtol-disaster-drone',
      donorId: donorAnanya.id,
      amount: 50000.0,
      displayName: 'Ananya Singhania',
      message: 'Phenomenal work on the VTOL transition dynamics! Happy to fund the sensor suite for disaster response.',
    },
    {
      campaignSlug: 'garuda-autonomous-vtol-disaster-drone',
      donorId: donorAcme.id,
      amount: 100000.0,
      displayName: 'Acme Philanthropic Trust',
      message: 'Allocated under our Disaster Resilience & Autonomous Robotics CSR grant window.',
    },
    {
      campaignSlug: 'krishibot-autonomous-field-rover',
      donorId: donorAnanya.id,
      amount: 35000.0,
      displayName: 'Ananya Singhania',
      message: 'Smallholder farmers desperately need low-cost robotic weeding. Proud to support open agriculture!',
    },
    {
      campaignSlug: 'sparsh-myoelectric-prosthetic-arm',
      donorId: donorAcme.id,
      amount: 75000.0,
      displayName: 'Acme Philanthropic Trust',
      message: 'Accessible medical devices embody true technology for human dignity.',
    },
    {
      campaignSlug: 'vidyut-x-modular-ev-racing-kart',
      donorId: donorAnanya.id,
      amount: 40000.0,
      displayName: 'Ananya Singhania',
      message: 'Go VIT Chennai electric racing! Looking forward to the national championship podium.',
    },
    {
      campaignSlug: 'jalnet-realtime-yamuna-sensing-grid',
      donorId: donorAcme.id,
      amount: 150000.0,
      displayName: 'Acme Philanthropic Trust',
      message: 'Clean river telemetry and open citizen data align directly with our ESG priorities.',
    },
    {
      campaignSlug: 'suryashiksha-solar-microgrid-village-schools',
      donorId: donorAcme.id,
      amount: 200000.0,
      displayName: 'Acme Philanthropic Trust',
      message: 'Empowering village classrooms with uninterrupted solar computing.',
    },
    {
      campaignSlug: 'navik-1-suborbital-hybrid-rocket',
      donorId: donorAnanya.id,
      amount: 45000.0,
      displayName: 'Ananya Singhania',
      message: 'Inspiring to see Indian student pioneers test-firing hybrid rocket engines. Reach for the stars!',
    },
  ];

  for (const d of sampleDonations) {
    const targetCampaign = campaignMap[d.campaignSlug];
    if (targetCampaign) {
      const existingDonation = await prisma.donation.findFirst({
        where: {
          campaignId: targetCampaign.id,
          donorId: d.donorId,
          amount: d.amount,
        },
      });

      if (!existingDonation) {
        const donation = await prisma.donation.create({
          data: {
            campaignId: targetCampaign.id,
            tenantId: targetCampaign.tenantId,
            donorId: d.donorId,
            amount: d.amount,
            currency: 'INR',
            isAnonymous: false,
            donorDisplayName: d.displayName,
            donorMessage: d.message,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 10 + 1) * 24 * 3600 * 1000),
          },
        });

        // Payment Intent
        const pi = await prisma.paymentIntent.create({
          data: {
            donationId: donation.id,
            tenantId: targetCampaign.tenantId,
            totalAmount: d.amount,
            currency: 'INR',
            status: 'SUCCEEDED',
            idempotencyKey: `PI_SEED_${donation.id.slice(0, 16)}`,
            metadata: { gateway: 'RAZORPAY_DEMO', mode: 'ESCROW_SETTLED' },
          },
        });

        // Payment Attempt
        await prisma.paymentAttempt.create({
          data: {
            paymentIntentId: pi.id,
            gateway: 'RAZORPAY',
            gatewayPaymentId: `pay_demo_${Math.random().toString(36).slice(2, 12)}`,
            gatewayOrderId: `order_demo_${Math.random().toString(36).slice(2, 12)}`,
            gatewayTransactionId: `txn_demo_${Math.random().toString(36).slice(2, 12)}`,
            status: 'SUCCEEDED',
          },
        });

        // Post Double-Entry Ledger Transaction
        const existingTx = await prisma.ledgerTransaction.findFirst({
          where: { referenceType: 'DONATION', referenceId: donation.id },
        });

        if (!existingTx) {
          const ltx = await prisma.ledgerTransaction.create({
            data: {
              transactionType: 'DONATION_ESCROW_CREDIT',
              referenceType: 'DONATION',
              referenceId: donation.id,
              tenantId: targetCampaign.tenantId,
              userId: d.donorId,
              status: 'POSTED',
              currency: 'INR',
              metadata: { campaignSlug: targetCampaign.slug, donorName: d.displayName },
            },
          });

          // Credit entry on Campaign Escrow Account
          if (targetCampaign.escrowAccountId) {
            await prisma.ledgerEntry.create({
              data: {
                transactionId: ltx.id,
                accountId: targetCampaign.escrowAccountId,
                amount: d.amount,
                entryType: 'CREDIT',
                currency: 'INR',
              },
            });
          }
        }
      }
    }
  }
  console.log('✓ Seeded live donations with payments, intents and ledger entries.');

  // --------------------------------------------------------------------------
  // STEP 12: SOCIAL PROOF: ENDORSEMENTS & COMMUNITY COMMENTS
  // --------------------------------------------------------------------------
  console.log('\n[12/12] Seeding Faculty Endorsements & Community Comments...');

  const facultyEndorsements = [
    {
      campaignSlug: 'garuda-autonomous-vtol-disaster-drone',
      endorserEmail: 'prof.rajesh@vit.ac.in',
      designation: 'Professor of Mechanical Engineering & Dean of Student Welfare',
      content: 'As Dean of Student Welfare and faculty advisor, I have reviewed the aerodynamics models and fail-safe recovery protocols. The Garuda VTOL represents exemplary student engineering of the highest national standard.',
    },
    {
      campaignSlug: 'garuda-autonomous-vtol-disaster-drone',
      endorserEmail: 'vikram.mentor@vit.ac.in',
      designation: 'Aerospace Systems Architect & Flight Controls Mentor',
      content: 'The tilt-motor flight dynamic transitions and carbon composite structural integrity meet rigorous unmanned aviation benchmarks.',
    },
    {
      campaignSlug: 'krishibot-autonomous-field-rover',
      endorserEmail: 'prof.rajesh@vit.ac.in',
      designation: 'Professor of Mechanical Engineering & Dean of Student Welfare',
      content: 'KrishiBot tackles a pressing agricultural challenge in our state. The hardware-software integration is exceptionally well executed.',
    },
    {
      campaignSlug: 'sparsh-myoelectric-prosthetic-arm',
      endorserEmail: 'sneha.verma@vit.ac.in',
      designation: 'Principal Investigator & Senior Research Scientist',
      content: 'The surface EMG signal conditioning and parametric socket 3D printing demonstrate genuine clinical empathy and biomechanical rigor.',
    },
  ];

  for (const end of facultyEndorsements) {
    const campaign = campaignMap[end.campaignSlug];
    const endorser = userMap[end.endorserEmail];
    if (campaign && endorser) {
      await prisma.campaignEndorsement.upsert({
        where: {
          campaignId_endorserUserId: {
            campaignId: campaign.id,
            endorserUserId: endorser.id,
          },
        },
        update: {
          designation: end.designation,
          comments: end.content,
          status: 'APPROVED',
          endorsedAt: new Date(),
        },
        create: {
          campaignId: campaign.id,
          endorserUserId: endorser.id,
          designation: end.designation,
          comments: end.content,
          status: 'APPROVED',
          endorsedAt: new Date(),
        },
      });
    }
  }

  const communityComments = [
    {
      campaignSlug: 'garuda-autonomous-vtol-disaster-drone',
      userEmail: 'prof.rajesh@vit.ac.in',
      content: 'Proud of Aarav and the entire Aero Club team! The wind tunnel tests were flawless.',
    },
    {
      campaignSlug: 'garuda-autonomous-vtol-disaster-drone',
      userEmail: 'donor@dreamxec.com',
      content: 'Excited to see the 25 km BVLOS demonstration. Such projects restore faith in student-driven technology!',
    },
    {
      campaignSlug: 'krishibot-autonomous-field-rover',
      userEmail: 'donor@dreamxec.com',
      content: 'Reducing 85% herbicide usage is exactly the sustainable innovation India needs. Kudos team KrishiBot!',
    },
    {
      campaignSlug: 'sparsh-myoelectric-prosthetic-arm',
      userEmail: 'donor.corporate@dreamxec.com',
      content: 'Our corporate CSR committee has approved additional matching grant funding for clinical trials.',
    },
  ];

  for (const comm of communityComments) {
    const campaign = campaignMap[comm.campaignSlug];
    const user = userMap[comm.userEmail];
    if (campaign && user) {
      const existing = await prisma.campaignComment.findFirst({
        where: { campaignId: campaign.id, userId: user.id, content: comm.content },
      });
      if (!existing) {
        await prisma.campaignComment.create({
          data: {
            campaignId: campaign.id,
            userId: user.id,
            content: comm.content,
          },
        });
      }
    }
  }
  console.log('✓ Seeded academic endorsements and community discussions.');

  // Flush Redis Cache
  try {
    if (redis && typeof redis.flushAll === 'function') {
      await redis.flushAll();
      console.log('\n✓ Redis cache flushed to sync all live UI lists.');
    }
  } catch (err) {
    console.warn('Note: Redis flush bypassed:', err.message);
  }

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('🎉 DREAMXEC MASTER DEMO SEEDING COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
  console.log(`Total Users:            ${await prisma.user.count()} (All passwords: "${DEFAULT_PASSWORD}")`);
  console.log(`Total Organizations:    ${await prisma.organization.count()} (Colleges, Authorities, Corporates & Clubs)`);
  console.log(`Total Active Members:   ${await prisma.membership.count()}`);
  console.log(`Total Campaigns:        ${await prisma.campaign.count()} (With multi-tranche milestones)`);
  console.log(`Total Milestones:       ${await prisma.campaignMilestone.count()}`);
  console.log(`Total Escrow Ledgers:   ${await prisma.ledgerAccount.count()}`);
  console.log(`Total Disbursements:    ${await prisma.milestoneDisbursement.count()} (Settled & Maker-Checker)`);
  console.log(`Total Donations:        ${await prisma.donation.count()}`);
  console.log(`Total Workflows:        ${await prisma.workflowTemplate.count()}`);
  console.log(`Live Verifications:     ${await prisma.verification.count()} (Pending review queue active)`);
  console.log(`Endangered Species:     ${await prisma.endangeredSpecies.count()}`);
  console.log('================================================================\n');
}

if (require.main === module) {
  seedMasterDemo()
    .catch((err) => {
      console.error('\n❌ MASTER SEEDING FAILED WITH ERROR:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = seedMasterDemo;
