const prisma = require('../../../config/prisma');
const ClubRepositoryPort = require('../ports/club-repository.port');

class PrismaClubRepositoryAdapter extends ClubRepositoryPort {
  async findPublicClubs({ search, page = 1, limit = 10, orgId, scope, sort = 'newest' } = {}) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = {
      orgType: 'CLUB',
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };

    if (scope === 'org' && orgId) {
      where.parentId = orgId;
    } else if (scope === 'independent') {
      where.parentId = null;
    } else if (orgId) {
      where.OR = [
        { parentId: orgId },
        { parentId: null },
      ];
    } else if (scope === 'explore_all') {
      // Explicitly allow browsing all institutions if requested
    } else {
      // By default without enrolled organisation, display clubs not under any organisation
      where.parentId = null;
    }

    const orderBy = sort === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };

    const [clubs, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
              orgType: true,
            },
          },
          _count: {
            select: {
              memberships: true,
              tenantCampaigns: true,
            },
          },
          tenantCampaigns: {
            where: {
              status: { in: ['LIVE', 'FULLY_FUNDED', 'DISBURSING', 'COMPLETED'] },
            },
            select: {
              currentRaisedAmount: true,
            },
          },
        },
      }),
      prisma.organization.count({ where }),
    ]);

    return {
      clubs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async findById(id) {
    if (!id) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    return prisma.organization.findFirst({
      where: {
        orgType: 'CLUB',
        ...(isUuid ? { OR: [{ id }, { slug: id }] } : { slug: id }),
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            orgType: true,
          },
        },
        _count: {
          select: {
            memberships: true,
            tenantCampaigns: true,
          },
        },
        tenantCampaigns: {
          where: {
            status: { in: ['LIVE', 'FULLY_FUNDED', 'DISBURSING', 'COMPLETED'] },
          },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            currentRaisedAmount: true,
            targetAmount: true,
            category: true,
            status: true,
            coverImageUrl: true,
            createdAt: true,
            student: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            milestones: {
              select: {
                id: true,
                title: true,
                status: true,
                targetAmount: true,
                sequenceOrder: true,
              },
              orderBy: { sequenceOrder: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        memberships: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            id: true,
            role: true,
            designation: true,
            department: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                profileMetadata: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
          take: 30,
        },
      },
    });
  }

  async joinClub(clubId, userId, role = 'STUDENT') {
    const club = await this.findById(clubId);
    if (!club) {
      const AppError = require('../../../utils/AppError');
      throw new AppError(`Club '${clubId}' not found`, 404);
    }

    const targetRole = (role || 'STUDENT').toUpperCase();
    const allowedRoles = (club.allowedRoles && club.allowedRoles.length > 0)
      ? club.allowedRoles.map((r) => r.toUpperCase())
      : ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'];

    if (!allowedRoles.includes(targetRole)) {
      const AppError = require('../../../utils/AppError');
      throw new AppError(
        `Role '${targetRole}' is not permitted for club '${club.name}'. Allowed roles: ${allowedRoles.join(', ')}`,
        400
      );
    }

    // Check existing active membership for this user in this club and role
    const existing = await prisma.membership.findFirst({
      where: {
        organizationId: club.id,
        userId,
        role: targetRole,
      },
    });

    if (existing && existing.status === 'ACTIVE') {
      return {
        alreadyActive: true,
        club: { id: club.id, name: club.name, slug: club.slug },
        role: targetRole,
        membership: existing,
        message: `You are already an active verified ${targetRole} member of ${club.name}.`,
      };
    }

    // Role-based workflow initiation
    const governanceService = require('../../governance/governance.service');
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const workflowInstance = await governanceService.startWorkflowInstance({
      organizationId: club.id,
      role: targetRole,
      applicantId: userId,
      applicantEmail: user?.email,
      applicantName: user?.fullName || user?.name,
    });

    const pendingMembership = await prisma.membership.findFirst({
      where: {
        organizationId: club.id,
        userId,
        role: targetRole,
      },
    });

    return {
      requiresWorkflow: workflowInstance.status !== 'COMPLETED',
      club: { id: club.id, name: club.name, slug: club.slug },
      role: targetRole,
      workflowInstanceId: workflowInstance.id,
      workflowInstance,
      membership: pendingMembership,
      message: workflowInstance.status === 'COMPLETED'
        ? `Successfully joined ${club.name} as ${targetRole}!`
        : `Verification workflow initiated for ${club.name} as ${targetRole}. Please complete your verification stages.`,
    };
  }

  async createReferral(referralData) {
    if (prisma.clubReferral) {
      return prisma.clubReferral.create({
        data: referralData,
      });
    }
    return referralData;
  }

  async addMembers(clubId, membersList) {
    if (!clubId) {
      const error = new Error('Club ID or slug is required');
      error.statusCode = 400;
      throw error;
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clubId);
    const existingOrg = await prisma.organization.findFirst({
      where: {
        ...(isUuid ? { OR: [{ id: clubId }, { slug: clubId }] } : { slug: clubId }),
      },
      select: { id: true, name: true, slug: true, orgType: true },
    });

    if (!existingOrg) {
      const error = new Error(`Organization or Club '${clubId}' not found`);
      error.statusCode = 404;
      throw error;
    }

    let processed = 0;
    let created = 0;
    let updated = 0;
    let matchedUsers = 0;
    const errors = [];

    const allowedOrgRoles = ['STUDENT', 'RESEARCHER', 'PROFESSOR', 'STUDENT_PRESIDENT', 'ORG_ADMIN', 'MENTOR', 'ALUMNI', 'VOLUNTEER'];

    for (const member of (membersList || [])) {
      processed++;
      try {
        const email = String(member.email || '').trim().toLowerCase();
        if (!email || !email.includes('@')) {
          errors.push({ member: member.email || `Row ${processed}`, message: 'Invalid or missing email address' });
          continue;
        }

        const requestedRole = String(member.role || 'STUDENT').toUpperCase();
        const role = allowedOrgRoles.includes(requestedRole) ? requestedRole : 'STUDENT';

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          const generatedUsername = (member.fullName ? member.fullName.toLowerCase().replace(/[^a-z0-9]/g, '_') : email.split('@')[0]) + '_' + Math.floor(1000 + Math.random() * 9000);
          user = await prisma.user.create({
            data: {
              email,
              fullName: member.fullName || email.split('@')[0],
              username: generatedUsername,
              passwordHash: null,
              role: 'USER',
              accountStatus: 'ACTIVE',
              profileMetadata: {
                phone: member.phone || '',
                department: member.department || '',
                importedViaCsv: true,
                importedAt: new Date().toISOString(),
              },
            },
          });
          created++;
        } else {
          matchedUsers++;
        }

        const existingMembership = await prisma.membership.findUnique({
          where: {
            userId_organizationId_role: {
              userId: user.id,
              organizationId: existingOrg.id,
              role,
            },
          },
        });

        if (existingMembership) {
          await prisma.membership.update({
            where: { id: existingMembership.id },
            data: {
              status: 'ACTIVE',
              department: member.department || existingMembership.department,
              designation: member.designation || existingMembership.designation,
            },
          });
          updated++;
        } else {
          await prisma.membership.create({
            data: {
              userId: user.id,
              organizationId: existingOrg.id,
              role,
              status: 'ACTIVE',
              department: member.department || null,
              designation: member.designation || null,
              joinedAt: new Date(),
            },
          });
          updated++;
        }
      } catch (rowErr) {
        errors.push({ member: member.email || `Row ${processed}`, message: rowErr.message });
      }
    }

    return {
      clubId: existingOrg.id,
      processed,
      created,
      updated,
      matchedUsers,
      errors,
    };
  }

  async transferPresidency(clubId, callerUserId, { successorUserId, newOutgoingRole = 'ALUMNI', handoverNotes }) {
    if (!clubId || !successorUserId) {
      const error = new Error('Club ID and successorUserId are required');
      error.statusCode = 400;
      throw error;
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clubId);
    const club = await prisma.organization.findFirst({
      where: {
        ...(isUuid ? { OR: [{ id: clubId }, { slug: clubId }] } : { slug: clubId }),
      },
      include: {
        memberships: true,
      },
    });

    if (!club) {
      const error = new Error(`Club '${clubId}' not found`);
      error.statusCode = 404;
      throw error;
    }

    // Verify caller has president or admin authority
    const callerUser = await prisma.user.findUnique({ where: { id: callerUserId } });
    const isGlobalAdmin = callerUser && ['ADMIN', 'SUPER_ADMIN'].includes(callerUser.role);
    const callerMembership = club.memberships.find((m) => m.userId === callerUserId && (m.role === 'STUDENT_PRESIDENT' || m.role === 'ORG_ADMIN'));

    if (!isGlobalAdmin && !callerMembership) {
      const error = new Error('Only the current club president or an administrator can execute succession handover.');
      error.statusCode = 403;
      throw error;
    }

    const successor = await prisma.user.findUnique({ where: { id: successorUserId } });
    if (!successor) {
      const error = new Error('Successor user not found');
      error.statusCode = 404;
      throw error;
    }

    const outgoingRole = ['ALUMNI', 'STUDENT'].includes(newOutgoingRole) ? newOutgoingRole : 'ALUMNI';

    // 1. Promote successor to STUDENT_PRESIDENT
    await prisma.membership.upsert({
      where: {
        userId_organizationId_role: {
          userId: successor.id,
          organizationId: club.id,
          role: 'STUDENT_PRESIDENT',
        },
      },
      update: {
        status: 'ACTIVE',
        designation: 'Club President & Student Lead',
      },
      create: {
        userId: successor.id,
        organizationId: club.id,
        role: 'STUDENT_PRESIDENT',
        status: 'ACTIVE',
        designation: 'Club President & Student Lead',
        joinedAt: new Date(),
      },
    });

    // 2. Transition outgoing president to ALUMNI/STUDENT
    const currentPresMembership = club.memberships.find((m) => m.role === 'STUDENT_PRESIDENT' && m.userId !== successor.id);
    if (currentPresMembership) {
      await prisma.membership.update({
        where: { id: currentPresMembership.id },
        data: {
          role: outgoingRole,
          designation: outgoingRole === 'ALUMNI' ? 'Former President & Alumni Mentor' : 'Former President',
        },
      });
    }

    // 3. Log audit event
    const { logAuditEvent } = require('../../../utils/auditLogger');
    await logAuditEvent({
      action: 'CLUB_PRESIDENCY_SUCCESSION',
      entityType: 'ORGANIZATION',
      entityId: club.id,
      tenantId: club.id,
      performedBy: callerUserId,
      details: {
        previousPresidentUserId: currentPresMembership?.userId || callerUserId,
        successorUserId: successor.id,
        successorName: successor.fullName,
        outgoingRole,
        handoverNotes,
      },
    });

    return {
      clubId: club.id,
      clubName: club.name,
      successor: { id: successor.id, fullName: successor.fullName, role: 'STUDENT_PRESIDENT' },
      outgoingPresident: {
        id: currentPresMembership?.userId || callerUserId,
        newRole: outgoingRole,
      },
      handoverDate: new Date().toISOString(),
    };
  }

  async updateProfile(clubId, userId, profileData) {
    if (!clubId) {
      const error = new Error('Club ID or slug is required');
      error.statusCode = 400;
      throw error;
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clubId);
    const existingOrg = await prisma.organization.findFirst({
      where: {
        orgType: 'CLUB',
        ...(isUuid ? { OR: [{ id: clubId }, { slug: clubId }] } : { slug: clubId }),
      },
      include: {
        memberships: {
          where: { userId, status: 'APPROVED' },
        },
      },
    });

    if (!existingOrg) {
      const error = new Error(`Club '${clubId}' not found`);
      error.statusCode = 404;
      throw error;
    }

    // Check user authorization
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    const isSiteAdmin = userRecord && ['ADMIN', 'DX_ADMIN', 'SUPER_ADMIN'].includes(userRecord.role);
    const isClubLead = existingOrg.memberships && existingOrg.memberships.some(
      (m) => m.role === 'STUDENT_PRESIDENT' || m.role === 'ORG_ADMIN'
    );

    if (!isSiteAdmin && !isClubLead && userRecord?.role !== 'STUDENT_PRESIDENT') {
      const error = new Error('Forbidden: Only the club president or platform administrator can update this club profile.');
      error.statusCode = 403;
      throw error;
    }

    const currentMetadata = (existingOrg.metadata && typeof existingOrg.metadata === 'object') ? existingOrg.metadata : {};
    const updatedMetadata = {
      ...currentMetadata,
      ...(profileData.motto !== undefined ? { motto: profileData.motto } : {}),
      ...(profileData.tagline !== undefined ? { tagline: profileData.tagline } : {}),
      ...(profileData.category !== undefined ? { category: profileData.category } : {}),
      ...(profileData.labLocation !== undefined ? { labLocation: profileData.labLocation } : {}),
      ...(profileData.meetingSchedule !== undefined ? { meetingSchedule: profileData.meetingSchedule } : {}),
      ...(profileData.facultyAdvisor !== undefined ? { facultyAdvisor: profileData.facultyAdvisor } : {}),
      ...(profileData.technicalStacks !== undefined ? { technicalStacks: profileData.technicalStacks } : {}),
      ...(profileData.facilities !== undefined ? { facilities: profileData.facilities } : {}),
    };

    const updated = await prisma.organization.update({
      where: { id: existingOrg.id },
      data: {
        metadata: updatedMetadata,
        ...(profileData.name ? { name: profileData.name } : {}),
        ...(profileData.description !== undefined ? { description: profileData.description } : {}),
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            orgType: true,
          },
        },
        _count: {
          select: {
            memberships: true,
            tenantCampaigns: true,
          },
        },
        tenantCampaigns: {
          where: {
            status: { in: ['LIVE', 'FULLY_FUNDED', 'DISBURSING', 'COMPLETED'] },
          },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            currentRaisedAmount: true,
            targetAmount: true,
            category: true,
            status: true,
            coverImageUrl: true,
            createdAt: true,
            student: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            milestones: {
              select: {
                id: true,
                title: true,
                status: true,
                targetAmount: true,
                sequenceOrder: true,
              },
              orderBy: { sequenceOrder: 'asc' },
            },
          },
        },
        memberships: {
          where: { status: 'APPROVED' },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return toClubDto(updated);
  }

  async findVerifications({ status, skip = 0, take = 50 } = {}) {
    if (prisma.clubVerification) {
      const where = status ? { status } : {};
      return prisma.clubVerification.findMany({
        where,
        select: { id: true, clubName: true, collegeName: true, presidentName: true, status: true, createdAt: true, userId: true },
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(take),
      });
    }
    if (prisma.verification) {
      const where = status ? { status } : {};
      return prisma.verification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(take),
      });
    }
    return [];
  }

  async findVerificationById(id) {
    if (prisma.clubVerification) {
      return prisma.clubVerification.findUnique({ where: { id } });
    }
    if (prisma.verification) {
      return prisma.verification.findUnique({ where: { id } });
    }
    return null;
  }

  async approveVerificationTransaction(id) {
    const generateClubSlug = require('../utils/generateClubSlug');
    return prisma.$transaction(async (tx) => {
      if (tx.clubVerification) {
        const verification = await tx.clubVerification.findUnique({ where: { id } });
        if (!verification) {
          const error = new Error('Verification not found');
          error.statusCode = 404;
          throw error;
        }
        if (!verification.userId) {
          const error = new Error('Verification is not linked to a user');
          error.statusCode = 400;
          throw error;
        }
        await tx.clubVerification.update({ where: { id }, data: { status: 'APPROVED' } });
        const safeClubName = verification.clubName || `${verification.collegeName} Club`;
        const uniqueSlug = await generateClubSlug(safeClubName, verification.collegeName);
        
        let club;
        if (tx.club) {
          club = await tx.club.create({
            data: {
              name: safeClubName,
              slug: uniqueSlug,
              college: verification.collegeName,
              description: verification.clubDescription || 'Student Club',
              presidentEmail: verification.studentEmail,
              presidentUserId: verification.userId,
            },
          });
          await tx.user.update({
            where: { id: verification.userId },
            data: {
              role: 'STUDENT_PRESIDENT',
              clubVerified: true,
              isClubPresident: true,
              isClubMember: true,
              canCreateCampaign: true,
              clubs: { connect: [{ id: club.id }] },
            },
          });
          if (tx.clubMember) {
            await tx.clubMember.create({
              data: {
                clubId: club.id,
                email: verification.studentEmail,
                name: verification.presidentName,
                userId: verification.userId,
                isUserRegistered: true,
                isVerified: true,
                addedBy: verification.userId,
              },
            });
          }
        } else {
          club = await tx.organization.create({
            data: {
              name: safeClubName,
              slug: uniqueSlug,
              orgType: 'CLUB',
              hierarchyPath: uniqueSlug,
              lifecycleStatus: 'ACTIVE',
              allowedRoles: ['STUDENT_PRESIDENT', 'STUDENT', 'ORG_ADMIN'],
            },
          });
          await tx.user.update({
            where: { id: verification.userId },
            data: {
              role: 'STUDENT_PRESIDENT',
            },
          });
          if (tx.membership) {
            await tx.membership.create({
              data: {
                organizationId: club.id,
                userId: verification.userId,
                role: 'STUDENT_PRESIDENT',
                status: 'APPROVED',
              },
            });
          }
        }
        return club;
      }

      if (tx.verification) {
        const verification = await tx.verification.findUnique({ where: { id } });
        if (!verification) {
          const error = new Error('Verification not found');
          error.statusCode = 404;
          throw error;
        }
        return tx.verification.update({
          where: { id },
          data: { status: 'APPROVED' },
        });
      }

      return null;
    });
  }

  async rejectVerification(id, { reason, reviewedBy }) {
    if (prisma.clubVerification) {
      return prisma.clubVerification.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: reason || 'No reason specified',
          reviewedBy: reviewedBy || null,
          reviewedAt: new Date(),
        },
      });
    }
    if (prisma.verification) {
      return prisma.verification.update({
        where: { id },
        data: {
          status: 'REJECTED',
        },
      });
    }
    return null;
  }

  async findReferralRequests({ status, skip = 0, take = 50 } = {}) {
    if (prisma.clubReferralRequest) {
      const where = status ? { status } : {};
      return prisma.clubReferralRequest.findMany({
        where,
        select: { id: true, clubName: true, collegeName: true, referrerEmail: true, presidentName: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(take),
      });
    }
    return [];
  }

  async findReferralRequestById(id) {
    if (prisma.clubReferralRequest) {
      return prisma.clubReferralRequest.findUnique({ where: { id } });
    }
    return null;
  }

  async updateReferralRequest(id, data) {
    if (prisma.clubReferralRequest) {
      return prisma.clubReferralRequest.update({
        where: { id },
        data,
      });
    }
    return null;
  }
}

module.exports = new PrismaClubRepositoryAdapter();
module.exports.PrismaClubRepositoryAdapter = PrismaClubRepositoryAdapter;
