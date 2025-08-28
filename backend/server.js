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

  db.exec('PRAGMA foreign_keys = ON;', (err) => {
    if (err) console.error("Could not enable foreign keys", err.message);
  });

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

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'player' CHECK(role IN ('admin', 'player'))
  )`, (err) => {
    if (!err) {
      // On insère des utilisateurs de test s'ils n'existent pas
      db.run(`INSERT OR IGNORE INTO users (id, name, role) VALUES 
        (1, 'Alice (Admin)', 'admin'),
        (2, 'Bob', 'player'),
        (3, 'Charlie', 'player')`);
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS registrations (
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  console.log("Toutes les tables sont prêtes.");
});

// =================================================================
// API ROUTES
// =================================================================

// --- USERS ---
// Obtenir la liste des utilisateurs
app.get('/api/users', (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "success", data: rows });
  });
});

// Obtenir un utilisateur par son ID
app.get('/api/users/:id', (req, res) => {
  db.get("SELECT * FROM users WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "success", data: row });
  });
});


// --- MIDDLEWARE DE "SÉCURITÉ" ---
// ATTENTION : Ceci n'est PAS une vraie sécurité. Juste une simulation pour notre besoin.
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

// --- EVENTS ---
// READ - Obtenir la liste de tous les événements AVEC les participants
app.get('/api/events', (req, res) => {
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

// CREATE - Créer un nouvel événement (protégé par le middleware isAdmin)
app.post('/api/events', isAdmin, (req, res) => {
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

// DELETE - Supprimer un événement (protégé par le middleware isAdmin)
app.delete('/api/events/:id', isAdmin, (req, res) => {
  db.run("DELETE FROM events WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ "error": err.message });
    if (this.changes > 0) {
      res.json({ "message": "deleted", "changes": this.changes });
    } else {
      res.status(404).json({ "message": "Aucun événement trouvé avec cet ID." });
    }
  });
});


// --- REGISTRATIONS ---
// S'inscrire à un événement
app.post('/api/events/:id/register', (req, res) => {
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

// Se désinscrire d'un événement
app.delete('/api/events/:id/register', (req, res) => {
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


// 6. Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});