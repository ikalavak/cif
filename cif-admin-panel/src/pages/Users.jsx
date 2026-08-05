import React from 'react';
import CollectionManager from '../components/CollectionManager';

export default function Users() {
  return (
    <div>
      <div className="info-banner">
        <strong>Note:</strong> Firebase's client SDK can't list actual sign-in accounts for security
        reasons — that requires the Firebase Admin SDK on a server. To add or remove someone's ability
        to log into this admin panel, go to <strong>Firebase Console → Authentication → Users</strong> directly.
        The list below is just a roster for keeping track of who's who and their role — it doesn't control login access.
      </div>
      <CollectionManager
        collectionName="admin_users"
        title="Users"
        subtitle="Roster of admin panel users and their roles."
        orderByField="name"
        orderDirection="asc"
        searchFields={['name', 'email', 'role']}
        fields={[
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'email', label: 'Email', type: 'text', required: true },
          { key: 'role', label: 'Role', type: 'select', options: ['Admin', 'Editor', 'Viewer'], default: 'Editor' },
        ]}
      />
    </div>
  );
}
