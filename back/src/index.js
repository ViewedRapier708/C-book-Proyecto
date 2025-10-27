// Load environment variables early
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler (placeholder)
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// Initialize DB and start server
const db = require('./config/db');
db.connect()
	.then(() => {
		app.listen(port, () => console.log(`Server running on port ${port}`));
	})
	.catch((err) => {
		console.error('Failed to start server due to DB error:', err);
		process.exit(1);
	});

module.exports = app;
