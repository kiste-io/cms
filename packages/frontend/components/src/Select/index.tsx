import React, {useEffect, useState, useRef, useReducer} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames/bind';
import style from './style.module.scss';
import SelectContext, {useSelectContext} from './state';

const cx = classnames.bind(style)


const Portal = ({children}) => {

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


const SelectMenu = () => {

    const [ref, setRef] = useState(null)
    const [{options, rect, selected}, dispatch] = useSelectContext()

    
    const {top, left, width} = rect || {top:0, left:0, width:0}

    const clickListener = (e: MouseEvent) => {
        console.log('ref.current', ref)
        if(ref && !ref.contains(e.target)) {
            dispatch({type: 'COLLAPSE'})
        }
        
    }

    useEffect(() => {
        document.addEventListener('click', clickListener)
        console.log('ref.current 2', ref)
        return () => document.removeEventListener('click', clickListener);
    }, [ref])

    


    return selected ? <Portal>
        <div ref={(ref) => {console.log('ref', ref); setRef(ref)}} className={cx('SelectMenu')} style={{top, left, width}}><ul>{
            options.map((o, i) => {
                return <li key={i} onClick={() => console.log('clicked', o)}>{o.label}</li>
            })
        }</ul></div>
    </Portal>
    : null
}

const SelectNode = () => {
    const ref = useRef()
    const [{selected, name, defaultValue, id, label, options}, dispatch] = useSelectContext()

    const handlClick = () => {
        const rect = (ref.current as HTMLDivElement).getBoundingClientRect()
        dispatch({type: 'LIST', payload: {rect}})
    }

    return <div className={cx('Select', 'toPortal', {selected})} ref={ref} onClick={handlClick}>
            <label htmlFor={id}>{label}</label>
            <SelectMenu />
            
            <svg focusable="false" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5z"></path></svg>
            
            <select aria-hidden tabIndex={-1} defaultValue={defaultValue} name={name} id={id}>
                {options.map((o, i) => <option key={i} value={o.value}>{o.label}</option>)}
            </select>
        </div>

}

export const Select = (props) => (
    <SelectContext {...props}>
        <SelectNode />
    </SelectContext>
)



Select.propTypes = {    
    name: PropTypes.string.isRequired,
    defaultValue: PropTypes.string,
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
};
  
Select.defaultProps = {
    defaultValue: undefined,
    onChange: undefined,
};
