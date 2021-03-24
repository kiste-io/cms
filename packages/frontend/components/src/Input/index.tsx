import React, {useState, useRef} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames/bind';
import style from './style.module.scss';

const cx = classnames.bind(style)


export const Input = ({name, label, defaultValue, password}) => {

    const [id] = useState(() => `${name}_${Math.random().toString(36).slice(-5)}`)
    const [filled, setFilled] = useState(defaultValue.length>0) 
    
    
    return <div className={cx('Input')}>
        <input type={password && 'password'} name={name} id={id} onChange={(e) => setFilled(e.target.value.length>0)} className={cx({filled})} />
        <label htmlFor={id}>{label}</label>
    </div>
}

Input.propTypes = {
    
    name: PropTypes.string.isRequired,
    password: PropTypes.bool,
    defaultValue: PropTypes.string,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func,

  };
  
  Input.defaultProps = {
    password: false,
    defaultValue: '',
    onClick: undefined,
  };