// cif-admin-panel/src/pages/Opportunities.jsx
import React from 'react';
import CollectionManager from '../components/CollectionManager';
import { useAuth } from '../AuthContext';
import { recordAuditLog } from '../utils/auditLogger';

export default function Opportunities() {
  const { session } = useAuth();

  const handleAfterCreate = async (docId, data) => {
    await recordAuditLog({
      action: 'CREATE',
      resource: 'opportunities',
      resourceId: docId,
      actor: session,
      details: {
        title: data.title,
        company: data.company,
        type: data.type,
        location: data.location,
        salary: data.salary,
        active: data.active ?? true,
      },
    });
  };

  const handleAfterUpdate = async (docId, data) => {
    await recordAuditLog({
      action: 'UPDATE',
      resource: 'opportunities',
      resourceId: docId,
      actor: session,
      details: {
        title: data.title,
        company: data.company,
        type: data.type,
        location: data.location,
        salary: data.salary,
        active: data.active,
      },
    });
  };

  const handleAfterDelete = async (docId, item) => {
    await recordAuditLog({
      action: 'DELETE',
      resource: 'opportunities',
      resourceId: docId,
      actor: session,
      details: {
        title: item?.title || 'Unknown Opportunity',
        company: item?.company || '—',
        type: item?.type || '—',
      },
    });
  };

  return (
    <CollectionManager
      collectionName="opportunities"
      title="Opportunities"
      subtitle="Manage jobs, volunteering, internships, and vacancies."
      orderByField="created_at"
      orderDirection="desc"
      searchFields={['title', 'company', 'location', 'type']}
      fields={[
        { key: 'title', label: 'Title / Role', type: 'text', required: true },
        { key: 'company', label: 'Company / Organization', type: 'text', required: true },
        { key: 'location', label: 'Location', type: 'text', required: true },
        { key: 'type', label: 'Type', type: 'select', options: ['Job', 'Volunteering', 'Internship'], default: 'Job' },
        { key: 'salary', label: 'Salary / Compensation', type: 'text', required: true, default: 'Competitive' },
        { key: 'description', label: 'Job Description', type: 'textarea', wide: true, required: true },
        { key: 'requirements', label: 'Requirements / Qualifications', type: 'textarea', wide: true },
        { key: 'contact_email', label: 'Application Contact Email', type: 'text' },
        { key: 'active', label: 'Active', type: 'checkbox', default: true },
      ]}
      onAfterCreate={handleAfterCreate}
      onAfterUpdate={handleAfterUpdate}
      onAfterDelete={handleAfterDelete}
    />
  );
}