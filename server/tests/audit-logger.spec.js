const { logAuditEvent } = require('../src/utils/auditLogger');
const prisma = require('../src/config/prisma');

describe('Security & Action Audit Log (Milestone M1 - B7)', () => {
  it('should write an immutable audit event to prisma.auditEvent', async () => {
    const createSpy = jest.spyOn(prisma.auditEvent, 'create').mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000999',
    });

    await logAuditEvent({
      action: 'LOGIN_SUCCESS',
      entityType: 'USER',
      entityId: '00000000-0000-4000-8000-000000000123',
      userId: '00000000-0000-4000-8000-000000000123',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 TestBrowser',
      details: { email: 'student@example.com' },
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'LOGIN_SUCCESS',
          entityType: 'USER',
          entityId: '00000000-0000-4000-8000-000000000123',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 TestBrowser',
          newValue: { email: 'student@example.com' },
        }),
      })
    );
  });
});
