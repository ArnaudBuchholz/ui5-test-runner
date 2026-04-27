export const SORT_BY = [
    {
        label: 'Name',
        key: 'name'
    },
    {
        label: 'Status',
        key: 'status'
    },
    {
        label: 'Duration',
        key: 'duration'
    }
] as const;

export const FILTER_ON_STATUS = [
    {
        label: 'All Statuses',
        key: ''
    },
    {
        label: 'Passed',
        key: 'passed'
    },
    {
        label: 'Failed',
        key: 'failed'
    },
    {
        label: 'Other',
        key: 'other'
    }
] as const;
