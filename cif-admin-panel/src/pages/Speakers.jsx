import React from 'react';
import CollectionManager from '../components/CollectionManager';

export default function Speakers() {
  return (
    <CollectionManager
      collectionName="speakers"
      title="Speakers"
      subtitle="Speaker profiles shown against events."
      orderByField="name"
      orderDirection="asc"
      searchFields={['name', 'role']}
      fields={[
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'role', label: 'Role / title', type: 'text' },
        { key: 'photo_url', label: 'Photo URL', type: 'text', wide: true },
        { key: 'bio', label: 'Bio', type: 'textarea', wide: true, showInTable: false },
      ]}
    />
  );
}
