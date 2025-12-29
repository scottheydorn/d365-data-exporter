/**
 * Common D365 Entities Presets
 * 
 * Quick-add buttons for commonly used D365 data entities
 */

import React, { useCallback } from 'react';
import { useApp } from '../context/AppContext';

// Categorized list of common D365 F&O data entities
const ENTITY_PRESETS = {
  'Financials': [
    'MainAccounts',
    'LedgerJournalHeaders',
    'LedgerJournalLines',
    'GeneralJournalAccountEntries',
    'DimensionCombinations',
    'FiscalCalendars',
    'ExchangeRates',
    'TaxGroupHeadings',
  ],
  'Customers & AR': [
    'CustomersV3',
    'CustomerGroups',
    'CustomerPaymentMethod',
    'SalesOrderHeaders',
    'SalesOrderLines',
    'CustInvoiceJour',
    'CustTrans',
    'CustTable',
  ],
  'Vendors & AP': [
    'VendorsV2',
    'VendorGroups',
    'VendorPaymentMethod',
    'PurchaseOrderHeaders',
    'PurchaseOrderLines',
    'VendInvoiceJour',
    'VendTrans',
    'VendTable',
  ],
  'Inventory': [
    'ReleasedProducts',
    'ProductsV2',
    'InventItemGroup',
    'InventDim',
    'InventTable',
    'InventTrans',
    'InventSum',
    'Warehouses',
    'InventLocations',
  ],
  'Production': [
    'ProductionOrders',
    'BOMHeaders',
    'BOMLines',
    'RoutesV2',
    'RouteOperations',
    'WorkCenters',
  ],
  'HR & Payroll': [
    'Employees',
    'Workers',
    'Positions',
    'Jobs',
    'Departments',
    'HcmWorker',
    'HcmEmployment',
  ],
  'System': [
    'SystemParameters',
    'Companies',
    'LegalEntities',
    'Users',
    'NumberSequences',
    'BatchJobs',
  ],
};

export default function EntityPresets() {
  const { entities, setEntities, d365Connected } = useApp();

  const addEntities = useCallback((entityNames) => {
    const newEntities = entityNames
      .filter(name => !entities.some(e => e.name.toLowerCase() === name.toLowerCase()))
      .map(name => ({
        name,
        type: 'preset',
        accessible: null,
      }));

    if (newEntities.length > 0) {
      setEntities(prev => [...prev, ...newEntities]);
    }
  }, [entities, setEntities]);

  const addCategory = useCallback((category) => {
    addEntities(ENTITY_PRESETS[category]);
  }, [addEntities]);

  const addAllPresets = useCallback(() => {
    const allEntities = Object.values(ENTITY_PRESETS).flat();
    addEntities(allEntities);
  }, [addEntities]);

  if (!d365Connected) {
    return null;
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-nb-black uppercase tracking-wider text-sm">
          Quick Add Entities
        </h3>
        <button
          onClick={addAllPresets}
          className="text-xs text-nb-teal hover:underline"
        >
          Add All Presets
        </button>
      </div>

      <div className="space-y-3">
        {Object.entries(ENTITY_PRESETS).map(([category, entityList]) => (
          <div key={category} className="flex items-center justify-between py-2 border-b border-nb-opal last:border-0">
            <div>
              <span className="font-medium text-sm">{category}</span>
              <span className="text-xs text-nb-gray ml-2">
                ({entityList.length} entities)
              </span>
            </div>
            <button
              onClick={() => addCategory(category)}
              className="text-xs bg-nb-opal/30 hover:bg-nb-opal/50 px-3 py-1 text-nb-black transition-colors"
            >
              + Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
