import React from 'react';
import PropTypes from 'prop-types';
import style from './style.module.scss';
import classnames from 'classnames/bind';

const cx = classnames.bind(style);



/**
 * Primary UI component for user interaction
 */
export const Button = ({ primary, backgroundColor, size, label, as, ...props }) => {
  const mode = primary ? 'primary' : 'default';
  
  return React.createElement(as, {
    className: cx('Button', size, mode),
    style: backgroundColor && { backgroundColor },
    ...props},
    label)
  }

Button.propTypes = {
  /**
   * Is this the principal call to action on the page?
   */
  primary: PropTypes.bool,
  /**
   * How large should the button be?
   */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /**
   * Button contents
   */
  label: PropTypes.string.isRequired,
  /**
   * Optional click handler
   */
  onClick: PropTypes.func,

  as: PropTypes.string
};

Button.defaultProps = {
  primary: false,
  size: 'medium',
  onClick: undefined,
  as: 'button'
};