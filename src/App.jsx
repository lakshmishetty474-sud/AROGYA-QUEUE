import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppRoutes } from './routes/AppRoutes';
import { SplashScreen } from './components/common/SplashScreen';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';
import { AppToaster } from './components/common/AppToaster';
import { BookingVerificationProvider } from './context/BookingVerification';
import { RedistributionProvider } from './context/RedistributionContext';

export function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <GlobalErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <BookingVerificationProvider>
            <RedistributionProvider>
              {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
              <AppRoutes />
              <AppToaster />
            </RedistributionProvider>
          </BookingVerificationProvider>
        </AppProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  );
}

export default App;
