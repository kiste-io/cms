const express = require('express');
const router = new express.Router();
const formidable = require('formidable')
const publicImagesRouter = new express.Router();
const fs = require('fs')
const {fieldsToJSON} = require('./utils')


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

            const fieldsPayload =  fieldsToJSON(fields)

            const filesPayload = fieldsToJSON(files)  
            /** root images */
            const filesImagesPayloadArray = Array.isArray(filesPayload.images) ? filesPayload.images : [filesPayload.images].filter(el => el)
            const imagesMeta = fieldsPayload.images && Object
                .keys(fieldsPayload.images)
                .map(node_uuid => ({node_uuid, ...fieldsPayload.images[node_uuid]})) || []



            const imagesPayload = filesImagesPayloadArray.map(file => {
                const uri =  encodeURI(file.name)

                const node_uuid = imagesMeta.find(i => i.uri === uri)?.node_uuid

                return {file, meta: {
                    node_uuid, 
                    collection, 
                    entity_uuid 
                }}
            }).filter(image => image.meta.node_uuid)
            
            const images = imagesPayload && imagesPayload.length > 0 && await uploadImagesCommand2(imagesPayload) || []
            fieldsPayload.images && images.forEach((image) => {

                fieldsPayload.images[image.node_uuid] = {...fieldsPayload.images[image.node_uuid], ...image}
            })

            /** content images */
            await appendContentFiles(fieldsPayload, filesPayload, {collection, entity_uuid })            

            console.log('last fieldsPayload', fieldsPayload)

            const titleForSlug = fieldsPayload?.title?.en || fieldsPayload?.title?.de || "entity"

            const payload = fieldsPayload




            updateEntityData(conn, collection)(entity_uuid, payload, titleForSlug).then(() => {
                res.send()
            }).catch((err) => {
                console.error(err)
                res.status(500).send()
            })
        })
    
        
    })


    const appendContentFiles = async (fieldsPayload, filesPayload, meta) => {

        if(!filesPayload.content || !fieldsPayload.content) return

        await Promise.all(Object.keys(fieldsPayload.content).map(async(content_uuid) => {
            if(filesPayload.content[content_uuid] && filesPayload.content[content_uuid].images) {
                
                const imagesPayload = Object.keys(filesPayload.content[content_uuid].images).map(node_uuid => {

                    const file = filesPayload.content[content_uuid].images[node_uuid]
                    if(!file || !file.name) return;

                    return {file, meta: {
                        node_uuid, 
                        ...meta 
                    }}

                }).filter(el => el)

                const images = imagesPayload && imagesPayload.length > 0 && await uploadImagesCommand2(imagesPayload) || []
                images.forEach((image) => {
                    fieldsPayload.content[content_uuid].images = fieldsPayload.content[content_uuid].images || {}
                    fieldsPayload.content[content_uuid].images[image.node_uuid] = {...fieldsPayload.content[content_uuid].images[image.node_uuid], ...image}
                })
            }
                
        }))

    
        

    }
    
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

    return publicImagesRouter
}

module.exports = {
    entitiesCollectionConfig,
    entitiesRepo,
    publicImagesRepo
}
