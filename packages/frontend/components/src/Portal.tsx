import {useState, useEffect} from 'react'
import ReactDOM from 'react-dom';

export default ({children}) => {

    const [portal, setPortal] = useState<HTMLDivElement>()

    useEffect(() => {

        const div = document.createElement("div")
        div.setAttribute('id',  `portal_${Math.random().toString(36).slice(-5)}`)
        document.body.appendChild(div)

        setPortal(div)

        return () => {
            setPortal(undefined)
            document.body.removeChild(div)
        }

    }, [])


    return portal && ReactDOM.createPortal(children, portal) || null
}
