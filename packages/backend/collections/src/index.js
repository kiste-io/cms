const {from, of, zip, interval, lastValueFrom} = require('rxjs')
const {map, tap, mergeMap, reduce, scan, catchError, take} = require('rxjs/operators')

const {
    updateEntityData,
    updateCollectionParameters,
    findCollectionParameters
} = require('./db')

const {fieldsToJSON} = require('./utils')

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
        })

    
        updateCollectionParameters(connection, collection, s_paramters)
            .then(() => resolve(s_paramters))
            .catch(reject)

    })

/*** ENTITY */
const updateEntity = async(connection, {collection, entity_uuid, fields, files}) => {
    const fieldsPayload =  fieldsToJSON(fields)       
    const filesPayload = fieldsToJSON(files)  

    const titleForSlug = fieldsPayload?.title?.en || fieldsPayload?.title?.de || "entity"

    const source$ = of(true).pipe(
        mergeMap(_ => from(ensureCollectionParameters(connection, collection, fieldsPayload))),
        mergeMap(parameters => updateEntityData(connection, collection)(entity_uuid, {...fieldsPayload, parameters}, titleForSlug)),
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


module.exports = {
    updateEntity,
    findEntityParameters
}