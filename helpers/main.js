const fs = require('fs');
const rp = require('request-promise');

const Throttler = require('../models/Throttler.js');
const ACADEMIC_PROGRAMS = require('../mesa_academic_programs_new.json');

const ONET_CREDENTIALS = {
    USERNAME: process.env.ONET_API_USERNAME,
    PASSWORD: process.env.ONET_API_PASSWORD,
    BASIC: process.env.ONET_API_AUTH
}

const ONET_API_HEADERS = {
    Authorization: ONET_CREDENTIALS.BASIC,
    Accept: 'application/json'
}

var ONET_OPTIONS = {
    headers: ONET_API_HEADERS,
    json: true
}

const start = async() => {
    await buildProgramData();
}

const buildProgramData = async () => {
    console.log("Reading academic programs from JSON file...")
    const throttler = new Throttler(ACADEMIC_PROGRAMS, 5, 500);
    console.log("Pulling O*NET data...")
    let p = await throttler.execute();
    const json = JSON.stringify(p);
    fs.writeFile("academic_programs.json", json, "utf8", () => {});
    console.log("O*NET retreival complete.");
}

const getCareerTasks = async(code) => {
    console.log("Pulling career tasks from O*NET Web Services...");
    const careerTasksUrl = "https://services.onetcenter.org/ws/online/occupations/" + code + "/details/tasks?display=long";
    try {
        let data = await rp(careerTasksUrl, ONET_OPTIONS);
        if(data.hasOwnProperty("task")) {
            let tasks = data.task;
            tasks = tasks
            .filter(task => task.category == 'Core')
            .map(task => {
                return task.statement
            })
            return tasks;
        } else return null;
    } catch(error) {
        console.error(error);
        return null;
    }
}

const getCareerTechnicalSkills = async(code) => {
    console.log("Pulling career technical skills from O*NET Web Services...");
    const careerTechnicalSkillsUrl = "https://services.onetcenter.org/ws/mnm/careers/" + code + "/technology";
    try {
        console.log(careerTechnicalSkillsUrl);
        let data = await rp(careerTechnicalSkillsUrl, ONET_OPTIONS);
        if(data.hasOwnProperty("category")) {
            let technical_skills = data.category;
            technical_skills = technical_skills
            .map(skill => skill.example
                .map(el => el.name));
            
            let arr = [].concat.apply([], technical_skills);

            return arr;
        } else return null;
    } catch(error) {
        console.error(error);
        return null;
    }
}

const getCareerSoftSkills = async(code) => {
    console.log("Pulling career soft skills from O*NET Web Services...");
    const careerSoftSkillsUrl = "https://services.onetcenter.org/ws/online/occupations/" + code + "/details/skills?display=long";
    try {
        let data = await rp(careerSoftSkillsUrl, ONET_OPTIONS);
        if(data.hasOwnProperty("element")) {
            let soft_skills = data.element;
            soft_skills = soft_skills
            .filter(skill => skill.score.value >= 65)
            .map(skill => {
                return {
                    name: skill.name,
                    description: skill.description
                }
            });
            
            return soft_skills;
        } else return null;
    } catch(error) {
        console.error(error);
        return null;
    }
}

const getCareerAbilities = async(code) => {
    console.log("Pulling career abilities from O*NET Web Services...");
    const careerAbiltiesUrl = "https://services.onetcenter.org/ws/online/occupations/" + code + "/details/abilities?display=long";
    try {
        let data = await rp(careerAbiltiesUrl, ONET_OPTIONS);
        if(data.hasOwnProperty("element")) {
            let abilities = data.element;
            abilities = abilities.
            filter(item => item.score.value >= 65)
            .map(item => {
                return {
                    name: item.name,
                    description: item.description
                }
            })
            .slice(0, 5); // take only first 5 elements

            return abilities;
        } else return null;
    } catch(error) {
        console.error(error);
        return null;
    }
}

const getCareerKnowledge = async(code) => {
    console.log("Pulling career knowledge from O*NET Web Services...");
    const careerKnowledgeUrl = "https://services.onetcenter.org/ws/online/occupations/" + code + "/details/knowledge?display=long";
    try {
        let data = await rp(careerKnowledgeUrl, ONET_OPTIONS);
        if(data.hasOwnProperty("element")) {
            let knowledge = data.element;
            knowledge = knowledge
            .filter(item => item.score.value >= 65)
            .map(item => {
                return {
                    name: item.name,
                    description: item.description
                }
            });

            return knowledge;
        } else return null;
    } catch(error) {
        console.error(error);
        return null;
    }
}

module.exports = {
    start,
    getCareerTasks,
    getCareerTechnicalSkills,
    getCareerSoftSkills,
    getCareerAbilities,
    getCareerKnowledge
}