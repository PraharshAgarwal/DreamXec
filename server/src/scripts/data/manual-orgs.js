/**
 * Manual Organizations and Workflows Seed Data Configuration
 * 
 * Edit or add any organization and its role-specific workflows here.
 * You can execute this anytime using:
 *   cd server && npm run seed:manual-orgs
 * or:
 *   node server/src/scripts/add-manual-orgs.js
 */

module.exports = [
  // ============================================================================
  // 1. COLLEGE / UNIVERSITY: VIT Chennai
  // ============================================================================
  {
    name: "Vellore Institute of Technology, Chennai",
    slug: "nit-kurukshetra",
    orgType: "COLLEGE", // COLLEGE | CLUB | RESEARCH_INSTITUTION | CORPORATE | INCUBATOR | NGO
    lifecycleStatus: "ACTIVE", // DRAFT | PENDING_VERIFICATION | ACTIVE | SUSPENDED
    allowedRoles: ["STUDENT", "PROFESSOR", "RESEARCHER", "STUDENT_PRESIDENT", "ORG_ADMIN"],
    metadata: {
      location: "Vandalur-Kelambakkam Road, Chennai, Tamil Nadu, India",
      domain: "vit.ac.in",
      website: "https://chennai.vit.ac.in",
      established: 1963,
      category: "Institute of National Importance",
      accreditation: "NIRF Tier 1 Engineering Institute",
      contactEmail: "admin@vit.ac.in"
    },
    workflows: [
      {
        role: "STUDENT",
        title: "Undergraduate / Graduate Student Verification",
        description: "Official verification workflow for enrolled students at VIT Chennai",
        stages: [
          {
            name: "Academic Credentials & Roll Number",
            stageType: "FORM", // FORM | DOCUMENT_UPLOAD | MANUAL_REVIEW | AUTOMATED_CHECK | APPROVAL
            executionOrder: 1,
            config: {
              fields: [
                { id: "rollNumber", label: "Institute Roll / Enrollment Number", type: "text", required: true },
                { id: "degreeProgram", label: "Program of Study", type: "select", options: ["B.Tech", "M.Tech", "MCA", "MBA", "Ph.D."], required: true },
                { id: "department", label: "Academic Department", type: "select", options: ["Computer Engineering", "Electronics & Comm.", "Mechanical Engg.", "Electrical Engg.", "Civil Engg."], required: true },
                { id: "graduationYear", label: "Expected Year of Graduation", type: "number", required: true }
              ]
            }
          },
          {
            name: "Student ID Card & Fee Receipt",
            stageType: "DOCUMENT_UPLOAD",
            executionOrder: 2,
            config: {
              requiredDocuments: [
                { id: "studentIdCard", name: "Institute Student ID Card (Front & Back)", required: true, allowedTypes: [".pdf", ".jpg", ".png"] },
                { id: "currentSemesterReceipt", name: "Current Semester Tuition Fee Receipt", required: false, allowedTypes: [".pdf"] }
              ]
            }
          },
          {
            name: "Dean / Student Affairs Verification",
            stageType: "MANUAL_REVIEW",
            executionOrder: 3,
            config: {
              reviewRequired: true,
              reviewerRole: "ORG_ADMIN"
            }
          }
        ]
      },
      {
        role: "PROFESSOR",
        title: "Faculty & Professor Onboarding",
        description: "Faculty authentication & department appointment workflow",
        stages: [
          {
            name: "Faculty Appointment Details",
            stageType: "FORM",
            executionOrder: 1,
            config: {
              fields: [
                { id: "employeeId", label: "Faculty / Employee ID", type: "text", required: true },
                { id: "designation", label: "Designation", type: "select", options: ["Assistant Professor", "Associate Professor", "Professor", "Head of Department"], required: true },
                { id: "facultyEmail", label: "Institutional Email (@vit.ac.in)", type: "email", required: true },
                { id: "orcidId", label: "ORCID Researcher ID (0000-xxxx-xxxx-xxxx)", type: "text", required: false }
              ]
            }
          },
          {
            name: "Appointment Letter & ID Verification",
            stageType: "DOCUMENT_UPLOAD",
            executionOrder: 2,
            config: {
              requiredDocuments: [
                { id: "facultyIdCard", name: "Faculty ID Card", required: true, allowedTypes: [".pdf", ".jpg", ".png"] },
                { id: "joiningOrder", name: "Official Joining Letter / Office Order", required: true, allowedTypes: [".pdf"] }
              ]
            }
          },
          {
            name: "Institutional Compliance Review",
            stageType: "MANUAL_REVIEW",
            executionOrder: 3,
            config: {
              reviewRequired: true,
              reviewerRole: "ORG_ADMIN"
            }
          }
        ]
      },
      {
        role: "RESEARCHER",
        title: "Doctoral & Research Scholar Verification",
        description: "Verification workflow for active Ph.D. scholars and post-doctoral research associates",
        stages: [
          {
            name: "Research Domain & Guide Details",
            stageType: "FORM",
            executionOrder: 1,
            config: {
              fields: [
                { id: "scholarId", label: "Research Scholar Enrollment ID", type: "text", required: true },
                { id: "researchTopic", label: "Doctoral Dissertation / Research Topic", type: "textarea", required: true },
                { id: "supervisorName", label: "Principal Supervisor / Guide Name", type: "text", required: true },
                { id: "orcidId", label: "ORCID iD", type: "text", required: true }
              ]
            }
          },
          {
            name: "Research Proposal & Guide Endorsement",
            stageType: "DOCUMENT_UPLOAD",
            executionOrder: 2,
            config: {
              requiredDocuments: [
                { id: "researchProposal", name: "Approved Synopsis / Research Proposal", required: true, allowedTypes: [".pdf"] },
                { id: "supervisorEndorsement", name: "Supervisor Endorsement & NOC", required: true, allowedTypes: [".pdf"] }
              ]
            }
          },
          {
            name: "Dean of Research & Consultancy Approval",
            stageType: "MANUAL_REVIEW",
            executionOrder: 3,
            config: {
              reviewRequired: true,
              reviewerRole: "ORG_ADMIN"
            }
          }
        ]
      }
    ]
  },

  // ============================================================================
  // 2. RESEARCH INSTITUTION: Indian Institute of Science (IISc Bangalore)
  // ============================================================================
  {
    name: "Indian Institute of Science (IISc)",
    slug: "iisc-bangalore",
    orgType: "RESEARCH_INSTITUTION",
    lifecycleStatus: "ACTIVE",
    allowedRoles: ["RESEARCHER", "PROFESSOR", "COMPLIANCE_OFFICER", "ORG_ADMIN"],
    metadata: {
      location: "Bengaluru, Karnataka, India",
      domain: "iisc.ac.in",
      website: "https://iisc.ac.in",
      category: "Autonomous Apex Research Institution",
      focusAreas: ["Quantum Technologies", "Artificial Intelligence", "Clean Energy", "Biomedical Systems"]
    },
    workflows: [
      {
        role: "RESEARCHER",
        title: "Principal Investigator & Research Scientist Onboarding",
        description: "Verification workflow for research scientists and grant investigators",
        stages: [
          {
            name: "Scientist Profile & Research Domain",
            stageType: "FORM",
            executionOrder: 1,
            config: {
              fields: [
                { id: "labName", label: "Laboratory / Center Name", type: "text", required: true },
                { id: "scientificTitle", label: "Official Scientist Designation", type: "text", required: true },
                { id: "orcidId", label: "Official ORCID iD", type: "text", required: true },
                { id: "scopusAuthorId", label: "Scopus / Web of Science ID", type: "text", required: false }
              ]
            }
          },
          {
            name: "Grant Sanctions & Credentials",
            stageType: "DOCUMENT_UPLOAD",
            executionOrder: 2,
            config: {
              requiredDocuments: [
                { id: "scientistCv", name: "Comprehensive Scientific CV", required: true, allowedTypes: [".pdf"] },
                { id: "appointmentProof", name: "Institutional Appointment Letter", required: true, allowedTypes: [".pdf"] }
              ]
            }
          },
          {
            name: "Scientific Ethics & Compliance Review",
            stageType: "MANUAL_REVIEW",
            executionOrder: 3,
            config: {
              reviewRequired: true,
              reviewerRole: "COMPLIANCE_OFFICER"
            }
          }
        ]
      }
    ]
  },

  // ============================================================================
  // 3. INCUBATOR & ACCELERATOR: DreamX DeepTech Innovation Hub
  // ============================================================================
  {
    name: "DreamX DeepTech Innovation Hub",
    slug: "dreamx-deeptech-hub",
    orgType: "INCUBATOR",
    lifecycleStatus: "ACTIVE",
    allowedRoles: ["INCUBATOR_MANAGER", "MENTOR", "ORG_ADMIN"],
    metadata: {
      location: "Bengaluru Innovation Corridor, India",
      website: "https://dreamxec.com/incubator",
      focusSectors: ["Robotics & Hardware", "AI Systems", "SpaceTech", "BioTech"],
      supportedCohortsPerYear: 4
    },
    workflows: [
      {
        role: "INCUBATOR_MANAGER",
        title: "Incubation Portfolio Manager Verification",
        description: "Onboarding workflow for incubator directors, cohort heads, and program leads",
        stages: [
          {
            name: "Managerial Credentials & Cohort Focus",
            stageType: "FORM",
            executionOrder: 1,
            config: {
              fields: [
                { id: "managerTitle", label: "Incubator Role / Portfolio Lead", type: "text", required: true },
                { id: "incubatorEmail", label: "Official Work Email", type: "email", required: true },
                { id: "linkedinUrl", label: "LinkedIn Profile URL", type: "text", required: true }
              ]
            }
          },
          {
            name: "Program Authorization Documents",
            stageType: "DOCUMENT_UPLOAD",
            executionOrder: 2,
            config: {
              requiredDocuments: [
                { id: "incubatorAccreditation", name: "Incubator Registration / Gazette Certificate", required: true, allowedTypes: [".pdf"] },
                { id: "idCard", name: "Government Photo ID Proof", required: true, allowedTypes: [".pdf", ".jpg", ".png"] }
              ]
            }
          },
          {
            name: "Platform Governance Review",
            stageType: "MANUAL_REVIEW",
            executionOrder: 3,
            config: {
              reviewRequired: true,
              reviewerRole: "ORG_ADMIN"
            }
          }
        ]
      },
      {
        role: "MENTOR",
        title: "Startup & Innovation Mentor Accreditation",
        description: "Evaluation and accreditation for technical, business, and patent mentors",
        stages: [
          {
            name: "Mentorship Track & Background",
            stageType: "FORM",
            executionOrder: 1,
            config: {
              fields: [
                { id: "primaryDomain", label: "Domain of Advisory Expertise", type: "text", required: true },
                { id: "yearsExperience", label: "Years of Industry / Venture Experience", type: "number", required: true },
                { id: "pastMentoredStartups", label: "Key Startups or Projects Mentored", type: "textarea", required: false }
              ]
            }
          },
          {
            name: "Advisory Proof & References",
            stageType: "DOCUMENT_UPLOAD",
            executionOrder: 2,
            config: {
              requiredDocuments: [
                { id: "mentorResume", name: "Executive Resume / Portfolio", required: true, allowedTypes: [".pdf"] }
              ]
            }
          },
          {
            name: "Incubation Committee Review",
            stageType: "MANUAL_REVIEW",
            executionOrder: 3,
            config: {
              reviewRequired: true,
              reviewerRole: "INCUBATOR_MANAGER"
            }
          }
        ]
      }
    ]
  },

  // ============================================================================
  // 4. CAMPUS CLUB (Affiliated with VIT Chennai)
  // ============================================================================
  {
    name: "VIT Chennai Robotics & Mechatronics Guild",
    slug: "vit-robotics-mechatronics",
    orgType: "CLUB",
    lifecycleStatus: "ACTIVE",
    parentSlug: "nit-kurukshetra", // Affiliated child org
    allowedRoles: ["STUDENT", "STUDENT_PRESIDENT", "RESEARCHER"],
    metadata: {
      tagline: "Autonomous Field Robotics, ROS2 Navigation & Drone Systems",
      motto: "Engineering autonomous physical systems for sustainable agriculture and space exploration",
      facultyAdvisor: "Dr. P. K. Sharma, Professor & Head of Mechatronics",
      labLocation: "Innovation Lab 2, Central Workshop Block, VIT Chennai"
    },
    workflows: [
      {
        role: "STUDENT",
        title: "Club Member & Project Lead Induction",
        description: "Student recruitment and project division onboarding",
        stages: [
          {
            name: "Technical Skills & Division Choice",
            stageType: "FORM",
            executionOrder: 1,
            config: {
              fields: [
                { id: "division", label: "Preferred Technical Division", type: "select", options: ["Embedded Firmware & Sensors", "ROS2 Navigation & Perception", "Mechanical CAD & Fabrication", "AI Edge Compute"], required: true },
                { id: "githubProfile", label: "GitHub Profile / Project Portfolio URL", type: "text", required: false },
                { id: "motivation", label: "Why do you want to build autonomous systems with us?", type: "textarea", required: true }
              ]
            }
          },
          {
            name: "Student Verification & NOC",
            stageType: "DOCUMENT_UPLOAD",
            executionOrder: 2,
            config: {
              requiredDocuments: [
                { id: "studentIdProof", name: "Enrolled Student ID Card", required: true, allowedTypes: [".pdf", ".jpg", ".png"] }
              ]
            }
          },
          {
            name: "Club President Review",
            stageType: "MANUAL_REVIEW",
            executionOrder: 3,
            config: {
              reviewRequired: true,
              reviewerRole: "STUDENT_PRESIDENT"
            }
          }
        ]
      },
      {
        role: "STUDENT_PRESIDENT",
        title: "Club President & Executive Committee Verification",
        description: "Presidential verification endorsed by Faculty Advisor",
        stages: [
          {
            name: "Executive Committee Declaration",
            stageType: "FORM",
            executionOrder: 1,
            config: {
              fields: [
                { id: "termYear", label: "Tenure Year (e.g. 2026-2027)", type: "text", required: true },
                { id: "officialClubEmail", label: "Official Club Contact Email", type: "email", required: true }
              ]
            }
          },
          {
            name: "Faculty Endorsement Letter",
            stageType: "DOCUMENT_UPLOAD",
            executionOrder: 2,
            config: {
              requiredDocuments: [
                { id: "facultyAdvisorEndorsement", name: "Signed Faculty Advisor Appointment Letter", required: true, allowedTypes: [".pdf"] }
              ]
            }
          },
          {
            name: "Dean of Student Welfare Authorization",
            stageType: "MANUAL_REVIEW",
            executionOrder: 3,
            config: {
              reviewRequired: true,
              reviewerRole: "ORG_ADMIN"
            }
          }
        ]
      }
    ]
  }
];
