## Modules

<dl>
<dt><a href="#module_routes/admin">routes/admin</a></dt>
<dd><p>Handles /admin route requests.</p>
</dd>
<dt><a href="#module_routes/career">routes/career</a></dt>
<dd><p>Handles /career route requests.</p>
</dd>
<dt><a href="#module_routes/program">routes/program</a></dt>
<dd><p>Handles /program route requests.</p>
</dd>
</dl>

<a name="module_routes/admin"></a>

## routes/admin
Handles /admin route requests.

**Requires**: <code>{@link https://www.npmjs.com/package/express\| express}</code>, <code>{@link https://www.npmjs.com/package/request-promise\|request-promise}</code>, <code>module:services/DatabaseService</code>, <code>module:services/DataExportService</code>, <code>module:models/JobTracker</code>, <code>module:models/Throttler</code>, <code>module:models/AcademicProgram</code>, <code>module:helpers/Utils</code>  
**Author**: Devon Rojas  

* [routes/admin](#module_routes/admin)
    * [~adminRouter](#module_routes/admin..adminRouter) : <code>object</code>
        * [.GET/update-job-tracking()](#module_routes/admin..adminRouter.GET/update-job-tracking)
        * [.GET/build-programs()](#module_routes/admin..adminRouter.GET/build-programs)
        * ~~[.GET/generate()](#module_routes/admin..adminRouter.GET/generate)~~
        * ~~[.GET/export-careers()](#module_routes/admin..adminRouter.GET/export-careers)~~
        * ~~[.GET/export-programs()](#module_routes/admin..adminRouter.GET/export-programs)~~

<a name="module_routes/admin..adminRouter"></a>

### routes/admin~adminRouter : <code>object</code>
**Kind**: inner namespace of [<code>routes/admin</code>](#module_routes/admin)  

* [~adminRouter](#module_routes/admin..adminRouter) : <code>object</code>
    * [.GET/update-job-tracking()](#module_routes/admin..adminRouter.GET/update-job-tracking)
    * [.GET/build-programs()](#module_routes/admin..adminRouter.GET/build-programs)
    * ~~[.GET/generate()](#module_routes/admin..adminRouter.GET/generate)~~
    * ~~[.GET/export-careers()](#module_routes/admin..adminRouter.GET/export-careers)~~
    * ~~[.GET/export-programs()](#module_routes/admin..adminRouter.GET/export-programs)~~

<a name="module_routes/admin..adminRouter.GET/update-job-tracking"></a>

#### adminRouter.GET/update-job-tracking()
Runs a program to update all job tracking information in database if necessary.

**Kind**: static method of [<code>adminRouter</code>](#module_routes/admin..adminRouter)  
**See**

- [DatabaseService](module:services/DatabaseService)
- [Throttler](module:models/Throttler)

<a name="module_routes/admin..adminRouter.GET/build-programs"></a>

#### adminRouter.GET/build-programs()
Builds program data out of [Mesa Academic Programs](../misc/mesa_academic_programs_new.json) and writes any new data to database. _Note_: This function requires a properly configured JSON fileto execute. See current academic programs JSON file in /misc folder for example.

**Kind**: static method of [<code>adminRouter</code>](#module_routes/admin..adminRouter)  
**See**

- [AcademicProgram](module:models/AcademicProgram)
- [Throttler](module:models/Throttler)

<a name="module_routes/admin..adminRouter.GET/generate"></a>

#### ~~adminRouter.GET/generate()~~
***Deprecated***

**Kind**: static method of [<code>adminRouter</code>](#module_routes/admin..adminRouter)  
<a name="module_routes/admin..adminRouter.GET/export-careers"></a>

#### ~~adminRouter.GET/export-careers()~~
***Deprecated***

**Kind**: static method of [<code>adminRouter</code>](#module_routes/admin..adminRouter)  
<a name="module_routes/admin..adminRouter.GET/export-programs"></a>

#### ~~adminRouter.GET/export-programs()~~
***Deprecated***

**Kind**: static method of [<code>adminRouter</code>](#module_routes/admin..adminRouter)  
<a name="module_routes/career"></a>

## routes/career
Handles /career route requests.

**Requires**: <code>{@link https://www.npmjs.com/package/express\| express}</code>, <code>{@link https://www.npmjs.com/package/request-promise\| request-promise}</code>, <code>module:services/DatabaseService</code>, <code>module:services/CareerOneStopService</code>  
**Author**: Devon Rojas  

* [routes/career](#module_routes/career)
    * [~careerRouter](#module_routes/career..careerRouter) : <code>object</code>
        * [.GET/()](#module_routes/career..careerRouter.GET/)
        * [.GET/:code()](#module_routes/career..careerRouter.GET/_code)
        * [.GET/career/:code/:location/:radius(code, location, [radius])](#module_routes/career..careerRouter.GET/career/_code/_location/_radius)

<a name="module_routes/career..careerRouter"></a>

### routes/career~careerRouter : <code>object</code>
**Kind**: inner namespace of [<code>routes/career</code>](#module_routes/career)  

* [~careerRouter](#module_routes/career..careerRouter) : <code>object</code>
    * [.GET/()](#module_routes/career..careerRouter.GET/)
    * [.GET/:code()](#module_routes/career..careerRouter.GET/_code)
    * [.GET/career/:code/:location/:radius(code, location, [radius])](#module_routes/career..careerRouter.GET/career/_code/_location/_radius)

<a name="module_routes/career..careerRouter.GET/"></a>

#### careerRouter.GET/()
Retrieves all [Careers](module:models/Career) in database.

**Kind**: static method of [<code>careerRouter</code>](#module_routes/career..careerRouter)  
<a name="module_routes/career..careerRouter.GET/_code"></a>

#### careerRouter.GET/:code()
Retrieves career data based on query flags passed into request.Response will always provide career code and title.

**Kind**: static method of [<code>careerRouter</code>](#module_routes/career..careerRouter)  
**Example**  
```js
// Returns the career's description and riasec code.// /career/15-1134?description=true&riasec_code=true
```
<a name="module_routes/career..careerRouter.GET/career/_code/_location/_radius"></a>

#### careerRouter.GET/career/:code/:location/:radius(code, location, [radius])
Retrieves occupation information associated with a careercode, location, and radius.

**Kind**: static method of [<code>careerRouter</code>](#module_routes/career..careerRouter)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| code | <code>string</code> |  | Occupation code to look up |
| location | <code>string</code> |  | Location to retrieve occupation data around |
| [radius] | <code>number</code> | <code>25</code> | Distance from location to search |

<a name="module_routes/program"></a>

## routes/program
Handles /program route requests.

**Requires**: <code>{@link https://www.npmjs.com/package/express\| express}</code>, <code>{@link https://www.npmjs.com/package/request-promise\|request-promsie}</code>, <code>module:services/DatabaseService</code>, <code>module:models/AcademicProgram</code>, <code>module:models/Career</code>, <code>module:helpers/Utils</code>  
**Author**: Devon Rojas  

* [routes/program](#module_routes/program)
    * [~programRouter](#module_routes/program..programRouter) : <code>object</code>
        * [.GET/bulk(codes)](#module_routes/program..programRouter.GET/bulk)
        * [.POST/program()](#module_routes/program..programRouter.POST/program)
        * [.GET/()](#module_routes/program..programRouter.GET/)
        * [.GET/program/:code(code)](#module_routes/program..programRouter.GET/program/_code)
        * [.PUT/program/:code(code)](#module_routes/program..programRouter.PUT/program/_code)
        * [.DELETE/program/:code(code)](#module_routes/program..programRouter.DELETE/program/_code)
        * [.POST/program/:code/career/:soc_code(code, soc_code)](#module_routes/program..programRouter.POST/program/_code/career/_soc_code)
        * [.DELETE/program/:code/career/:soc_code(code, soc_code)](#module_routes/program..programRouter.DELETE/program/_code/career/_soc_code)
        * [.GET/program/:code/title(code)](#module_routes/program..programRouter.GET/program/_code/title)

<a name="module_routes/program..programRouter"></a>

### routes/program~programRouter : <code>object</code>
**Kind**: inner namespace of [<code>routes/program</code>](#module_routes/program)  

* [~programRouter](#module_routes/program..programRouter) : <code>object</code>
    * [.GET/bulk(codes)](#module_routes/program..programRouter.GET/bulk)
    * [.POST/program()](#module_routes/program..programRouter.POST/program)
    * [.GET/()](#module_routes/program..programRouter.GET/)
    * [.GET/program/:code(code)](#module_routes/program..programRouter.GET/program/_code)
    * [.PUT/program/:code(code)](#module_routes/program..programRouter.PUT/program/_code)
    * [.DELETE/program/:code(code)](#module_routes/program..programRouter.DELETE/program/_code)
    * [.POST/program/:code/career/:soc_code(code, soc_code)](#module_routes/program..programRouter.POST/program/_code/career/_soc_code)
    * [.DELETE/program/:code/career/:soc_code(code, soc_code)](#module_routes/program..programRouter.DELETE/program/_code/career/_soc_code)
    * [.GET/program/:code/title(code)](#module_routes/program..programRouter.GET/program/_code/title)

<a name="module_routes/program..programRouter.GET/bulk"></a>

#### programRouter.GET/bulk(codes)
Retrieves multiple [AcademicPrograms](module:models/AcademicProgram) fromdatabase and sends back all of their program data.

**Kind**: static method of [<code>programRouter</code>](#module_routes/program..programRouter)  
**See**

- [DatabaseService](module:services/DatabaseService)
- [Utils](module:helpers/Utils)


| Param | Type | Description |
| --- | --- | --- |
| codes | <code>Array</code> | An array of program codes to fetch information for. |

**Example**  
```js
// GET/program/bulk?codes=1&codes=2&... 
```
<a name="module_routes/program..programRouter.POST/program"></a>

#### programRouter.POST/program()
Adds a new [AcademicProgram](module:models/AcademicProgram) to database.Checks to make sure program doesn't already exist in database. If it isindeed new, then the relevant occupations and their data for the program are generated. All occupations pulled for this program are checkedagainst the job_tracking collection in the database to see if any new occupations have popped up. Any new occupations have their jobtracking data pulled for zip code 92111. Additionally, theiroccupation data is added into the careers collection. If any of theoccupations have invalid/missing data, all instances of the occupationin the database removed, so as to not cause any client-side errors.Once all valid _new_ careers have been added to the database, alloccupations associated with the program have the program's title, urland degree types added to its relevant_programs property.

**Kind**: static method of [<code>programRouter</code>](#module_routes/program..programRouter)  
**See**

- [DatabaseService](module:services/DatabaseService)
- [Utils](module:helpers/Utils)

<a name="module_routes/program..programRouter.GET/"></a>

#### programRouter.GET/()
Retrieves all [AcademicPrograms](module:models/AcademicProgram) from database and sends back their titles and codes.

**Kind**: static method of [<code>programRouter</code>](#module_routes/program..programRouter)  
**See**: [DatabaseService](module:services/DatabaseService)  
<a name="module_routes/program..programRouter.GET/program/_code"></a>

#### programRouter.GET/program/:code(code)
Retrieves [AcademicProgram](module:models/AcademicProgram) from databaseusing the program code.

**Kind**: static method of [<code>programRouter</code>](#module_routes/program..programRouter)  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>number</code> | Program code to look up |

<a name="module_routes/program..programRouter.PUT/program/_code"></a>

#### programRouter.PUT/program/:code(code)
Updates a program

**Kind**: static method of [<code>programRouter</code>](#module_routes/program..programRouter)  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>number</code> | Program code to update |

<a name="module_routes/program..programRouter.DELETE/program/_code"></a>

#### programRouter.DELETE/program/:code(code)
Deletes a program

**Kind**: static method of [<code>programRouter</code>](#module_routes/program..programRouter)  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>number</code> | Program code to delete |

<a name="module_routes/program..programRouter.POST/program/_code/career/_soc_code"></a>

#### programRouter.POST/program/:code/career/:soc\_code(code, soc_code)
Adds a career to a program

**Kind**: static method of [<code>programRouter</code>](#module_routes/program..programRouter)  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>number</code> | Program code to look up |
| soc_code | <code>string</code> | Career code to add to program |

<a name="module_routes/program..programRouter.DELETE/program/_code/career/_soc_code"></a>

#### programRouter.DELETE/program/:code/career/:soc\_code(code, soc_code)
Deletes a career from a program

**Kind**: static method of [<code>programRouter</code>](#module_routes/program..programRouter)  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>number</code> | Program code to look up |
| soc_code | <code>string</code> | Career code to delete from program |

<a name="module_routes/program..programRouter.GET/program/_code/title"></a>

#### programRouter.GET/program/:code/title(code)
Retrieves a program title

**Kind**: static method of [<code>programRouter</code>](#module_routes/program..programRouter)  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>number</code> | Program code to look up |

