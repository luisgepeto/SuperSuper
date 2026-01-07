const About = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">About SuperSuper</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Introduction */}
              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">What is SuperSuper?</h3>
                <p className="text-gray-600 leading-relaxed">
                  SuperSuper is your trusted supermarket companion that helps you compare products 
                  while shopping. The application runs locally on your home network and works 
                  completely offline, ensuring your shopping data stays private and accessible 
                  even without an internet connection.
                </p>
              </section>

              {/* Features */}
              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Key Features</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <strong className="text-gray-800">Barcode Scanning:</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Quickly scan product barcodes using your device's camera to add items to your shopping trip.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <strong className="text-gray-800">Trip Management:</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Track all items scanned during your shopping trip with timestamps and automatic organization.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <strong className="text-gray-800">Offline Support:</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Works completely offline using service workers, so you can use it anywhere in the store.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <strong className="text-gray-800">Self-Hosted:</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Run on your own home network for complete privacy and control over your shopping data.
                      </p>
                    </div>
                  </li>
                </ul>
              </section>

              {/* How to Use */}
              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">How to Use</h3>
                <ol className="space-y-3 list-decimal list-inside text-gray-600">
                  <li className="leading-relaxed">
                    <strong className="text-gray-800">Start a Shopping Trip:</strong> Click the "Go shopping!" button on the home page to begin a new trip.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-gray-800">Scan Items:</strong> Tap the camera button at the bottom of the screen to open the barcode scanner.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-gray-800">Point and Scan:</strong> Point your camera at a product's barcode. The app will automatically detect and record it.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-gray-800">View Your Items:</strong> All scanned items appear in your trip list with timestamps for easy tracking.
                  </li>
                </ol>
              </section>

              {/* System Status */}
              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">System Status Indicators</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-gray-600"><strong>Green:</strong> System is fully online and operational</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    <span className="text-gray-600"><strong>Orange:</strong> Server is offline but app works in offline mode</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-gray-600"><strong>Red:</strong> No network connection detected</span>
                  </div>
                </div>
              </section>

              {/* Mobile Optimization */}
              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Mobile Optimized</h3>
                <p className="text-gray-600 leading-relaxed">
                  SuperSuper is designed specifically for mobile devices in portrait mode, 
                  making it perfect for use while shopping in the supermarket. The clean, 
                  modern interface ensures you can quickly scan and compare products on the go.
                </p>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
