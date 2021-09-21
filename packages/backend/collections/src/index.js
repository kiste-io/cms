const {from, of, zip, lastValueFrom} = require('rxjs')
const {map, tap, mergeMap} = require('rxjs/operators')

const {
    updateEntityData,
    updateCollectionParameters,
    findCollectionParameters,
    updateCollectionCategory,
    findCollection,
    updateSingleCollection,
    storeEntityCategory
} = require('./db')

const {
    uploadFiles
} = require('./upload')

const {fieldsToJSON} = require('./utils')

/** CONFIG */

const config = {
    collections: null,

    getEntity: function (collection) {
        return this.collections.entities.find(e => e.id ===  collection)
    },

    getEntityEditConfig: function (collection, edit) {
        const entityCollection = this.getEntity(collection)
        return entityCollection?.edit?.find(c => c.id === edit) || null
    },

    getEntityUploadEditConfig: function (collection) {
        const entityCollection = this.getEntity(collection)
        
        return entityCollection?.edit?.filter(e => e.component === 'upload')
    },
    getEntityEditConfigAssetTypes: function (collection, edit) {
        const entityCollection = this.getEntity(collection)
        const editTuple = entityCollection?.edit?.find(c => c.id === edit) || {assets: []}
        return editTuple.assets.map(a => ({...a, edit_id: editTuple.id}))
    },
}
const applyCollectionsConfig = (c) => config.collections = c



/*** PARAMETERS */

const findEntityParameters = (connection, collection) => 
    new Promise((resolve, reject) => {        

        findCollectionParameters(connection, collection)
            .then((result) => resolve(result))
            .catch(reject)

    })


const ensureCollectionParameters = (connection, collection, {parameters}) => 
    new Promise((resolve, reject) => {
    
        if(!parameters) resolve()

        const s_paramters = Object.keys(parameters).map(order => {
            const {label, value} = parameters[order].key
            return {parameter_uuid: value, label, order, value: parameters[order].value }
        }).filter(({value, label}) => value && label)

    
        updateCollectionParameters(connection, collection, s_paramters)
            .then(() => resolve(s_paramters))
            .catch(reject)

    })

/*** CATEGORY */

const ensureCollectionCategory = (connection, collection, {category}) => 
    new Promise((resolve, reject) => {
    
        if(!category) resolve()
      
        const {label, value} = category
        
        if(!label || label.length === 0) resolve() 
    
        const s_category = {category_uuid: value, label}
        updateCollectionCategory(connection, collection, s_category)
            .then(() => resolve(s_category))
            .catch(reject)

    })

const ensureAttributes = async (connection, collection, fieldsPayload) => {
    const source$ = of(true).pipe(
        mergeMap(_ => from(ensureCollectionParameters(connection, collection, fieldsPayload))),
        mergeMap(_ => zip(of(_), from(ensureCollectionCategory(connection, collection, fieldsPayload)))),
        map(([parameters, category]) => ({parameters, category})),
        tap(payload => console.log('tap', payload)),
        
    );
    

    return await lastValueFrom(source$)
}

/** FILTER */
const matchFieldsToFiles = (collection, fieldsPayload) => {

    const uploadEditIds = config
        .getEntityUploadEditConfig(collection)
        .map(e => e.id)

    
    const fields = Object.keys(fieldsPayload)
        .filter(f => !uploadEditIds.includes(f))
        .reduce((acc, f) => ({...acc, [f]: fieldsPayload[f]}), {})

    
    return fields

}


/*** ENTITY */
const updateEntity = async(connection, {collection, entity_uuid, fields, files}) => {
    const fieldsPayload =  fieldsToJSON(fields)       
    const filesPayload = fieldsToJSON(files)  

    const titleForSlug = fieldsPayload?.title?.en || fieldsPayload?.title?.de || "entity"

    const source$ = of(true).pipe(
        mergeMap(_ => from(ensureAttributes(connection, collection, fieldsPayload))),
        mergeMap(_ => zip(of(_), from(uploadFiles(collection, entity_uuid, fieldsPayload, filesPayload, config)))),
        mergeMap(([attributes, uploads]) => {
            const fields = matchFieldsToFiles(collection, fieldsPayload)
            console.log('[attributes, fields, uploads]', [attributes, fields, uploads])
            return updateEntityData(connection, collection)(entity_uuid, {...fields, ...attributes, ...uploads}, titleForSlug)
        }),
        tap(payload => console.log('tap', payload)),
        
    );
    

    return await lastValueFrom(source$)
}



const _updateEntity = async(connection, {collection, entity_uuid, fields, files}) => {
    
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

    const titleForSlug = fieldsPayload?.title?.en || fieldsPayload?.title?.de || "entity"

    const payload = fieldsPayload




    return await updateEntityData(connection, collection)(entity_uuid, payload, titleForSlug)

}

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


/** SINGLE */

const findSingle =  async (conn, coll) => {

    try {
        const data = await findCollection(conn, coll)
        return data && data[0] || {}
    } catch (e) {
        console.error(e)
        return {}
    }
}

const updateSingle =  (conn, {collection, fields, files}) => new Promise(async(resolve, reject) => {

    const payload = fieldsToJSON(fields)

    updateSingleCollection(conn, collection, payload)
        .then(resolve)
        .catch(reject)
    
})


/** CATEGORY */

const updateEntityCategory = (conn, collection, category_uuid, fields) => new Promise(async(resolve, reject) => {
    const payload = fieldsToJSON(fields)
    storeEntityCategory(conn)(collection, category_uuid, payload)
        .then(resolve)
        .catch(reject)
})
    



module.exports = {
    applyCollectionsConfig,
    config,
    updateEntity,
    findEntityParameters,
    findSingle,
    updateSingle,
    updateEntityCategory
}
