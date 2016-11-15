[![Code Climate](https://codeclimate.com/github/makeomatic/mservice-calendar/badges/gpa.svg)](https://codeclimate.com/github/makeomatic/mservice-calendar)
[![Build Status](https://semaphoreci.com/api/v1/makeomatic/mservice-calendar/branches/master/shields_badge.svg)](https://semaphoreci.com/makeomatic/mservice-calendar)
[![codecov](https://codecov.io/gh/makeomatic/mservice-calendar/branch/master/graph/badge.svg)](https://codecov.io/gh/makeomatic/mservice-calendar)

# What we can do:

* create recurring event using RRule, multi-tenancy support
* update that event, including meta & period
* remove an event
* list events by tenant within a given time frame, including filtering by tags & hosts/participants

# Roadmap

- [ ] subscribe to events
- [ ] unsubscribe from event
- [ ] send "notification" to subscribers when event changes
- [ ] support pagination by events or add max time frame to prevent extreme database load
