import React, { forwardRef } from 'react';

const AddressMapFrame = forwardRef(({ html, onError }, ref) => (
  <iframe
    ref={ref}
    title="Mapa para elegir dirección"
    srcDoc={html}
    onError={onError}
    style={{ width: '100%', height: '100%', border: 0 }}
  />
));

export default AddressMapFrame;
