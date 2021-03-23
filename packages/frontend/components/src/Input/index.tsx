import React, {useState} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames/bind';
import style from './style.module.scss';

const cx = classnames.bind(style)


export const Input = ({name, label}) => {

    const [id] = useState(() => `${name}_${Math.random().toString(36).slice(-5)}`)
    

    return <div className={cx('Input')}>
        <label htmlFor={id}>{label}</label>
        <input name={name} id={id} />
    </div>
}


Input.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func,
  };
  
Input.defaultProps = {
    onClick: undefined,
};
  