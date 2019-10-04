## Modules

<dl>
<dt><a href="#module_helpers/auth">helpers/auth</a></dt>
<dd></dd>
<dt><a href="#module_helpers/Utils">helpers/Utils</a></dt>
<dd></dd>
</dl>

<a name="module_helpers/auth"></a>

## helpers/auth
**Requires**: <code>{@link https://www.npmjs.com/package/bcrypt\|bcrypt}</code>, <code>module:services/DatabaseService</code>  
**Author**: Devon Rojas  
<a name="module_helpers/Utils"></a>

## helpers/Utils
**Author**: Devon Rojas  

* [helpers/Utils](#module_helpers/Utils)
    * [~Utils](#module_helpers/Utils..Utils)
        * [.isString(val)](#module_helpers/Utils..Utils.isString) ⇒ <code>boolean</code>
        * [.isArray(val)](#module_helpers/Utils..Utils.isArray) ⇒ <code>boolean</code>
        * [.isNull(data)](#module_helpers/Utils..Utils.isNull) ⇒ <code>boolean</code>
        * [.isValidObj(keys, obj)](#module_helpers/Utils..Utils.isValidObj) ⇒ <code>boolean</code>
        * [.timeout(ms)](#module_helpers/Utils..Utils.timeout) ⇒ <code>Promise</code>
        * [.asyncForEach(arr, cb)](#module_helpers/Utils..Utils.asyncForEach)
        * [.throttle(calls, rateLimitCount, rateLimitTime)](#module_helpers/Utils..Utils.throttle) ⇒ <code>Array</code>
        * [.fetchGoogleSheet(spreadsheetID)](#module_helpers/Utils..Utils.fetchGoogleSheet) ⇒ <code>Object</code>

<a name="module_helpers/Utils..Utils"></a>

### helpers/Utils~Utils
Class containing utility functions for application.

**Kind**: inner class of [<code>helpers/Utils</code>](#module_helpers/Utils)  

* [~Utils](#module_helpers/Utils..Utils)
    * [.isString(val)](#module_helpers/Utils..Utils.isString) ⇒ <code>boolean</code>
    * [.isArray(val)](#module_helpers/Utils..Utils.isArray) ⇒ <code>boolean</code>
    * [.isNull(data)](#module_helpers/Utils..Utils.isNull) ⇒ <code>boolean</code>
    * [.isValidObj(keys, obj)](#module_helpers/Utils..Utils.isValidObj) ⇒ <code>boolean</code>
    * [.timeout(ms)](#module_helpers/Utils..Utils.timeout) ⇒ <code>Promise</code>
    * [.asyncForEach(arr, cb)](#module_helpers/Utils..Utils.asyncForEach)
    * [.throttle(calls, rateLimitCount, rateLimitTime)](#module_helpers/Utils..Utils.throttle) ⇒ <code>Array</code>
    * [.fetchGoogleSheet(spreadsheetID)](#module_helpers/Utils..Utils.fetchGoogleSheet) ⇒ <code>Object</code>

<a name="module_helpers/Utils..Utils.isString"></a>

#### Utils.isString(val) ⇒ <code>boolean</code>
Checks if a value is a string.

**Kind**: static method of [<code>Utils</code>](#module_helpers/Utils..Utils)  
**Returns**: <code>boolean</code> - Whether or not the value is a string.  

| Param | Type |
| --- | --- |
| val | <code>\*</code> | 

<a name="module_helpers/Utils..Utils.isArray"></a>

#### Utils.isArray(val) ⇒ <code>boolean</code>
Checks if a value is an array.

**Kind**: static method of [<code>Utils</code>](#module_helpers/Utils..Utils)  
**Returns**: <code>boolean</code> - Whether or not the value is an array.  

| Param | Type |
| --- | --- |
| val | <code>\*</code> | 

<a name="module_helpers/Utils..Utils.isNull"></a>

#### Utils.isNull(data) ⇒ <code>boolean</code>
Checks if data is null or contains any null values.

**Kind**: static method of [<code>Utils</code>](#module_helpers/Utils..Utils)  
**Returns**: <code>boolean</code> - Whether or not the data has any null values.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>\*</code> | Data to check nullity for. |

<a name="module_helpers/Utils..Utils.isValidObj"></a>

#### Utils.isValidObj(keys, obj) ⇒ <code>boolean</code>
Checks if an object contains a list of keys and that those key/values are not null or undefined.

**Kind**: static method of [<code>Utils</code>](#module_helpers/Utils..Utils)  
**Returns**: <code>boolean</code> - Whether or not the object is valid  

| Param | Type | Description |
| --- | --- | --- |
| keys | <code>Array</code> | Array of keys to check object against |
| obj | <code>Object</code> | An object to check |

<a name="module_helpers/Utils..Utils.timeout"></a>

#### Utils.timeout(ms) ⇒ <code>Promise</code>
Sets a timeout.

**Kind**: static method of [<code>Utils</code>](#module_helpers/Utils..Utils)  
**Returns**: <code>Promise</code> - A completed Promise after timeout finishes.  

| Param | Type | Description |
| --- | --- | --- |
| ms | <code>number</code> | Amount of time in milliseconds to wait. |

<a name="module_helpers/Utils..Utils.asyncForEach"></a>

#### Utils.asyncForEach(arr, cb)
Asynchronously loops through an array, executing a callback functionfor each element contained within array.

**Kind**: static method of [<code>Utils</code>](#module_helpers/Utils..Utils)  

| Param | Type | Description |
| --- | --- | --- |
| arr | <code>Array</code> | Array to asynchronously loop through |
| cb | <code>function</code> | Callback function to execute for each array element. |

<a name="module_helpers/Utils..Utils.throttle"></a>

#### Utils.throttle(calls, rateLimitCount, rateLimitTime) ⇒ <code>Array</code>
Asynchronously executes callback functions per the rateLimitCount and rateLimitTimevalues passed in to the function.

**Kind**: static method of [<code>Utils</code>](#module_helpers/Utils..Utils)  
**Returns**: <code>Array</code> - Reponse data from all calls.  

| Param | Type | Description |
| --- | --- | --- |
| calls | <code>Array</code> | Array of calls to execute |
| rateLimitCount | <code>number</code> | Amount of calls to make sychronously |
| rateLimitTime | <code>number</code> | Amount of time to wait between batches |

<a name="module_helpers/Utils..Utils.fetchGoogleSheet"></a>

#### Utils.fetchGoogleSheet(spreadsheetID) ⇒ <code>Object</code>
Pulls JSON data of a Google Spreadsheet and parses it into a object.

**Kind**: static method of [<code>Utils</code>](#module_helpers/Utils..Utils)  
**Returns**: <code>Object</code> - The parsed JSON object  

| Param | Type | Description |
| --- | --- | --- |
| spreadsheetID | <code>string</code> | A Google Spreadsheet ID |

