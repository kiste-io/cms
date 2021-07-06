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
        images: images && Object.keys(images).map &&  Object.keys(images).map(key => ({node_uuid: key, order: images[key].order, uris: images[key].uris}) || []),
        content: content && Object.keys(content).map && Object.keys(content).map(key => ({
            content_uuid: key, 
            ...content[key], 
            images: content[key].images && content[key].images.map(i => ({uris: i.uris, node_uuid: i.node_uuid}))
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
    
    /*router.post("/entities/:collection/:entity_uuid", async (req, res) => {
    
        const {collection, entity_uuid} = req.params;

        new formidable.IncomingForm().parse(req, async (err, fields, files)  => {


            console.log('/entities/:collection/:entity_uuid', {collection, entity_uuid, err, fields, files})
            const reg1 = /(?<parent_node>[^\[]*)/
            const reg2 = /\[(.*?)\]/g

            const parsedFields = Object.keys(fields).map(key => {
                const [head, reg2tail]  = [reg1.exec(key), reg2.exec(key)]

                if(!reg2tail) {
                    return {[key]: fields[key]}
                }

                let tail = [reg2tail[1]]

                for (let match; (match = reg2.exec(key)) !== null;)  {
                    tail = [...tail, match[1]]
                }
                  

                const {parent_node} = head.groups
                const [parent_uuid, node, node_uuid] = tail 
                

                return {value: fields[key], meta: {parent_node, parent_uuid, node, node_uuid}}

                
            })

            const payload = parsedFields.reduce((acc, elem) => {
                if (!elem.value) return {...acc, ...elem}
                else {
                    const {parent_node, parent_uuid, node, node_uuid} = elem.meta

                    const value = elem.value
                    
                    if (acc[parent_node] && acc[parent_node][parent_uuid]) {
                        return {...acc, [parent_node]: { ...acc[parent_node],  [parent_uuid] : {...acc[parent_node][parent_uuid],  [node]: value}}}
                    }

                    
                    if (acc[parent_node]) {
                        return {...acc, [parent_node]: { ...acc[parent_node],  [parent_uuid] : {  [node]: value}}}
                    }



                    return {...acc, [parent_node]: {  [parent_uuid] : {  [node]: value}}}
                }
            })

       

            const filesData = Object.keys(files).map(key => {
                const [head, reg2tail]  = [reg1.exec(key), reg2.exec(key)]

                if(!reg2tail) {
                    return {[key]: fields[key]}
                }

                let tail = [reg2tail[1]]

                for (let match; (match = reg2.exec(key)) !== null;)  {
                    tail = [...tail, match[1]]
                }
                  

                const {parent_node} = head.groups
                const [parent_uuid, _, node_uuid] = tail 

                return {file:files[key], meta: {parent_node, parent_uuid, node_uuid, collection, entity_uuid } }
            })
                
            console.log('payload', payload, 'filesData', filesData)

            const images = filesData.length > 0 && await uploadImagesCommand2(filesData) || []
            images.forEach((image) => {
                payload[image.parent_node][image.parent_uuid].images = [image]
            })

            

            updateEntityData(conn, collection)(entity_uuid, payload).then(() => {
                res.send()
            }).catch((err) => {
                console.error(err)
                res.status(500).send()
            })
            
            
        })

    
        
    })
    */

    router.post("/entities/:collection/:entity_uuid", async (req, res) => {
    
        const {collection, entity_uuid} = req.params;

        formidable({ multiples: true }).parse(req, async (err, fields, files)  => {

            const fieldsPayload =  fieldsToJSON(fields)

            const filesPayload = fieldsToJSON(files)  
            const filesImagesPayloadArray = Array.isArray(filesPayload.images) ? filesPayload.images : [filesPayload.images].filter(el => el)
            
            const imagesMeta = Object
                .keys(fieldsPayload.images)
                .map(node_uuid => ({node_uuid, ...fieldsPayload.images[node_uuid]}))
            
            const imagesPayload = filesImagesPayloadArray.map(file => {
                const uri =  encodeURI(file.name)

                const node_uuid = imagesMeta.find(i => i.uri === uri)?.node_uuid

                return {file, meta: {
                    node_uuid, 
                    collection, 
                    entity_uuid 
                }}
            } )
            
            const images = imagesPayload && imagesPayload.length > 0 && await uploadImagesCommand2(imagesPayload) || []

            images.forEach((image) => {
                fieldsPayload.images[image.node_uuid] = {...fieldsPayload.images[image.node_uuid], ...image}
            })
            

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
