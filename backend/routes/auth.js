const { default: axios } = require('axios');
let express = require('express')
const router = express.Router();

router.post('/',(req,res)=>{
    try{
        let headers = req.headers;
        let url = 'http://localhost:9000/v2/consents/request';
        let body = req.body;
        let {fiList,mobile} = body;

        let data = JSON.stringify({
            "redirect_params": {
              "callback_url": "https://bootstack.xyz"
            },
            "consents": [
              {
                "consent_start": "2024-10-25T04:22:24.975Z",
                "consent_expiry": "2026-12-31T00:00:00.000Z",
                "consent_mode": "STORE",
                "fetch_type": "PERIODIC",
                "consent_types": fiList,
                "fi_types": [
                  "DEPOSIT"
                ],
                "customer": {
                  "identifiers": [
                    {
                      "type": "MOBILE",
                      "value": mobile
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
            url,
            headers,
            data,

          };
      
          axios.request(config)
            .then((response) => {
                console.log(response);
                res.status(200).json(response.data);
                return;
            })
            .catch((error) => {
              console.log(error.message);
              res.status(500).json({ status: 'ERROR', message: error.message });
              return;
            });

        // logic to save the user data in the database

    } catch(error){
        console.error(error);
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
        return;
    }
})

module.exports = router;