import React from 'react';
import CollectionManager from '../components/CollectionManager';

export default function Categories() {
  return (
    <CollectionManager
      collectionName="categories"
      title="Categories"
      subtitle="Event classification and taxonomy used across the app."
      orderByField="name"
      orderDirection="asc"
      searchFields={['name']}
      fields={[
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'color', label: 'Colour (hex)', type: 'text' },
      ]}
    />
  );
}
