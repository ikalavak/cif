import React from 'react';
import CollectionManager from '../components/CollectionManager';

export default function Events() {
  return (
    <CollectionManager
      collectionName="events"
      title="Events"
      subtitle="Manage lifecycle, visibility, and featured status for festival events."
      orderByField="start_date"
      orderDirection="asc"
      searchFields={['title', 'category', 'venue']}
      fields={[
        { key: 'title', label: 'Title', type: 'text', required: true, wide: true },
        { key: 'category', label: 'Category', type: 'text' },
        { key: 'venue', label: 'Venue', type: 'text' },
        { key: 'start_date', label: 'Start date', type: 'datetime' },
        { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Almost Full', 'Sold Out', 'Cancelled'], default: 'Open' },
        { key: 'published', label: 'Published', type: 'checkbox', default: true },
        { key: 'featured', label: 'Featured', type: 'checkbox', default: false },
      ]}
    />
  );
}
