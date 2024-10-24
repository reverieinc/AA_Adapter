const express = require('express');
const router = express.Router();

let bankNames = ['IDFC BANK', 'STATE BANK OF INDIA', 'HDFC BANK', 'ICICI BANK', 'FEDERAL BANK']

router.get('/', function (req, res) {
    res.json({ message: 'Welcome to the User API!' });

});

router.get('/linkedaccount', function (req, res) {
    try {
        let consentHandle = req.query.consentHandle;
        let authorization = req.headers.authorization?.split(' ')[0];
        console.log({ consentHandle, authorization });

        let accounts = []

        for (let i = 0; i < Math.floor(Math.random() * 3) + 2; i++) {

            let bankName = bankNames[i];
            let last4digits = Math.floor(1000 + Math.random() * 9000);
            let accountType = Math.random() > 0.4 ? 'SAVINGS' : 'CURRENT';
            accounts.push({ bankName, last4digits, accountType });
        }
        res.status(200).json(accounts);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ status: "ERROR", message: 'Internal Server Error' });
        return;
    }

});

router.get('/Consent/handle', function (req, res) {
    try {
        let consentHandle = req.query.consentHandle;
        let authorization = req.headers.authorization?.split(' ')[0];
        console.log({ consentHandle, authorization });
        let fetchType = Math.random() > 0.5 ? 'ONETIME' : 'PERIODIC'
        res.status(200).json([
            {
                consentStart: "2024-10-24T05:27:27.597+00:00",
                consentExpiry: "2026-12-31T00:00:00.000+00:00",
                fetchType,
                consentTypes: [
                    "PROFILE",
                    "SUMMARY",
                    "TRANSACTIONS"
                ],
                "fiTypes": [
                    "DEPOSIT"
                ],
                "DataConsumer": {
                    "name": "Consumer Name",
                    "id": "consumer-id"
                },
                FIDataRange: {
                    "from": "2023-01-01T00:00:00.000+00:00",
                    "to": "2025-12-31T00:00:00.000+00:00"
                }
            }
        ]);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ status: "ERROR", message: 'Internal Server Error' });
        return;
    }

});

router.post('/Consents/Approval/Verification', function (req, res) {
    try {
        let status = req.body?.consentApprovalStatus;
        if (status) {
            if (status === "READY") {
                res.status(200).json({
                    status: 'SUCCESS',
                    message: 'Consent approved successfully'
                });
            }
            else {
                res.status(200).json({
                    status: 'SUCCESS',
                    message: 'Consent rejected successfully'
                });
            }
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'ERROR',
            message: 'Failed to verify consent approval'
        });
    }

})

module.exports = router;