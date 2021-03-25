const MongoClient = require('mongodb').MongoClient;
 

const connector = (url, dbName, options = {}) => (query) => new Promise((resolve, reject) => MongoClient.connect(
    url, 
    { 
        useUnifiedTopology: true,
        connectTimeoutMS: 1000,
        serverSelectionTimeoutMS: 1000,
        ...options
     }, 
    async (err, client) => {
    
        if(err) {
            reject(err)
            return
        }
        
        const result = await query(client.db(dbName))
        resolve(result)
        
        client.close();
    }))
 

module.exports = connector

