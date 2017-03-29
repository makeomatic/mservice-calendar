const { TYPE_TAG, collectionResponse } = require('../utils/response');
const { EVENT_TAGS_TABLE, EVENT_TABLE, EVENT_SPANS_TABLE } = require('../constants');
const partial = require('lodash/partial');
const moment = require('moment');

// cached response
const response = partial(collectionResponse, partial.placeholder, TYPE_TAG);

/**
 * @api {http} <prefix>.event.tags.list List tags
 * @apiVersion 1.0.0
 * @apiName event.tags.list
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.tags.list.json} apiParam
 * @apiSchema {jsonschema=../../schemas/event.tags.list.response.json} apiSuccess
 */
function EventTagsList({ method, params, query }) {
  const input = method === 'get' ? query : params;

  // input params
  const isActive = input.active;
  const startTime = input.startTime || new Date().toISOString();
  const endTime = input.endTime || moment().add(2, 'month').toISOString();

  // TODO: assert that we do not request something 1 year from now
  // 1. select available tags
  // 2. filter by any events with the same active tag and return response

  const dbQuery = this.knex
    .select([
      `${EVENT_TAGS_TABLE}.id as id`,
      'eng',
      'icon',
      'cover',
      'priority',
      'section',
    ])
    .from(EVENT_TAGS_TABLE);

  if (isActive) {
    dbQuery
      .joinRaw(`INNER JOIN ${EVENT_TABLE} on ${EVENT_TABLE}.tags @> ARRAY[${EVENT_TAGS_TABLE}.id]`)
      .joinRaw(`INNER JOIN ${EVENT_SPANS_TABLE} on (`
        + `${EVENT_TABLE}.id = ${EVENT_SPANS_TABLE}.event_id AND `
        + `${EVENT_SPANS_TABLE}.period && tsrange(TIMESTAMP '${startTime}', TIMESTAMP '${endTime}')`
        + ')'
      )
      .groupByRaw(`${EVENT_TAGS_TABLE}.id`);
  }

  dbQuery.orderBy('priority', 'desc');

  // tag list response
  return dbQuery.then(response);
}

EventTagsList.schema = 'event.tags.list';
EventTagsList.transports = ['http'];

module.exports = EventTagsList;
