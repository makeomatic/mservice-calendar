// holds references to table names
module.exports = {
  EVENT_TYPE: 'event',
  EVENT_TABLE: 'events',
  EVENT_SPANS_TABLE: 'events_spans',
  EVENT_TAGS_TABLE: 'events_tags',
  EVENT_SUBS_TABLE: 'events_subs',
  EVENT_FIELDS: [
    'owner',
    'rrule',
    'title',
    'description',
    'duration',
    'hosts',
    'subscribers',
    'notifications',
    'picture',
    'link',
    'tags',
    'tz',
  ],
};
