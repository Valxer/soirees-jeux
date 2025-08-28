// 1. Import des modules nécessaires
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

// 2. Initialisation de l'application Express
const app = express();
const PORT = 3000;

// 3. Configuration des middlewares
app.use(cors());
app.use(express.json());

// 4. Connexion à la base de données SQLite
const db = new sqlite3.Database('./soirees-jeux.db', (err) => {
  if (err) {
    return console.error("Erreur lors de la connexion à la base de données", err.message);
  }
  console.log("Connecté à la base de données SQLite 'soirees-jeux'.");
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    max_players INTEGER NOT NULL,
    current_players INTEGER DEFAULT 0
  )`, (err) => {
    if (err) {
      return console.error("Erreur lors de la création de la table 'events'", err.message);
    }
    console.log("Table 'events' prête.");
  });
});

// =================================================================
// API ROUTES (Nos nouvelles routes)
// =================================================================

// READ - Obtenir la liste de tous les événements
app.get('/api/events', (req, res) => {
  const sql = "SELECT * FROM events ORDER BY date ASC";
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ "error": err.message });
      return;
    }
    res.json({
      "message": "success",
      "data": rows
    });
  });
});

// READ - Obtenir un événement spécifique par son ID
app.get('/api/events/:id', (req, res) => {
    const sql = "SELECT * FROM events WHERE id = ?";
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
          res.status(500).json({ "error": err.message });
          return;
        }
        if (row) {
            res.json({
                "message": "success",
                "data": row
            });
        } else {
            res.status(404).json({ "message": "Aucun événement trouvé avec cet ID." });
        }
    });
});

// CREATE - Créer un nouvel événement
app.post('/api/events', (req, res) => {
  const { name, date, max_players } = req.body;
  if (!name || !date || !max_players) {
    res.status(400).json({ "error": "Veuillez fournir name, date et max_players." });
    return;
  }
  const sql = "INSERT INTO events (name, date, max_players) VALUES (?, ?, ?)";
  db.run(sql, [name, date, max_players], function(err) {
    if (err) {
      res.status(500).json({ "error": err.message });
      return;
    }
    res.status(201).json({
      "message": "success",
      "data": { id: this.lastID, name, date, max_players, current_players: 0 }
    });
  });
});

// UPDATE - S'inscrire à un événement (Incrémenter le nombre de joueurs)
app.patch('/api/events/:id/register', (req, res) => {
    const id = req.params.id;
    const getSql = "SELECT * FROM events WHERE id = ?";

    db.get(getSql, [id], (err, event) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }
        if (!event) {
            return res.status(404).json({ "message": "Événement non trouvé." });
        }
        if (event.current_players >= event.max_players) {
            return res.status(400).json({ "message": "L'événement est complet." });
        }

        const updateSql = "UPDATE events SET current_players = current_players + 1 WHERE id = ?";
        db.run(updateSql, [id], function(err) {
            if (err) {
                return res.status(500).json({ "error": err.message });
            }
            res.json({
                "message": `Inscription réussie à l'événement '${event.name}'`,
                "data": { ...event, current_players: event.current_players + 1 }
            });
        });
    });
});


// DELETE - Supprimer un événement
app.delete('/api/events/:id', (req, res) => {
  const sql = "DELETE FROM events WHERE id = ?";
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ "error": err.message });
      return;
    }
    if (this.changes > 0) {
        res.json({ "message": "deleted", "changes": this.changes });
    } else {
        res.status(404).json({ "message": "Aucun événement trouvé avec cet ID." });
    }
  });
});


// 6. Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});