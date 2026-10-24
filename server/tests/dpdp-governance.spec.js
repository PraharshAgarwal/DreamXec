const userService = require('../src/modules/users/user.service');
const prisma = require('../src/config/prisma');

describe('DPDP Personal Data Compliance (Milestone M1 - O3)', () => {
  const testUserId = '00000000-0000-4000-8000-000000000099';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportUserData', () => {
    it('should aggregate user personal data into compliant DPDP payload', async () => {
      const mockUser = {
        id: testUserId,
        fullName: 'Arya Researcher',
        email: 'arya@example.com',
        secondaryEmail: 'arya.backup@example.com',
        username: 'arya_r',
        role: 'RESEARCHER',
        accountStatus: 'ACTIVE',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        profileMetadata: { orcid: '0000-0002-1825-0097' },
        assignedSpecies: {
          commonName: 'Bengal Tiger',
          scientificName: 'Panthera tigris tigris',
          avatarUrl: 'https://cdn.example.com/tiger.png',
        },
        speciesNumber: 12,
        memberships: [
          {
            id: 'mem-1',
            role: 'RESEARCHER',
            orgId: 'org-1',
            organization: { name: 'IISc Bangalore' },
            createdAt: new Date('2026-01-01'),
          },
        ],
        donations: [],
        docVaultItems: [],
        accountVaultItems: [],
        ledgerAccounts: [],
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await userService.exportUserData(testUserId);

      expect(result.complianceNotice).toContain('Section 11');
      expect(result.profile.fullName).toBe('Arya Researcher');
      expect(result.profile.email).toBe('arya@example.com');
      expect(result.memberships.length).toBe(1);
      expect(result.memberships[0].organizationName).toBe('IISc Bangalore');
      expect(result.profile.assignedSpecies.commonName).toBe('Bengal Tiger');
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(userService.exportUserData('nonexistent')).rejects.toThrow(
        /User not found/
      );
    });
  });

  describe('requestAccountDeletion', () => {
    it('should anonymize personal data, revoke sessions and mark status DELETED', async () => {
      const mockUser = {
        id: testUserId,
        fullName: 'Arya Researcher',
        email: 'arya@example.com',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      const updateSpy = jest.spyOn(prisma.user, 'update').mockResolvedValue({
        id: testUserId,
        accountStatus: 'DELETED',
      });
      const sessionSpy = jest.spyOn(prisma.session, 'updateMany').mockResolvedValue({ count: 2 });
      const docSpy = jest.spyOn(prisma.userDocVault, 'updateMany').mockResolvedValue({ count: 1 });
      const accSpy = jest.spyOn(prisma.userAccountVault, 'updateMany').mockResolvedValue({ count: 1 });

      const result = await userService.requestAccountDeletion(testUserId);

      expect(result.status).toBe('success');
      expect(result.message).toContain('DPDP Act, 2023');

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: testUserId },
          data: expect.objectContaining({
            accountStatus: 'DELETED',
            fullName: 'Deleted User',
            secondaryEmail: null,
            passwordHash: null,
          }),
        })
      );
      expect(sessionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: testUserId, status: 'ACTIVE' },
          data: expect.objectContaining({ status: 'REVOKED' }),
        })
      );
      expect(docSpy).toHaveBeenCalled();
      expect(accSpy).toHaveBeenCalled();
    });
  });
});
