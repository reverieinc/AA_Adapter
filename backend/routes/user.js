const express = require('express');
const { getSession, updateSessionAccessToken } = require('../getSession');
const { sessionCollection } = require('../db');
const router = express.Router();

let bankNames = ['IDFC BANK', 'STATE BANK OF INDIA', 'HDFC BANK', 'ICICI BANK', 'FEDERAL BANK']

router.get('/', function (req, res) {
    res.json({ message: 'Welcome to the User API!' });

});

router.get('/linkedaccount', async function (req, res) {
    try {
        let sessionId = req.headers?.session_id;
        if (!sessionId) {
            res.status(401).json({ status: 'ERROR', message: 'Missing session_id' });
            return;
        }
        let session = await getSession(sessionId);
        if (session) {
            let { accessToken, consentHandle, ivrSessionEnd } = session;
            if (ivrSessionEnd < Date.now()) {
                await sessionCollection.deleteOne({ sessionId: session.sessionId });
                res.status(401).json({ status: 'ERROR', message: 'Session expired' });
                return;
            }
            else {
                let token = "Bearer "+accessToken;

                const myHeaders = new Headers();
                myHeaders.append("Content-Type", "application/json");
                myHeaders.append("Authorization", token);
                myHeaders.append("Cookie", "null; KC_REDIRECT=/api/v2/User/linkedaccount");

                const requestOptions = {
                    method: "GET",
                    headers: myHeaders,
                    redirect: "follow"
                };
                fetch(`${session.baseUrl}/User/linkedaccount?consentHandle=${consentHandle}`, requestOptions)
                    .then((response) => {
                        if (!response.ok) {
                            res.status(response.status).json({ status: 'ERROR', message: 'Failed to fetch linked accounts' });
                            return;
                        }
                        return response.json();
                    })
                    .then((result) => {
                        if(!result){
                            return;
                        }
                        let accounts = [];
                        result.forEach((account) => {
                            let{fiType,fipHandle,fipName,linkRefNumber,maskedAccNumber} = account;
                            accounts.push({
                                accountType:fiType,
                                fipHandle,
                                bankName:fipName,
                                linkRefNumber,
                                last4digits: maskedAccNumber.slice(maskedAccNumber.length-4)
                            })
                        });
                        res.status(200).json(accounts);
                    })
                    .catch((error) => {
                        console.error('Error:', error.message);
                        res.status(500).json({ status: 'ERROR', message: 'Internal Server Error' });
                        return;
                    });
            }
        }
        else {
            res.status(401).json({ status: 'ERROR', message: 'Session not found' });
            return;
        }

    }
    catch (err) {
        console.error(err);
        res.status(500).json({ status: "ERROR", message: 'Internal Server Error' });
        return;
    }

});

router.get('/Consent/handle', async function (req, res) {
    try {
        let sessionId = req.headers?.session_id;
        if (!sessionId) {
            res.status(401).json({ status: 'ERROR', message: 'Missing session_id' });
            return;
        }
        let session = await getSession(sessionId);
        if (session) {
            let { accessToken, consentHandle, ivrSessionEnd } = session;
            if (ivrSessionEnd < Date.now()) {
                await sessionCollection.deleteOne({ sessionId: session.sessionId });
                res.status(401).json({ status: 'ERROR', message: 'Session expired' });
                return;
            }
            else {
                let token = "Bearer "+accessToken;

                const myHeaders = new Headers();
                myHeaders.append("Content-Type", "application/json");
                myHeaders.append("Authorization", token);
                myHeaders.append("Cookie", "null; KC_REDIRECT=/api/v2/User/linkedaccount");

                const requestOptions = {
                    method: "GET",
                    headers: myHeaders,
                    redirect: "follow"
                };
                fetch(`${session.baseUrl}/User/Consent/handle?consentHandle=${consentHandle}`, requestOptions)
                    .then((response) => {
                        if (!response.ok) {
                            res.status(response.status).json({ status: 'ERROR', message: 'Failed to fetch linked accounts' });
                            return;
                        }
                        return response.json();
                    })
                    .then((result) => {
                        if(!result){
                            return;
                        }
                        res.status(200).json(result);
                    })
                    .catch((error) => {
                        console.error('Error:', error.message);
                        res.status(500).json({ status: 'ERROR', message: 'Internal Server Error' });
                        return;
                    });
            }
        }
        else {
            res.status(401).json({ status: 'ERROR', message: 'Session not found' });
            return;
        }

    }
    catch (err) {
        console.error(err);
        res.status(500).json({ status: "ERROR", message: 'Internal Server Error' });
        return;
    }

});

router.post('/Consents/Approval/Verification', async function (req, res) {
    try {

        let sessionId = req.headers?.session_id;
        let status = req.body?.status;
        let accounts = req.body?.accounts;

        if(!status || !accounts){
            res.status(400).json({ status: 'ERROR', message: 'Missing required parameters' });
            return;

        }

        if (!sessionId) {
            res.status(401).json({ status: 'ERROR', message: 'Missing session_id' });
            return;
        }
        let session = await getSession(sessionId);
        if (session) {
            let { accessToken, consentHandle, ivrSessionEnd } = session;
            if (ivrSessionEnd < Date.now()) {
                await sessionCollection.deleteOne({ sessionId: session.sessionId });
                res.status(401).json({ status: 'ERROR', message: 'Session expired' });
                return;
            }
            else {
                let token = "Bearer "+accessToken;

                const myHeaders = new Headers();
                myHeaders.append("Content-Type", "application/json");
                myHeaders.append("Accept", "application/json");
                myHeaders.append("Authorization", token);
                myHeaders.append("Cookie", "null; KC_REDIRECT=/api/v2/User/linkedaccount");

                const raw = JSON.stringify({
                    "consentHandle": [
                      consentHandle
                    ],
                    "constentApprovalStatus": status,
                    accounts
                  });

                const requestOptions = {
                    method: "POST",
                    headers: myHeaders,
                    body: raw,
                    redirect: "follow"
                };

                fetch(`${session.baseUrl}/User/Consents/Approval/Verification`, requestOptions)
                    .then((response) => {
                        if (!response.ok) {
                            res.status(response.status).json({ status: 'ERROR', message: 'Failed to Approve' });
                            return;
                        }
                        return response.json();
                    })
                    .then(async(result) => {
                        if(!result){
                            return;
                        }
                        await sessionCollection.deleteOne({sessionId: session.sessionId});
                        res.status(200).json(result);
                    })
                    .catch((error) => {
                        console.error('Error:', error.message);
                        res.status(500).json({ status: 'ERROR', message: 'Internal Server Error' });
                        return;
                    });
            }
        }
        else {
            res.status(401).json({ status: 'ERROR', message: 'Session not found' });
            return;
        }

    }
    catch (err) {
        console.error(err);
        res.status(500).json({ status: "ERROR", message: 'Internal Server Error' });
        return;
    }

})

router.post('/init-otp', async (req, res) => {
    try {
        let phoneNumber = req.body?.phoneNumber;
        let sessionId = req.headers.session_id;

        if (!sessionId || !phoneNumber) {
            res.status(400).json({ status: 'ERROR', message: 'Missing required parameters' });
            return;
        }

        let session = await getSession(sessionId);

        if (session) {
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("Cookie", "null; null; null; KC_REDIRECT=/api/v2/User/linkedaccount");

            const raw = JSON.stringify({
                phoneNumber,
                "isTermsAndConditionAgreed": true
            });

            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: raw,
                redirect: "follow"
            };

            fetch(`${session.baseUrl}/public/user/combined/init-otp`, requestOptions)
                .then(async (response) => {
                    if (response.status === 200) {
                        return response.json();
                    }
                    else {
                        res.status(400).json({ status: 'ERROR', message: 'Failed to send OTP' });
                        return;
                    }
                })
                .then((result) => {
                    res.status(200).json({ status: 'OK', message: "OTP sent successfully", otpUniqueID: result.otpUniqueID });
                    return;

                })
                .catch((error) => {
                    console.error('Error:', error.message);
                    res.status(500).json({ status: 'ERROR', message: 'Internal Server Error' });
                    return;
                });


        }
        else {
            res.status(401).json({ status: 'ERROR', message: 'Invalid client handle' });
            return;

        }

    }
    catch (err) {
        console.error(err);
        res.status(500).json({ status: 'ERROR', message: 'Failed to initiate OTP' });
    }
})

router.post('/verify-otp', async (req, res) => {
    try {
        let phoneNumber = req.body?.phoneNumber;
        let otp = req.body?.otp;
        let otpUniqueID = req.body?.otpUniqueID;
        let sessionId = req.headers.session_id;

        if (!sessionId || !phoneNumber || !otpUniqueID || !otp) {
            res.status(400).json({ status: 'ERROR', message: 'Missing required parameters' });
            return;
        }

        let session = await getSession(sessionId);

        if (session) {
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("Cookie", "null; null; null; KC_REDIRECT=/api/v2/User/linkedaccount");

            const raw = JSON.stringify({
                code: otp,
                phoneNumber,
                otpUniqueID,
            });

            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: raw,
                redirect: "follow"
            };

            fetch(`${session.baseUrl}/public/user/combined/verify-otp`, requestOptions)
                .then(async (response) => {
                    if (response.status === 200) {
                        return response.json();
                    }
                    else {
                        res.status(400).json({ status: 'ERROR', message: 'Failed to send OTP' });
                        return;
                    }
                })
                .then(async (result) => {
                    if (!result) {
                        return;

                    }
                    let { firstName, lastName, vuaId, phoneNumber, access_token } = result;

                    session = await updateSessionAccessToken(sessionId, access_token);
                    res.status(200).json({
                        firstName,
                        lastName,
                        userid: vuaId,
                        phoneNumber
                    });
                    return;

                })
                .catch((error) => {
                    console.error('Error:', error.message);
                    res.status(500).json({ status: 'ERROR', message: 'Internal Server Error' });
                    return;
                });


        }
        else {
            res.status(401).json({ status: 'ERROR', message: 'Invalid client handle' });
            return;

        }

    }
    catch (err) {
        console.error(err);
        res.status(500).json({ status: 'ERROR', message: 'Failed to initiate OTP' });
    }
})

module.exports = router;