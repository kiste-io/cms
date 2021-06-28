import React, {useState, useRef, useEffect} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames/bind';
import style from './style.module.scss';

const cx = classnames.bind(style)


export const Input = ({name, label, defaultValue, value, password, onChange, ...props}) => {

    const [id] = useState(() => `${name}_${Math.random().toString(36).slice(-5)}`)
    const [filled, setFilled] = useState(defaultValue && defaultValue.length>0) 
    const [inputValue, setValue] = useState(value || defaultValue)
        
    useEffect(() => {
        setValue(defaultValue)
        setFilled(defaultValue && defaultValue.length>0)
    }, [defaultValue])
    
    return <div className={cx("Input")}>
        <input 
            type={password && 'password' || 'text'} 
            name={name} 
            id={id} 
            defaultValue={defaultValue}
            value={inputValue}
            onChange={(e) => {
                setFilled(e.target.value.length>0)
                setValue(e.target.value)
                if(onChange) {
                    onChange(e.target.value) 
                }
            }} 
            className={cx({filled})} 
            {...props}
            />
        <label htmlFor={id}>{label}</label>
    </div>
}

Input.propTypes = {
    
    name: PropTypes.string.isRequired,
    password: PropTypes.bool,
    defaultValue: PropTypes.string,
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,

  };
  
Input.defaultProps = {
    password: false,
    defaultValue: '',
    onChange: undefined,
};