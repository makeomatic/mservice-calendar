const { TYPE_TAG, collectionResponse } = require('../utils/response');
const { EVENT_TAGS_TABLE, EVENT_TABLE, EVENT_SPANS_TABLE } = require('../constants');
const partial = require('lodash/partial');
const moment = require('moment');

// cached response
const response = partial(collectionResponse, partial.placeholder, TYPE_TAG);

/**
 * @api {http} <prefix>.event.tags.list Create new event
 * @apiVersion 1.0.0
 * @apiName event.tags.list
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.tags.list.json} apiParam
 * @apiSchema {jsonschema=../../schemas/event.tags.list.response.json} apiResponse
 */
function EventTagsList({ method, params, query }) {
  const input = method === 'get' ? query : params;

  // input params
  const isActive = input.active;

  // TODO: make sure we only request recent tags
  const startTime = input.startTime || new Date().toISOString();
  const endTime = input.endTime || moment().add(1, 'month').toISOString();

  // 1. select available tags
  // 2. filter by any events with the same active tag and return response

  const dbQuery = this.knex
    .select([
      `${EVENT_TAGS_TABLE}.id as id`,
      'eng',
      'icon',
      'cover',
      'priority',
    ])
    .from(EVENT_TAGS_TABLE);

  if (isActive) {
    dbQuery
      .joinRaw(`INNER JOIN ${EVENT_TABLE} on ${EVENT_TAGS_TABLE}.id = ANY(${EVENT_TABLE}.tags)`)
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
