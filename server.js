// Entry point root redirect to backend/server.js
const app = require('./backend/server.js');
const PORT = process.env.PORT || 5000;

if (process.env.VERCEL !== '1' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`Lost2Found Server running on port ${PORT}`);
  });
}

module.exports = app;
