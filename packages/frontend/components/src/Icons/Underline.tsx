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
      <path fill="currentcolor" d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
    </svg>
  )
);
