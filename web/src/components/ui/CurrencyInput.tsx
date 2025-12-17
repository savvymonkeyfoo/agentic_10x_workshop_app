import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
    value: number | undefined;
    onChange: (value: number | undefined) => void;
    placeholder?: string;
    suffix?: string;
    prefix?: string;
    className?: string;
    id?: string;
    name?: string;
}

export function CurrencyInput({ value, onChange, placeholder, suffix = '', prefix = '$', className = '', id, name }: CurrencyInputProps) {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        if (value === undefined || value === null) {
            setDisplayValue('');
        } else {
            const activeId = document.activeElement?.id;
            // Only update if not strictly focused on this input (by ID check if available)
            if (activeId && id && activeId === id) {
                // Do nothing, user is typing
            } else {
                setDisplayValue(formatDisplay(value));
            }
        }
    }, [value, suffix, prefix]); // eslint-disable-line react-hooks/exhaustive-deps

    const formatDisplay = (val: number | undefined) => {
        if (val === undefined || val === null) return '';
        return (prefix ? prefix : '') + val.toLocaleString() + (suffix ? ' ' + suffix : '');
    };

    const handleBlur = () => {
        if (displayValue) {
            const clean = displayValue.replace(/[^0-9.]/g, '');
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
            id={id}
            name={name}
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
