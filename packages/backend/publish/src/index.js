
const {buildWebsite} = require('./publish')

const {
    findPublishes,
    addPublishData
} = require('./db')


const getPublishLog = (conn) => new Promise(async(resolve, reject) => {
    
    const publishes = await findPublishes(conn)                    
    
    resolve(publishes)

})

const buildProject = (conn) => new Promise(async(resolve, reject) => {

    const payload = await buildWebsite()
        
    await addPublishData(conn, payload)
        
    resolve()
})





module.exports = {
    getPublishLog,
    buildProject
}