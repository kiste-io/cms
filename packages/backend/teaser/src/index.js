const express = require('express');
const router = new express.Router();
const publicImagesRouter = new express.Router();
const fs = require('fs')
const formidable = require('formidable')

const {
    updateTeaserData,
    findTeaser,
    findTeaserImage,
    findTeasers,
    deleteTeaser
} = require('./db')

const {
    uploadThumb
} = require('./upload')






const config = {
    collections: {}
}
const teasersCollectionConfig = (collections) => config.collections = collections


const teasersRepo = (conn) => {

    router.get("/teasers", async (req, res) => {

        const collections = config.collections
        res.send(collections)        
    })


    router.get("/teasers/:collection", async (req, res) => {

        const {collection} = req.params;

        findTeasers(conn, collection).then((result) => {
            res.send(result)
        })
    })
    

    router.get("/teasers/:collection/:teaser_uuid", async (req, res) => {

        const {collection, teaser_uuid} = req.params;

        findTeaser(conn,collection, teaser_uuid).then((result) => {
            res.send(result)
        })
    })


    router.delete("/teasers/:collection/:teaser_uuid", async (req, res) => {

        const {collection, teaser_uuid} = req.params;

        deleteTeaser(conn, collection, teaser_uuid).then((result) => {
            res.send(result)
        })
    })
    
    router.post("/teasers/:collection/:teaser_uuid", async (req, res) => {
    
        const {collection, teaser_uuid} = req.params;

        new formidable.IncomingForm().parse(req, function(err, fields, files) {
    
            const payload = JSON.parse(fields.payload)

            updateTeaserData(conn, collection, teaser_uuid, payload).then(() => {
                res.send()
            })

            
            if(files && Object.keys(files).length > 0){
                
                const file_uuids = Object.keys(files)
                
                Promise.all(file_uuids.map((file_uuid) => {
                    return uploadThumb(collection, teaser_uuid, file_uuid, files[file_uuid])
                })).catch((err) => {
                        console.error(err)
                        res.status(err.status ? err.status : 500)
                        res.send()
                    })
                    // quick response
                    .then(images => {
                        
                        updateTeaserData(conn, collection, teaser_uuid, {images}).then(() => {
                            console.log('saved image', {images})
                        })                                                
                    })            

            }            
        })                
    })

    return router    
}

const publicTeaserImagesRepo = (connection) => {
    
    publicImagesRouter.get("/teasers/:collection/:teaser_uuid/images/:file_uuid", async (req, res) => {

        const {collection, teaser_uuid, file_uuid} = req.params
        
        const path = await findTeaserImage(connection, collection, teaser_uuid, file_uuid).catch(_ => {
            res.status(404)  
        })
        console.log('path', path)
        path && fs.exists(path, (exists) => {
            if(!exists) {
                res.status(404)
                res.send(`can not read file by id: ${teaser_uuid}`)
            }else {
                //response.type('image/jpeg')
      
                res.sendFile(path)
            }
        })          
        
      })

    return publicImagesRouter
}

module.exports = {
    teasersRepo,
    publicTeaserImagesRepo,
    teasersCollectionConfig
}
