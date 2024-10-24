const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3030;

app.use(express.json());
app.use(cors());

let userRouter = require('./routes/user');
let webViewRouter = require('./routes/webview');

app.use('/User', userRouter);
app.use('/webview', webViewRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

