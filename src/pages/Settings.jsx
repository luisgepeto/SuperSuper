import { useMemo } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useApiKey } from '../hooks/useApiKey';
import { Card, Button, Input, Badge, WifiIcon, WifiOffIcon, ServerIcon, RefreshIcon, KeyIcon, CheckIcon } from '../components/ui';

const Settings = () => {
  const {
    isOnline,
    isNetworkOnline,
    isBackendOnline,
    status,
    checkBackend
  } = useOnlineStatus();

  const {
    value: goUpcApiKey,
    setValue: setGoUpcApiKey
  } = useApiKey('go-upc');

  const {
    value: barcodeSpiderApiKey,
    setValue: setBarcodeSpiderApiKey
  } = useApiKey('barcode-spider');

 
  const serviceWorkerSupport = useMemo(() => 'serviceWorker' in navigator, []);

  const handleServerRetry = () => {
    checkBackend();
  };

  return (
    <div className="h-full bg-warm-50 overflow-y-auto">
      <div className="min-h-full pb-6">
        {/* Header */}
        <div className="bg-white border-b border-warm-100 px-5 pt-6 pb-4 safe-area-top">
          <h1 className="text-2xl font-bold text-warm-900">
            Settings
          </h1>
          <p className="text-sm text-warm-500 mt-1">
            Manage your app preferences
          </p>
        </div>

        {/* Content */}
        <div className="px-4 pt-4 space-y-4 max-w-lg mx-auto">
          
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
                  label="GO-UPC API Key"
                  type="password"
                  placeholder="Enter your API key"
                  value={goUpcApiKey}
                  onChange={(e) => setGoUpcApiKey(e.target.value)}
                  hint="Used for product barcode lookups"
                />
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
      </div>
    </div>
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
        <span className={`w-2 h-2 rounded-full ${status ? 'bg-success-DEFAULT' : 'bg-warning-DEFAULT'}`} />
        <span className={`text-sm capitalize ${status ? 'text-success-dark' : 'text-warning-dark'}`}>
          {statusText}
        </span>
      </div>
      {action}
    </div>
  </div>
);

export default Settings;
