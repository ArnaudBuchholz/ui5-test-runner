export const FIVE_SECONDS = 5000 as const;
export const FIVE_MINUTES = 300_000 as const;

export const RELATIVE_TIMERANGE_SETTINGS = [
  {
    label: '5 minutes',
    key: FIVE_MINUTES
  },
  {
    label: '15 minutes',
    key: 900_000
  },
  {
    label: '30 minutes',
    key: 1_800_000
  },
  {
    label: '1 hour',
    key: 3_600_000
  },
  {
    label: '3 hours',
    key: 10_800_000
  }
] as const;

export const AUTO_REFRESH_SETTINGS = [
  {
    label: '5 seconds',
    key: FIVE_SECONDS
  },
  {
    label: '10 seconds',
    key: 10_000
  },
  {
    label: '30 seconds',
    key: 30_000
  },
  {
    label: '60 seconds',
    key: 60_000
  }
] as const;
