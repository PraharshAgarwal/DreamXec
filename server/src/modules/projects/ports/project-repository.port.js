/**
 * Abstract Port defining database persistence contract for Projects.
 * @abstract
 */
class ProjectRepositoryPort {
  async createProject(userId, projectData) {
    throw new Error('Method ProjectRepositoryPort.createProject() must be implemented.');
  }

  async findByIdOrSlug(identifier) {
    throw new Error('Method ProjectRepositoryPort.findByIdOrSlug() must be implemented.');
  }

  async findPublicProjects({ cursor, limit }) {
    throw new Error('Method ProjectRepositoryPort.findPublicProjects() must be implemented.');
  }

  async findUserProjects(userId) {
    throw new Error('Method ProjectRepositoryPort.findUserProjects() must be implemented.');
  }

  async findDonorProjects() {
    throw new Error('Method ProjectRepositoryPort.findDonorProjects() must be implemented.');
  }

  async updateProject(id, updateData) {
    throw new Error('Method ProjectRepositoryPort.updateProject() must be implemented.');
  }

  async deleteProject(id) {
    throw new Error('Method ProjectRepositoryPort.deleteProject() must be implemented.');
  }
}

module.exports = ProjectRepositoryPort;
