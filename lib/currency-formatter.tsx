"use client"

import { useSettings } from "./settings-context";

export const useCurrency = () => {
    const { settings } = useSettings();

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) {
            // Return a default value for non-numbers, maybe 0 formatted or a dash
            return new Intl.NumberFormat('th-TH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                ...(settings.showCurrencySymbol && { style: 'currency', currency: settings.currency })
            }).format(0);
        }

        const options: Intl.NumberFormatOptions = {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        };

        if (settings.showCurrencySymbol) {
            options.style = 'currency';
            options.currency = settings.currency;
        }
        
        // Using 'en-US' locale can sometimes be more stable for various currency symbols
        // while still respecting the currency code from settings.
        const locale = settings.currency === 'THB' ? 'th-TH' : 'en-US';

        return new Intl.NumberFormat(locale, options).format(amount);
    };

    return { formatCurrency, currency: settings.currency, showCurrencySymbol: settings.showCurrencySymbol };
};

