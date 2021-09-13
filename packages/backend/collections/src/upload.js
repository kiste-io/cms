const {from, of, zip, lastValueFrom} = require('rxjs')
const {map, tap, mergeMap, reduce, scan, catchError, filter} = require('rxjs/operators')
const fs = require('fs')
const sharp = require('sharp')
require('dotenv').config()

const imgRootDir = `${process.env.IMG_ROOT_DIR}`;

const resizeCover  = (src_file, dist_file, length, entropy) => 
    sharp(src_file)
        .resize({
            width: length,
            height: length,
            fit: sharp.fit.cover,
            position: entropy ? sharp.strategy.entropy : undefined
        })
        .toFormat('jpeg')
        .toFile(dist_file)
        .then(_ => dist_file)

    
        



const resize = async (dist, file) => {
    const filename = escape([...file.name.split('.').slice(0, -1), 'jpeg'].join('.'))
    
    return Promise.all([

        resizeCover(file.path, `${dist}/200x200_${filename}`, 300, true).then(dist_file => ({'200x200': dist_file})),

        sharp(file.path)
            .resize({width: 700, height:700, position: sharp.strategy.entropy})
            .toFormat('jpeg')
            .toFile(`${dist}/600_${filename}`)
            .then(_ => ({'600': `${dist}/600_${filename}`})),

        sharp(file.path)
            .resize(1000, 1000, {fit: sharp.fit.inside, withoutEnlargement: true})
            .toFormat('jpeg')
            .toFile(`${dist}/1000_${filename}`)
            .then(_ => ({'1000': `${dist}/1000_${filename}`})),

        
        ]).then(([x1, x2, x3]) => ({...x1, ...x2, ...x3}))                    
}

const ensureDir = (path) => new Promise((resolve, reject) => fs.exists(path, (exists) => {
    exists
    ? resolve(path)
    : fs.mkdir(path, {}, (err) => 
            err 
            ? reject(err)
            : resolve(path))}
))


const _processImages = (dir, fields, files) => {
    return of(...fields).pipe(
        mergeMap((field) => zip(of(field), from(resize(dir, files[field.file_uuid])))),
        tap(console.log),
        reduce((acc, [field, pathes]) => [...acc, {...field, pathes}], []))
} 

const _urifyImages = (collection, entity_uuid, images) => {

    return images.map(({file_uuid, pathes, ...rest}) => {
        
        // /entities/:collection/:entity_uuid/images/:file_uuid/:format
        const uris = Object.keys(pathes).reduce((acc, key) => 
            ({...acc, [key]: `${process.env.BACKED_SERVICE_URL}/entities/${collection}/${entity_uuid}/images/${file_uuid}/${key}`}), {})


        return {file_uuid, pathes, uris, ...rest }
    })
    
    
}

const urifyImages = (pathes, {collection, entity_uuid, edit_id, type, node_uuid}) => {

   
        // /entities/:collection/:entity_uuid/images/:file_uuid/:format
    return Object.keys(pathes).reduce((acc, key) => 
        ({...acc, [key]: `${process.env.BACKED_SERVICE_URL}/assets/${collection}/${entity_uuid}/${edit_id}/${type}/${node_uuid}/${key}`}), {})

 
    
}

const urifyImages2 = (meta, pathes) => {


    const {collection, entity_uuid, node_uuid, ...rest} = meta
 
    // /entities/:collection/:entity_uuid/images/:file_uuid/:format
    const uris = Object.keys(pathes).reduce((acc, key) => 
        ({...acc, [key]: `${process.env.BACKED_SERVICE_URL}/entities/${collection}/${entity_uuid}/images/${node_uuid}/${key}`}), {})


    return {node_uuid, pathes, uris, ...rest }

    
}

const uploadImagesCommand = (collection, uuid, fields, files) => of(true)
.pipe(        
    /** resize and store locally images */
    mergeMap(_ => from(ensureDir(`/tmp/${uuid}`))),
    
    mergeMap(dir => processImages(dir, fields, files)),

    map(images => urifyImages(collection, uuid, images)),

    tap(images => console.log('result',  {images})),

    /**
     * Example 
    [{
        file_uuid: '0be7f0f4-e8bb-4658-be05-99b8f79aac68',
        pathes: {
        '600': '/tmp/fdf8afe1-ca9d-4d3b-b0c3-ba37d9e8c6bc/600_1.jpeg',
        '1000': '/tmp/fdf8afe1-ca9d-4d3b-b0c3-ba37d9e8c6bc/1000_1.jpeg',
        '200x200': '/tmp/fdf8afe1-ca9d-4d3b-b0c3-ba37d9e8c6bc/200x200_1.jpeg'
        },
        uris: {
        '600': 'http://192.168.3.211:3010/images/fdf8afe1-ca9d-4d3b-b0c3-ba37d9e8c6bc/0be7f0f4-e8bb-4658-be05-99b8f79aac68/600',
        '1000': 'http://192.168.3.211:3010/images/fdf8afe1-ca9d-4d3b-b0c3-ba37d9e8c6bc/0be7f0f4-e8bb-4658-be05-99b8f79aac68/1000',
        '200x200': 'http://192.168.3.211:3010/images/fdf8afe1-ca9d-4d3b-b0c3-ba37d9e8c6bc/0be7f0f4-e8bb-4658-be05-99b8f79aac68/200x200'
        },
        order: 1
    }]
     */    
        
).toPromise()



const uploadImagesCommand2 = async (filesData) => {

    const dir = await ensureDir(`${imgRootDir}/${filesData[0].meta.entity_uuid}`)
    return from(filesData)
    .pipe(        
        /** resize and store locally images */
        mergeMap((filedata) => zip(of(filedata), from(resize(dir, filedata.file)))),    
        map(([filedata, pathes]) => urifyImages2(filedata.meta, pathes)),
        scan((acc, value) => [...acc, value], []),
        catchError((err, caught) => {
            console.error(err, caught)
            return of([])
        }),

    ).toPromise()
} 


const matchFilesToFields = (filesPayload, fieldsPayload) => {
    
    const files = Object.keys({...filesPayload}).reduce((acc, id) => {
        
        return {...acc, [id] : Object.keys(filesPayload[id]).reduce((_acc, type) => {
            const files = !Array.isArray(filesPayload[id][type]) 
            ? [filesPayload[id][type]]
            : filesPayload[id][type]

            const filenames = Object.keys(fieldsPayload[id][type]).map(node_uuid => {
                return fieldsPayload[id][type][node_uuid].filename
            })

            const uuidMap = Object.keys(fieldsPayload[id][type]).reduce((acc, node_uuid) => {
                return {...acc, [fieldsPayload[id][type][node_uuid].filename] : node_uuid}
            }, {})

            return {..._acc, [type] : files
                .filter(file => filenames.includes(encodeURI(file.name)) && file.size > 0)
                .map(file => ({file, node_uuid: uuidMap[encodeURI(file.name)]}))
            }}, {})
        
    }}, {})

    const keys = Object.keys(files)
        .filter(id => 
            Object.keys(files[id]).filter(type => files[id][type].length > 0).length > 0)
    
    

    return {files, keys}
}


const uploadFiles =  async (collection, entity_uuid, fieldsPayload, filesPayload, config) => {

   
    const {files, keys} = matchFilesToFields(filesPayload, fieldsPayload)
            
    if(keys.length === 0) return Promise.resolve({})

    const source$ = from(keys).pipe(
        
        mergeMap(key => from(config.getEntityEditConfigAssetTypes(collection, key))),

        map(t => ({...t, entity_uuid, files: files[t.edit_id][t.type]})),

        mergeMap(assetPayload => zip(of(assetPayload), from(ensureDir(`${imgRootDir}/${assetPayload.entity_uuid}`)))),

        tap((r) => console.log('assetPayload dest', r)),

        mergeMap(([assetPayload, dest]) => from(processAsset(assetPayload, dest, {collection, entity_uuid}))),

        tap((r) => console.log('reslut', r)),
        
        filter(r => r)
    )

    return await lastValueFrom(source$)
    
}


const processAsset =  async ({type, edit_id, sizes, files}, dest_dir, meta) => {
        
    if(type === 'images'){
        const images = await processImages(files, sizes, dest_dir, {...meta, type, edit_id})
        return Promise.resolve({[edit_id] : {[type]: [...images]}})    
    }
    
    return Promise.resolve()    

}


const processImages = async (files, sizes, dest_dir, meta) => {
    const source$ = from(files).pipe(
        mergeMap((file) => from(proccessImage(file, sizes, dest_dir, meta))),
        scan((acc, value) => [...acc, value], [])
    )
    return await lastValueFrom(source$)
}
    
    



const proccessImage = ({file, node_uuid}, sizes, dest_dir, meta) =>  
    Promise.all(sizes.map(({id, ...params}) =>  {
    
        const dest_path = `${dest_dir}/${id}_${escape(file.name)}`

        return  sharp(file.path)
            .resize({...params})
            .toFile(dest_path)
            .then(_ => ({[id]: dest_path}))
            
    }))
    .then((result) => result.reduce((acc, r) => ({...acc, ...r}), {}))
    .then((result) => ( {node_uuid, src: {...result}, uri: urifyImages(result, {...meta, node_uuid})}))

    

module.exports =  {
    uploadImagesCommand, 
    uploadImagesCommand2,
    uploadFiles,
    digitalOceanUpload: (images) => of(images)
            .pipe(

            )
}

    
