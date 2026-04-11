"""SecurementPanel.tsx - UI for managing securements (straps, airbags, blocks, etc.)"""

import React, { useState, useEffect } from 'react';

interface Securement {
  id: number;
  type: string;
  position: [number, number, number];
  load_id: number;
  reason?: string;
  count?: number;
  crush_strength_psf?: number;
  [key: string]: any;
}

interface SecurementPanelProps {
  optimizationId: number;
  suggestedSecurements?: Securement[];
  onSecurementAdded?: (sec: Securement) => void;
  onSecurementDeleted?: (secId: number) => void;
}

const SECUREMENT_TYPES = [
  { value: 'airbag_level_2', label: 'Airbag Level 2 (≤75k lb)' },
  { value: 'airbag_level_3', label: 'Airbag Level 3 (≤160k)' },
  { value: 'airbag_level_4', label: 'Airbag Level 4 (≤216k)' },
  { value: 'airbag_level_5', label: 'Airbag Level 5 (≤216k)' },
  { value: 'steel_strap', label: 'Steel Strap' },
  { value: 'nonmetallic_strap', label: 'Nonmetallic Strap' },
  { value: 'riser', label: 'Riser/Pad' },
  { value: 'rubber_mat', label: 'Rubber Mat' },
  { value: 'void_filler', label: 'Void Filler' },
  { value: 'chock', label: 'Chock Block' },
];

export const SecurementPanel: React.FC<SecurementPanelProps> = ({
  optimizationId,
  suggestedSecurements = [],
  onSecurementAdded,
  onSecurementDeleted,
}) => {
  const [securements, setSecurements] = useState<Securement[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Securement>>({
    type: 'airbag_level_4',
    position: [5, 0.5, 2.5],
    load_id: 0,
  });
  const [loading, setLoading] = useState(false);

  // Load securements on mount
  useEffect(() => {
    fetchSecurements();
  }, [optimizationId]);

  const fetchSecurements = async () => {
    try {
      const response = await fetch(`/api/optimization/${optimizationId}/securements`);
      const data = await response.json();
      if (data.success) {
        setSecurements(data.data.securements || []);
      }
    } catch (err) {
      console.error('Failed to fetch securements:', err);
    }
  };

  const handleAddSecurement = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/optimization/${optimizationId}/securements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setSecurements([...securements, data.data.securement]);
        if (onSecurementAdded) {
          onSecurementAdded(data.data.securement);
        }
        setShowAddModal(false);
        setFormData({
          type: 'airbag_level_4',
          position: [5, 0.5, 2.5],
          load_id: 0,
        });
      }
    } catch (err) {
      console.error('Failed to add securement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSecurement = async (secId: number) => {
    if (!window.confirm('Delete this securement?')) return;
    try {
      const response = await fetch(
        `/api/optimization/${optimizationId}/securements/${secId}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (data.success) {
        setSecurements(securements.filter(s => s.id !== secId));
        if (onSecurementDeleted) {
          onSecurementDeleted(secId);
        }
      }
    } catch (err) {
      console.error('Failed to delete securement:', err);
    }
  };

  return (
    <div className="securement-panel" style={{
      padding: '16px',
      borderRadius: '8px',
      backgroundColor: '#f5f5f5',
      border: '1px solid #ddd',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Securements</h3>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          + Add
        </button>
      </div>

      {/* Suggested Securements */}
      {suggestedSecurements.length > 0 && (
        <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#e7f3ff', borderRadius: '4px', borderLeft: '3px solid #0066cc' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#0066cc' }}>Suggested:</div>
          {suggestedSecurements.map((sec, idx) => (
            <div
              key={idx}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                marginBottom: '4px',
                backgroundColor: 'white',
                borderRadius: '3px',
                border: '1px solid #0066cc',
              }}
            >
              <strong>{sec.type}</strong> - {sec.reason}
              <button
                onClick={() => {
                  setFormData(sec);
                  handleAddSecurement();
                }}
                style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  color: '#0066cc',
                  background: 'none',
                  border: '1px solid #0066cc',
                  borderRadius: '2px',
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Current Securements List */}
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {securements.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', padding: '16px' }}>
            No securements added
          </div>
        ) : (
          securements.map(sec => (
            <div
              key={sec.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                marginBottom: '8px',
                backgroundColor: 'white',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '12px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600' }}>{sec.type}</div>
                <div style={{ color: '#666', fontSize: '11px' }}>Load #{sec.load_id}</div>
                {sec.reason && (
                  <div style={{ color: '#888', fontSize: '10px', marginTop: '2px' }}>{sec.reason}</div>
                )}
              </div>
              <button
                onClick={() => handleDeleteSecurement(sec.id)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Add Securement</h2>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600' }}>
                Type
              </label>
              <select
                value={formData.type || ''}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                {SECUREMENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600' }}>
                Load ID
              </label>
              <input
                type="number"
                value={formData.load_id || 0}
                onChange={e => setFormData({ ...formData, load_id: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600' }}>
                Position (X, Y, Z)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[0, 1, 2].map(idx => (
                  <input
                    key={idx}
                    type="number"
                    step="0.1"
                    value={(formData.position?.[idx] || 0).toFixed(2)}
                    onChange={e => {
                      const pos = [...(formData.position || [0, 0, 0])] as [number, number, number];
                      pos[idx] = parseFloat(e.target.value);
                      setFormData({ ...formData, position: pos });
                    }}
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddSecurement}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Adding...' : 'Add Securement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurementPanel;
