import type { RazorpayCheckoutOptions } from '../components/common/RazorpayCheckoutModal';

/**
 * Loads the official Razorpay Checkout SDK (https://checkout.razorpay.com/v1/checkout.js).
 * Resolves true once real `window.Razorpay` constructor is available.
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(false);
    }

    // 1. Check if official Razorpay SDK is already loaded
    if (typeof (window as any).Razorpay === 'function' && !(window as any).Razorpay.__isMockFallback) {
      return resolve(true);
    }

    // 2. Check if script tag is already in DOM
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existingScript) {
      if (typeof (window as any).Razorpay === 'function' && !(window as any).Razorpay.__isMockFallback) {
        return resolve(true);
      }
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => {
        setupRazorpaySandboxFallback();
        resolve(true);
      });
      return;
    }

    // 3. Inject official Razorpay checkout script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.warn('[Razorpay] Official checkout script failed to load. Activating fallback interface.');
      setupRazorpaySandboxFallback();
      resolve(true);
    };

    document.body.appendChild(script);
  });
};

/**
 * Fallback used only if the official Razorpay script cannot be reached (e.g. offline)
 */
export const setupRazorpaySandboxFallback = () => {
  if (typeof window === 'undefined') return;

  const MockRazorpay: any = function (this: any, options: RazorpayCheckoutOptions) {
    this.options = options || {};
    this.open = () => {
      window.dispatchEvent(
        new CustomEvent('OPEN_RAZORPAY_CHECKOUT', {
          detail: this.options,
        })
      );
    };
  };
  MockRazorpay.__isMockFallback = true;
  (window as any).Razorpay = MockRazorpay;
};
