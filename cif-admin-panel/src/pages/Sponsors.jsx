import React from 'react';
import CollectionManager from '../components/CollectionManager';

export default function Sponsors() {
  return (
    <CollectionManager
      collectionName="sponsors"
      title="Sponsors"
      subtitle="Partner records and brand relations."
      orderByField="name"
      orderDirection="asc"
      searchFields={['name', 'tier']}
      fields={[
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'logo_url', label: 'Logo URL', type: 'text', wide: true },
        { key: 'tier', label: 'Tier', type: 'select', options: ['Platinum', 'Gold', 'Silver', 'Partner'], default: 'Partner' },
      ]}
    />
  );
}
