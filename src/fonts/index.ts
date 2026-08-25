import { Fira_Code, Raleway } from 'next/font/google';

const firaCode = Fira_Code({
  display: 'swap',
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-fira-code',
});

const raleway = Raleway({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-raleway',
});

export { firaCode, raleway };
