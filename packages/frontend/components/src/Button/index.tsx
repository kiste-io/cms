import React, {useState, useRef} from 'react';
import PropTypes from 'prop-types';
import style from './style.module.scss';
import classnames from 'classnames/bind';
import { v4 as uuidv4} from 'uuid'

const cx = classnames.bind(style);



/**
 * Primary UI component for user interaction
 */
export const Button = ({ primary = false, size = 'medium', label, icon, as, ...props }) => {
  const mode = primary ? 'primary' : 'default';
  
  return React.createElement(as, 
    { className: cx('Button', size, mode), ...props },
    icon ? icon : label)
  }

Button.defaultProps = {
  primary: false,
  size: 'medium',
  onClick: undefined,
  as: 'button'
};



/**
 * 
 *  Upload Button as special case
 */



export const UploadButton = ({id, multiple, accept = "image/*", onChange, name, label, icon}) => {

    const enrichOnChange = (e) => {
      const files = Array.from(e.target.files)
      onChange(files)
    } 

    return (<div >
        <label htmlFor={id}>            
            <Button icon={icon} label={label} as='span' />        
        </label>
        <input
              name={name}
              style={{display: 'none'}}
              accept={accept}
              id={id}
              multiple={multiple}
              type="file"
              onChange={enrichOnChange}
          />
    </div>)
}
