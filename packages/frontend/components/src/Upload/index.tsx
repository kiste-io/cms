import React, { useState, useRef } from 'react'
import {Button} from '../'


export const ImageUpload = ({src, id, multiple, name, children, label}) => {

    const [upload, setUpload] = useState(false)

    const imgRef = useRef<HTMLImageElement>()
    const uploadRef = useRef<HTMLInputElement>()

    const makePreview = () => {

        if(!uploadRef.current || !imgRef.current) return

        const [file] = Array.from(uploadRef.current.files)
        if (file) {
            imgRef.current.src = URL.createObjectURL(file)
        }
    }

    return (<div >

        <label htmlFor={id}>            
            <img ref={imgRef} src={src} />
            <Button label={label} as='span' onClick={() => setUpload(true)} />        
        </label>
        {upload 
        ? <input
            ref={uploadRef}
            name={name}
            style={{display: 'none'}}
            accept="image/*"
            id={id}
            multiple={multiple}
            type="file"
            onChange={makePreview}
        />
        : children
    }
        

    </div>)


}