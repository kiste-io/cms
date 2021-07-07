import React, { forwardRef, SVGProps } from 'react';

export default forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  ({width=24, height=24,...props}, svgRef) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height={height}
      viewBox="0 0 24 24"
      width={width}
      ref={svgRef}
      {...props}
    >
      <path d="M0 0h24v24H0V0z" fill="none"/>
      <path fill="currentcolor" d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z"/>
    </svg>
  )
);
