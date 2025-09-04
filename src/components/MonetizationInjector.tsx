import { useEffect } from 'react';
import { dbService } from '@/services/database';

const MonetizationInjector = () => {
  useEffect(() => {
    const injectMonetizationCode = async () => {
      try {
        // Check if we're in Telegram WebView environment
        const isTelegramWebView = window.Telegram?.WebApp || 
          window.navigator.userAgent.includes('TelegramBot') ||
          window.location.hostname.includes('telegram') ||
          window.parent !== window;

        if (isTelegramWebView) {
          console.log('🚫 Skipping external ad injection in Telegram WebView environment');
          return;
        }

        const monetizationCode = await dbService.getAdminSetting('monetization_code');
        
        if (monetizationCode && monetizationCode.trim() !== '') {
          // Remove any existing monetization scripts
          const existingScript = document.getElementById('monetization-injector');
          if (existingScript) {
            existingScript.remove();
          }

          // Create and inject the monetization code (only for non-Telegram environments)
          const scriptElement = document.createElement('div');
          scriptElement.id = 'monetization-injector';
          scriptElement.innerHTML = monetizationCode;
          
          // Append to body
          document.body.appendChild(scriptElement);

          // If the code contains script tags, we need to execute them
          const scripts = scriptElement.querySelectorAll('script');
          scripts.forEach((script) => {
            const newScript = document.createElement('script');
            if (script.src) {
              newScript.src = script.src;
              newScript.onerror = () => {
                console.warn('Failed to load external ad script:', script.src);
              };
            } else {
              newScript.textContent = script.textContent;
            }
            document.head.appendChild(newScript);
          });
        }
      } catch (error) {
        console.error('Error injecting monetization code:', error);
      }
    };

    injectMonetizationCode();
  }, []);

  return null; // This is a utility component with no UI
};

export default MonetizationInjector;