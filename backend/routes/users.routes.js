const express = require('express');
const router = express.Router();
const db = require('../database');
const { isAdmin } = require('../middlewares/authMiddleware');
const bcrypt = require('bcrypt');

// READ - Obtenir tous les utilisateurs
router.get('/', (req, res) => {
  // On ajoute "password_hash IS NOT NULL as hasPassword" pour informer le front-end
  const sql = "SELECT id, name, role, password_hash IS NOT NULL as hasPassword FROM users";
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "success", data: rows });
  });
});

router.post('/:id/set-password', async (req, res) => {
  const { password } = req.body;
  const userId = req.params.id;
  if (!password) return res.status(400).json({ message: "Le mot de passe est requis." });
  
  // On vérifie que l'utilisateur est bien un admin et n'a pas déjà de mdp
  db.get("SELECT * FROM users WHERE id = ?", [userId], async (err, user) => {
    if (!user || user.role !== 'admin' || user.password_hash) {
      return res.status(403).json({ message: "Action non autorisée." });
    }
    
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    db.run("UPDATE users SET password_hash = ? WHERE id = ?", [password_hash, userId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Mot de passe défini avec succès." });
    });
  });
});

// READ - Obtenir un utilisateur par son ID
router.get('/:id', (req, res) => {
  db.get("SELECT * FROM users WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "success", data: row });
  });
});

// --- USER MANAGEMENT (protégé) ---
router.post('/', isAdmin, (req, res) => {
  const { name, role } = req.body;
  if (!name || !role) {
    return res.status(400).json({ error: "Les champs 'name' et 'role' sont requis." });
  }
  const sql = "INSERT INTO users (name, role) VALUES (?, ?)";
  db.run(sql, [name, role], function(err) {
    if (err) { // ex: nom déjà pris
      return res.status(400).json({ error: err.message });
    }
    res.status(201).json({
      message: "Utilisateur créé avec succès",
      data: { id: this.lastID, name, role }
    });
  });
});

router.put('/:id', isAdmin, (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Le champ 'name' est requis." });
  }
  const sql = "UPDATE users SET name = ? WHERE id = ?";
  db.run(sql, [name, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Utilisateur mis à jour", changes: this.changes });
  });
});

router.delete('/:id', isAdmin, (req, res) => {
  const adminId = req.headers['x-user-id'];
  const userIdToDelete = req.params.id;

  if (adminId === userIdToDelete) {
    return res.status(400).json({ message: "Un admin ne peut pas se supprimer lui-même." });
  }

  const sql = "DELETE FROM users WHERE id = ?";
  db.run(sql, [userIdToDelete], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Utilisateur supprimé", changes: this.changes });
  });
});

module.exports = router;