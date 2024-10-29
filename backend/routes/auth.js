const { default: axios } = require('axios');
let express = require('express')
const router = express.Router();

const configureApp = async () => {

}

const configureFIU = async () => {

}

const configureAA = async () => {

}

router.post('/', async (req, res) => {
    try {
        let headers = req.headers;
        let fiuEntityId = headers['fiu_entity_id'];
        let aaEntityId = headers['aa_entity_id'];
        let body = req.body;

        let data = JSON.stringify({
            "redirect_params": {
                "callback_url": "https://bootstack.xyz"
            },
            "consents": [
                {
                    "consent_start": "2024-10-28T11:26:11.856Z",
                    "consent_expiry": "2026-12-31T00:00:00.000Z",
                    "consent_mode": "STORE",
                    "fetch_type": "PERIODIC",
                    "consent_types": [
                        "PROFILE",
                        "SUMMARY",
                        "TRANSACTIONS"
                    ],
                    "fi_types": body.fiList,
                    "customer": {
                        "identifiers": [
                            {
                                "type": "MOBILE",
                                "value": body.mobile
                            }
                        ]
                    },
                    "purpose": {
                        "code": "101",
                        "text": "Wealth management service"
                    },
                    "fi_data_range": {
                        "from": "2023-01-01T00:00:00.000Z",
                        "to": "2025-12-31T00:00:00.000Z"
                    },
                    "data_life": {
                        "unit": "MONTH",
                        "value": 10
                    },
                    "frequency": {
                        "unit": "MONTH",
                        "value": 31
                    }
                }
            ]
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${process.env.DOCKER_URL}v2/consents/request`,
            headers: {
                'fiu_entity_id': fiuEntityId,
                'aa_entity_id': aaEntityId,
                'Content-Type': 'application/json',
                'Authorization': process.env.BASIC_AUTH || 'Basic Auth'
            },
            data: data
        };

        console.log(config);

        axios.request(config)
            .then((response) => {
                // console.log((response.data));
                res.status(200).json(response.data);
                return;
            })
            .catch((error) => {
                console.log(error.response.data);
                res.status(500).json({ status: 'ERROR', message: 'Internal Server Error' });
            });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
        return;
    }
})

module.exports = router;