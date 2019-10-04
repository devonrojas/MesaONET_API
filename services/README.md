## Modules

<dl>
<dt><a href="#module_services/CareerOneStopService">services/CareerOneStopService</a></dt>
<dd></dd>
<dt><a href="#module_services/DatabaseService">services/DatabaseService</a></dt>
<dd></dd>
<dt><a href="#module_services/DataExportService">services/DataExportService</a></dt>
<dd></dd>
<dt><a href="#module_services/GoogleMapsService">services/GoogleMapsService</a></dt>
<dd></dd>
<dt><a href="#module_services/ONETService">services/ONETService</a></dt>
<dd></dd>
</dl>

<a name="module_services/CareerOneStopService"></a>

## services/CareerOneStopService
**Requires**: <code>{@link https://www.npmjs.com/package/request-promise\| request-promise}</code>  
**Author**: Devon Rojas  

* [services/CareerOneStopService](#module_services/CareerOneStopService)
    * [.fetch(code, [location])](#module_services/CareerOneStopService.fetch) ⇒ <code>object</code>
    * [.fetchJobDetail(code, [location], [radius], [days], [tries])](#module_services/CareerOneStopService.fetchJobDetail) ⇒ <code>object</code>

<a name="module_services/CareerOneStopService.fetch"></a>

### services/CareerOneStopService.fetch(code, [location]) ⇒ <code>object</code>
Retrieves O*NET occupation data from CareerOneStop API.

**Kind**: static method of [<code>services/CareerOneStopService</code>](#module_services/CareerOneStopService)  
**Returns**: <code>object</code> - Occupation data.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| code | <code>string</code> |  | O*NET Occupation code. |
| [location] | <code>string</code> | <code>&quot;&#x27;US&#x27;&quot;</code> | Location to query (state or zip code). |

<a name="module_services/CareerOneStopService.fetchJobDetail"></a>

### services/CareerOneStopService.fetchJobDetail(code, [location], [radius], [days], [tries]) ⇒ <code>object</code>
Retrieves job posting data for an O*NET Occupation code.

**Kind**: static method of [<code>services/CareerOneStopService</code>](#module_services/CareerOneStopService)  
**Returns**: <code>object</code> - Job posing data for occupation.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| code | <code>string</code> |  | O*NET Occupation code to fetch data for. |
| [location] | <code>string</code> | <code>&quot;\&quot;US\&quot;&quot;</code> | Location to query. |
| [radius] | <code>number</code> | <code>25</code> | Radius from location to search. |
| [days] | <code>number</code> | <code>30</code> | Length to retrieve data back to. |
| [tries] | <code>number</code> | <code>0</code> | Amount of tries of function (error-handling purposes) |

<a name="module_services/DatabaseService"></a>

## services/DatabaseService
**Requires**: <code>{@link https://www.npmjs.com/package/mongodb\|mongodb}</code>, <code>module:helpers/Utils</code>  
**Author**: Devon Rojas  

* [services/DatabaseService](#module_services/DatabaseService)
    * [~addToCollection(collectionName, data, writeOperation)](#module_services/DatabaseService..addToCollection) ⇒ <code>void</code>
    * [~addMultipleToCollection(collectionName, data, atomicOps)](#module_services/DatabaseService..addMultipleToCollection) ⇒ <code>void</code>
    * [~queryCollection(collectionName, query)](#module_services/DatabaseService..queryCollection) ⇒ <code>void</code>
    * [~deleteOne(collectionName, query)](#module_services/DatabaseService..deleteOne) ⇒ <code>void</code>
    * [~deleteMany(collectionName, query)](#module_services/DatabaseService..deleteMany) ⇒ <code>void</code>
    * [~updateMany(collectionName, query)](#module_services/DatabaseService..updateMany) ⇒ <code>void</code>
    * [~updateOne(collectionName, query)](#module_services/DatabaseService..updateOne)
    * [~cleanCollections()](#module_services/DatabaseService..cleanCollections) ⇒ <code>void</code>

<a name="module_services/DatabaseService..addToCollection"></a>

### services/DatabaseService~addToCollection(collectionName, data, writeOperation) ⇒ <code>void</code>
Adds a single document to database collection.

**Kind**: inner method of [<code>services/DatabaseService</code>](#module_services/DatabaseService)  

| Param | Type | Description |
| --- | --- | --- |
| collectionName | <code>string</code> | Collection in database to write to. |
| data | <code>Object</code> | Data object to write. |
| writeOperation | <code>function</code> | Write operation function to specify data mapping. |

<a name="module_services/DatabaseService..addMultipleToCollection"></a>

### services/DatabaseService~addMultipleToCollection(collectionName, data, atomicOps) ⇒ <code>void</code>
Adds multiple documents to a collection.

**Kind**: inner method of [<code>services/DatabaseService</code>](#module_services/DatabaseService)  

| Param | Type | Description |
| --- | --- | --- |
| collectionName | <code>string</code> | Collection in database to write to. |
| data | <code>Object</code> | Data object to write. |
| atomicOps | <code>function</code> | Atomic write operation function to specify data mapping. |

<a name="module_services/DatabaseService..queryCollection"></a>

### services/DatabaseService~queryCollection(collectionName, query) ⇒ <code>void</code>
Queries a collection for specific condition(s).

**Kind**: inner method of [<code>services/DatabaseService</code>](#module_services/DatabaseService)  

| Param | Type | Description |
| --- | --- | --- |
| collectionName | <code>string</code> | Collection in database to query. |
| query | <code>Object</code> | Query parameters. |

<a name="module_services/DatabaseService..deleteOne"></a>

### services/DatabaseService~deleteOne(collectionName, query) ⇒ <code>void</code>
Deletes a single document from a collection.

**Kind**: inner method of [<code>services/DatabaseService</code>](#module_services/DatabaseService)  

| Param | Type | Description |
| --- | --- | --- |
| collectionName | <code>string</code> | Collection in database to delete document from. |
| query | <code>Object</code> | Query parameter to find document to delete. |

<a name="module_services/DatabaseService..deleteMany"></a>

### services/DatabaseService~deleteMany(collectionName, query) ⇒ <code>void</code>
Deletes multiple documents from a collection.

**Kind**: inner method of [<code>services/DatabaseService</code>](#module_services/DatabaseService)  

| Param | Type | Description |
| --- | --- | --- |
| collectionName | <code>string</code> | Collection in database to delete documents from. |
| query | <code>Object</code> | Query paramater(s) to find documents to delete. |

<a name="module_services/DatabaseService..updateMany"></a>

### services/DatabaseService~updateMany(collectionName, query) ⇒ <code>void</code>
Updates multiple documents in a collection.

**Kind**: inner method of [<code>services/DatabaseService</code>](#module_services/DatabaseService)  

| Param | Type | Description |
| --- | --- | --- |
| collectionName | <code>string</code> | Collection in database to update documents in. |
| query | <code>Object</code> | One or more query conditions to specify update operation. |

<a name="module_services/DatabaseService..updateOne"></a>

### services/DatabaseService~updateOne(collectionName, query)
Updates a single document in a collection.

**Kind**: inner method of [<code>services/DatabaseService</code>](#module_services/DatabaseService)  

| Param | Type | Description |
| --- | --- | --- |
| collectionName | <code>string</code> | Collection in database to update documents in. |
| query | <code>Object</code> | One of more query conditions to specify update operation. |

<a name="module_services/DatabaseService..cleanCollections"></a>

### services/DatabaseService~cleanCollections() ⇒ <code>void</code>
Scans both the *careers* and *job_tracking* collections in the database and removes any careers that do not appear in both collections.

**Kind**: inner method of [<code>services/DatabaseService</code>](#module_services/DatabaseService)  
<a name="module_services/DataExportService"></a>

## services/DataExportService
**Requires**: <code>module:models/Career</code>, <code>module:helpers/Utils</code>  
**Author**: Devon Rojas  

* [services/DataExportService](#module_services/DataExportService)
    * ~~[~DataExportService](#module_services/DataExportService..DataExportService)~~
        * [new DataExportService(params)](#new_module_services/DataExportService..DataExportService_new)
        * [.buildData(arr, [data])](#module_services/DataExportService..DataExportService+buildData) ⇒ <code>Array</code>

<a name="module_services/DataExportService..DataExportService"></a>

### ~~services/DataExportService~DataExportService~~
***Deprecated***

**Kind**: inner class of [<code>services/DataExportService</code>](#module_services/DataExportService)  

* ~~[~DataExportService](#module_services/DataExportService..DataExportService)~~
    * [new DataExportService(params)](#new_module_services/DataExportService..DataExportService_new)
    * [.buildData(arr, [data])](#module_services/DataExportService..DataExportService+buildData) ⇒ <code>Array</code>

<a name="new_module_services/DataExportService..DataExportService_new"></a>

#### new DataExportService(params)
Builds DataExportService object.


| Param | Type |
| --- | --- |
| params | <code>Array</code> | 

<a name="module_services/DataExportService..DataExportService+buildData"></a>

#### dataExportService.buildData(arr, [data]) ⇒ <code>Array</code>
Generates occupation data from an array of O*NET occupation codes.

**Kind**: instance method of [<code>DataExportService</code>](#module_services/DataExportService..DataExportService)  
**Returns**: <code>Array</code> - Complete array of [Careers](module:models/Career).  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| arr | <code>Array</code> |  | Array of codes to pull data from. |
| [data] | <code>Array</code> | <code>[]</code> | Array to add retrieved data to. |

<a name="module_services/GoogleMapsService"></a>

## services/GoogleMapsService
**Requires**: <code>{@link https://www.npmjs.com/package/request-promise\| request-promise}</code>  
**Author**: Devon Rojas  

* [services/GoogleMapsService](#module_services/GoogleMapsService)
    * [~findLocation(location)](#module_services/GoogleMapsService..findLocation) ⇒ <code>Array</code>
    * [~getCounty(location)](#module_services/GoogleMapsService..getCounty) ⇒ <code>object</code>
    * [~getState(location)](#module_services/GoogleMapsService..getState) ⇒ <code>object</code>
    * [~_fetch(location)](#module_services/GoogleMapsService.._fetch) ⇒ <code>object</code>

<a name="module_services/GoogleMapsService..findLocation"></a>

### services/GoogleMapsService~findLocation(location) ⇒ <code>Array</code>
Retrieves zip code, county, state, and country location components from a keyword.

**Kind**: inner method of [<code>services/GoogleMapsService</code>](#module_services/GoogleMapsService)  
**Returns**: <code>Array</code> - Location components.  

| Param | Type | Description |
| --- | --- | --- |
| location | <code>string</code> | Location to reverse lookup. |

<a name="module_services/GoogleMapsService..getCounty"></a>

### services/GoogleMapsService~getCounty(location) ⇒ <code>object</code>
Retrives county component from a keyword.

**Kind**: inner method of [<code>services/GoogleMapsService</code>](#module_services/GoogleMapsService)  
**Returns**: <code>object</code> - County location data.  

| Param | Type | Description |
| --- | --- | --- |
| location | <code>string</code> | Location to reverse lookup |

<a name="module_services/GoogleMapsService..getState"></a>

### services/GoogleMapsService~getState(location) ⇒ <code>object</code>
Retrieves state component from a keyword.

**Kind**: inner method of [<code>services/GoogleMapsService</code>](#module_services/GoogleMapsService)  
**Returns**: <code>object</code> - State location data  

| Param | Type | Description |
| --- | --- | --- |
| location | <code>string</code> | Location to reverse lookup |

<a name="module_services/GoogleMapsService.._fetch"></a>

### services/GoogleMapsService~\_fetch(location) ⇒ <code>object</code>
Fetches data from Google Maps Geocoding API.

**Kind**: inner method of [<code>services/GoogleMapsService</code>](#module_services/GoogleMapsService)  
**Returns**: <code>object</code> - Location data.  
**See**: [Google Maps Geocoding API](https://developers.google.com/maps/documentation/geocoding)  

| Param | Type |
| --- | --- |
| location | <code>string</code> | 

<a name="module_services/ONETService"></a>

## services/ONETService
**Requires**: <code>{@link https://www.npmjs.com/package/request-promise\| request-promise}</code>  
**Author**: Devon Rojas  

* [services/ONETService](#module_services/ONETService)
    * [.getCareerTechnicalSkills(code)](#module_services/ONETService.getCareerTechnicalSkills) ⇒ <code>null</code> \| <code>Array</code>
    * [.getCareerTechnicalSkills(code)](#module_services/ONETService.getCareerTechnicalSkills) ⇒ <code>null</code> \| <code>String</code>
    * [.fetch(url)](#module_services/ONETService.fetch)

<a name="module_services/ONETService.getCareerTechnicalSkills"></a>

### services/ONETService.getCareerTechnicalSkills(code) ⇒ <code>null</code> \| <code>Array</code>
Retrieves technical skills associated with an O*NETOccupation code.

**Kind**: static method of [<code>services/ONETService</code>](#module_services/ONETService)  
**Returns**: <code>null</code> \| <code>Array</code> - Array of technical skills.  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>string</code> | O*NET code to query. |

<a name="module_services/ONETService.getCareerTechnicalSkills"></a>

### services/ONETService.getCareerTechnicalSkills(code) ⇒ <code>null</code> \| <code>String</code>
Retrieves RIASEC code associated with an O*NETOccupation code.

**Kind**: static method of [<code>services/ONETService</code>](#module_services/ONETService)  
**Returns**: <code>null</code> \| <code>String</code> - RIASEC code.  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>string</code> | O*NET code to query. |

<a name="module_services/ONETService.fetch"></a>

### services/ONETService.fetch(url)
**Kind**: static method of [<code>services/ONETService</code>](#module_services/ONETService)  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | URL to send a request to. |

