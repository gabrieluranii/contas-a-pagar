'use client';
import { useState } from 'react';

export default function MetricCard({ label, value, sub, color }) {
  const valueColor = color === 'green'
    ? '#2d8a4e'
    : color === 'red'
    ? '#d97757'   // laranja ao invés de vermelho
    : '#1a1a1a';  // padrão

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid #e0e0dd',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem 1.5rem',
    }}>
      <div style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: '#555555',
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'Poppins, sans-serif',
        fontSize: 22,
        fontWeight: 600,
        color: valueColor,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        lineHeight: 1.2,
        marginBottom: 4,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          color: '#888888',
          marginTop: 2,
        }}>
          {sub}
        </div>
      )}
    </div>
  );
}
