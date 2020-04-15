import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";
import * as cors from  'cors';
const serviceAccount = require("../everything-book-firebase");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://everything-book.firebaseio.com"
});
const corsSettings = cors({origin: true});
const bookDao = admin.firestore().collection('book');
const ruleDao = admin.firestore().collection('rules');
const passwordDao = admin.firestore().collection('passwords').doc('current');

const CHAPTER = 'chapter';
const REGULAR = 'regular';
const QUOTATIONS_LIMIT =4;
const QUOTATION = 'quotation';
const POEM = 'poem';

const chapterPlaceholder ={
    level : -1,
    number : 0,
    isPlaceholder : true,
    records :[
        {
            number : 0,
            type : CHAPTER,
            spans : [
                {
                    number : false,
                    text : ''
                }
            ]
        },
        {
            number : 0,
            type : REGULAR,
            spans : [
                {
                    number : false,
                    text : 'Статья не обнаружена на сервере, но она уже написана и скоро будет доступна.'
                }
            ]
        },
    ],
}

export function getChapterPlaceholder(number : number) {
  chapterPlaceholder.number = number;
  chapterPlaceholder.records[0].number = number;
  chapterPlaceholder.records[1].number = number;
  chapterPlaceholder.records[0].spans[0].text = number +'';
  return chapterPlaceholder;
}

export const getChapters = functions.region('europe-west3')
    .https.onRequest(async (request, response) => {
    return corsSettings(request,response, async()=>{
            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Access-Control-Allow-Headers', '*');
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
            if(request.method ==='OPTIONS'){
                response.sendStatus(204);
            }
            const res : any[] =[];
            try {
                const password = (await passwordDao.get()).data();
                if(password){
                    /*
                        I want one secret temporal password valid for any user
                     */
                    if(password.password !== request.body.password){
                        response.sendStatus(401);
                    }
                }

                let numbers : number[] = request.body.numbers;
                if(!numbers || numbers.length ===0){
                    numbers = [1];
                }


                const snap = await bookDao
                    .where('number','in',numbers)
                    .get();
                snap.forEach(
                    doc=>{
                        const chapter = doc.data();
                        const number : number = chapter.number;
                        const index = numbers.indexOf(number);
                        if(index >=0){
                            numbers = numbers.splice(index,1);
                        }
                        res.push(chapter);
                    }
                );
                numbers.forEach(number=>res.push(getChapterPlaceholder(number)));
            }catch (e) {
                response.status(500).send(e);
            }

            response.send(res);
        })
});

export const getRules = functions.region('europe-west3')
    .https.onRequest(async (request, response) => {
        return corsSettings(request,response, async()=>{
            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Access-Control-Allow-Headers', '*');
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
            if(request.method ==='OPTIONS'){
                response.sendStatus(204);
            }
            const res : any[] =[];
            try {
                const password = (await passwordDao.get()).data();
                if(password){
                    /*
                        I want one secret temporal password valid for any user
                     */
                    if(password.password !== request.body.password){
                        response.sendStatus(401);
                    }
                }

                const snap = await ruleDao
                    .orderBy('number')
                    .get();
                snap.forEach(
                    doc=>res.push(doc.data())
                );
            }catch (e) {
                response.status(500).send(e);
            }

            response.send(res);
        })
    });

function getRandom(max :number):number{
    return Math.floor(1 + max* Math.random());
}

export const getQuotation = functions.region('europe-west3')
    .https.onRequest(async (request, response) => {
        return corsSettings(request,response, async()=>{
            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Access-Control-Allow-Headers', '*');
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
            if(request.method ==='OPTIONS'){
                response.sendStatus(204);
            }
            const res : any[] =[];
            try {
                const maxRecord = await bookDao
                    .orderBy('number','desc')
                    .limit(1)
                    .get();
                let max =1;
                maxRecord.forEach(doc=>max=doc.data().number);
                const numbers = [];
                for(let i=0; i<QUOTATIONS_LIMIT; i++){
                    numbers.push(getRandom(max));
                }
                const snap = await bookDao
                    .where('number','in',numbers)
                    .get();
                snap.forEach(
                    doc=>{
                        const data = doc.data();
                        data.records = data.records.filter((record :any)  => record.type === CHAPTER || record.type === QUOTATION ||record.type === POEM);
                        res.push(data)
                    }
                );
            }catch (e) {
                console.log(e);
                response.status(500).send(e);
            }
            console.log(res);
            response.send(res);
        })
    });