import React from 'react';
import CollectionManager from '../components/CollectionManager';

export default function Announcements() {
  return (
    <CollectionManager
      collectionName="announcements"
      title="Announcements"
      subtitle="Post updates that appear in the app's home feed."
      orderByField="created_at"
      orderDirection="desc"
      searchFields={['title', 'body']}
      fields={[
        { key: 'title', label: 'Title', type: 'text', required: true, wide: true },
        { key: 'body', label: 'Body', type: 'textarea', wide: true, showInTable: false },
        { key: 'published', label: 'Published', type: 'checkbox', default: true },
      ]}
    />
  );
}
