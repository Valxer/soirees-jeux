const express = require('express');
const router = express.Router(); // On crée un routeur
const db = require('../database');
const { isAdmin } = require('../middlewares/authMiddleware');

// READ - Obtenir tous les événements
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      e.*, 
      (SELECT json_group_array(json_object('id', u.id, 'name', u.name)) 
       FROM registrations r JOIN users u ON r.user_id = u.id 
       WHERE r.event_id = e.id) as participants
    FROM events e
    ORDER BY e.date ASC`;
  
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ "error": err.message });
    // On parse le JSON des participants qui est retourné comme une string par SQLite
    const events = rows.map(event => ({
        ...event,
        participants: event.participants ? JSON.parse(event.participants) : []
    }));
    res.json({ "message": "success", "data": events });
  });
});

// CREATE - Créer un événement
router.post('/', isAdmin, (req, res) => {
  const { name, date, max_players } = req.body;
  if (!name || !date || !max_players) {
    return res.status(400).json({ "error": "Veuillez fournir name, date et max_players." });
  }
  const sql = "INSERT INTO events (name, date, max_players) VALUES (?, ?, ?)";
  db.run(sql, [name, date, max_players], function(err) {
    if (err) return res.status(500).json({ "error": err.message });
    res.status(201).json({
      "message": "success",
      "data": { id: this.lastID, name, date, max_players, current_players: 0, participants: [] }
    });
  });
});

// DELETE - Supprimer un événement
router.delete('/:id', isAdmin, (req, res) => {
  db.run("DELETE FROM events WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ "error": err.message });
    if (this.changes > 0) {
      res.json({ "message": "deleted", "changes": this.changes });
    } else {
      res.status(404).json({ "message": "Aucun événement trouvé avec cet ID." });
    }
  });
});

// S'inscrire à un événement
router.post('/:id/register', (req, res) => {
  const eventId = req.params.id;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "userId est requis." });

  const checkEventSql = "SELECT * FROM events WHERE id = ?";
  db.get(checkEventSql, [eventId], (err, event) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!event) return res.status(404).json({ message: "Événement non trouvé." });
    if (event.current_players >= event.max_players) {
      return res.status(400).json({ message: "L'événement est complet." });
    }

    db.run("INSERT INTO registrations (event_id, user_id) VALUES (?, ?)", [eventId, userId], function(err) {
      if (err) return res.status(400).json({ message: "Inscription déjà existante." });
      
      db.run("UPDATE events SET current_players = current_players + 1 WHERE id = ?", [eventId], () => {
        res.status(201).json({ message: "Inscription réussie." });
      });
    });
  });
});

// Se désinscrire
router.delete('/:id/register', (req, res) => {
  const eventId = req.params.id;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "userId est requis." });

  db.run("DELETE FROM registrations WHERE event_id = ? AND user_id = ?", [eventId, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes > 0) {
      db.run("UPDATE events SET current_players = current_players - 1 WHERE id = ?", [eventId], () => {
        res.json({ message: "Désinscription réussie." });
      });
    } else {
      res.status(404).json({ message: "Inscription non trouvée." });
    }
  });
});

module.exports = router; // On exporte le routeur