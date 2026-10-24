const prisma = require('../../../config/prisma');

class PrismaMFAAdapter {
  async updateMFAData(userId, mfaData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileMetadata: true },
    });

    if (!user) return null;

    const existingMetadata = (typeof user.profileMetadata === 'object' && user.profileMetadata !== null)
      ? user.profileMetadata
      : {};

    const updatedMetadata = {
      ...existingMetadata,
      mfa: {
        ...(existingMetadata.mfa || {}),
        ...mfaData,
      },
    };

    return prisma.user.update({
      where: { id: userId },
      data: { profileMetadata: updatedMetadata },
    });
  }

  async getMFAData(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileMetadata: true },
    });

    if (!user || !user.profileMetadata || typeof user.profileMetadata !== 'object') {
      return null;
    }

    return user.profileMetadata.mfa || null;
  }
}

module.exports = new PrismaMFAAdapter();
