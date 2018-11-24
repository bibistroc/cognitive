const express = require('express');
const app = express();

const port = 5000;

app.use(express.static('./dist'));

app.listen(port, () => console.log('You can see your presentation on http://localhost:' + port));