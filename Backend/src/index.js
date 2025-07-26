import express from 'express';
const app = express();
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
app.get('/healthcheck', (req, res) => {
  res.send('API is working!');
});