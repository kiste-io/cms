
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


const generateEntitySlug = (name, existing_slugs, iteration=0) => {

const slug = name.toLocaleLowerCase().replace(/[^a-z0-9]/g, "")

if(existing_slugs.includes(slug)){
    return generateEntitySlug(`${name}${++iteration}`, existing_slugs, iteration)
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




const updateEntityData = (connection, collection) => (entity_uuid, payload) => new Promise((resolve, reject) => 
findEntities(connection, collection).then((entities) => {
    try {
        const {title } = payload
        const entity = entities.find(e => e.entity_uuid === entity_uuid) || {}

        let {slug} = entity
        if(!slug) {
            slug = generateEntitySlug(title, entities.map(p => p.slug))
        }
    
        
        connection(db => {
            db.collection(collection).updateOne(
                {entity_uuid}, 
                {$set: { ...payload, slug }}, 
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
            ? result.images.find(i => i.file_uuid === file_uuid)
            : null
    
        image ? resolve(image.pathes[format]) : resolve(null)
            
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

const findEntityCategories = (connection) => 
    (collection) => new Promise((resolve, _) => {
        connection(db => 
            resolve(db.collection(categoryCollection(collection)).find().toArray()))
    })
        


const storeEntityCategory = (connection) =>
    (collection, category_uuid, payload) => new Promise((resolve, reject) =>                     
        connection(db => {
            db.collection(categoryCollection(collection)).updateOne(
                {category_uuid}, 
                {$set: { ...payload }}, 
                {upsert: true},
                (err, result) => {
                    if(err) reject(err)
                    else resolve(result)
                })


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


module.exports = {
    findEntities,
    findEntitiesByCategory,
    updateEntityData,
    findEntity,
    deleteEntity,
    storeEntityImages,
    findEntityImage,
    deleteEntityImage,
    reorderEntityImage,
    findEntityCategories,
    storeEntityCategory,
    deleteEntityCategory
}
