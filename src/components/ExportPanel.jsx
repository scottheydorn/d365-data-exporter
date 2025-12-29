/**
 * Export Panel
 * 
 * Handles data export configuration and execution
 */

import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { fetchEntityData, recordsToCsv, recordsToJson } from '../utils/d365Api';
import { createOrUpdateFile, generateFilename } from '../utils/githubApi';

export default function ExportPanel() {
  const {
    d365Config,
    d365Token,
    d365Connected,
    githubConfig,
    githubConnected,
    selectedEntities,
    entityCounts,
    exportFormat,
    setExportFormat,
    exportProgress,
    setExportProgress,
    addExportRecord,
    setError,
  } = useApp();

  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    maxRecords: null, // null = all
    includeTimestamp: true,
  });
  const [exportResults, setExportResults] = useState([]);

  const canExport = d365Connected && githubConnected && selectedEntities.size > 0;

  // Estimate total records for selected entities
  const estimatedRecords = Array.from(selectedEntities)
    .reduce((sum, name) => {
      const count = entityCounts[name];
      return sum + (count || 0);
    }, 0);

  const handleExport = useCallback(async () => {
    if (!canExport) return;

    setIsExporting(true);
    setExportResults([]);
    setError(null);

    const results = [];
    const entitiesToExport = Array.from(selectedEntities);
    let completedCount = 0;

    for (const entityName of entitiesToExport) {
      try {
        setExportProgress({
          phase: 'fetching',
          current: completedCount + 1,
          total: entitiesToExport.length,
          entity: entityName,
          message: `Fetching ${entityName}...`,
        });

        // Fetch entity data
        const records = await fetchEntityData(
          d365Config.url,
          entityName,
          d365Token,
          { top: exportOptions.maxRecords },
          (progress) => {
            setExportProgress(prev => ({
              ...prev,
              message: `Fetching ${entityName} - Page ${progress.page}, ${progress.recordCount} records...`,
            }));
          }
        );

        if (records.length === 0) {
          results.push({
            entity: entityName,
            status: 'skipped',
            message: 'No records found',
            recordCount: 0,
          });
          completedCount++;
          continue;
        }

        setExportProgress({
          phase: 'saving',
          current: completedCount + 1,
          total: entitiesToExport.length,
          entity: entityName,
          message: `Saving ${entityName} to GitHub...`,
        });

        // Convert to desired format
        let content;
        let filename;
        
        if (exportFormat === 'csv') {
          content = recordsToCsv(records);
          filename = generateFilename(entityName, 'csv');
        } else {
          content = recordsToJson(records, entityName);
          filename = generateFilename(entityName, 'json');
        }

        // Build file path
        const filePath = githubConfig.path 
          ? `${githubConfig.path}/${filename}`
          : filename;

        // Save to GitHub
        const commitMessage = `Export ${entityName} - ${records.length} records`;
        
        await createOrUpdateFile(
          githubConfig.owner,
          githubConfig.repo,
          filePath,
          content,
          commitMessage,
          githubConfig.token,
          githubConfig.branch
        );

        results.push({
          entity: entityName,
          status: 'success',
          recordCount: records.length,
          filename: filename,
          path: filePath,
        });

        addExportRecord({
          timestamp: new Date().toISOString(),
          entity: entityName,
          recordCount: records.length,
          format: exportFormat,
          path: filePath,
        });

      } catch (error) {
        console.error(`Export error for ${entityName}:`, error);
        results.push({
          entity: entityName,
          status: 'error',
          message: error.message,
          recordCount: 0,
        });
      }

      completedCount++;
    }

    setExportResults(results);
    setExportProgress(null);
    setIsExporting(false);
  }, [
    canExport,
    selectedEntities,
    d365Config,
    d365Token,
    githubConfig,
    exportFormat,
    exportOptions,
    addExportRecord,
    setError,
    setExportProgress,
  ]);

  const successCount = exportResults.filter(r => r.status === 'success').length;
  const errorCount = exportResults.filter(r => r.status === 'error').length;

  return (
    <div className="card">
      <h2 className="section-title mb-6">
        <span className="mr-2">📤</span>
        Export Data
      </h2>

      {/* Connection Status */}
      {(!d365Connected || !githubConnected) && (
        <div className="bg-nb-cream p-4 mb-6">
          <p className="text-nb-gray text-sm">
            {!d365Connected && '⚠️ Connect to D365 to export data. '}
            {!githubConnected && '⚠️ Connect to GitHub to save exports.'}
          </p>
        </div>
      )}

      {/* Export Options */}
      <div className="space-y-4 mb-6">
        {/* Format Selection */}
        <div>
          <label className="label">Export Format</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="json"
                checked={exportFormat === 'json'}
                onChange={() => setExportFormat('json')}
                className="accent-nb-red"
              />
              <span className="font-medium">JSON</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={exportFormat === 'csv'}
                onChange={() => setExportFormat('csv')}
                className="accent-nb-red"
              />
              <span className="font-medium">CSV</span>
            </label>
          </div>
        </div>

        {/* Max Records */}
        <div>
          <label className="label">Maximum Records per Entity</label>
          <select
            value={exportOptions.maxRecords || 'all'}
            onChange={(e) => setExportOptions(prev => ({
              ...prev,
              maxRecords: e.target.value === 'all' ? null : parseInt(e.target.value)
            }))}
            className="input-field w-auto"
          >
            <option value="all">All Records</option>
            <option value="100">100</option>
            <option value="1000">1,000</option>
            <option value="5000">5,000</option>
            <option value="10000">10,000</option>
            <option value="50000">50,000</option>
          </select>
        </div>
      </div>

      {/* Selection Summary */}
      <div className="bg-nb-cream p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-nb-black">
              {selectedEntities.size} entities selected
            </p>
            {estimatedRecords > 0 && (
              <p className="text-sm text-nb-gray">
                ~{estimatedRecords.toLocaleString()} estimated records
              </p>
            )}
          </div>
          
          {githubConnected && (
            <div className="text-right text-sm text-nb-gray">
              <p>Destination:</p>
              <p className="font-mono">
                {githubConfig.owner}/{githubConfig.repo}/{githubConfig.path}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Export Progress */}
      {exportProgress && (
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {exportProgress.message}
            </span>
            <span className="text-sm text-nb-gray">
              {exportProgress.current} / {exportProgress.total}
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill"
              style={{ 
                width: `${(exportProgress.current / exportProgress.total) * 100}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={!canExport || isExporting}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {isExporting ? (
          <>
            <span className="spinner" />
            Exporting...
          </>
        ) : (
          <>
            <span>📤</span>
            Export Selected Entities
          </>
        )}
      </button>

      {/* Export Results */}
      {exportResults.length > 0 && (
        <div className="mt-6 animate-fade-in">
          <h3 className="font-semibold text-nb-black mb-3">
            Export Results
          </h3>
          
          {/* Summary */}
          <div className="flex gap-4 mb-4">
            {successCount > 0 && (
              <span className="badge badge-teal">
                {successCount} successful
              </span>
            )}
            {errorCount > 0 && (
              <span className="badge badge-red">
                {errorCount} failed
              </span>
            )}
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Entity</th>
                  <th>Status</th>
                  <th>Records</th>
                  <th>File</th>
                </tr>
              </thead>
              <tbody>
                {exportResults.map((result, idx) => (
                  <tr key={idx}>
                    <td className="font-medium">{result.entity}</td>
                    <td>
                      <span className={`badge ${
                        result.status === 'success' ? 'badge-teal' :
                        result.status === 'error' ? 'badge-red' :
                        'badge-gray'
                      }`}>
                        {result.status}
                      </span>
                    </td>
                    <td className="text-right font-mono">
                      {result.recordCount.toLocaleString()}
                    </td>
                    <td className="text-sm">
                      {result.filename || result.message || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* GitHub Link */}
          {successCount > 0 && (
            <div className="mt-4 pt-4 border-t border-nb-opal">
              <a
                href={`https://github.com/${githubConfig.owner}/${githubConfig.repo}/tree/${githubConfig.branch}/${githubConfig.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-nb-teal hover:underline text-sm"
              >
                View exports on GitHub →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
