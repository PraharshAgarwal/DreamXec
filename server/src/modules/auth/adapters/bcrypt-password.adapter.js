const bcrypt = require('bcryptjs');
const PasswordHasherPort = require('../ports/password-hasher.port');

class BcryptPasswordAdapter extends PasswordHasherPort {
  constructor(saltRounds = 10) {
    super();
    this.saltRounds = saltRounds;
  }

  async hash(password) {
    return bcrypt.hash(password, this.saltRounds);
  }

  async verify(password, hashedPassword) {
    if (!password || !hashedPassword) return false;
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = new BcryptPasswordAdapter();
