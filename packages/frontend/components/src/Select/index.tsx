import React, {useEffect, useState, useRef, useCallback} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames/bind';
import style from './style.module.scss';
import SelectContext, {useSelectContext} from './state';
import Portal from '../Portal';
import { Icon } from '../Icons';
const cx = classnames.bind(style)


const InputValue = () => {

    const ref = useRef()
    const [{input, options, value}, dispatch] = useSelectContext()

    const label = (options.find(o => o.value === value) || {}).label

    const filterOptions = (label) => {
        const filtered = options.filter(o => o.label.toLowerCase().indexOf(label.toLowerCase()) === -1)
        dispatch({type: 'HIDE_OPTIONS', options: filtered, label})
    }

    useEffect(() => {
        if(ref.current) {
            (ref.current as any).focus()
        }
    }, [ref.current])

    return input
    ? <span tabIndex={0}><input defaultValue={label} ref={ref} onChange={e => filterOptions(e.target.value)}/></span>
    : null
}


const SelectMenu = () => {

    const [ref, setRef] = useState(null)
    const [{options, rect, listed, value, defaultValue, onChange, small}, dispatch] = useSelectContext()

    
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

    

    const existingCurrentValue = options.find(o => o.value === (value ||¬†defaultValue))
    const sortedOptions = existingCurrentValue 
    ? [existingCurrentValue, ...options.filter(o => o.value !== existingCurrentValue.value)]
    : options

    const visibleOptions = sortedOptions.filter(o => !o.hidden)

    return listed ? <Portal>
        <div ref={(ref) => {setRef(ref)}} className={cx('SelectMenu', {small})} style={{top, left, width}}>
            <InputValue />
            <ul>{
            visibleOptions.map((o, i) => {
                return <li key={i} className={cx({currentValue: existingCurrentValue && existingCurrentValue.value === o.value})} data-value={o.value} data-label={o.label}>{o.label}</li>
            })
        }</ul></div>
    </Portal>
    : null
}

const SelectValue = ({value, options}) =>  {

    return value && options.find(o => o.value === value)
    ? <>
        <span className={cx('selectValue')}>{options.find(o => o.value === value)?.label}</span>
    </>
    :¬†null 
}
    


const SelectNode = ({children}) => {
    const ref = useRef()
    const [{input, listed, name, defaultValue, value, id, label, options, small}, dispatch] = useSelectContext()

    const handlClick = () => {
        const rect = (ref.current as HTMLDivElement).getBoundingClientRect()
        dispatch({type: 'LIST', payload: {rect}})
    }

    
    const selectedValue = (value ||¬†defaultValue)
    const existingSelectedValue = options.find(o => o.value === selectedValue) && selectedValue
    const existingSelectedLabel = options.find(o => o.value === existingSelectedValue)?.label ||¬†''

    return <div className={cx('SelectContainer')}><div ref={ref}  tabIndex={0} className={cx('Select', 'toPortal', {listed, value: value ||¬†defaultValue, small, children, input})} onClick={handlClick}>
            {label && <label htmlFor={id}>{label}</label>}
            {!listed  && <SelectValue {...{value: value ||¬†defaultValue, options}} />}
            <SelectMenu />
            
            <Icon.Arrowdown />
            {input && <input type='hidden' name={`${name}[label]`} key={existingSelectedLabel}  id={`input-${id}`}  value={existingSelectedLabel}/> }
            <select name={`${name}${input ? '[value]' : ''}`} value={existingSelectedValue} id={id}>
                <option value=""></option>
                {options.map((o, i) =><option key={`${o.value}_${i}`} value={o.value}>{o.label}</option>)}
            </select>
        </div>
        {children && <span className={cx('right_children')}>{children}</span>}
        </div>


}

export const Select = ({children, ...props}) => (
    <SelectContext {...props}>
        <SelectNode>{children}</SelectNode>
    </SelectContext>
)




Select.propTypes = {    
    name: PropTypes.string.isRequired,
    defaultValue: PropTypes.string,
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    children: PropTypes.func,
    input: PropTypes.bool,
    inputValue: PropTypes.string,
};
  
Select.defaultProps = {
    defaultValue: undefined,
    onChange: undefined,
};
