
require('dotenv').config()


const collectionPrefix = `${process.env.CMS_COLLECTION_PREFIX || 'cms'}`;

const collection = `${collectionPrefix}_publish`

const findPublishes = (connection) => new Promise((resolve, reject) => 
    connection(async (db) => {
    
        const logs = await db.collection(collection).find().sort({_id: -1}).toArray()
    
        resolve(logs)

    }))


const addPublishData = (connection, payload) => new Promise((resolve, reject) =>
    connection(db => {
            db.collection(collection).insertOne(
                payload,
                (err, result) => {
                    if(err) reject(err)
                    else resolve(result)
            })
        })  
    )                    
  





module.exports = {
    findPublishes,
    addPublishData
}
