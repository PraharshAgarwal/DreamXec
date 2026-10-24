const jwt = require("jsonwebtoken");

function generateDevToken(userId, role = "USER", orgRoles = []) {
  const token = jwt.sign(
    { id: userId, role, orgRoles },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  return token;
}

module.exports = generateDevToken;
