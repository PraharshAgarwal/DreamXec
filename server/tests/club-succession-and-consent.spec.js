const prisma = require('../src/config/prisma');
const userService = require('../src/modules/users/user.service');
const defaultClubRepository = require('../src/modules/clubs/adapters/prisma-club-repository.adapter');

describe('DPDP Consent Logging (Milestone M1 - O3)', () => {
  it('should record immutable consent and update profile metadata', async () => {
    const testUserId = '00000000-0000-4000-8000-000000000088';
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: testUserId,
      email: 'consent.user@example.com',
      profileMetadata: {},
    });
    const updateSpy = jest.spyOn(prisma.user, 'update').mockResolvedValue({
      id: testUserId,
    });
    const auditSpy = jest.spyOn(prisma.auditEvent, 'create').mockResolvedValue({
      id: 'audit-1',
    });

    const result = await userService.recordDpdpConsent(testUserId, {
      version: '2026.1',
      termsAccepted: true,
      privacyNoticeAccepted: true,
      ipAddress: '192.168.1.5',
    });

    expect(result.status).toBe('success');
    expect(result.data.consent.version).toBe('2026.1');
    expect(result.data.consent.ipAddress).toBe('192.168.1.5');
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: testUserId },
        data: expect.objectContaining({
          profileMetadata: expect.objectContaining({
            dpdpConsent: expect.objectContaining({ version: '2026.1' }),
          }),
        }),
      })
    );
  });
});

describe('Club President Succession Workflow (Milestone M1 - C6)', () => {
  it('should transfer presidency to successor and transition outgoing president to ALUMNI', async () => {
    const clubId = '00000000-0000-4000-8000-000000000101';
    const currentPresId = '00000000-0000-4000-8000-000000000102';
    const successorId = '00000000-0000-4000-8000-000000000103';

    const mockClub = {
      id: clubId,
      name: 'Robotics Club',
      slug: 'robotics-club',
      memberships: [
        { id: 'mem-pres', userId: currentPresId, role: 'STUDENT_PRESIDENT' },
      ],
    };

    jest.spyOn(prisma.organization, 'findFirst').mockResolvedValue(mockClub);
    jest.spyOn(prisma.user, 'findUnique').mockImplementation(async ({ where }) => {
      if (where.id === currentPresId) return { id: currentPresId, fullName: 'Outgoing President', role: 'STUDENT_PRESIDENT' };
      if (where.id === successorId) return { id: successorId, fullName: 'Incoming President', role: 'STUDENT' };
      return null;
    });

    const upsertSpy = jest.spyOn(prisma.membership, 'upsert').mockResolvedValue({ id: 'mem-new' });
    const updateMemSpy = jest.spyOn(prisma.membership, 'update').mockResolvedValue({ id: 'mem-pres' });
    const auditSpy = jest.spyOn(prisma.auditEvent, 'create').mockResolvedValue({ id: 'audit-2' });

    const result = await defaultClubRepository.transferPresidency(clubId, currentPresId, {
      successorUserId: successorId,
      newOutgoingRole: 'ALUMNI',
      handoverNotes: 'Graduating batch of 2026',
    });

    expect(result.clubId).toBe(clubId);
    expect(result.successor.id).toBe(successorId);
    expect(result.outgoingPresident.newRole).toBe('ALUMNI');

    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_organizationId_role: {
            userId: successorId,
            organizationId: clubId,
            role: 'STUDENT_PRESIDENT',
          },
        },
      })
    );

    expect(updateMemSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'mem-pres' },
        data: expect.objectContaining({
          role: 'ALUMNI',
        }),
      })
    );
  });
});
