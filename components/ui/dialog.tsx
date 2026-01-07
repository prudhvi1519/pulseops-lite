import React from 'react';

// Simplified Dialog for Smoke Test
export const Dialog = ({ open, children }: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!open) return null;
    return <div role="dialog">{children}</div>;
};

export const DialogContent = ({ children }: any) => <div>{children}</div>; // eslint-disable-line @typescript-eslint/no-explicit-any
export const DialogHeader = ({ children }: any) => <div>{children}</div>; // eslint-disable-line @typescript-eslint/no-explicit-any
export const DialogTitle = ({ children }: any) => <h2>{children}</h2>; // eslint-disable-line @typescript-eslint/no-explicit-any
export const DialogFooter = ({ children }: any) => <div>{children}</div>; // eslint-disable-line @typescript-eslint/no-explicit-any
