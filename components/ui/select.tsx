import React from 'react';

// Simplified Select for Smoke Test
// Real implementation would utilize Radix UI or similar
export const Select = ({ children, onValueChange: _onValueChange, value: _value }: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    return <div>{children}</div>;
};

export const SelectTrigger = ({ children }: any) => <button>{children}</button>; // eslint-disable-line @typescript-eslint/no-explicit-any
export const SelectValue = () => <span>Select</span>;
export const SelectContent = ({ children }: any) => <div>{children}</div>; // eslint-disable-line @typescript-eslint/no-explicit-any
export const SelectItem = ({ value: _value, children }: any) => <div data-value={_value}>{children}</div>; // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
