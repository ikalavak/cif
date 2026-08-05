import React from 'react';
import CollectionManager from '../components/CollectionManager';

export default function Gallery() {
  return (
    <CollectionManager
      collectionName="gallery"
      title="Gallery"
      subtitle="Media assets and visual content shown in the app."
      orderByField="created_at"
      orderDirection="desc"
      searchFields={['caption']}
      fields={[
        { key: 'image_url', label: 'Image URL', type: 'text', required: true, wide: true },
        { key: 'caption', label: 'Caption', type: 'text' },
      ]}
    />
  );
}
