import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
    value: number | undefined;
    onChange: (value: number | undefined) => void;
    placeholder?: string;
    suffix?: string; // e.g. "hrs"
    prefix?: string; // e.g. "$"
    className?: string;
}

export function CurrencyInput({ value, onChange, placeholder, suffix = '', prefix = '$', className = '' }: CurrencyInputProps) {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        if (value === undefined || value === null) {
            setDisplayValue('');
        } else {
            // Format existing value on mount/update if we are not editing (actually typically we might, but let's just format it simple)
            // But if user is typing, we don't want to re-format. 
            // However, this useEffect runs when 'value' prop changes.
            // If parent updates 'value', we should update display.
            // But we need to distinguish internal edits vs external updates.
            // For now, let's just format it.
            // setDisplayValue(formatNumber(value)); // This might conflict if we are typing.
            // Better strategy: Only update display value if it's drastically different or we are not focused?
            // Actually, for a simple implementation: 
            // On Focus: Show raw number.
            // On Blur: Show formatted.
            // This is easier.
            setDisplayValue(document.activeElement !== document.getElementById(`currency-input-${placeholder}`) ? formatDisplay(value) : value.toString());
        }
    }, [value, suffix, prefix]); // eslint-disable-line react-hooks/exhaustive-deps

    const formatDisplay = (val: number | undefined) => {
        if (val === undefined || val === null) return '';
        return (prefix ? prefix : '') + val.toLocaleString() + (suffix ? ' ' + suffix : '');
    };

    const handleBlur = () => {
        if (displayValue) {
            // Parse the number from current display value (user might have typed "150000")
            const clean = displayValue.replace(/[^0-9.]/g, ''); // Simple parse
            const num = parseFloat(clean);
            if (!isNaN(num)) {
                onChange(num);
                setDisplayValue(formatDisplay(num));
            } else {
                onChange(undefined);
                setDisplayValue('');
            }
        } else {
            onChange(undefined);
            setDisplayValue('');
        }
    };

    const handleFocus = () => {
        if (value !== undefined) {
            setDisplayValue(value.toString());
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayValue(e.target.value);
    };

    return (
        <input
            type="text"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            className={className}
        />
    );
}
