import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useApiKey } from '../hooks/useApiKey';
import { Card, Button, Input, Badge, Modal, WifiIcon, WifiOffIcon, ServerIcon, RefreshIcon, KeyIcon, CheckIcon, DatabaseIcon, DownloadIcon, UploadIcon, TrashIcon, AlertTriangleIcon, CloseIcon } from '../components/ui';
import dataStorage from '../services/dataStorage';
import settingsStorage from '../services/settingsStorage';

const Settings = () => {
  const {
    isOnline,
    isNetworkOnline,
    isBackendOnline,
    status,
    checkBackend
  } = useOnlineStatus();

  const {
    value: barcodeSpiderApiKey,
    setValue: setBarcodeSpiderApiKey
  } = useApiKey('barcode-spider');

  // Data management state
  const [hasExistingData, setHasExistingData] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  // Experimental features state
  const [semanticSearchEnabled, setSemanticSearchEnabled] = useState(
    settingsStorage.isSemanticSearchEnabled()
  );

  // Check for existing data on mount and after operations
  const checkExistingData = useCallback(() => {
    setHasExistingData(dataStorage.hasExistingData());
  }, []);

  // Reevaluate import button state on mount and when API keys change
  useEffect(() => {
    checkExistingData();
  }, [checkExistingData, barcodeSpiderApiKey]);

  const serviceWorkerSupport = useMemo(() => 'serviceWorker' in navigator, []);

  const handleServerRetry = () => {
    checkBackend();
  };

  // Download data handler
  const handleDownloadData = () => {
    dataStorage.downloadData();
  };

  // Clear data handlers
  const handleClearDataClick = () => {
    setShowClearConfirm(true);
  };

  const handleClearDataConfirm = () => {
    dataStorage.clearAllData();
    setShowClearConfirm(false);
    checkExistingData();
    // Reset API key state after clearing
    setBarcodeSpiderApiKey('');
  };

  const handleClearDataCancel = () => {
    setShowClearConfirm(false);
  };

  // Import data handlers
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportPreview(null);

    try {
      const data = await dataStorage.readFileAsJson(file);
      const validation = dataStorage.validateImportData(data);

      if (!validation.isValid) {
        setImportError(validation.errors.join(', '));
        return;
      }

      setImportPreview({
        data,
        summary: validation.summary
      });
    } catch (error) {
      setImportError(error.message);
    }

    // Reset file input
    event.target.value = '';
  };

  const handleImportConfirm = () => {
    if (!importPreview) return;

    const result = dataStorage.importData(importPreview.data);
    if (result.success) {
      setImportPreview(null);
      checkExistingData();
      // Reload the page to refresh all components with new data from localStorage.
      // This is necessary because hooks like useApiKey read from localStorage on mount.
      // A more sophisticated approach would be to use context/event emitters, but
      // since importing data is an infrequent operation, a page reload is acceptable.
      window.location.reload();
    } else {
      setImportError(result.errors.join(', '));
    }
  };

  const handleImportCancel = () => {
    setImportPreview(null);
    setImportError(null);
  };

  // Handle semantic search toggle
  const handleSemanticSearchToggle = (event) => {
    const enabled = event.target.checked;
    setSemanticSearchEnabled(enabled);
    settingsStorage.setSemanticSearchEnabled(enabled);
    
    // Reload page to reinitialize components with new setting
    // When enabling: loads the semantic search module
    // When disabling: unloads the model and frees memory
    window.location.reload();
  };


  return (
    <>
      {/* Clear Data Confirmation Modal */}
      <Modal isOpen={showClearConfirm} onClose={handleClearDataCancel}>
        <Card variant="default" padding="lg" className="max-w-sm w-full">
          <Card.Header>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-error-light rounded-lg">
                <AlertTriangleIcon size={18} className="text-error" />
              </div>
              <Card.Title>Clear All Data?</Card.Title>
            </div>
          </Card.Header>
          <Card.Content>
            <p className="text-sm text-warm-600 mb-4">
              This will permanently delete all your trips, API keys, and other stored data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={handleClearDataCancel}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={handleClearDataConfirm}
              >
                Clear Data
              </Button>
            </div>
          </Card.Content>
        </Card>
      </Modal>

      {/* Import Preview Modal */}
      <Modal isOpen={!!importPreview} onClose={handleImportCancel}>
        <Card variant="default" padding="lg" className="max-w-sm w-full">
          <Card.Header>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <UploadIcon size={18} className="text-primary-600" />
                </div>
                <Card.Title>Import Data</Card.Title>
              </div>
              <button
                onClick={handleImportCancel}
                className="p-2 hover:bg-warm-100 rounded-lg transition-smooth"
              >
                <CloseIcon size={18} className="text-warm-500" />
              </button>
            </div>
          </Card.Header>
          <Card.Content>
            <p className="text-sm text-warm-600 mb-4">
              The following data will be imported:
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between p-2 bg-warm-50 rounded-lg">
                <span className="text-sm text-warm-700">Trips</span>
                <span className="text-sm font-medium text-warm-900">{importPreview?.summary.trips}</span>
              </div>
              <div className="flex justify-between p-2 bg-warm-50 rounded-lg">
                <span className="text-sm text-warm-700">API Keys</span>
                <span className="text-sm font-medium text-warm-900">{importPreview?.summary.apiKeys}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={handleImportCancel}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleImportConfirm}
              >
                Import
              </Button>
            </div>
          </Card.Content>
        </Card>
      </Modal>

      <div className="h-full bg-warm-50 flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <header className="flex-shrink-0 bg-gradient-to-br from-primary-600 to-primary-700 text-white sticky top-0 z-10">
          <div className="px-5 pt-6 pb-5">
            <h1 className="text-xl font-bold">
              Settings
            </h1>
            <p className="text-sm text-primary-100 mt-0.5">
              Manage your app preferences
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">

          <div className="px-4 pt-4 pb-6 space-y-4 max-w-lg mx-auto">
            
            {/* System Status Card */}
            <Card variant="default" padding="lg">
              <Card.Header>
                <div className="flex items-center justify-between">
                  <Card.Title>System Status</Card.Title>
                  <Badge 
                    variant={isOnline ? 'success' : 'warning'} 
                    size="sm"
                    dot
                  >
                    {status.overall === 'online' ? 'All Systems Go' : 'Issues Detected'}
                  </Badge>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  {/* Service Worker Status */}
                  <StatusRow
                    icon={<CheckIcon size={18} />}
                    label="Offline Support"
                    status={serviceWorkerSupport}
                    statusText={serviceWorkerSupport ? 'Enabled' : 'Not Available'}
                  />

                  {/* Network Status */}
                  <StatusRow
                    icon={isNetworkOnline ? <WifiIcon size={18} /> : <WifiOffIcon size={18} />}
                    label="Internet"
                    status={isNetworkOnline}
                    statusText={status.network}
                  />

                  {/* Backend Status */}
                  <StatusRow
                    icon={<ServerIcon size={18} />}
                    label="Server"
                    status={isBackendOnline}
                    statusText={status.backend}
                    action={!isBackendOnline && (
                      <button
                        onClick={handleServerRetry}
                        className="p-2 hover:bg-warm-100 rounded-lg transition-smooth"
                      >
                        <RefreshIcon size={16} className="text-warm-500" />
                      </button>
                    )}
                  />
                </div>
              </Card.Content>
            </Card>

            {/* API Keys Card */}
            <Card variant="default" padding="lg">
              <Card.Header>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-accent-100 rounded-lg">
                    <KeyIcon size={18} className="text-accent-600" />
                  </div>
                  <div>
                    <Card.Title>API Keys</Card.Title>
                    <Card.Description>Configure external services</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <Input
                    label="Barcode Spider API Key"
                    type="password"
                    placeholder="Enter your API key"
                    value={barcodeSpiderApiKey}
                    onChange={(e) => setBarcodeSpiderApiKey(e.target.value)}
                    hint={<>Get your key at <a href="https://www.barcodespider.com/" target="_blank" rel="noopener noreferrer" className="text-accent-600 underline">barcodespider.com</a></>}
                  />
                </div>
              </Card.Content>
            </Card>

            {/* Experimental Features Card */}
            <Card variant="default" padding="lg">
              <Card.Header>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-warning-light rounded-lg">
                    <AlertTriangleIcon size={18} className="text-warning-dark" />
                  </div>
                  <div>
                    <Card.Title>Experimental Features</Card.Title>
                    <Card.Description>Enable features in development</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-warm-600 mb-4">
                  These features are experimental and may impact performance or stability.
                </p>
                
                <div className="space-y-4">
                  {/* Semantic Search Toggle */}
                  <label className="flex items-center justify-between p-3 bg-warm-50 rounded-xl cursor-pointer hover:bg-warm-100 transition-smooth">
                    <div className="flex-1">
                      <div className="font-medium text-warm-900">Semantic Search</div>
                      <div className="text-sm text-warm-600 mt-0.5">
                        AI-powered search that understands meaning (~23MB download)
                      </div>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        role="switch"
                        aria-checked={semanticSearchEnabled}
                        checked={semanticSearchEnabled}
                        onChange={handleSemanticSearchToggle}
                        className="w-12 h-6 rounded-full appearance-none cursor-pointer transition-colors relative
                          bg-warm-300 checked:bg-primary-600
                          before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full 
                          before:bg-white before:top-0.5 before:left-0.5 before:transition-transform
                          checked:before:translate-x-6"
                      />
                    </div>
                  </label>
                </div>
              </Card.Content>
            </Card>

            {/* Your Data Card */}
            <Card variant="default" padding="lg">
              <Card.Header>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <DatabaseIcon size={18} className="text-primary-600" />
                  </div>
                  <div>
                    <Card.Title>Your Data</Card.Title>
                    <Card.Description>You own your data</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-warm-600 mb-4">
                  Your data is stored locally in your browser. You can export, import, or clear your data at any time.
                </p>
                
                <div className="space-y-3">
                  {/* Download Data Button */}
                  <Button
                    variant="secondary"
                    fullWidth
                    icon={<DownloadIcon size={18} />}
                    onClick={handleDownloadData}
                  >
                    Download Data
                  </Button>

                  {/* Import Data Button */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="secondary"
                      fullWidth
                      icon={<UploadIcon size={18} />}
                      onClick={handleImportClick}
                      disabled={hasExistingData}
                    >
                      Import Data
                    </Button>
                    {hasExistingData && (
                      <p className="text-xs text-warm-500 mt-2">
                        Import is disabled because data already exists. To import new data, first download your current data for backup, then clear it and import.
                      </p>
                    )}
                  </div>

                  {/* Clear Data Button */}
                  <Button
                    variant="danger"
                    fullWidth
                    icon={<TrashIcon size={18} />}
                    onClick={handleClearDataClick}
                  >
                    Clear Data
                  </Button>
                </div>

                {/* Import Error */}
                {importError && (
                  <div className="mt-4 p-3 bg-error-light rounded-xl">
                    <p className="text-sm text-error-dark">{importError}</p>
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* About Card */}
            <Card variant="filled" padding="md">
              <div className="text-center">
                <p className="font-semibold text-warm-800">SuperSuper</p>
                <p className="text-sm text-warm-500 mt-1">
                  Your family shopping companion
                </p>
                <p className="text-xs text-warm-400 mt-2">
                  Version 1.0.0
                </p>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
};

// Status Row Component
const StatusRow = ({ icon, label, status, statusText, action }) => (
  <div className="flex items-center justify-between p-3 bg-warm-50 rounded-xl">
    <div className="flex items-center gap-3">
      <div className={`${status ? 'text-primary-600' : 'text-warm-400'}`}>
        {icon}
      </div>
      <span className="font-medium text-warm-700">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${status ? 'bg-success' : 'bg-warning'}`} />
        <span className={`text-sm capitalize ${status ? 'text-success-dark' : 'text-warning-dark'}`}>
          {statusText}
        </span>
      </div>
      {action}
    </div>
  </div>
);

export default Settings;
