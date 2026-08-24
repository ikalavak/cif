// cif-admin-panel/src/pages/Opportunities.jsx
import React from 'react';
import CollectionManager from '../components/CollectionManager';

export default function Opportunities() {
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
    />
  );
}