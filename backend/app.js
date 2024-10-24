const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3030;

app.use(express.json());
app.use(cors());

let userRouter = require('./routes/user')

app.use('/User', userRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

