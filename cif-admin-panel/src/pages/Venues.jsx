import React from 'react';
import CollectionManager from '../components/CollectionManager';

export default function Venues() {
  return (
    <CollectionManager
      collectionName="venues"
      title="Venues"
      subtitle="Manage festival locations and room capacities."
      orderByField="name"
      orderDirection="asc"
      searchFields={['name', 'address']}
      fields={[
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'address', label: 'Address', type: 'text', wide: true },
        { key: 'capacity', label: 'Capacity', type: 'number' },
      ]}
    />
  );
}
