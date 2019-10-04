## Modules

<dl>
<dt><a href="#module_models/AcademicProgram">models/AcademicProgram</a></dt>
<dd></dd>
<dt><a href="#module_models/Career">models/Career</a></dt>
<dd></dd>
<dt><a href="#module_models/JobTracker">models/JobTracker</a></dt>
<dd></dd>
<dt><a href="#module_models/Salary">models/Salary</a></dt>
<dd></dd>
<dt><a href="#module_models/Throttler">models/Throttler</a></dt>
<dd></dd>
</dl>

<a name="module_models/AcademicProgram"></a>

## models/AcademicProgram
**Requires**: <code>module:services/ONETService</code>, <code>module:services/DatabaseService</code>, [<code>models/Career</code>](#module_models/Career), [<code>models/Salary</code>](#module_models/Salary)  
**Author**: Devon Rojas  

* [models/AcademicProgram](#module_models/AcademicProgram)
    * [~AcademicProgram](#module_models/AcademicProgram..AcademicProgram)
        * [new AcademicProgram(title, [degree_types], [code])](#new_module_models/AcademicProgram..AcademicProgram_new)
        * [.addCareer(career)](#module_models/AcademicProgram..AcademicProgram+addCareer)
        * [.removeCareer(code)](#module_models/AcademicProgram..AcademicProgram+removeCareer)
        * [.hasCareer(code)](#module_models/AcademicProgram..AcademicProgram+hasCareer)
        * [.retrieveAcademicProgramData()](#module_models/AcademicProgram..AcademicProgram+retrieveAcademicProgramData) ⇒ <code>void</code>
        * [.checkRelatedPrograms()](#module_models/AcademicProgram..AcademicProgram+checkRelatedPrograms)
        * [.updateCareers()](#module_models/AcademicProgram..AcademicProgram+updateCareers)

<a name="module_models/AcademicProgram..AcademicProgram"></a>

### models/AcademicProgram~AcademicProgram
Class representing an academic program at Mesa and all associated O*NETCareer data under it.

**Kind**: inner class of [<code>models/AcademicProgram</code>](#module_models/AcademicProgram)  

* [~AcademicProgram](#module_models/AcademicProgram..AcademicProgram)
    * [new AcademicProgram(title, [degree_types], [code])](#new_module_models/AcademicProgram..AcademicProgram_new)
    * [.addCareer(career)](#module_models/AcademicProgram..AcademicProgram+addCareer)
    * [.removeCareer(code)](#module_models/AcademicProgram..AcademicProgram+removeCareer)
    * [.hasCareer(code)](#module_models/AcademicProgram..AcademicProgram+hasCareer)
    * [.retrieveAcademicProgramData()](#module_models/AcademicProgram..AcademicProgram+retrieveAcademicProgramData) ⇒ <code>void</code>
    * [.checkRelatedPrograms()](#module_models/AcademicProgram..AcademicProgram+checkRelatedPrograms)
    * [.updateCareers()](#module_models/AcademicProgram..AcademicProgram+updateCareers)

<a name="new_module_models/AcademicProgram..AcademicProgram_new"></a>

#### new AcademicProgram(title, [degree_types], [code])
Creates an academic program.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| title | <code>string</code> |  | The name of the program. |
| [degree_types] | <code>Array</code> | <code>[]</code> | The types of degrees or certifications offered under the program. |
| [code] | <code>number</code> | <code>0</code> | A program code |

<a name="module_models/AcademicProgram..AcademicProgram+addCareer"></a>

#### academicProgram.addCareer(career)
Adds a career into the AcademicProgram's career array.

**Kind**: instance method of [<code>AcademicProgram</code>](#module_models/AcademicProgram..AcademicProgram)  

| Param | Type | Description |
| --- | --- | --- |
| career | <code>Career</code> | A Career object. |

<a name="module_models/AcademicProgram..AcademicProgram+removeCareer"></a>

#### academicProgram.removeCareer(code)
Removes a career from the AcademicProgram's career array.

**Kind**: instance method of [<code>AcademicProgram</code>](#module_models/AcademicProgram..AcademicProgram)  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>string</code> | A valid career code. |

<a name="module_models/AcademicProgram..AcademicProgram+hasCareer"></a>

#### academicProgram.hasCareer(code)
Checks if a career exists in the AcademicProgram's career array.

**Kind**: instance method of [<code>AcademicProgram</code>](#module_models/AcademicProgram..AcademicProgram)  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>string</code> | A valid career code. |

<a name="module_models/AcademicProgram..AcademicProgram+retrieveAcademicProgramData"></a>

#### academicProgram.retrieveAcademicProgramData() ⇒ <code>void</code>
Checks database for existing program data, and if it doesn't exist, buildsCareers out of all O*NET Occupations associated with the program. Each career has theirrelated programs updated as it is generated. If program data _does_ exist, thedata is copied into the AcademicProgram object, and the contained careers arescanned for any related programs updates.

**Kind**: instance method of [<code>AcademicProgram</code>](#module_models/AcademicProgram..AcademicProgram)  
**See**

- [Career](#module_models/Career)
- [ONETService](module:services/ONETService)
- [DatabaseService](module:services/DatabaseService)

<a name="module_models/AcademicProgram..AcademicProgram+checkRelatedPrograms"></a>

#### academicProgram.checkRelatedPrograms()
Checks database for any updates to the program collection, andmakes any changes the the AcademicProgram's career'srelated_programs property if any updates exist.

**Kind**: instance method of [<code>AcademicProgram</code>](#module_models/AcademicProgram..AcademicProgram)  
<a name="module_models/AcademicProgram..AcademicProgram+updateCareers"></a>

#### academicProgram.updateCareers()
Updates all AcademicProgram's careers with new data from ONET.

**Kind**: instance method of [<code>AcademicProgram</code>](#module_models/AcademicProgram..AcademicProgram)  
<a name="module_models/Career"></a>

## models/Career
**Requires**: <code>module:services/DatabaseService</code>, <code>module:services/ONETService</code>, <code>module:services/CareerOneStopService</code>, [<code>models/JobTracker</code>](#module_models/JobTracker)  
**Author**: Devon Rojas  

* [models/Career](#module_models/Career)
    * [~Career](#module_models/Career..Career)
        * [new Career(code)](#new_module_models/Career..Career_new)
        * [.setRelatedPrograms(arr)](#module_models/Career..Career+setRelatedPrograms)
        * [.getRelatedPrograms()](#module_models/Career..Career+getRelatedPrograms) ⇒ <code>Array</code>
        * [.addRelatedProgram(program, title, degree_types, parth)](#module_models/Career..Career+addRelatedProgram)
        * [.retrieveCareerData()](#module_models/Career..Career+retrieveCareerData)
        * [.validateCareer()](#module_models/Career..Career+validateCareer) ⇒ <code>boolean</code>
        * [.saveToDatabase()](#module_models/Career..Career+saveToDatabase)
        * [.updateSalary(location)](#module_models/Career..Career+updateSalary)

<a name="module_models/Career..Career"></a>

### models/Career~Career
Class representing O*NET and CareerOneStop Occupation data, and anyacademic programs associated with it.

**Kind**: inner class of [<code>models/Career</code>](#module_models/Career)  

* [~Career](#module_models/Career..Career)
    * [new Career(code)](#new_module_models/Career..Career_new)
    * [.setRelatedPrograms(arr)](#module_models/Career..Career+setRelatedPrograms)
    * [.getRelatedPrograms()](#module_models/Career..Career+getRelatedPrograms) ⇒ <code>Array</code>
    * [.addRelatedProgram(program, title, degree_types, parth)](#module_models/Career..Career+addRelatedProgram)
    * [.retrieveCareerData()](#module_models/Career..Career+retrieveCareerData)
    * [.validateCareer()](#module_models/Career..Career+validateCareer) ⇒ <code>boolean</code>
    * [.saveToDatabase()](#module_models/Career..Career+saveToDatabase)
    * [.updateSalary(location)](#module_models/Career..Career+updateSalary)

<a name="new_module_models/Career..Career_new"></a>

#### new Career(code)
Create a career.


| Param | Type | Description |
| --- | --- | --- |
| code | <code>string</code> | A valid O*NET Code. |

<a name="module_models/Career..Career+setRelatedPrograms"></a>

#### career.setRelatedPrograms(arr)
Sets the career's related programs.

**Kind**: instance method of [<code>Career</code>](#module_models/Career..Career)  

| Param | Description |
| --- | --- |
| arr | An array of related programs. |

<a name="module_models/Career..Career+getRelatedPrograms"></a>

#### career.getRelatedPrograms() ⇒ <code>Array</code>
Gets the career's related programs.

**Kind**: instance method of [<code>Career</code>](#module_models/Career..Career)  
**Returns**: <code>Array</code> - Array of related programs.  
<a name="module_models/Career..Career+addRelatedProgram"></a>

#### career.addRelatedProgram(program, title, degree_types, parth)
Adds a program to the object's related_programs array.

**Kind**: instance method of [<code>Career</code>](#module_models/Career..Career)  

| Param | Type | Description |
| --- | --- | --- |
| program | <code>Object</code> | A related program object |
| title | <code>string</code> | Program title |
| degree_types | <code>Array</code> | An array of degrees associated with a program |
| parth | <code>string</code> | A URL path pointing to a Mesa Academic Program page |

<a name="module_models/Career..Career+retrieveCareerData"></a>

#### career.retrieveCareerData()
Checks database for existing career data, and if it doesn't exist, buildsa new Career object. If a new object is created, a [JobTracker](#module_models/JobTracker)object is also generated and added to its appropriate database collection.

**Kind**: instance method of [<code>Career</code>](#module_models/Career..Career)  
**See**

- [DatabaseService](module:services/DatabaseService)
- [ONETService](module:services/ONETService)
- [CareerOneStopService](module:services/CareerOneStopService)
- [JobTracker](#module_models/JobTracker)

<a name="module_models/Career..Career+validateCareer"></a>

#### career.validateCareer() ⇒ <code>boolean</code>
Checks all Career object properties for empty Arrays, Objects, andnull and undefined values.

**Kind**: instance method of [<code>Career</code>](#module_models/Career..Career)  
**Returns**: <code>boolean</code> - Boolean indicating whether object is complete  
<a name="module_models/Career..Career+saveToDatabase"></a>

#### career.saveToDatabase()
Saves career data to careers collection in database

**Kind**: instance method of [<code>Career</code>](#module_models/Career..Career)  
**See**: [DatabaseService](module:services/DatabaseService)  
<a name="module_models/Career..Career+updateSalary"></a>

#### career.updateSalary(location)
Updates salary data

**Kind**: instance method of [<code>Career</code>](#module_models/Career..Career)  
**See**: [CareerOneStopService](module:services/CareerOneStopService)  

| Param | Type | Description |
| --- | --- | --- |
| location | <code>string</code> | Location to search |

<a name="module_models/JobTracker"></a>

## models/JobTracker
**Requires**: <code>module:services/CareerOneStopService</code>, <code>module:services/GoogleMapsService</code>, <code>module:services/DatabaseService</code>, <code>module:helpers/Utils</code>  
**Author**: Devon Rojas  

* [models/JobTracker](#module_models/JobTracker)
    * [~JobTracker](#module_models/JobTracker..JobTracker)
        * [new JobTracker(location)](#new_module_models/JobTracker..JobTracker_new)
        * [.getAreas()](#module_models/JobTracker..JobTracker+getAreas) ⇒ <code>Array</code>
        * [.retrieveData()](#module_models/JobTracker..JobTracker+retrieveData)
    * [~PrimitiveArea](#module_models/JobTracker..PrimitiveArea)
        * [new PrimitiveArea(area)](#new_module_models/JobTracker..PrimitiveArea_new)
        * [.getArea()](#module_models/JobTracker..PrimitiveArea+getArea) ⇒ <code>object</code>
        * [.getData()](#module_models/JobTracker..PrimitiveArea+getData) ⇒ <code>Array</code>
        * [.getCompanies()](#module_models/JobTracker..PrimitiveArea+getCompanies) ⇒ <code>Array</code>
        * [.setArea(area)](#module_models/JobTracker..PrimitiveArea+setArea)
        * [.init(code)](#module_models/JobTracker..PrimitiveArea+init)
        * [.update(code)](#module_models/JobTracker..PrimitiveArea+update)
        * [.fetch(code, [radius])](#module_models/JobTracker..PrimitiveArea+fetch)
    * [~CountyArea](#module_models/JobTracker..CountyArea)
        * [new CountyArea(location)](#new_module_models/JobTracker..CountyArea_new)
        * [.addZipCodeAlias(zip)](#module_models/JobTracker..CountyArea+addZipCodeAlias)
        * [.update(code)](#module_models/JobTracker..CountyArea+update)
        * [.fetch(code)](#module_models/JobTracker..CountyArea+fetch)
    * [~AreaRadius](#module_models/JobTracker..AreaRadius)
        * [new AreaRadius(radius)](#new_module_models/JobTracker..AreaRadius_new)
        * [.getRadius()](#module_models/JobTracker..AreaRadius+getRadius) ⇒ <code>number</code>
        * [.getData()](#module_models/JobTracker..AreaRadius+getData) ⇒ <code>Array</code>
        * [.addRecord(record)](#module_models/JobTracker..AreaRadius+addRecord)
    * [~JobRecord](#module_models/JobTracker..JobRecord)
        * [new JobRecord()](#new_module_models/JobTracker..JobRecord_new)
        * [.setJobCount(count)](#module_models/JobTracker..JobRecord+setJobCount)
        * [.setCompanyCount(count)](#module_models/JobTracker..JobRecord+setCompanyCount)
        * [.getJobCount()](#module_models/JobTracker..JobRecord+getJobCount) ⇒ <code>number</code>
        * [.getCompanyCount()](#module_models/JobTracker..JobRecord+getCompanyCount) ⇒ <code>number</code>

<a name="module_models/JobTracker..JobTracker"></a>

### models/JobTracker~JobTracker
Class containing logic to build job posting data for an O*NET Occupation.

**Kind**: inner class of [<code>models/JobTracker</code>](#module_models/JobTracker)  

* [~JobTracker](#module_models/JobTracker..JobTracker)
    * [new JobTracker(location)](#new_module_models/JobTracker..JobTracker_new)
    * [.getAreas()](#module_models/JobTracker..JobTracker+getAreas) ⇒ <code>Array</code>
    * [.retrieveData()](#module_models/JobTracker..JobTracker+retrieveData)

<a name="new_module_models/JobTracker..JobTracker_new"></a>

#### new JobTracker(location)
Creates a JobTracker object.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| location | <code>string</code> | <code>&quot;92111&quot;</code> | A location (Zip code, city, or state) |

<a name="module_models/JobTracker..JobTracker+getAreas"></a>

#### jobTracker.getAreas() ⇒ <code>Array</code>
Retrieves job tracking area data.

**Kind**: instance method of [<code>JobTracker</code>](#module_models/JobTracker..JobTracker)  
**Returns**: <code>Array</code> - Array of job tracking data  
<a name="module_models/JobTracker..JobTracker+retrieveData"></a>

#### jobTracker.retrieveData()
Pulls all job tracking data for all areas associated with an O*NET Occupation Code.

**Kind**: instance method of [<code>JobTracker</code>](#module_models/JobTracker..JobTracker)  
**See**

- [GoogleMapsService](module:services/GoogleMapsService)
- [DatabaseService](module:services/DatabaseService)

<a name="module_models/JobTracker..PrimitiveArea"></a>

### models/JobTracker~PrimitiveArea
Class representing an area containing monthly [records](#module_models/JobTracker..JobRecord) of job postings.

**Kind**: inner class of [<code>models/JobTracker</code>](#module_models/JobTracker)  

* [~PrimitiveArea](#module_models/JobTracker..PrimitiveArea)
    * [new PrimitiveArea(area)](#new_module_models/JobTracker..PrimitiveArea_new)
    * [.getArea()](#module_models/JobTracker..PrimitiveArea+getArea) ⇒ <code>object</code>
    * [.getData()](#module_models/JobTracker..PrimitiveArea+getData) ⇒ <code>Array</code>
    * [.getCompanies()](#module_models/JobTracker..PrimitiveArea+getCompanies) ⇒ <code>Array</code>
    * [.setArea(area)](#module_models/JobTracker..PrimitiveArea+setArea)
    * [.init(code)](#module_models/JobTracker..PrimitiveArea+init)
    * [.update(code)](#module_models/JobTracker..PrimitiveArea+update)
    * [.fetch(code, [radius])](#module_models/JobTracker..PrimitiveArea+fetch)

<a name="new_module_models/JobTracker..PrimitiveArea_new"></a>

#### new PrimitiveArea(area)
Creates a job posting area.


| Param | Type | Description |
| --- | --- | --- |
| area | <code>object</code> | Location object |
| area.short_name | <code>string</code> | Name of area |
| area.types | <code>Array</code> | Area types |

<a name="module_models/JobTracker..PrimitiveArea+getArea"></a>

#### primitiveArea.getArea() ⇒ <code>object</code>
Retrieves the data of an area.

**Kind**: instance method of [<code>PrimitiveArea</code>](#module_models/JobTracker..PrimitiveArea)  
**Returns**: <code>object</code> - Object containing area name and type(s)  
<a name="module_models/JobTracker..PrimitiveArea+getData"></a>

#### primitiveArea.getData() ⇒ <code>Array</code>
Retrieves the job data associated with area.

**Kind**: instance method of [<code>PrimitiveArea</code>](#module_models/JobTracker..PrimitiveArea)  
<a name="module_models/JobTracker..PrimitiveArea+getCompanies"></a>

#### primitiveArea.getCompanies() ⇒ <code>Array</code>
Retrieves the companies associated with the area.

**Kind**: instance method of [<code>PrimitiveArea</code>](#module_models/JobTracker..PrimitiveArea)  
<a name="module_models/JobTracker..PrimitiveArea+setArea"></a>

#### primitiveArea.setArea(area)
Sets the area.

**Kind**: instance method of [<code>PrimitiveArea</code>](#module_models/JobTracker..PrimitiveArea)  

| Param | Type | Description |
| --- | --- | --- |
| area | <code>Area</code> | The area to set the object to. |

<a name="module_models/JobTracker..PrimitiveArea+init"></a>

#### primitiveArea.init(code)
Initializes a new area.

**Kind**: instance method of [<code>PrimitiveArea</code>](#module_models/JobTracker..PrimitiveArea)  
**See**

- [CareerOneStopService](modules:services/CareerOneStopService)
- [JobRecord](modules:models/JobTracker~JobRecord)


| Param | Type | Description |
| --- | --- | --- |
| code | <code>string</code> | A valid O*NET Occupation code |

<a name="module_models/JobTracker..PrimitiveArea+update"></a>

#### primitiveArea.update(code)
Updates area with any necessary job records.

**Kind**: instance method of [<code>PrimitiveArea</code>](#module_models/JobTracker..PrimitiveArea)  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>string</code> | A valid O*NET Occupation code |

<a name="module_models/JobTracker..PrimitiveArea+fetch"></a>

#### primitiveArea.fetch(code, [radius])
Retrieves job data for area.

**Kind**: instance method of [<code>PrimitiveArea</code>](#module_models/JobTracker..PrimitiveArea)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| code | <code>string</code> |  | A valid O*NET Occupation code |
| [radius] | <code>number</code> | <code>25</code> | The radius around a location to search job postings in |

<a name="module_models/JobTracker..CountyArea"></a>

### models/JobTracker~CountyArea
Class representing a county containing monthly [records](#module_models/JobTracker..JobRecord) of job postings, categorized by radius.

**Kind**: inner class of [<code>models/JobTracker</code>](#module_models/JobTracker)  
**See**: [AreaRadius](#module_models/JobTracker..AreaRadius)  

* [~CountyArea](#module_models/JobTracker..CountyArea)
    * [new CountyArea(location)](#new_module_models/JobTracker..CountyArea_new)
    * [.addZipCodeAlias(zip)](#module_models/JobTracker..CountyArea+addZipCodeAlias)
    * [.update(code)](#module_models/JobTracker..CountyArea+update)
    * [.fetch(code)](#module_models/JobTracker..CountyArea+fetch)

<a name="new_module_models/JobTracker..CountyArea_new"></a>

#### new CountyArea(location)
Creates a county job posting area. This object contains a collection of zip codes that fallwithin the county to assist in data retrieval from the [CareerOneStop](module:services/CareerOneStopService) API.


| Param | Type | Description |
| --- | --- | --- |
| location | <code>object</code> | Location object |
| location.short_name | <code>string</code> | A valid US Zip code |

<a name="module_models/JobTracker..CountyArea+addZipCodeAlias"></a>

#### countyArea.addZipCodeAlias(zip)
Adds a zip code to object's zip code alias array.

**Kind**: instance method of [<code>CountyArea</code>](#module_models/JobTracker..CountyArea)  

| Param | Type | Description |
| --- | --- | --- |
| zip | <code>string</code> \| <code>number</code> | A valid US Zip code |

<a name="module_models/JobTracker..CountyArea+update"></a>

#### countyArea.update(code)
Updates area with any necessary job records.

**Kind**: instance method of [<code>CountyArea</code>](#module_models/JobTracker..CountyArea)  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>string</code> | A valid O*NET Occupation code |

<a name="module_models/JobTracker..CountyArea+fetch"></a>

#### countyArea.fetch(code)
Retrieves job data for an area with different radius values.

**Kind**: instance method of [<code>CountyArea</code>](#module_models/JobTracker..CountyArea)  
**See**: [CareerOneStopService](module:services/CareerOneStopService)  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>string</code> | A valid O*NET Occupation code |

<a name="module_models/JobTracker..AreaRadius"></a>

### models/JobTracker~AreaRadius
Class representing job data within a certain radius.

**Kind**: inner class of [<code>models/JobTracker</code>](#module_models/JobTracker)  

* [~AreaRadius](#module_models/JobTracker..AreaRadius)
    * [new AreaRadius(radius)](#new_module_models/JobTracker..AreaRadius_new)
    * [.getRadius()](#module_models/JobTracker..AreaRadius+getRadius) ⇒ <code>number</code>
    * [.getData()](#module_models/JobTracker..AreaRadius+getData) ⇒ <code>Array</code>
    * [.addRecord(record)](#module_models/JobTracker..AreaRadius+addRecord)

<a name="new_module_models/JobTracker..AreaRadius_new"></a>

#### new AreaRadius(radius)
Creates an object to hold job data within a certain radius.


| Param | Type | Description |
| --- | --- | --- |
| radius | <code>number</code> | Radius to pull job data in. |

<a name="module_models/JobTracker..AreaRadius+getRadius"></a>

#### areaRadius.getRadius() ⇒ <code>number</code>
Retrieves radius of object.

**Kind**: instance method of [<code>AreaRadius</code>](#module_models/JobTracker..AreaRadius)  
**Returns**: <code>number</code> - Radius value.  
<a name="module_models/JobTracker..AreaRadius+getData"></a>

#### areaRadius.getData() ⇒ <code>Array</code>
Retrives data of object.

**Kind**: instance method of [<code>AreaRadius</code>](#module_models/JobTracker..AreaRadius)  
**Returns**: <code>Array</code> - Job data for the specified radius.  
<a name="module_models/JobTracker..AreaRadius+addRecord"></a>

#### areaRadius.addRecord(record)
Adds a [Job Record](#module_models/JobTracker..JobRecord) to data.

**Kind**: instance method of [<code>AreaRadius</code>](#module_models/JobTracker..AreaRadius)  

| Param | Type | Description |
| --- | --- | --- |
| record | <code>object</code> | A [Job Record](#module_models/JobTracker..JobRecord). |

<a name="module_models/JobTracker..JobRecord"></a>

### models/JobTracker~JobRecord
Class representing a single monthly job record for an area.

**Kind**: inner class of [<code>models/JobTracker</code>](#module_models/JobTracker)  

* [~JobRecord](#module_models/JobTracker..JobRecord)
    * [new JobRecord()](#new_module_models/JobTracker..JobRecord_new)
    * [.setJobCount(count)](#module_models/JobTracker..JobRecord+setJobCount)
    * [.setCompanyCount(count)](#module_models/JobTracker..JobRecord+setCompanyCount)
    * [.getJobCount()](#module_models/JobTracker..JobRecord+getJobCount) ⇒ <code>number</code>
    * [.getCompanyCount()](#module_models/JobTracker..JobRecord+getCompanyCount) ⇒ <code>number</code>

<a name="new_module_models/JobTracker..JobRecord_new"></a>

#### new JobRecord()
Creates a job record.

<a name="module_models/JobTracker..JobRecord+setJobCount"></a>

#### jobRecord.setJobCount(count)
Sets job count.

**Kind**: instance method of [<code>JobRecord</code>](#module_models/JobTracker..JobRecord)  

| Param | Type | Description |
| --- | --- | --- |
| count | <code>number</code> | Value to set job count to. |

<a name="module_models/JobTracker..JobRecord+setCompanyCount"></a>

#### jobRecord.setCompanyCount(count)
Sets company count.

**Kind**: instance method of [<code>JobRecord</code>](#module_models/JobTracker..JobRecord)  

| Param | Type | Description |
| --- | --- | --- |
| count | <code>count</code> | Value to set company count to. |

<a name="module_models/JobTracker..JobRecord+getJobCount"></a>

#### jobRecord.getJobCount() ⇒ <code>number</code>
Retrieves job count.

**Kind**: instance method of [<code>JobRecord</code>](#module_models/JobTracker..JobRecord)  
**Returns**: <code>number</code> - Job count.  
<a name="module_models/JobTracker..JobRecord+getCompanyCount"></a>

#### jobRecord.getCompanyCount() ⇒ <code>number</code>
Retrieves company count.

**Kind**: instance method of [<code>JobRecord</code>](#module_models/JobTracker..JobRecord)  
**Returns**: <code>number</code> - Company count.  
<a name="module_models/Salary"></a>

## models/Salary
**Author**: Devon Rojas  

* [models/Salary](#module_models/Salary)
    * [~Salary](#module_models/Salary..Salary)
        * [new Salary(pct10, pct25, median, pct75, pct90)](#new_module_models/Salary..Salary_new)
        * [.getPct10()](#module_models/Salary..Salary+getPct10) ⇒ <code>number</code>
        * [.getPct25()](#module_models/Salary..Salary+getPct25) ⇒ <code>number</code>
        * [.getMedian()](#module_models/Salary..Salary+getMedian) ⇒ <code>number</code>
        * [.getPct75()](#module_models/Salary..Salary+getPct75) ⇒ <code>number</code>
        * [.getPct90()](#module_models/Salary..Salary+getPct90) ⇒ <code>number</code>
        * [.setPct10(val)](#module_models/Salary..Salary+setPct10)
        * [.setPct25(val)](#module_models/Salary..Salary+setPct25)
        * [.setMedian(val)](#module_models/Salary..Salary+setMedian)
        * [.setPct75(val)](#module_models/Salary..Salary+setPct75)
        * [.setPct90(val)](#module_models/Salary..Salary+setPct90)

<a name="module_models/Salary..Salary"></a>

### models/Salary~Salary
Class representing salary percentile distributions per each Career.

**Kind**: inner class of [<code>models/Salary</code>](#module_models/Salary)  

* [~Salary](#module_models/Salary..Salary)
    * [new Salary(pct10, pct25, median, pct75, pct90)](#new_module_models/Salary..Salary_new)
    * [.getPct10()](#module_models/Salary..Salary+getPct10) ⇒ <code>number</code>
    * [.getPct25()](#module_models/Salary..Salary+getPct25) ⇒ <code>number</code>
    * [.getMedian()](#module_models/Salary..Salary+getMedian) ⇒ <code>number</code>
    * [.getPct75()](#module_models/Salary..Salary+getPct75) ⇒ <code>number</code>
    * [.getPct90()](#module_models/Salary..Salary+getPct90) ⇒ <code>number</code>
    * [.setPct10(val)](#module_models/Salary..Salary+setPct10)
    * [.setPct25(val)](#module_models/Salary..Salary+setPct25)
    * [.setMedian(val)](#module_models/Salary..Salary+setMedian)
    * [.setPct75(val)](#module_models/Salary..Salary+setPct75)
    * [.setPct90(val)](#module_models/Salary..Salary+setPct90)

<a name="new_module_models/Salary..Salary_new"></a>

#### new Salary(pct10, pct25, median, pct75, pct90)
Creates a salary.


| Param | Type | Description |
| --- | --- | --- |
| pct10 | <code>number</code> | 10th Percentile salary value. |
| pct25 | <code>number</code> | 25th Percentile salary value. |
| median | <code>number</code> | Median salary value. |
| pct75 | <code>number</code> | 75th Percentile salary value. |
| pct90 | <code>number</code> | 90th Percentile salary value. |

<a name="module_models/Salary..Salary+getPct10"></a>

#### salary.getPct10() ⇒ <code>number</code>
Get the 10th Percentile salary value.

**Kind**: instance method of [<code>Salary</code>](#module_models/Salary..Salary)  
**Returns**: <code>number</code> - 10th percentile salary.  
<a name="module_models/Salary..Salary+getPct25"></a>

#### salary.getPct25() ⇒ <code>number</code>
Get the 25th Percentile salary value.

**Kind**: instance method of [<code>Salary</code>](#module_models/Salary..Salary)  
**Returns**: <code>number</code> - 25th percentile salary.  
<a name="module_models/Salary..Salary+getMedian"></a>

#### salary.getMedian() ⇒ <code>number</code>
Get the 50th Percentile salary value.

**Kind**: instance method of [<code>Salary</code>](#module_models/Salary..Salary)  
**Returns**: <code>number</code> - Median salary.  
<a name="module_models/Salary..Salary+getPct75"></a>

#### salary.getPct75() ⇒ <code>number</code>
Get the 75th Percentile salary value.

**Kind**: instance method of [<code>Salary</code>](#module_models/Salary..Salary)  
**Returns**: <code>number</code> - 75th percentile salary.  
<a name="module_models/Salary..Salary+getPct90"></a>

#### salary.getPct90() ⇒ <code>number</code>
Get the 90th Percentile salary value.

**Kind**: instance method of [<code>Salary</code>](#module_models/Salary..Salary)  
**Returns**: <code>number</code> - 90th percentile salary.  
<a name="module_models/Salary..Salary+setPct10"></a>

#### salary.setPct10(val)
Sets the 10th Percentile salary value.

**Kind**: instance method of [<code>Salary</code>](#module_models/Salary..Salary)  

| Param | Type | Description |
| --- | --- | --- |
| val | <code>number</code> | The value to set. |

<a name="module_models/Salary..Salary+setPct25"></a>

#### salary.setPct25(val)
Sets the 25th Percentile salary value.

**Kind**: instance method of [<code>Salary</code>](#module_models/Salary..Salary)  

| Param | Type | Description |
| --- | --- | --- |
| val | <code>number</code> | The value to set. |

<a name="module_models/Salary..Salary+setMedian"></a>

#### salary.setMedian(val)
Sets the 50th Percentile salary value.

**Kind**: instance method of [<code>Salary</code>](#module_models/Salary..Salary)  

| Param | Type | Description |
| --- | --- | --- |
| val | <code>number</code> | The value to set. |

<a name="module_models/Salary..Salary+setPct75"></a>

#### salary.setPct75(val)
Sets the 75th Percentile salary value.

**Kind**: instance method of [<code>Salary</code>](#module_models/Salary..Salary)  

| Param | Type | Description |
| --- | --- | --- |
| val | <code>number</code> | The value to set. |

<a name="module_models/Salary..Salary+setPct90"></a>

#### salary.setPct90(val)
Sets the 90th Percentile salary value.

**Kind**: instance method of [<code>Salary</code>](#module_models/Salary..Salary)  

| Param | Type | Description |
| --- | --- | --- |
| val | <code>number</code> | The value to set. |

<a name="module_models/Throttler"></a>

## models/Throttler
**Requires**: <code>module:helpers/Utils</code>  
**Author**: Devon Rojas  

* [models/Throttler](#module_models/Throttler)
    * [~Throttler](#module_models/Throttler..Throttler)
        * [new Throttler(arr, [rateLimitCount], [rateLimitTime])](#new_module_models/Throttler..Throttler_new)
        * [.execute(callbackFn)](#module_models/Throttler..Throttler+execute) ⇒ <code>Array</code>

<a name="module_models/Throttler..Throttler"></a>

### models/Throttler~Throttler
Class containing logic to throttle a large number of function executions.

**Kind**: inner class of [<code>models/Throttler</code>](#module_models/Throttler)  

* [~Throttler](#module_models/Throttler..Throttler)
    * [new Throttler(arr, [rateLimitCount], [rateLimitTime])](#new_module_models/Throttler..Throttler_new)
    * [.execute(callbackFn)](#module_models/Throttler..Throttler+execute) ⇒ <code>Array</code>

<a name="new_module_models/Throttler..Throttler_new"></a>

#### new Throttler(arr, [rateLimitCount], [rateLimitTime])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| arr | <code>Array</code> |  | Array of items to perform an operation on |
| [rateLimitCount] | <code>number</code> | <code>1</code> | Number of executions to perform per rateLimitTime |
| [rateLimitTime] | <code>number</code> | <code>1000</code> | Amount of time (in milliseconds) to wait between execution batches |

<a name="module_models/Throttler..Throttler+execute"></a>

#### throttler.execute(callbackFn) ⇒ <code>Array</code>
Executes, in batch sizes specified in the [constructor](module:models/Throttler#constructor), acallback function on each item in the Throttler's item array.

**Kind**: instance method of [<code>Throttler</code>](#module_models/Throttler..Throttler)  
**Returns**: <code>Array</code> - Resulting response array from throttled callback functions.  
**See**: [Utils.throttle()](module:helpers/Utils~throttle)  

| Param | Type | Description |
| --- | --- | --- |
| callbackFn | <code>function</code> | An _asynchronous_ callback function to perform on each item - Must handle two arguments, (cb, item),  with cb being a returned function and item being the current item from the array. |

**Example**  
```js
A sample callbackFn argument.async callbackFn(cb, item) => {     // Perform some operation on item     cb();}
```
