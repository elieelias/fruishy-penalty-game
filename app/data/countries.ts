export type CountryId =
  | 'france'
  | 'argentina'
  | 'morocco'
  | 'spain'
  | 'belgium'
  | 'brazil'
  | 'mexico'
  | 'switzerland';

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
  { id: 'morocco', name: 'Morocco', flag: '🇲🇦', primary: '#c1272d', secondary: '#ffffff', accent: '#006233' },
  { id: 'spain', name: 'Spain', flag: '🇪🇸', primary: '#aa151b', secondary: '#f1bf00', accent: '#ffffff' },
  { id: 'belgium', name: 'Belgium', flag: '🇧🇪', primary: '#1b1b1b', secondary: '#fdda24', accent: '#ef3340' },
  { id: 'brazil', name: 'Brazil', flag: '🇧🇷', primary: '#ffdf00', secondary: '#009c3b', accent: '#002776' },
  { id: 'mexico', name: 'Mexico', flag: '🇲🇽', primary: '#006847', secondary: '#ffffff', accent: '#ce1126' },
  { id: 'switzerland', name: 'Switzerland', flag: '🇨🇭', primary: '#d52b1e', secondary: '#ffffff', accent: '#202020' },
];

export const DEFAULT_COUNTRY: CountryId = 'france';

export function getCountryTheme(countryId: CountryId): CountryTheme {
  return (
    COUNTRY_THEMES.find((country) => country.id === countryId) ??
    COUNTRY_THEMES[0]
  );
}
