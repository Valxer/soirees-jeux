const express = require('express');
const cors = require('cors');

// On importe nos routeurs
const eventRoutes = require('./routes/events.routes');
const userRoutes = require('./routes/users.routes');
const authRoutes = require('./routes/auth.routes');


const app = express();
const PORT = 3000;

// Configuration des middlewares globaux
app.use(cors());
app.use(express.json());

// === Branchement des routeurs ===
// Toutes les routes commençant par /api/events seront gérées par eventRoutes
app.use('/api/events', eventRoutes);

// Toutes les routes commençant par /api/users seront gérées par userRoutes
app.use('/api/users', userRoutes);

// Toutes les routes commençant par /api/auth seront gérées par authRoutes
app.use('/api/auth', authRoutes);

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});