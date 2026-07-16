export type CountryId =
  | 'argentina'
  | 'spain';

export type CountryTheme = {
  id: CountryId;
  name: string;
  flag: string;
  primary: string;
  secondary: string;
  accent: string;
};

export const COUNTRY_THEMES: CountryTheme[] = [
  { id: 'argentina', name: 'Argentina', flag: '🇦🇷', primary: '#75aadb', secondary: '#ffffff', accent: '#f6b40e' },
  { id: 'spain', name: 'Spain', flag: '🇪🇸', primary: '#aa151b', secondary: '#f1bf00', accent: '#ffffff' },
];

export const DEFAULT_COUNTRY: CountryId = 'argentina';

export function getCountryTheme(countryId: CountryId): CountryTheme {
  return (
    COUNTRY_THEMES.find((country) => country.id === countryId) ??
    COUNTRY_THEMES[0]
  );
}
