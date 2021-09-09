const express = require('express');
const router = new express.Router();
const formidable = require('formidable')
const publicAssetsRouter = new express.Router();
const fs = require('fs')
const {fieldsToJSON} = require('../src/utils')


const {
    updateEntityData, 
    findEntities,
    findEntitiesByCategory,
    findEntity,
    deleteEntity,
    storeEntityImages,
    findEntityImage,
    findEntityContentImage,
    reorderEntityImage,
    deleteEntityImage,
    storeEntityCategory,
    findEntityCategories,
    reorderEntities,
    findCategory,
    deleteEntityCategory
} = require('../src/db')


const {
    updateEntity,
    findEntityParameters
} = require('../src');

const {
    uploadImagesCommand,
    uploadImagesCommand2

} = require('../src/upload')


function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }


const formatEntitesResponse = ({images, content, parameter, ...rest}) => {
    const responseData = {...rest, 
        images: images && Object.keys(images).map &&  Object.keys(images).map(key => ({node_uuid: key, order: images[key].order, uris: images[key].uris, uri:images[key].uri}) || []),
        content: content && Object.keys(content).map && Object.keys(content).map(key => ({
            content_uuid: key, 
            ...content[key]
        })),
        parameter: parameter && Object.keys(parameter).map && Object.keys(parameter).map(key => ({
            parameter_uuid: key, 
            ...parameter[key]
        })),
        
    }

    console.log('responseData', responseData)

    return responseData
}

const config = {
    collections: null
}
const applyCollectionsConfig = (c) => config.collections = c



const entitiesRepo = (conn) => {

     // entity collections
     router.get("/collections", async (req, res) => {
   
        res.send(config.collections)        
        
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


     // entity parameters
     router.get("/entities/:collection/parameters", async (req, res) => {
        const {collection} = req.params

        findEntityParameters(conn, collection).then(result => {
            res.send(result)
        }).catch(() => {
            res.status(500)
            res.send()
        })
        
        
    })
 

    router.get("/entities/:collection/categories/slug/:slug", async (req, res) => {
        const {collection, slug} = req.params

        findCategory(conn, collection)({slug}).then(result => {
            res.send(result)
        }).catch(() => {
            res.status(500)
            res.send()
        })
        
        findCategory
    })

    router.post("/entities/:collection/reorder", async (req, res) => {
        const {collection} = req.params
        const {list} = req.body

        await reorderEntities(conn, collection)(list)
        
        res.send()
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

    router.get("/entities/:collection/slug/:slug", async (req, res) => {

        const {collection, slug} = req.params;

        findEntity(conn, collection)({slug}).then((result) => {
            res.send(formatEntitesResponse(result || {}))
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

        formidable({ multiples: true }).parse(req, async (err, fields, files)  => {

        updateEntity(conn, {collection, entity_uuid, fields, files}).then(() => {
                res.send()
            }).catch((err) => {
                console.error(err)
                res.status(500).send()
            })

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

const publicAssetsRepo = (connection) => {
    
    publicAssetsRouter.get("/assets/:collection/:entity_uuid/images/:file_uuid/:format", async (req, res) => {

        const {collection, entity_uuid, file_uuid, format} = req.params
        const path = await findEntityImage(connection)(collection, entity_uuid, file_uuid, format) 
        || await findEntityContentImage(connection)(collection, entity_uuid, file_uuid, format)

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

    return publicAssetsRouter
}

module.exports = {
    applyCollectionsConfig,
    entitiesRepo,
    publicAssetsRepo
}