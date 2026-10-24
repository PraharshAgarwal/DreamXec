/**
 * Sanitizes user profile object by stripping sensitive fields.
 */
function sanitizeProfile(profile) {
  if (!profile) return profile;
  const cleaned = { ...profile };
  delete cleaned.password;
  delete cleaned.verificationToken;
  delete cleaned.verificationTokenExpiry;
  delete cleaned.resetPasswordToken;
  delete cleaned.resetPasswordExpiry;
  delete cleaned.panNumber;
  return cleaned;
}

/**
 * Calculates profile completion percentage for a Student/Regular User.
 */
function calcStudentCompletion(u) {
  if (!u) return 0;
  const fields = [
    u.name,
    u.email,
    u.phone,
    u.gender,
    u.dateOfBirth,
    u.college,
    u.yearOfStudy,
    u.address,
    u.bio,
    Boolean(u.skills && u.skills.length > 0),
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

/**
 * Calculates profile completion percentage for a Donor.
 */
function calcDonorCompletion(d) {
  if (!d) return 0;
  const fields = [
    d.name,
    d.phone,
    d.gender,
    d.dateOfBirth,
    d.address,
    d.bio,
    d.organizationName,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

function toUserDto(user) {
  return sanitizeProfile(user);
}

function toUserListDto(users) {
  return {
    status: 'success',
    results: Array.isArray(users) ? users.length : 0,
    data: { users: Array.isArray(users) ? users.map(toUserDto) : [] },
  };
}

module.exports = {
  sanitizeProfile,
  calcStudentCompletion,
  calcDonorCompletion,
  toUserDto,
  toUserListDto,
};
