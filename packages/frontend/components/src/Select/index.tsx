import React, {useEffect, useState, useRef} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames/bind';
import style from './style.module.scss';
import SelectContext, {useSelectContext} from './state';
import Portal from '../Portal';
const cx = classnames.bind(style)


const SelectMenu = () => {

    const [ref, setRef] = useState(null)
    const [{options, rect, listed, value, defaultValue, onChange}, dispatch] = useSelectContext()

    
    const {top, left, width} = rect || {top:0, left:0, width:0}

    const clickListener = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if(ref && !ref.contains(target)) {
            dispatch({type: 'COLLAPSE'})
        }
        if(target.dataset.value && ref && ref.contains(target)) {
            const {value, label} = target.dataset
            
            dispatch({type: 'SELECT', value, label })
            onChange && onChange({value, label})
        }
    }

    useEffect(() => {
        document.addEventListener('click', clickListener)
        return () => document.removeEventListener('click', clickListener);
    }, [ref])

    

    const existingCurrentValue = options.find(o => o.value === (value || defaultValue))
    const sortedOptions = existingCurrentValue 
    ? [existingCurrentValue, ...options.filter(o => o.value !== existingCurrentValue.value)]
    : options

    return listed ? <Portal>
        <div ref={(ref) => {setRef(ref)}} className={cx('SelectMenu')} style={{top, left, width}}><ul>{
            sortedOptions.map((o, i) => {
                return <li key={i} className={cx({currentValue: existingCurrentValue && existingCurrentValue.value === o.value})} data-value={o.value} data-label={o.label}>{o.label}</li>
            })
        }</ul></div>
    </Portal>
    : null
}

const SelectValue = ({value, options}) => value && options.find(o => o.value === value)
    ? <span className={cx('selectValue')}>{options.find(o => o.value === value)?.label}</span>
    : null 
    


const SelectNode = () => {
    const ref = useRef()
    const [{listed, name, defaultValue, value, id, label, options}, dispatch] = useSelectContext()

    const handlClick = () => {
        const rect = (ref.current as HTMLDivElement).getBoundingClientRect()
        dispatch({type: 'LIST', payload: {rect}})
    }

    
    const selectedValue = (value || defaultValue)
    const existingSelectedValue = options.find(o => o.value === selectedValue) && selectedValue

    return <div ref={ref} className={cx('Select', 'toPortal', {listed, value: value || defaultValue})} onClick={handlClick}>
            <label htmlFor={id}>{label}</label>
            {!listed  && <SelectValue {...{value: value || defaultValue, options}} />}
            <SelectMenu />
            
            <svg focusable="false" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5z"></path></svg>
            
            <select name={name} value={existingSelectedValue} id={id}>
                <option value=""></option>
                {options.map((o, i) =><option key={`${o.value}_${i}`} value={o.value}>{o.label}</option>)}
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
