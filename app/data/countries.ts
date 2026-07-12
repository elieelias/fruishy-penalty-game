export type CountryId =
  | 'france'
  | 'argentina'
  | 'spain'
  | 'england';

export type CountryTheme = {
  id: CountryId;
  name: string;
  flag: string;
  primary: string;
  secondary: string;
  accent: string;
};

export const COUNTRY_THEMES: CountryTheme[] = [
  { id: 'france', name: 'France', flag: '🇫🇷', primary: '#1f3c88', secondary: '#ffffff', accent: '#ed2939' },
  { id: 'argentina', name: 'Argentina', flag: '🇦🇷', primary: '#75aadb', secondary: '#ffffff', accent: '#f6b40e' },
  { id: 'spain', name: 'Spain', flag: '🇪🇸', primary: '#aa151b', secondary: '#f1bf00', accent: '#ffffff' },
  { id: 'england', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', primary: '#ffffff', secondary: '#cf142b', accent: '#1f3c88' },
];

export const DEFAULT_COUNTRY: CountryId = 'france';

export function getCountryTheme(countryId: CountryId): CountryTheme {
  return (
    COUNTRY_THEMES.find((country) => country.id === countryId) ??
    COUNTRY_THEMES[0]
  );
}
