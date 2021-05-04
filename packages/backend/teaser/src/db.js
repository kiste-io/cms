const updateTeaserData = (connection, collection, teaser_uuid, payload) => 
    new Promise((resolve, reject) => {
        try {
            
    
            connection(db => {
                db.collection(collection).updateOne(
                    {teaser_uuid}, 
                    {$set: { ...payload }}, 
                    {upsert: true},
                    (err, result) => {
                        if(err) reject(err)
                        else resolve(result)
                    })
            })
            
        } catch (err) {
            reject(err)
        }     
    })


const findTeaser = (connection, collection, teaser_uuid) => new Promise(
    (resolve, _) => 
        connection(async (db) => {
            const teaser = await db.collection(collection).findOne({teaser_uuid}, {_id: 0})
            resolve(teaser)
        }
    ))

const deleteTeaser = (connection, collection, teaser_uuid) => new Promise(
    (resolve, _) => 
        connection(async (db) => {
            const teaser = await db.collection(collection).deleteOne({teaser_uuid})
            resolve(teaser)
        }
    ))

const findTeaserImage = (connection,collection, teaser_uuid, file_uuid) => new Promise(
    (resolve, reject) => 
        connection(async (db) => {
            const teaser = await db.collection(collection).findOne({teaser_uuid}, {_id: 0})

            const img = teaser && teaser.images && teaser.images.find(i => i.file_uuid === file_uuid)
            img && img.path
            ? resolve(img.path)
            : reject()

        }
    ))

const findTeasers = (connection, collection) => new Promise((resolve, reject) => {
    try {
        connection(db => {
            db.collection(collection).find()
                .toArray()
                .then((result) => {
                    resolve(result)
                })
            })
        
        
    } catch (err) {
        reject(err)
    }     
})

module.exports = {
    findTeaser,
    findTeaserImage,
    updateTeaserData,
    findTeasers,
    deleteTeaser
}