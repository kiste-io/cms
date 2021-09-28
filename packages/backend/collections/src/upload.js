const {from, of, zip, lastValueFrom} = require('rxjs')
const {map, tap, mergeMap, reduce, scan, catchError, filter} = require('rxjs/operators')
const fs = require('fs')
const { access, copyFile, mkdir } = require('fs/promises')
const sharp = require('sharp')
const merge = require('deepmerge')

require('dotenv').config()

const imgRootDir = `${process.env.ASSETS_ROOT_DIR}`;

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

const urifyEntityAsset = ({collection, entity_uuid, edit_id, type, node_uuid}) => {
   
    // /entities/:collection/:entity_uuid/images/:file_uuid/:format
    return`${process.env.BACKED_SERVICE_URL}/assets/${collection}/${entity_uuid}/${edit_id}/${type}/${node_uuid}`        

}

const obtainFilename = (path) => path.split('/').slice(-1)[0]

const urifySingleImages = (pathes, node_uuid) => {
    return Object.keys(pathes).reduce((acc, key) => 
        ({...acc, [key]: `${process.env.BACKED_SERVICE_URL}/assets/${node_uuid}/${obtainFilename(pathes[key])}`}), {})
}

const urifySingleFile = (path, node_uuid) => {
    return `${process.env.BACKED_SERVICE_URL}/assets/${node_uuid}/${obtainFilename(path)}`
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


const matchFilesToFields = (collection, config, filesPayload, fieldsPayload) => {
    
    const files = Object.keys(filesPayload).reduce((acc, id) => {
        
        const assetsConfig = config.getEditConfigAssetTypes(collection, id)

        return {...acc, [id] : Object.keys(filesPayload[id]).reduce((_acc, type) => {
            
            const isSchehduled = fieldsPayload[id] && fieldsPayload[id][type]

            console.log('isSchehduled', id, type, fieldsPayload[id])
            if(!isSchehduled) return _acc

            

            const files = !Array.isArray(filesPayload[id][type]) 
            ? [filesPayload[id][type]]
            : filesPayload[id][type]

            const assetConfig = assetsConfig.find(a => a.type === type && a.edit_id === id)
            
            if(assetConfig.folder) {
                // for folder exit hier with the same node_uuid
                const [node_uuid] = Object.keys(fieldsPayload[id][type])
                return {..._acc, [type] : files.map(file => ({file, node_uuid}))}
            }
            
            const filenames =  Object.keys(fieldsPayload[id][type]).map(node_uuid => {
                return fieldsPayload[id][type][node_uuid].filename
            }) || []

            const uuidMap = Object.keys(fieldsPayload[id][type]).reduce((acc, node_uuid) => {
                return {...acc, [fieldsPayload[id][type][node_uuid].filename] : node_uuid}
            }, {})

            return {..._acc, [type] : files
                .filter(file => (
                    filenames.includes(encodeURI(file.name)) && file.size > 0)
                )
                .map(file => ({file, node_uuid: uuidMap[encodeURI(file.name)]}))
            }}, {})
        
    }}, {})

    const keys = Object.keys(files)
        .filter(id => 
            Object.keys(files[id]).filter(type => files[id][type].length > 0).length > 0)
    
    

    return {files, keys}
}






const uploadFiles =  async (collection, entity_uuid, fieldsPayload, filesPayload, config) => {

    const {files, keys} = matchFilesToFields(collection, config, filesPayload, fieldsPayload)
            
    if(keys.length === 0) return Promise.resolve({})

    const source$ = from(keys).pipe(
                
        mergeMap(id => from(Object.keys(files[id]).map(type => ({id, type})))),

        map(t => ({...t, entity_uuid, files: files[t.id][t.type], ...config.getEntityEditConfigAssetTypes(collection, t.id).find(a => a.type === t.type)})),

        tap(t => console.log('config t', t)),

        filter(t => t.files.length > 0),

        mergeMap(assetPayload => zip(of(assetPayload), from(ensureDir(`${imgRootDir}/${assetPayload.entity_uuid}`)))),

        tap((r) => console.log('asssetPayload dest', r)),

        mergeMap(([assetPayload, dest]) => from(processAsset(assetPayload, dest, {collection, entity_uuid}))),

        tap((r) => console.log('reslut', r)),
        
        filter(r => r)
    )

    return await lastValueFrom(source$)
    
}

const matchSingleFilesToFields = (collection, config, filesPayload, fieldsPayload) => {
    const filesForUpload = []
    // files level 1
    Object.keys(filesPayload).map(edit_id => {
        const assetsConfig = config.getEditConfigAssetTypes(collection, edit_id)

        // files level 2
        Object.keys(filesPayload[edit_id]).map(parent_uuid => {

                // assets
                assetsConfig.map(asset => {

                
                    // fields level 3
                    Object.keys(fieldsPayload[edit_id][parent_uuid][asset.type]).map(node_uuid => {

                        //fields level 4
                        const {filename} = fieldsPayload[edit_id][parent_uuid][asset.type][node_uuid]

                       
                        
                        // find corresponding filename in files
                        
                        const uploadedFiles = filesPayload[edit_id][parent_uuid][asset.type]
                        const files = !Array.isArray(uploadedFiles) 
                        ? [uploadedFiles]
                        : uploadedFiles

                        
                        const file = files.find(f => encodeURI(f.name) === filename)
                        
                        console.log('fieldsPayload filename', filename, 'files', files.find(f => encodeURI(f.name) === filename))

                        if (file) {
                            filesForUpload.push({
                                file,
                                node_uuid,
                                asset,
                                parent_uuid,
                                edit_id
                            })
                        }

                    })    
                   
                })            
        })
    })

     // clean up fields payload
     config.getEditConfigUploadableAssetsTypes(collection).map(edit => {

        // items
        fieldsPayload[edit.id] && Object.keys(fieldsPayload[edit.id]).map(parent_uuid => {

            // assets
            edit.assets.map(asset => {
                
                    delete fieldsPayload[edit.id][parent_uuid][asset.type]
                
            })
        })
  
    })
        


    return [fieldsPayload, filesForUpload]

}

const uploadSingleFiles =  async (collection, fieldsPayload, filesPayload, config) => {

    const [restfields, files] = matchSingleFilesToFields(collection, config, filesPayload, fieldsPayload)
            
    if(files.length === 0){
        return Promise.resolve([restfields, {}])
    }

    const source$ = from(files).pipe(                
      
        mergeMap(file => zip(of(file), from(ensureDir(`${imgRootDir}/${file.node_uuid}`)))),

        tap((r) => console.log('asssetPayload dest', r)),

        mergeMap(([file, dest]) => from(processSingleAsset(file, dest))),

        scan((acc, value) => merge(acc, value), {}),
        
        catchError((err, caught) => {
            console.error(err, caught)
            return of([])
        }),

        tap((r) => console.log('reslut', r)),
        
        filter(r => r),

        mergeMap(uploads => zip(of(restfields), of(uploads)))
    )

    return await lastValueFrom(source$)
    
}

const processSingleAsset = async(filedata, dest_dir) => {
    const {file, asset, node_uuid, edit_id, parent_uuid} = filedata

    const {type, sizes} = asset
   
    if(type === 'images'){
        const images = await processSingleImage(file, sizes, dest_dir, node_uuid)
        return Promise.resolve({[edit_id] : {[parent_uuid] : {[type]: [images]}}})    
    }
    if(type === 'files'){
        const files = await processSingleFile(file, dest_dir, node_uuid)
        return Promise.resolve({[edit_id] : {[parent_uuid] : {[type]: [files]}}})    
    }
    return Promise.resolve()    
    
}


const processAsset =  async ({type, edit_id, sizes, folder, files}, dest_dir, meta) => {
        
    if(type === 'images'){
        const images = await processImages(files, sizes, dest_dir, {...meta, type, edit_id})
        return Promise.resolve({[edit_id] : {[type]: [...images]}})    
    }
    if(type === 'gltf' && folder){
        const gltf = await processGltfFolder(files, dest_dir, {...meta, type, edit_id})
        return Promise.resolve({[edit_id] : {[type]: [gltf]}})    
    }
    if(type === 'usdz'){
        const usdz = await processUsdz(files, dest_dir, {...meta, type, edit_id})
        return Promise.resolve({[edit_id] : {[type]: [usdz]}})    
    }
    
    return Promise.resolve()    

}

const ensureDirPath = (path, deep) => {
    const folders = path.split('/')
    if(folders.length === deep) return path

    const dir = folders.slice(0, deep + 1).join('/')
    try {
        fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK)
    } catch (err) {
        fs.mkdirSync(dir)
    }
    return ensureDirPath(path, deep + 1)
    

}


const processUsdz = async (files, _, meta) => {
    
    
    const [{file, node_uuid}] = files
    const _dist_dir = `${imgRootDir}/${node_uuid}`
    await  ensureDir(_dist_dir)

    const filepath = `${_dist_dir}/${file.name}`

    await copyFile(file.path, filepath)
    
    return Promise.resolve({node_uuid, src: filepath, uri: urifySingleFile(filepath, node_uuid)})
}

const processGltfFolder = async (files, dest_dir, meta) => {

    const result = await Promise.all(files.map(({file}) => {
        const path = `${dest_dir}/${file.name}`
        const dir = path.split('/').slice(0, -1).join('/')
        ensureDirPath(dir, dest_dir.split('/').length)

        return copyFile(file.path, path).then(() => path)
    }))
    
    const {node_uuid} = files[0]

    const mainPath = result.reduce((gltfPath, path) => {
        const ext = path.split('/').slice(-1)[0].split('.').slice(-1)[0]
        return ext === 'gltf' ? path : gltfPath
    }, '')
    
    return Promise.resolve({node_uuid, src: mainPath, uri: urifyEntityAsset({...meta, node_uuid})})
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


const processSingleImage = (file, sizes, dest_dir, node_uuid) =>  
    Promise.all(sizes.map(({id, ...params}) =>  {
    
        const dest_path = `${dest_dir}/${id}_${escape(file.name)}`

        
        return  sharp(file.path)
            .resize({...params})
            .toFile(dest_path)
            .then(_ => ({[id]: dest_path}))
            
    }))
    .then((result) => result.reduce((acc, r) => ({...acc, ...r}), {}))
    .then((result) => ( {node_uuid, src: {...result}, uri: urifySingleImages(result, node_uuid)}))


const processSingleFile = (file, dest_dir, node_uuid) => new Promise(async (resolve, reject) => {
        
      
        const filepath = `${dest_dir}/${file.name}`

        await copyFile(file.path, filepath).catch(reject)
        resolve(filepath)
    }).then((path) => ( {node_uuid, src:path, uri: urifySingleFile(path, node_uuid)}))



module.exports =  {
    uploadImagesCommand, 
    uploadImagesCommand2,
    uploadFiles,
    uploadSingleFiles,
    matchFilesToFields,
    matchSingleFilesToFields,
    digitalOceanUpload: (images) => of(images)
            .pipe(

            )
}

    
