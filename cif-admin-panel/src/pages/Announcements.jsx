// src/pages/Announcements.jsx
import React from 'react';
import CollectionManager from '../components/CollectionManager';
import { useAuth } from '../AuthContext';
import { recordAuditLog } from '../utils/auditLogger';

export default function Announcements() {
  const { session } = useAuth();

  const handleAfterCreate = async (docId, data) => {
    await recordAuditLog({
      action: 'CREATE',
      resource: 'announcements',
      resourceId: docId,
      actor: session,
      details: {
        title: data.title,
        published: data.published ?? true,
      },
    });
  };

  const handleAfterUpdate = async (docId, data) => {
    await recordAuditLog({
      action: 'UPDATE',
      resource: 'announcements',
      resourceId: docId,
      actor: session,
      details: {
        title: data.title,
        published: data.published,
      },
    });
  };

  const handleAfterDelete = async (docId, item) => {
    await recordAuditLog({
      action: 'DELETE',
      resource: 'announcements',
      resourceId: docId,
      actor: session,
      details: {
        title: item?.title || 'Untitled Announcement',
      },
    });
  };

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
      onAfterCreate={handleAfterCreate}
      onAfterUpdate={handleAfterUpdate}
      onAfterDelete={handleAfterDelete}
    />
  );
}