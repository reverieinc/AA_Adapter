const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3030;

app.use(express.json());
app.use(cors());

let userRouter = require('./routes/user');
let webViewRouter = require('./routes/webview');
let progressRouter = require('./routes/progress');
let authRouter = require('./routes/auth');
let ivrRouter = require('./routes/ivr');

app.use('/User', userRouter);
app.use('/webview', webViewRouter);
app.use('/progress', progressRouter);
app.use('/auth',authRouter);
app.use('/ivr', ivrRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

