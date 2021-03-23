import React, {useState} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames/bind';
import style from './style.module.scss';

const cx = classnames.bind(style)


export const Select = ({name, label, options}) => {

    const [id] = useState(() => `${name}_${Math.random().toString(36).slice(-5)}`)
    

    return <div className={cx('Select')}>
        <label htmlFor={id}>{label}</label>
        <select name={name} id={id}>
            {options.map((o, i) => <option key={i} value={o.value}>{o.label}</option>)}
        </select>
    </div>
}


Select.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired
        }).isRequired
      ).isRequired,
    onClick: PropTypes.func,
  };
  
Select.defaultProps = {
    onClick: undefined,
};
  