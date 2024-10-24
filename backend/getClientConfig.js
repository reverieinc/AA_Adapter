const getClientConfig = async(req,res,client_handle)=>{
    //get config from db
    //for now setting up client_handle for Saafe AA

    let config = {
        client_handle,
        api_url: 'https://test.saafe.in/api/v2',

    }

    if(config){
        return config;

    }
    else{
        res.status(401).json({ status: 'ERROR', message: 'Invalid client handle' });
        return;

    }
}

module.exports = { getClientConfig };