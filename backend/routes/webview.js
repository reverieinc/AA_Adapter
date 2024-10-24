const express = require('express');
const { sessionCollection } = require('../db');
const { getClientConfig } = require('../getClientConfig');
const router = express.Router();

const createSession = async(req,res,data,baseUrl) => {
    let sessionId = data.sessionid || null;
    let consentHandle = data.srcref || null;
    let phone = data.phoneNumber || null;
    let fiuId = data.fiuId || null;
    let fiuName = data.fiuName || null;
    let userid = data.userid || null;
    let ivrSessionStart = Date.now();
    let ivrSessionEnd = ivrSessionStart+ 30*60*1000;

    if(!sessionId || !consentHandle || !phone || !fiuId || !fiuName || !userid || !baseUrl){
        return null;

    }

    let session = {
        sessionId,
        consentHandle,
        phone,
        fiuId,
        fiuName,
        userid,
        ivrSessionStart,
        ivrSessionEnd,
        baseUrl,
        step:0
    }

    let existingSession = await sessionCollection.findOne({sessionId})
    if(existingSession){
        if(existingSession.ivrSessionEnd >= Date.now()){
            return existingSession;
        }
        else{
            //delete session
            await sessionCollection.deleteOne({sessionId});
            return null;
        }
        
        return null;

    }

    let newSession = await sessionCollection.insertOne(session);
    if(newSession.acknowledged){
        return session;

    }
    else{
        return null;

    }

}

router.post('/',async(req,res)=>{
    try{
        let client_handle = req.headers?.client_handle;
        let params = req.query;

        let {ecreq, reqdate, fi} = params;
        if(!ecreq || !fi || !reqdate){
            res.status(400).json({ status: 'ERROR', message: 'Missing required parameters' });
            return;

        }

        if(client_handle){
            let clientConfig = await getClientConfig(req,res,client_handle);
            let data = JSON.stringify({
                ecreq,
                fi,
                reqdate
            });
            const myHeaders = new Headers();
            myHeaders.append("trackingid", "");
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("Cookie", "null; KC_REDIRECT=/api/v2/User/linkedaccount");
            
            const requestOptions = {
              method: "POST",
              headers: myHeaders,
              body: data,
              redirect: "follow"
            };
            
            fetch(`${clientConfig.api_url}/public/decode`, requestOptions)
              .then((response) => {
                if (!response.ok) {
                  res.status(404).json({message: "Expired Request"});
                  return;
                }
                return response.json();
              })
              .then(async(result) => {
                if(!result){
                    return;
                    
                }
                let session = await createSession(req,res,result,clientConfig.api_url);
                if(session){
                    let {sessionId, phone, fiuName} = session;
                    res.status(200).json({sessionId, phone, fiuName});
                    return;

                }
                else{
                    res.status(404).json({ status: 'ERROR', message: 'Invalid Credentials' });
                    return;

                }
              })
              .catch((error) =>{
                console.error('Error:', error.message);
                res.status(500).json({ status: 'ERROR', message: 'Internal Server Error' });
                return;
              });

        }
        else{
            res.status(401).json({ status: 'ERROR', message: 'Client handle is required' });
            return;
        }
    }

    catch(err){
        res.status(500).json({ status: 'ERROR', message: 'Internal Server Error' });
        return;
    }
    
})

module.exports = router;