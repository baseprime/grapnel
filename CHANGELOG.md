## Changelog

##### 0.5.8
* Added environmnet option
* Changed option property `usePushState` into `mode`. It was not changeable, so it does not make sense for it to be an 'option'
* Added tests

##### 0.5.7
* Client-side modules no longer assign route event listeners to navigate by default

##### 0.5.6
* Minor changes to allow Server-side routing

##### 0.5.5
* Fragment property clarification as to what it does
The following deprecated items were removed:
* Removed duplicate anchor & hash as it was redundant
* Removed Grapnel().router as it was also redundant

##### 0.5.4
* Fixes issue with Safari >= 6.1.0 where routes load more than once on init (#24)

##### 0.5.3
* Added middleware support
* Increased AMD compatibility
* Fix propagation bug (#23)

##### 0.5.2
* Added event.stopPropagation
* Added `#!` support
* Added tests/gruntfile

##### 0.5.1
* Added history pushState support
* Deprecated router.fragment.defaultHash and router.fragment.reset()

##### 0.4.2
* Moved production file into `/dist` directory
* Added to bower registry

##### 0.4.1
* Removed unnecessary "key/value hooks" features, as it added to the footprint and was an infrequently-used feature
* Added more route support
* Added context support
* Cleaned up events and made them faster
* Backwards compatibility (with some minor tweaks)

##### 0.3.1
* Added support for AMD modules
* Publicized `util` object

##### 0.2.1
* Added routing capabilities
* Cleaned up documentation

##### 0.1.3
* Privatized utility methods: `map` and `trigger`
* Moved `anchor` into its own object
* Internal `forEach` workaround for compatibility issues
* Removed version from library filename

##### 0.1.2
* Increased compatibility
* Fixed bug where events would run twice if there were more than one matches
* Added RegEx support for actions

##### 0.1.1
* Compatibility: Map Array workaround for compatibility issues with archaic browsers
* Added `this.version` property

##### 0.1.0
* Initial release
