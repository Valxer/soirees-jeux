const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');


// Route de connexion principale
router.post('/login', (req, res) => {
  const { userId, password, sessionToken } = req.body;
  if (!userId) return res.status(400).json({ message: "userId est requis." });

  const sql = "SELECT * FROM users WHERE id = ?";
  db.get(sql, [userId], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    // Cas 1 : Connexion avec un jeton de session (pour les rechargements de page)
    if (sessionToken && user.role === 'admin') {
      if (user.session_token && user.session_token === sessionToken) {
        return res.json({ message: "Connexion réussie via jeton", data: { ...user, sessionToken } });
      } else {
        return res.status(401).json({ message: "Jeton de session invalide ou expiré." });
      }
    }
    
    // Cas 2 : Connexion d'un joueur (sans mot de passe)
    if (user.role === 'player') {
      return res.json({ message: "Connexion réussie", data: user });
    }

    // Cas 3 : Connexion d'un admin
    if (user.role === 'admin') {
      if (!user.password_hash) {
        return res.json({ message: "Configuration du mot de passe requise", needsPasswordSetup: true, data: user });
      }
      if (!password) return res.status(400).json({ message: "Le mot de passe est requis pour un admin." });

      const match = await bcrypt.compare(password, user.password_hash);
      if (match) {
        // Le mot de passe est bon ! On génère un nouveau jeton de session.
        const newSessionToken = crypto.randomBytes(32).toString('hex');
        db.run("UPDATE users SET session_token = ? WHERE id = ?", [newSessionToken, userId]);
        
        // On renvoie l'utilisateur ET le jeton au front-end
        return res.json({ message: "Connexion réussie", data: { ...user, sessionToken: newSessionToken } });
      } else {
        return res.status(401).json({ message: "Mot de passe incorrect." });
      }
    }
  });
});

router.post('/logout', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "userId est requis." });
  
  // On efface le jeton dans la base de données
  db.run("UPDATE users SET session_token = NULL WHERE id = ?", [userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Déconnexion réussie." });
  });
});

module.exports = router;