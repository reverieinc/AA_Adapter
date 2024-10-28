const { default: axios } = require('axios');
const express = require('express');
const router = express.Router();


router.post('/', async (req, res) => {
    try {
        let body = req.body;
        let name = body.name;
        let mobile = body.mobile;
        let sessionId = body.sessionId;
        let data = JSON.stringify([
            {
                "recipient_phone_number": "+918104035237",
                "conversation_id": "243820",
                name,
                "session_id": sessionId,

            }
        ]);

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'http://172.18.0.04:8765/bulk_call',
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };

        axios.request(config)
            .then((response) => {
                console.log(response.ok);
                res.status(200).json({ message: 'IVR triggered successfully' });
                return;

            })
            .catch((error) => {
                console.log(error.message);
                res.status(500).json({ status: 'ERROR', message: 'Internal Server Error' });
                return;

            });


    }
    catch (err) {
        console.log(err.message);
        res.status(500).json({ status: 'ERROR', message: 'Internal Server Error' });
        return;

    }
})

module.exports = router;