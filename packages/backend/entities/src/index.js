const express = require('express');
const router = new express.Router();
const formidable = require('formidable')
const publicImagesRouter = new express.Router();
const fs = require('fs')


const {
    updateEntityData, 
    findEntities,
    findEntitiesByCategory,
    findEntity,
    deleteEntity,
    storeEntityImages,
    findEntityImage,
    reorderEntityImage,
    deleteEntityImage,
    storeEntityCategory,
    findEntityCategories,
    deleteEntityCategory
} = require('./db')

const {
    uploadImagesCommand,
    uploadImagesCommand2

} = require('./upload')


function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }


const formatEntitesResponse = ({images, ...rest}) => {
    return {...rest, 
        images: images && images.map(({file_uuid, uris, order}) =>({file_uuid, order, uri: uris['200x200']}) || [])
    }
}

const config = {
    collections: {}
}
const entitiesCollectionConfig = (collections) => config.collections = collections



const entitiesRepo = (conn) => {

     // entity collections
     router.get("/entities", async (req, res) => {
   
        const collections = config.collections
        console.log('collections', collections)
        res.send(collections)        
        
    })



     // entity categories
     router.get("/entities/:collection/categories", async (req, res) => {
        const {collection} = req.params

        findEntityCategories(conn)(collection).then(result => {
            res.send(result)
        }).catch(() => {
            res.status(500)
            res.send()
        })
        
        
    })

     // entity categories
     router.get("/entities/:collection/categories", async (req, res) => {
        const {collection} = req.params

        findEntityCategories(conn)(collection).then(result => {
            res.send(result)
        }).catch(() => {
            res.status(500)
            res.send()
        })
        
        
    })
     router.post("/entities/:collection/categories/:category_uuid", async (req, res) => {
        const {collection, category_uuid} = req.params
        const payload = req.body

        await storeEntityCategory(conn)(collection, category_uuid, payload)
        
        res.send()
    })

    router.get("/entities/:collection/categories/:category_uuid/enities", async (req, res) => {
        const {collection, category_uuid} = req.params


        findEntitiesByCategory(conn, collection, category_uuid).then(result => {
            res.send(result)
        }).catch(() => {
            res.status(500)
            res.send()
        })
        
        
    })

    router.delete("/entities/:collection/categories/:category_uuid", async (req, res) => {
        const {collection, category_uuid} = req.params

        await deleteEntityCategory(conn)(collection, category_uuid)
        
        res.send()
    })

    // entities
    router.get("/entities/:collection", async (req, res) => {

        const {collection} = req.params;

        findEntities(conn, collection).then((entities) => {

            res.send(entities.map(formatEntitesResponse))
        })
        
    })

    

    router.get("/entities/:collection/:entity_uuid", async (req, res) => {

        const {collection, entity_uuid} = req.params;

        findEntity(conn, collection)({entity_uuid}).then((result) => {
            res.send(formatEntitesResponse(result || {}))
        })
    })

    router.delete("/entities/:collection/:entity_uuid", async (req, res) => {

        const {collection, entity_uuid} = req.params;

        await deleteEntity(conn)(collection, entity_uuid)

        res.send()
    })
    
    router.post("/entities/:collection/:entity_uuid", async (req, res) => {
    
        const {collection, entity_uuid} = req.params;

        new formidable.IncomingForm().parse(req, async (err, fields, files)  => {


            console.log('/entities/:collection/:entity_uuid', {collection, entity_uuid, err, fields, files})
            const reg1 = /(?<parent_node>[^\[]*)/
            const reg2 = /\[(?<parent_uuid>.*?)\]\[(?<node>.*?)\]/
            const reg3 = /\[(?<parent_uuid>.*?)\]\[(?<node>.*?)\]\[(?<node_uuid>.*?)\]/

            const parsedFields = Object.keys(fields).map(key => {
                const [head, tail] = [reg1.exec(key), reg2.exec(key)]

                if(!tail) {
                    return {[key]: fields[key]}
                }

                const {parent_node} = head.groups
                const {parent_uuid, node} = tail.groups

                return {value: fields[key], meta: {parent_node, parent_uuid, node}}
                
            })

            const fieldsObj = parsedFields.reduce((acc, elem) => {
                if (!elem.value) return {...acc, ...elem}
                else {
                    const {parent_node, parent_uuid, node} = elem.meta

                    if (acc[parent_node]) {
                        return {...acc, [parent_node]: { ...acc[parent_node],  [parent_uuid] : {  [node]: elem.value}}}
                    }

                    if (acc[parent_node] && acc[parent_node][parent_uuid]) {
                        return {...acc, [parent_node]: { ...acc[parent_node],  [parent_uuid] : {...acc[parent_node][parent_uuid],  [node]: elem.value}}}
                    }

                    return {...acc, [parent_node]: {  [parent_uuid] : {  [node]: elem.value}}}
                }
            })

       

            const filesData = Object.keys(files).map(key => {
                const [head, tail] = [reg1.exec(key), reg3.exec(key)]

                if(!tail) {
                    return {[key]: fields[key]}
                }

                const {parent_node} = head.groups
                const {parent_uuid, node_uuid} = tail.groups

                return {file:files[key], meta: {parent_node, parent_uuid, file_uuid: node_uuid, collection, entity_uuid } }
            })
                
            console.log('fieldsObj', fieldsObj)
            const images = await uploadImagesCommand2(filesData)
            console.log('images', images)

            
        })

    
        
    })
    
    router.post("/entities/:collection/:entity_uuid/images", async (req, res) => {
    
        const {collection, entity_uuid} = req.params

        formidable({ multiples: true }).parse(req, function(err, fields, files) {
    
            const {images} = fields
            
    
            uploadImagesCommand(collection, entity_uuid, JSON.parse(images), files)
                .catch((err) => {
                    console.error(err)
                    res.status(err.status ? err.status : 500)
                    res.send()
                })
                // quick response
                .then(images => {
                    console.log('storeEntityImages', storeEntityImages)

                    storeEntityImages(conn, collection, {entity_uuid}, images).then(() => {
                        res.status(200)
                        
                        res.send(formatEntitesResponse({images}).images)
                        return images
                    })// do heavy stuff
                    .then(async(images) => {
                         // wait for client reading temporary pathes
                         await sleep(2000)
                         // upload to dns server
                        //uploadToDigitalocean(project_uuid, images)
                    })       
                    
                })                 
            
        })
        
    })
    
    
    router.put("/entities/:collection/:entity_uuid/images", async (req, res) => {

        const {collection, entity_uuid} = req.params
        const payload = req.body
        await reorderEntityImage(conn)(collection, entity_uuid, payload)
        
        res.send()
    
    })
    
    router.delete("/entities/:collection/:entity_uuid/images/:file_uuid", async (req, res) => {
  
        const {collection, entity_uuid, file_uuid} = req.params
        await deleteEntityImage(conn)(collection, entity_uuid, file_uuid)
        
        res.send()
        
      })


   
    

    return router    
}

const publicImagesRepo = (connection) => {
    
    publicImagesRouter.get("/entities/:collection/:entity_uuid/images/:file_uuid/:format", async (req, res) => {

        const {collection, entity_uuid, file_uuid, format} = req.params
        const path = await findEntityImage(connection)(collection, entity_uuid, file_uuid, format)
        console.log('path', path)
        fs.exists(path, (exists) => {
            if(!exists) {
                res.status(404)
                res.send(`can not read file by id: ${entity_uuid}`)
            }else {
                //response.type('image/jpeg')
      
                res.sendFile(path)
            }
        })          
        
      })

    return publicImagesRouter
}

module.exports = {
    entitiesCollectionConfig,
    entitiesRepo,
    publicImagesRepo
}
