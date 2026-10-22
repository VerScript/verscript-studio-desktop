import React, { useState, useEffect } from 'react';
import { VERSCRIPT_HELP_DB } from './help/help_db.js';

export default function HelpModal({ isOpen, onClose, onInsertCode }) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (isOpen && VERSCRIPT_HELP_DB && VERSCRIPT_HELP_DB.length > 0 && !selectedItem) {
      setSelectedItem(VERSCRIPT_HELP_DB[0]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = (VERSCRIPT_HELP_DB || []).filter(item => {
    if (activeTab !== 'all' && item.category !== activeTab) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="studio-modal-overlay" onClick={onClose}>
      <div className="studio-modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0e1320' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>📖</span>
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#fff' }}>VerScript Keyword & Syntax Knowledge Base</span>
            <span style={{ fontSize: '11px', padding: '2px 6px', background: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff', borderRadius: '4px', fontWeight: 700 }}>109 Topics</span>
          </div>
          <button 
            style={{ background: 'transparent', border: 'none', color: '#8a9bb8', fontSize: '18px', cursor: 'pointer' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Search & Tabs */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#121726' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by keyword, library, error, or what you want to do (e.g. 'print', 'matrix', 'exception', 'loop')..."
              style={{
                flex: 1,
                background: '#0a0d16',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', borderRadius: '6px', padding: '0 10px', cursor: 'pointer' }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'keyword', label: 'Keywords' },
              { id: 'library', label: 'Standard Libraries' },
              { id: 'error', label: 'Errors' },
              { id: 'functionality', label: 'By Functionality' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeTab === tab.id ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)',
                  background: activeTab === tab.id ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                  color: activeTab === tab.id ? '#00e5ff' : '#8a9bb8'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Split: List on Left, Details on Right */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* List Pane */}
          <div style={{ width: '260px', borderRight: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto', background: '#0a0d16' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                No topics matching "{query}"
              </div>
            ) : (
              filtered.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    background: selectedItem?.id === item.id ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                    borderLeft: selectedItem?.id === item.id ? '3px solid #00e5ff' : '3px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{item.name}</span>
                    <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', textTransform: 'uppercase' }}>{item.category}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#8a9bb8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                    {item.summary}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Details Pane */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#0f1422' }}>
            {selectedItem ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{selectedItem.name}</h2>
                    <span style={{ fontSize: '12px', color: '#00e5ff', textTransform: 'uppercase', fontWeight: 700 }}>{selectedItem.subcategory || selectedItem.category}</span>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '16px' }}>
                  {selectedItem.summary}
                </p>

                {selectedItem.syntax && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#8a9bb8', textTransform: 'uppercase', marginBottom: '6px' }}>Syntax Signature</div>
                    <pre style={{ background: '#07090e', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', color: '#00e5ff', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", overflowX: 'auto' }}>
                      {selectedItem.syntax}
                    </pre>
                  </div>
                )}

                {selectedItem.example && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#8a9bb8', textTransform: 'uppercase' }}>Example Code</span>
                      <button
                        onClick={() => {
                          if (onInsertCode) onInsertCode(selectedItem.example);
                          onClose();
                        }}
                        style={{
                          background: 'rgba(0, 229, 255, 0.15)',
                          border: '1px solid #00e5ff',
                          color: '#00e5ff',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        + Insert into Editor
                      </button>
                    </div>
                    <pre style={{ background: '#07090e', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', color: '#f1f5f9', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", overflowX: 'auto' }}>
                      {selectedItem.example}
                    </pre>
                  </div>
                )}

                {selectedItem.pairedWith && (
                  <div style={{ marginTop: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#8a9bb8', marginRight: '8px' }}>Commonly Paired With:</span>
                    {selectedItem.pairedWith.map(k => (
                      <span key={k} style={{ fontSize: '11px', padding: '2px 6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', color: '#00e5ff', marginRight: '4px', fontFamily: "'JetBrains Mono', monospace" }}>{k}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#8a9bb8', fontSize: '13px' }}>Select a topic on the left to inspect details.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
