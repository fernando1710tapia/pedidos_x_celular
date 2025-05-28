import React from 'react';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import * as eva from '@eva-design/eva';

const customTheme = {
  ...eva.light,
  'text-font-family': 'System',
  'text-heading-1-font-size': 32,
  'text-heading-2-font-size': 28,
  'text-heading-3-font-size': 24,
  'text-heading-4-font-size': 20,
  'text-heading-5-font-size': 18,
  'text-heading-6-font-size': 16,
  'text-subtitle-1-font-size': 16,
  'text-subtitle-2-font-size': 14,
  'text-paragraph-1-font-size': 16,
  'text-paragraph-2-font-size': 14,
  'text-caption-1-font-size': 12,
  'text-caption-2-font-size': 12,
  'text-label-font-size': 14,
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={customTheme}>
        {children}
      </ApplicationProvider>
    </>
  );
};
