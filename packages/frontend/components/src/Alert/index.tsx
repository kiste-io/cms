import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types';
import classnames from 'classnames/bind';
import style from './style.module.scss';


const cx = classnames.bind(style)


export const Alert = ({message, type, duration, buttomUp, ...props}) => {

    const [hide, setHide] = useState(false)
    const [unmount, setUnmount] = useState(false)
    

    useEffect(() => {
        if(duration){
            const timer = setTimeout(() => {
                setHide(true)
                props.onClose && props.onClose()
            }, duration)
            return () => clearTimeout(timer)
        }
        if(hide) {
            const utimer = setTimeout(() => void(setUnmount(true)), 1000)
            return () => clearTimeout(utimer)
        }

    }, [duration, hide])

    return !unmount
    ? <div className={cx('Alert', type, {hide, buttomUp})}>
        {message}
     </div>
    : null
}



Alert.propTypes = {
    
    message: PropTypes.string.isRequired,
    type:  PropTypes.oneOf(['success', 'error', 'info']),
    duration: PropTypes.number,
    onClose: PropTypes.func,
    buttomUp: PropTypes.bool

  };
  
Alert.defaultProps = {
    type: 'info',
    duration: undefined,
    onClose: undefined,
  };