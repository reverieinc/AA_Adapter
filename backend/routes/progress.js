let express = require('express');
const { getSession } = require('../getSession');
const { sessionCollection } = require('../db');
let router = express.Router();

router.get('/', async(req, res) => {
    try{
        let sessionId = req.query.sessionId;
        let session = await getSession(sessionId);
        if(session){
            if(session.step){
                res.status(200).json({sessionId, step:session.step});
                return;

            }
            else{
                session.step = 0;
                await sessionCollection.updateOne({ sessionId }, { $set: session });
                res.status(200).json({ sessionId, step: session.step});
                return;

            }
        }
        else{
            res.status(404).json({ status: 'ERROR', message: 'Invalid Session ID' });
            return;
        }
    }
    catch(err){
        console.error(err.message);
        res.status(500).json({ status: "ERROR", message: 'Internal Server Error' });
        return;
    }
    
});

router.post('/',async(req,res)=>{
    try{
        let body = req.body
        let {sessionId, progress} = body;
        let session = await sessionCollection.findOne({ sessionId });
        if(!session){
            res.status(404).json({ status: 'ERROR', message: 'Invalid Session ID' });
            return;
        }
        session.step = progress;
        await sessionCollection.updateOne({ sessionId }, { $set: session });
        res.status(200).json({ sessionId, step: session.step});
        return;
    }
    catch(err){
        console.error(err.message);
        res.status(500).json({ status: "ERROR", message: 'Internal Server Error' });
        return;
    }
    
})

module.exports = router;