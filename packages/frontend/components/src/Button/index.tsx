import React, {useState, useRef} from 'react';
import PropTypes from 'prop-types';
import style from './style.module.scss';
import classnames from 'classnames/bind';

const cx = classnames.bind(style);



/**
 * Primary UI component for user interaction
 */
export const Button = ({ primary = false, size = 'medium', label = null, icon = null, as = 'button', ...props }) => {
  const mode = primary ? 'primary' : 'default';
  
  return React.createElement(as, 
    { className: cx('Button', size, mode, {icon}), ...props },
    icon ? icon : label)
  }



/**
 * 
 *
 */

export const ButtonGroup = ({children}) => <div className={cx('ButtonGroup')}>{children}</div>


/**
 * 
 *  Upload Button as special case
 */



export const UploadButton = ({id, multiple, accept = "image/*", onChange, name, label, icon}) => {

    const [upload, setUpload] = useState(false)

    const enrichOnChange = (e) => {
      const files = Array.from(e.target.files)
      onChange(files)
    } 

    return (<div >
        <label htmlFor={id}>            
            <Button icon={icon} label={label} as='span' onClick={() => setUpload(true)} />        
        </label>
        {upload && <input
              name={name}
              style={{display: 'none'}}
              accept={accept}
              id={id}
              multiple={multiple}
              type="file"
              onChange={enrichOnChange}
          />}
        
    </div>)
}
