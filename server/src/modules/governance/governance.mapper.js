function toApplicationDto(application) {
  if (!application) return null;
  return {
    id: application.id,
    projectTitle: application.projectTitle || application.title || null,
    status: application.status || 'PENDING',
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    user: application.user ? { id: application.user.id, name: application.user.name, email: application.user.email } : null,
  };
}

function toMentorDto(mentor) {
  if (!mentor) return null;
  return {
    id: mentor.id,
    bio: mentor.bio || null,
    expertise: mentor.expertise || [],
    available: mentor.available !== undefined ? mentor.available : true,
    user: mentor.user ? { id: mentor.user.id, name: mentor.user.name, profilePicture: mentor.user.profilePicture || null } : null,
  };
}

function toStudentVerificationDto(verification) {
  if (!verification) return null;
  return {
    id: verification.id,
    studentEmail: verification.studentEmail,
    officialEmail: verification.officialEmail,
    mobileNumber: verification.mobileNumber,
    status: verification.status,
    createdAt: verification.createdAt,
  };
}

module.exports = {
  toApplicationDto,
  toMentorDto,
  toStudentVerificationDto,
};
