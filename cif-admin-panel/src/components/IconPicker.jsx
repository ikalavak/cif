// cif-admin-panel/src/components/IconPicker.jsx
import React, { useState } from 'react';
import * as FeatherIcons from 'react-feather';

// Comprehensive list of commonly used festival, UI, and media icons
export const AVAILABLE_ICONS = [
  'Activity', 'Airplay', 'Award', 'BookOpen', 'Bookmark', 'Box',
  'Briefcase', 'Calendar', 'Camera', 'Cast', 'CheckCircle', 'Clock',
  'Compass', 'Cpu', 'Crosshair', 'Disc', 'Droplet', 'Eye', 'Feather',
  'Film', 'Flag', 'Folder', 'Gift', 'Globe', 'Headphones', 'Heart',
  'HelpCircle', 'Image', 'Layers', 'LifeBuoy', 'Link', 'Map', 'MapPin',
  'Maximize', 'MessageCircle', 'Mic', 'Monitor', 'Music', 'Navigation',
  'Package', 'PenTool', 'Play', 'Radio', 'Scissors', 'Share2', 'Smile',
  'Speaker', 'Star', 'Tag', 'Target', 'Tv', 'User', 'Users', 'Video',
  'Volume2', 'Watch', 'Wifi', 'Zap'
];

// Helper to convert PascalCase (React-Feather) to kebab-case (Expo vector-icons)
export const toKebabCase = (str) =>
  str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase().replace(/^-/, '');

// Helper to convert kebab-case back to PascalCase
export const toPascalCase = (str) =>
  str
    ? str
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('')
    : 'Star';

export default function IconPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const activePascal = toPascalCase(value || 'star');
  const SelectedIcon = FeatherIcons[activePascal] || FeatherIcons.Star;

  const filteredIcons = AVAILABLE_ICONS.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase()) ||
    toKebabCase(name).includes(search.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      {/* Current Icon Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            backgroundColor: 'rgba(139, 92, 246, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8b5cf6',
          }}
        >
          <SelectedIcon size={18} />
        </div>
        <div style={{ textAlign: 'left', flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
            {value || 'star'}
          </div>
          <div style={{ fontSize: 10, color: '#64748b' }}>Click to change icon</div>
        </div>
      </button>

      {/* Modal / Dropdown Picker Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: 320,
            maxHeight: 280,
            zIndex: 50,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
            padding: 12,
            marginTop: 6,
          }}
        >
          <input
            type="text"
            placeholder="Search icon (e.g. film, music, users)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              marginBottom: 10,
              boxSizing: 'border-box',
            }}
            autoFocus
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 6,
              maxHeight: 180,
              overflowY: 'auto',
              paddingRight: 4,
            }}
          >
            {filteredIcons.map((iconKey) => {
              const IconComp = FeatherIcons[iconKey];
              const kebabName = toKebabCase(iconKey);
              const isSelected = (value || 'star') === kebabName;

              return (
                <button
                  key={iconKey}
                  type="button"
                  title={kebabName}
                  onClick={() => {
                    onChange(kebabName);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 8,
                    borderRadius: 6,
                    border: isSelected ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
                    background: isSelected ? 'rgba(139, 92, 246, 0.1)' : '#f8fafc',
                    color: isSelected ? '#8b5cf6' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  <IconComp size={18} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}