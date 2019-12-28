define({ "api": [
  {
    "type": "http",
    "url": "<prefix>.event.create",
    "title": "Create new event",
    "version": "1.0.0",
    "name": "event_create",
    "group": "Event",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Unknown",
            "optional": false,
            "field": "event",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>Auth token</p>"
          }
        ]
      }
    },
    "filename": "../src/actions/event.create.js",
    "groupTitle": "Event"
  },
  {
    "type": "http",
    "url": "<prefix>.event.list",
    "title": "List events registered in the system",
    "version": "1.0.0",
    "name": "event_list",
    "group": "Event",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "size": "1..",
            "optional": true,
            "field": "owner",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "Date-time",
            "optional": false,
            "field": "startTime",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "Date-time",
            "optional": false,
            "field": "endTime",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "size": "1..",
            "optional": true,
            "field": "tags",
            "description": "<p>undefined undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "size": "1..",
            "optional": true,
            "field": "hosts",
            "description": "<p>undefined undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "meta",
            "description": "<p>undefined</p>"
          }
        ]
      }
    },
    "filename": "../src/actions/event.list.js",
    "groupTitle": "Event"
  },
  {
    "type": "http",
    "url": "<prefix>.event.remove",
    "title": "Remove event",
    "version": "1.0.0",
    "name": "event_remove",
    "group": "Event",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>Event ID</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>Auth token</p>"
          }
        ]
      }
    },
    "filename": "../src/actions/event.remove.js",
    "groupTitle": "Event"
  },
  {
    "type": "http",
    "url": "<prefix>.event.single",
    "title": "Get event by id.",
    "version": "1.0.0",
    "name": "event_single",
    "group": "Event",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>Unique ID of event</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>Auth token</p>"
          }
        ]
      }
    },
    "filename": "../src/actions/event.single.js",
    "groupTitle": "Event"
  },
  {
    "type": "http",
    "url": "<prefix>.event.subs.list",
    "title": "List all subscriptions for an event",
    "version": "1.0.0",
    "name": "event_subs_list",
    "group": "Event",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "filter",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "optional": true,
            "field": "filter.id",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer[]",
            "optional": true,
            "field": "filter.ids",
            "description": "<p>undefined undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "filter.username",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "Date-time",
            "optional": true,
            "field": "filter.startTime",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "Date-time",
            "optional": true,
            "field": "filter.endTime",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>Auth token</p>"
          }
        ]
      }
    },
    "filename": "../src/actions/event.subs.list.js",
    "groupTitle": "Event"
  },
  {
    "type": "http",
    "url": "<prefix>.event.subscribe",
    "title": "Subscribe an user to an event",
    "version": "1.0.0",
    "name": "event_subscribe",
    "group": "Event",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>Auth token</p>"
          }
        ]
      }
    },
    "filename": "../src/actions/event.subscribe.js",
    "groupTitle": "Event"
  },
  {
    "type": "http",
    "url": "<prefix>.event.tags.list",
    "title": "List tags",
    "version": "1.0.0",
    "name": "event_tags_list",
    "group": "Event",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": true,
            "field": "active",
            "defaultValue": "true",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "Date-time",
            "optional": true,
            "field": "startTime",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "Date-time",
            "optional": true,
            "field": "endTime",
            "description": "<p>undefined</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": true,
            "field": "meta",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": true,
            "field": "data",
            "description": "<p>undefined undefined</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "data.id",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "data.type",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": true,
            "field": "data.attributes",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "data.attributes.eng",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Success 200",
            "type": "Uri",
            "optional": true,
            "field": "data.attributes.icon",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Success 200",
            "type": "Uri",
            "optional": true,
            "field": "data.attributes.cover",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": true,
            "field": "data.attributes.priority",
            "defaultValue": "0",
            "description": "<p>undefined</p>"
          }
        ]
      }
    },
    "filename": "../src/actions/event.tags.list.js",
    "groupTitle": "Event"
  },
  {
    "type": "http",
    "url": "<prefix>.event.unsubscribe",
    "title": "Subscribe an user to an event",
    "version": "1.0.0",
    "name": "event_unsubscribe",
    "group": "Event",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>Auth token</p>"
          }
        ]
      }
    },
    "filename": "../src/actions/event.unsubscribe.js",
    "groupTitle": "Event"
  },
  {
    "type": "http",
    "url": "<prefix>.event.update",
    "title": "Update existing event",
    "version": "1.0.0",
    "name": "event_update",
    "group": "Event",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>Auth token</p>"
          },
          {
            "group": "Parameter",
            "type": "Unknown",
            "optional": false,
            "field": "event",
            "description": "<p>undefined</p>"
          }
        ]
      }
    },
    "filename": "../src/actions/event.update.js",
    "groupTitle": "Event"
  },
  {
    "type": "http",
    "url": "<prefix>.event.tags.create",
    "title": "Create new tag",
    "version": "1.0.0",
    "name": "event_tags_create",
    "group": "Tags",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>Auth token</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "tag",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "tag.id",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "tag.eng",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "Uri",
            "optional": false,
            "field": "tag.icon",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "Uri",
            "optional": false,
            "field": "tag.cover",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "optional": true,
            "field": "tag.priority",
            "defaultValue": "0",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "size": "1..",
            "optional": false,
            "field": "tag.section",
            "description": "<p>undefined</p>"
          }
        ]
      }
    },
    "filename": "../src/actions/event.tags.create.js",
    "groupTitle": "Tags"
  },
  {
    "type": "http",
    "url": "<prefix>.event.tags.create",
    "title": "Remove tag",
    "version": "1.0.0",
    "name": "event_tags_delete",
    "group": "Tags",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>Auth token</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "tag",
            "description": "<p>undefined</p>"
          }
        ]
      }
    },
    "filename": "../src/actions/event.tags.delete.js",
    "groupTitle": "Tags"
  },
  {
    "type": "http",
    "url": "<prefix>.event.tags.update",
    "title": "Update existing tag",
    "version": "1.0.0",
    "name": "event_tags_update",
    "group": "Tags",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>Auth token</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "tag",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "tag.id",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "tag.eng",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "Uri",
            "optional": true,
            "field": "tag.icon",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "Uri",
            "optional": true,
            "field": "tag.cover",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "optional": true,
            "field": "tag.priority",
            "defaultValue": "0",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "size": "1..",
            "optional": true,
            "field": "tag.section",
            "description": "<p>undefined</p>"
          }
        ]
      }
    },
    "filename": "../src/actions/event.tags.update.js",
    "groupTitle": "Tags"
  }
] });
