const { sessionCollection } = require("./db");

const getSession = async(sessionId)=>{
    try{
        let session = await sessionCollection.findOne({sessionId});
        if(session){
            return session;

        }
        else{
            return null;

        }
    }
    catch(err){
        console.error(err.message);
        return null;
    }
}

const updateSessionAccessToken = async(sessionId, access_token)=>{
    try{
        let session = await sessionCollection.findOne({sessionId});
        if(session){
            session.accessToken = access_token;
            await sessionCollection.updateOne({ sessionId }, { $set: session });
            return session;
        }
        else{
            return null;
        }
        
    }
    catch(err){
        return null;
        
    }
    
}

module.exports = { getSession,updateSessionAccessToken };