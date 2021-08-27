import React, { forwardRef, SVGProps } from 'react';

export default forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  (props, svgRef) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      ref={svgRef}
      {...props}
    >
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
            fill="currentcolor"
        />
    </svg>
  )
);
