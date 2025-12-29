/**
 * Entity List Panel
 * 
 * Displays filterable list of D365 data entities with record counts
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { fetchEntityCount } from '../utils/d365Api';

export default function EntityListPanel() {
  const {
    d365Config,
    d365Token,
    d365Connected,
    entities,
    setEntities,
    selectedEntities,
    toggleEntitySelection,
    selectAllEntities,
    clearSelection,
    entityCounts,
    setEntityCounts,
    setError,
    setIsLoading,
  } = useApp();

  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [manualEntityInput, setManualEntityInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Filtered and sorted entities
  const filteredEntities = useMemo(() => {
    let result = [...entities];

    // Apply text filter
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      result = result.filter(e => 
        e.name.toLowerCase().includes(lowerFilter) ||
        (e.module && e.module.toLowerCase().includes(lowerFilter))
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter(e => e.type === typeFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';

      if (sortField === 'recordCount') {
        aVal = entityCounts[a.name] ?? -1;
        bVal = entityCounts[b.name] ?? -1;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal);
    });

    return result;
  }, [entities, filter, typeFilter, sortField, sortDirection, entityCounts]);

  // Handle sort
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // Add entity manually
  const handleAddEntity = useCallback(() => {
    const entityNames = manualEntityInput
      .split(/[\n,]/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && /^[a-zA-Z0-9_]+$/.test(s));

    if (entityNames.length === 0) {
      setError('Please enter valid entity names');
      return;
    }

    const newEntities = entityNames
      .filter(name => !entities.some(e => e.name.toLowerCase() === name.toLowerCase()))
      .map(name => ({
        name,
        type: 'manual',
        accessible: null,
      }));

    if (newEntities.length > 0) {
      setEntities(prev => [...prev, ...newEntities]);
    }

    setManualEntityInput('');
    setShowAddForm(false);
  }, [manualEntityInput, entities, setEntities, setError]);

  // Fetch record count for selected entities
  const handleFetchCounts = useCallback(async () => {
    if (!d365Connected || !d365Token) return;

    const entitiesToCount = filteredEntities.filter(e => 
      entityCounts[e.name] === undefined
    );

    if (entitiesToCount.length === 0) return;

    setLoadingCounts(true);

    for (const entity of entitiesToCount) {
      try {
        const count = await fetchEntityCount(d365Config.url, entity.name, d365Token);
        setEntityCounts(prev => ({ ...prev, [entity.name]: count }));
      } catch {
        setEntityCounts(prev => ({ ...prev, [entity.name]: null }));
      }
    }

    setLoadingCounts(false);
  }, [d365Connected, d365Token, d365Config.url, filteredEntities, entityCounts, setEntityCounts]);

  // Get unique types for filter dropdown
  const entityTypes = useMemo(() => {
    const types = new Set(entities.map(e => e.type).filter(Boolean));
    return Array.from(types).sort();
  }, [entities]);

  // Selection stats
  const selectionStats = useMemo(() => {
    const selectedCount = selectedEntities.size;
    const totalRecords = Array.from(selectedEntities)
      .reduce((sum, name) => sum + (entityCounts[name] || 0), 0);
    return { selectedCount, totalRecords };
  }, [selectedEntities, entityCounts]);

  if (!d365Connected) {
    return (
      <div className="card">
        <div className="text-center py-12 text-nb-gray">
          <span className="text-4xl mb-4 block">🔌</span>
          <p>Connect to D365 to view data entities</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">
          <span className="mr-2">📋</span>
          Data Entities
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-outline text-sm py-2"
          >
            + Add Entity
          </button>
        </div>
      </div>

      {/* Add Entity Form */}
      {showAddForm && (
        <div className="bg-nb-cream p-4 mb-4 animate-fade-in">
          <h4 className="font-semibold text-sm mb-2">Add Entities Manually</h4>
          <textarea
            value={manualEntityInput}
            onChange={(e) => setManualEntityInput(e.target.value)}
            placeholder="Enter entity names (one per line or comma-separated)&#10;e.g., CustomersV3, VendorsV2, SalesOrderHeaders"
            className="input-field h-24 text-sm"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleAddEntity} className="btn-primary text-sm py-2">
              Add
            </button>
            <button onClick={() => setShowAddForm(false)} className="btn-outline text-sm py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search entities..."
            className="input-field"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="all">All Types</option>
          {entityTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <button
          onClick={handleFetchCounts}
          disabled={loadingCounts}
          className="btn-secondary text-sm py-2"
        >
          {loadingCounts ? 'Loading...' : 'Get Counts'}
        </button>
      </div>

      {/* Selection Controls */}
      <div className="flex items-center justify-between mb-4 py-2 border-y border-nb-opal">
        <div className="flex items-center gap-4">
          <button
            onClick={selectAllEntities}
            className="text-sm text-nb-teal hover:underline"
          >
            Select All ({filteredEntities.length})
          </button>
          <button
            onClick={clearSelection}
            className="text-sm text-nb-gray hover:underline"
          >
            Clear Selection
          </button>
        </div>
        
        <div className="text-sm text-nb-gray">
          <span className="font-semibold text-nb-black">{selectionStats.selectedCount}</span> selected
          {selectionStats.totalRecords > 0 && (
            <span className="ml-2">
              ({selectionStats.totalRecords.toLocaleString()} records)
            </span>
          )}
        </div>
      </div>

      {/* Entity Table */}
      {filteredEntities.length === 0 ? (
        <div className="text-center py-12 text-nb-gray">
          {entities.length === 0 ? (
            <>
              <span className="text-4xl mb-4 block">📝</span>
              <p>No entities added yet.</p>
              <p className="text-sm mt-2">Add entities manually or load from a preset list.</p>
            </>
          ) : (
            <>
              <span className="text-4xl mb-4 block">🔍</span>
              <p>No entities match your filter.</p>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="data-table">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                <th className="w-12">
                  <input
                    type="checkbox"
                    checked={filteredEntities.every(e => selectedEntities.has(e.name))}
                    onChange={() => {
                      const allSelected = filteredEntities.every(e => selectedEntities.has(e.name));
                      if (allSelected) {
                        clearSelection();
                      } else {
                        filteredEntities.forEach(e => {
                          if (!selectedEntities.has(e.name)) {
                            toggleEntitySelection(e.name);
                          }
                        });
                      }
                    }}
                  />
                </th>
                <th 
                  className="cursor-pointer hover:bg-nb-opal/50"
                  onClick={() => handleSort('name')}
                >
                  Entity Name
                  {sortField === 'name' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="cursor-pointer hover:bg-nb-opal/50"
                  onClick={() => handleSort('type')}
                >
                  Type
                  {sortField === 'type' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="cursor-pointer hover:bg-nb-opal/50 text-right"
                  onClick={() => handleSort('recordCount')}
                >
                  Records
                  {sortField === 'recordCount' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEntities.map(entity => (
                <tr 
                  key={entity.name}
                  className={selectedEntities.has(entity.name) ? 'selected' : ''}
                  onClick={() => toggleEntitySelection(entity.name)}
                  style={{ cursor: 'pointer' }}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedEntities.has(entity.name)}
                      onChange={() => toggleEntitySelection(entity.name)}
                    />
                  </td>
                  <td className="font-medium">{entity.name}</td>
                  <td>
                    {entity.type && (
                      <span className={`badge ${
                        entity.type === 'manual' ? 'badge-gray' :
                        entity.type === 'custom' ? 'badge-teal' :
                        entity.type === 'microsoft' ? 'badge-gray' :
                        'badge-gray'
                      }`}>
                        {entity.type}
                      </span>
                    )}
                  </td>
                  <td className="text-right font-mono">
                    {entityCounts[entity.name] !== undefined ? (
                      entityCounts[entity.name] !== null ? (
                        entityCounts[entity.name].toLocaleString()
                      ) : (
                        <span className="text-nb-red">N/A</span>
                      )
                    ) : (
                      <span className="text-nb-gray">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Footer */}
      <div className="mt-4 pt-4 border-t border-nb-opal text-sm text-nb-gray">
        Showing {filteredEntities.length} of {entities.length} entities
      </div>
    </div>
  );
}
