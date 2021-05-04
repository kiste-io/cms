const fs = require('fs')
const sharp = require('sharp')


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


const uploadThumb = (teaser_uuid, file_uuid, image) => {
    const ext = image.name.split('.').pop()
    const filename = escape([...image.name.split('.').slice(0, -1), ext].join('.'))
    const dest_path = `/tmp/200x200_${filename}`
    
    return resizeCover(image.path, dest_path, ext, 240, true).then(path => ({
        file_uuid,
        path,
        url: `${process.env.BACKED_SERVICE_URL}/teasers/${teaser_uuid}/images/${file_uuid}`
    }))
}



module.exports =  {
    uploadThumb
}

    
