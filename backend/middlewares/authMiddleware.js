const db = require('../database'); // On importe la connexion à la BDD

// ATTENTION : Ceci n'est PAS une vraie sécurité. Juste une simulation.
const isAdmin = (req, res, next) => {
  const adminId = req.headers['x-user-id'];
  if (!adminId) return res.status(401).json({ message: "ID utilisateur manquant" });

  db.get("SELECT role FROM users WHERE id = ?", [adminId], (err, user) => {
    if (err || !user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    if (user.role === 'admin') {
      next(); // L'utilisateur est admin, on continue
    } else {
      res.status(403).json({ message: "Accès refusé. Seuls les admins peuvent faire cette action." });
    }
  });
};

module.exports = { isAdmin };