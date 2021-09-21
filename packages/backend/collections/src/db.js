
const findEntities = (connection, collection) => 
new Promise((resolve, reject) => connection(async (db) => {
    
    const entities = await db.collection(collection).find().toArray()
    
    resolve(entities)

}))

const findEntitiesByCategory = (connection, collection, category_uuid) => 
new Promise((resolve, reject) => connection(async (db) => {
    
    try {
        const entities = await db.collection(collection).find({category_uuid}).toArray()
    
        resolve(entities)
    
    }catch (e) {
        reject(e.msg)
    }
    

}))

const findEntity = (connection, collection) => (query) => 
    new Promise((resolve, reject) => connection(async (db) => {
        
        const entity = await db.collection(collection).findOne(query, {_id: 0})
        resolve(entity)

    }))




const generateSlug = (name, existing_slugs, iteration=0) => {

    const slug = name.toLocaleLowerCase().replace(/[^a-z0-9]/g, "")

    if(existing_slugs.includes(slug)){
        return generateSlug(`${name}${++iteration}`, existing_slugs, iteration)
    }else{
        return slug
    }


}

const deleteEntity = (connection) => 
    (collection, entity_uuid) => 
        new Promise((resolve, reject) => 
            connection(db => {
                db.collection(collection).remove(
                    {entity_uuid},
                    (err, result) => {
                        if(err) reject(err)
                        else resolve(result)
                    })
            }))

const reorderEntities = (connection, collection) => (list) => new Promise((resolve, reject) => {
    try {

        connection(db => {
            db.collection(collection).bulkWrite(list.map(e => ( { updateOne : {
                "filter" : { "entity_uuid" : e.entity_uuid },
                "update" : { $set : { "order" : e.order } }
            } }))).then(() => resolve())
            
        })



    } catch (e) {

        reject(e);

    }
})


const updateEntityData = (connection, collection) => (entity_uuid, payload) =>
     new Promise((resolve, reject) => 
        findEntities(connection, collection).then((entities) => {
            try {
                const {title } = payload
                const entity = entities.find(e => e.entity_uuid === entity_uuid) || {}

                let {slug} = entity
                if(!slug) {
                    slug = generateSlug(title.en || title.de || 'entity', entities.map(p => p.slug))
                }

                const {images} = entity
                if(images && payload.images) {
                    Object.keys(images).map(node_uuid => {
                        // if image file_uuid exists already then just take the current state 
                        if(payload.images[node_uuid]) {

                            const image = images[node_uuid]
                            if(image) {
                                payload.images[node_uuid] = {...image, ...payload.images[node_uuid]}
                            }
                            
                        }
                    })
                }
            

                const {content} = entity
                if(content && payload.content) {
                    Object.keys(content).map(content_uuid => {
                        // if image file_uuid exists already then just take the current state 
                        if(payload.content[content_uuid] && payload.content[content_uuid].keepimage && content[content_uuid].images) {

                            const node_uuid = payload.content[content_uuid].keepimage
                            const image = content[content_uuid].images[node_uuid]
                            if(image) {
                                payload.content[content_uuid].images = {[node_uuid]: image}
                                delete(payload.content[content_uuid].keepimage)
                            }
                            
                        }
                    })
                }


                const {model} = entity
                if(model && payload.model) {
                    Object.keys(model).map(key => {
                        if(!payload.model[key]) {
                            payload.model[key] = model[key]
                        }
                    })
                }
            
                console.log('update payload', payload)

                let statement = {'$set': { ...payload, slug }}
                if(!payload.content) {
                    statement = {...statement, "$unset": {'content' : ''}}
                }
                if(!payload.images) {
                    statement = {...statement, "$unset": {'images' : ''}}
                }
                if(!payload.parameters) {
                    statement = {...statement, "$unset": {'parameters' : ''}}
                }
                //reject()
                connection(db => {
                    db.collection(collection).updateOne(
                        {entity_uuid}, 
                        statement, 
                        {upsert: true},
                        (err, result) => {
                            if(err) reject(err)
                            else resolve(result?.result)
                        })
                })
                
            } catch (err) {
                reject(err)
            }        
    })
)


const storeEntityImages = async (connection, collection, query, images) => {

    await connection(async (db) => {

        const file_uuids = images.map(i => i.file_uuid)

        const entity = await db
        .collection(collection)
        .findOne(query)



        const _images = entity === null
        ? images
        : (entity.images) 
            ? [...entity.images.filter(i => !file_uuids.includes(i.file_uuid)), ...images]
            : images
        
        await db
        .collection(collection)
        .updateOne(query, {$set : {images: _images}}, {upsert: true})

    })}

const findEntityImage = (connection) => 
    (collection, entity_uuid, file_uuid, format) => new Promise((resolve, reject) => connection(async (db) => {

         
        
        const result = await db
        .collection(collection)
        .findOne({entity_uuid})
    
        
        const image = result === null
        ? null
        : (result.images) 
            ? result.images[file_uuid]
            : null
    
        image ? resolve(image.pathes[format]) : resolve(null)
            
    }))

const findEntityAsset = (connection, collection, {entity_uuid, edit_id, type, node_uuid, format}) =>
    new Promise((resolve, _) => connection(async (db) => {
        const result = await db
        .collection(collection)
        .findOne({entity_uuid})

        const typeAsset = result && result[edit_id] && result[edit_id][type] || [] 
        
        const node = typeAsset.length && typeAsset.find(a => a.node_uuid === node_uuid)
       
        const path = node && (node.src[format] || (!format && node.src))
    
        path ? resolve(path) : resolve(null)
    
    }))

const findGltfAsset = (connection, collection, {entity_uuid}) =>
    new Promise((resolve, _) => connection(async (db) => {
        const result = await db
        .collection(collection)
        .findOne({entity_uuid})

        const typeAsset = result?.model?.gltf || [{}] 
        
        const [{src}] = typeAsset

        src ? resolve(src) : resolve(null)

    }))

const findEntityContentImage = (connection) => 
(collection, entity_uuid, node_uuid, format) => new Promise((resolve, reject) => connection(async (db) => {

        
    
    const result = await db
    .collection(collection)
    .findOne({entity_uuid})

    const content = result === null
    ? null
    : (result.content) 
        ? Object.values(result.content).find(c => c.images && c.images && c.images[node_uuid])
        : null

    const path = content && content.images && content.images[node_uuid].pathes && content.images[node_uuid].pathes[format]

    path ? resolve(path) : resolve(null)
        
}))


const deleteEntityImage = (connection) => 
    (collection, entity_uuid, file_uuid) => new Promise((resolve, reject) => connection(async (db) => {

        const entity = await db
        .collection(collection)
        .findOne({entity_uuid})

        if(entity === null || !entity.images) return
        const _images = entity.images.filter(i => i.file_uuid !== file_uuid)
        
        await db
        .collection(collection)
        .updateOne({entity_uuid}, {$set : {images: _images}})
        
        resolve(true)

}))
    
const reorderEntityImage = (connection) =>
    (collection, entity_uuid, order) => new Promise((resolve, reject) => connection(async (db) => {
       

        const entityData = await db.collection(collection)
        .findOne({entity_uuid})


        if( entityData === null || !entityData.images) return 

        const orderDict = {}
        order.forEach(({file_uuid, order}) => orderDict[file_uuid] = order)
        entityData.images.forEach(i => i.order = orderDict[i.file_uuid])


        await db.collection(collection)
            .updateOne({entity_uuid}, {
                $set : {images: entityData.images} 
            })


        resolve(true)

    }))


const categoryCollection = (collection) => `${collection}_categories`

const parametersCollection = (collection) => `${collection}_parameters`

const findEntityCategories = (connection) => 
    (collection) => new Promise((resolve, _) => {
        connection(db => 
            resolve(db.collection(categoryCollection(collection)).find().toArray()))
    })
        
const findCategory = (connection, collection) => (query) => 
    new Promise((resolve, reject) => connection(async (db) => {
    
        const entity = await db.collection(categoryCollection(collection)).findOne(query, {_id: 0})
        resolve(entity)

    }))

const storeEntityCategory = (connection) =>
     (collection, category_uuid, payload) => new Promise((resolve, reject) => {
        findEntityCategories(connection)(collection).then(categories => {

            const {title } = payload
            const category = categories.find(e => e.category_uuid === category_uuid) || {}
    
            let {slug} = category
            if(!slug) {
                slug = generateSlug(title?.en || title?.de || 'category', categories.map(p => p.slug))
                payload = {...payload, slug}
            }
          
            connection(db => {
                db.collection(categoryCollection(collection)).updateOne(
                    {category_uuid}, 
                    {$set: { ...payload }}, 
                    {upsert: true},
                    (err, result) => {
                        if(err) reject(err)
                        else resolve(result)
                    })
                })  
            })                    
      
})

const updateCollectionCategory = (connection, collection, {category_uuid, label}) =>
    new Promise((resolve, reject) => connection(db => {
        console.log('category', {category_uuid, label})

        try {
            db.collection(categoryCollection(collection))
            .updateOne({ category_uuid },
                { $set : { label }},
                {upsert: true}
            ).then(resolve)
        
        } catch (e) {
            reject(e)
        }        
    }))

const deleteEntityCategory = connection =>
    (collection, category_uuid) => new Promise((resolve, reject) => connection(db => {
        db.collection(categoryCollection(collection)).remove(
            {category_uuid},
            (err, result) => {
                if(err) reject(err)
                else resolve(result)
            })
}))


const updateCollectionParameters = (connection, collection, parameters) => 
    new Promise((resolve, reject) => connection(db => {

        if(parameters.length === 0) {
            resolve()
            return
        }
        
        try {
            db.collection(parametersCollection(collection))
            .bulkWrite(parameters.map(p => ( { updateOne : {
                filter : { parameter_uuid : p.parameter_uuid },
                update : { $set : { label : p.label } },
                upsert: true
            } }))).then((r) => resolve(r?.result))
        
        } catch (e) {
            reject(e)
        }        
       
    }))

const findCollectionParameters = (connection, collection) => 
    new Promise((resolve, reject) => connection(db => {
        
        try {
            db.collection(parametersCollection(collection))
            .find()
            .toArray()
            .then(resolve)
        
        } catch (e) {
            reject(e)
        }        
    
    }))


const findCollection = (connection, collection) =>
    new Promise((resolve, reject) => 
        connection(async (db) => {
    
            const entities = await db.collection(collection).find().toArray()
    
            resolve(entities)

    }))

const updateSingleCollection = (connection, collection, payload) =>
    new Promise(async (resolve, reject) => {
        const statement = {'$set': { ...payload }}
        connection(db => {
            db.collection(collection).updateOne(
                {collection}, 
                statement, 
                {upsert: true},
                (err, result) => {
                    if(err) reject(err)
                    else resolve(result?.result)
                })
        })
    })

module.exports = {
    findEntities,
    findEntitiesByCategory,
    updateEntityData,
    findEntity,
    deleteEntity,
    storeEntityImages,
    findEntityImage,
    findEntityContentImage,
    deleteEntityImage,
    reorderEntityImage,
    findEntityCategories,
    reorderEntities,
    findCategory,
    storeEntityCategory,
    deleteEntityCategory,
    updateCollectionCategory,
    updateCollectionParameters,
    findCollectionParameters,
    findEntityAsset,
    findGltfAsset,
    findCollection,
    updateSingleCollection
}
