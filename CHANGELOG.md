## [6.0.11](https://github.com/makeomatic/mservice-calendar/compare/v6.0.10...v6.0.11) (2019-12-28)


### Bug Fixes

* update deps ([c913078](https://github.com/makeomatic/mservice-calendar/commit/c913078))
* **deps:** bump handlebars from 4.1.2 to 4.5.3 ([#53](https://github.com/makeomatic/mservice-calendar/issues/53)) ([f52d523](https://github.com/makeomatic/mservice-calendar/commit/f52d523))

## [6.0.10](https://github.com/makeomatic/mservice-calendar/compare/v6.0.9...v6.0.10) (2019-03-29)


### Bug Fixes

* **filter-events:** adapt code for new multiple stationGroups ([#50](https://github.com/makeomatic/mservice-calendar/issues/50)) ([13bf0a2](https://github.com/makeomatic/mservice-calendar/commit/13bf0a2))

## [6.0.9](https://github.com/makeomatic/mservice-calendar/compare/v6.0.8...v6.0.9) (2019-03-28)


### Bug Fixes

* **rrule:** correctly set no-until events ([#49](https://github.com/makeomatic/mservice-calendar/issues/49)) ([66a7a0f](https://github.com/makeomatic/mservice-calendar/commit/66a7a0f))

## [6.0.8](https://github.com/makeomatic/mservice-calendar/compare/v6.0.7...v6.0.8) (2019-03-07)


### Bug Fixes

* update deps & audit log ([c02e01c](https://github.com/makeomatic/mservice-calendar/commit/c02e01c))

## [6.0.7](https://github.com/makeomatic/mservice-calendar/compare/v6.0.6...v6.0.7) (2019-03-06)


### Bug Fixes

* upgrade node ([e04921e](https://github.com/makeomatic/mservice-calendar/commit/e04921e))

## [6.0.6](https://github.com/makeomatic/mservice-calendar/compare/v6.0.5...v6.0.6) (2019-03-03)


### Bug Fixes

* **events:** deterministic start_time order ([#48](https://github.com/makeomatic/mservice-calendar/issues/48)) ([06dd59a](https://github.com/makeomatic/mservice-calendar/commit/06dd59a))
* **single:** parsing rrule for legacy timezones ([#46](https://github.com/makeomatic/mservice-calendar/issues/46)) ([da51830](https://github.com/makeomatic/mservice-calendar/commit/da51830))
* **tests:** uxtend expired test events ([#47](https://github.com/makeomatic/mservice-calendar/issues/47)) ([9815425](https://github.com/makeomatic/mservice-calendar/commit/9815425))

## [6.0.5](https://github.com/makeomatic/mservice-calendar/compare/v6.0.4...v6.0.5) (2018-12-13)


### Bug Fixes

* false positive condition for 0 ([#45](https://github.com/makeomatic/mservice-calendar/issues/45)) ([e8d16de](https://github.com/makeomatic/mservice-calendar/commit/e8d16de))

## [6.0.4](https://github.com/makeomatic/mservice-calendar/compare/v6.0.3...v6.0.4) (2018-12-13)


### Bug Fixes

* handle rrules with byhour with simplified algo ([#44](https://github.com/makeomatic/mservice-calendar/issues/44)) ([0c1207e](https://github.com/makeomatic/mservice-calendar/commit/0c1207e))

## [6.0.3](https://github.com/makeomatic/mservice-calendar/compare/v6.0.2...v6.0.3) (2018-11-12)


### Bug Fixes

* prev day start ([cde48ce](https://github.com/makeomatic/mservice-calendar/commit/cde48ce))

## [6.0.2](https://github.com/makeomatic/mservice-calendar/compare/v6.0.1...v6.0.2) (2018-11-10)


### Bug Fixes

* set version number ([1f4fde4](https://github.com/makeomatic/mservice-calendar/commit/1f4fde4))

## [6.0.1](https://github.com/makeomatic/mservice-calendar/compare/v6.0.0...v6.0.1) (2018-11-10)


### Bug Fixes

* events daylight ([#43](https://github.com/makeomatic/mservice-calendar/issues/43)) ([ee51ab7](https://github.com/makeomatic/mservice-calendar/commit/ee51ab7))

# [6.0.0](https://github.com/makeomatic/mservice-calendar/compare/v5.0.1...v6.0.0) (2018-11-10)


### Features

* node 10, support dynamic timezones ([#42](https://github.com/makeomatic/mservice-calendar/issues/42)) ([1512dbf](https://github.com/makeomatic/mservice-calendar/commit/1512dbf))


### BREAKING CHANGES

* starts using newest @microfleet/core, introduces configuration changes & requires timezone to be specified during event update
