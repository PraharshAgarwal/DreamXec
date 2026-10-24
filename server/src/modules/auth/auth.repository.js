const PrismaAuthUserAdapter = require('./adapters/prisma-auth-user.adapter');
const PrismaAuthMembershipAdapter = require('./adapters/prisma-auth-membership.adapter');

const defaultUserRepository = new PrismaAuthUserAdapter();
const defaultMembershipRepository = new PrismaAuthMembershipAdapter();

module.exports = {
  userRepository: defaultUserRepository,
  membershipRepository: defaultMembershipRepository,
  UserRepository: PrismaAuthUserAdapter,
  MembershipRepository: PrismaAuthMembershipAdapter,
};
