const sqlite3 = require('sqlite3').verbose();

// Le fichier 'soirees-jeux.db' sera créé s'il n'existe pas
const db = new sqlite3.Database('./soirees-jeux.db', (err) => {
  if (err) {
    return console.error("Erreur lors de la connexion à la base de données", err.message);
  }
  console.log("Connecté à la base de données SQLite.");

  // On active les clés étrangères pour assurer l'intégrité des données
  db.exec('PRAGMA foreign_keys = ON;', (err) => {
    if (err) console.error("Could not enable foreign keys", err.message);
  });

  // Création des tables (la logique reste ici)
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
    role TEXT NOT NULL DEFAULT 'player' CHECK(role IN ('admin', 'player')),
    password_hash TEXT NULL,
    session_token TEXT NULL
  )`, (err) => {
    if (!err) {
      // On insère des utilisateurs de test s'ils n'existent pas
      db.run(`INSERT OR IGNORE INTO users (id, name, role) VALUES 
        (1, 'Kiwi', 'admin'),
        (2, 'Zoë', 'player'),
        (3, 'Mathieu', 'player')`);
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS registrations (
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  console.log("Initialisation de la base de données terminée.");
});

// On exporte l'objet 'db' pour qu'il soit accessible depuis d'autres fichiers
module.exports = db;