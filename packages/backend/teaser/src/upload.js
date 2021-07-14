const fs = require('fs')
const sharp = require('sharp')
require('dotenv').config()

const imgRootDir = `${process.env.IMG_ROOT_DIR}`;


const ensureDir = (path) => new Promise((resolve, reject) => fs.exists(path, (exists) => {
    exists
    ? resolve(path)
    : fs.mkdir(path, {}, (err) => 
        err 
        ? reject(err)
        : resolve(path))
}))

const resizeCover  = (src_file, dist_file, format, length, entropy) => 
    sharp(src_file)
        .resize({
            width: length,
            height: length,
            fit: sharp.fit.inside,
            position: entropy ? sharp.strategy.entropy : undefined
        })
        .toFormat(format)
        .toFile(dist_file)
        .then(_ => dist_file)


const uploadThumb = async (collection, teaser_uuid, file_uuid, image) => {
    const ext = image.name.split('.').pop()
    const filename = escape([...image.name.split('.').slice(0, -1), ext].join('.'))
    const dir = await ensureDir(`${imgRootDir}/${teaser_uuid}`)
    const dest_path = `${dir}/200x200_${filename}`
    
    console.log('url', `${process.env.BACKED_SERVICE_URL}/teasers/${collection}/${teaser_uuid}/images/${file_uuid}`)
    return resizeCover(image.path, dest_path, ext, 240, true).then(path => ({
        file_uuid,
        path,
        url: `${process.env.BACKED_SERVICE_URL}/teasers/${collection}/${teaser_uuid}/images/${file_uuid}`
    }))
}



module.exports =  {
    uploadThumb
}

    
