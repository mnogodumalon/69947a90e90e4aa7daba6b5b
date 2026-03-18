// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Kategorien {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    kategoriename?: string;
    beschreibung?: string;
    farbe?: LookupValue;
  };
}

export interface NotizSchlagwoerterZuordnung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    notiz?: string; // applookup -> URL zu 'Notizen' Record
    schlagwort?: string; // applookup -> URL zu 'Schlagwoerter' Record
  };
}

export interface Notizen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    titel?: string;
    inhalt?: string;
    kategorie?: string; // applookup -> URL zu 'Kategorien' Record
    prioritaet?: LookupValue;
    erstellungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    erinnerung?: string; // Format: YYYY-MM-DD oder ISO String
    erledigt?: boolean;
  };
}

export interface Schlagwoerter {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    schlagwortname?: string;
  };
}

export interface Schnellerfassung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    titel_schnell?: string;
    inhalt_schnell?: string;
    kategorie_schnell?: string; // applookup -> URL zu 'Kategorien' Record
    prioritaet_schnell?: LookupValue;
    erstellungsdatum_schnell?: string; // Format: YYYY-MM-DD oder ISO String
    erinnerung_schnell?: string; // Format: YYYY-MM-DD oder ISO String
    erledigt_schnell?: boolean;
  };
}

export const APP_IDS = {
  KATEGORIEN: '69947a6c9b00d7ae1a66583d',
  NOTIZ_SCHLAGWOERTER_ZUORDNUNG: '69947a73400e119a41d3e876',
  NOTIZEN: '69947a7338cc60e9b64f6817',
  SCHLAGWOERTER: '69947a72b56677beb9f4f1d5',
  SCHNELLERFASSUNG: '69947a74f207e8a598d92878',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  kategorien: {
    farbe: [{ key: "rot", label: "Rot" }, { key: "blau", label: "Blau" }, { key: "gruen", label: "Grün" }, { key: "gelb", label: "Gelb" }, { key: "orange", label: "Orange" }, { key: "lila", label: "Lila" }, { key: "grau", label: "Grau" }],
  },
  notizen: {
    prioritaet: [{ key: "normal", label: "Normal" }, { key: "hoch", label: "Hoch" }, { key: "sehr_hoch", label: "Sehr hoch" }, { key: "niedrig", label: "Niedrig" }],
  },
  schnellerfassung: {
    prioritaet_schnell: [{ key: "niedrig", label: "Niedrig" }, { key: "normal", label: "Normal" }, { key: "hoch", label: "Hoch" }, { key: "sehr_hoch", label: "Sehr hoch" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'kategorien': {
    'kategoriename': 'string/text',
    'beschreibung': 'string/textarea',
    'farbe': 'lookup/select',
  },
  'notiz_schlagwoerter_zuordnung': {
    'notiz': 'applookup/select',
    'schlagwort': 'applookup/select',
  },
  'notizen': {
    'titel': 'string/text',
    'inhalt': 'string/textarea',
    'kategorie': 'applookup/select',
    'prioritaet': 'lookup/select',
    'erstellungsdatum': 'date/date',
    'erinnerung': 'date/datetimeminute',
    'erledigt': 'bool',
  },
  'schlagwoerter': {
    'schlagwortname': 'string/text',
  },
  'schnellerfassung': {
    'titel_schnell': 'string/text',
    'inhalt_schnell': 'string/textarea',
    'kategorie_schnell': 'applookup/select',
    'prioritaet_schnell': 'lookup/select',
    'erstellungsdatum_schnell': 'date/date',
    'erinnerung_schnell': 'date/datetimeminute',
    'erledigt_schnell': 'bool',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateKategorien = StripLookup<Kategorien['fields']>;
export type CreateNotizSchlagwoerterZuordnung = StripLookup<NotizSchlagwoerterZuordnung['fields']>;
export type CreateNotizen = StripLookup<Notizen['fields']>;
export type CreateSchlagwoerter = StripLookup<Schlagwoerter['fields']>;
export type CreateSchnellerfassung = StripLookup<Schnellerfassung['fields']>;