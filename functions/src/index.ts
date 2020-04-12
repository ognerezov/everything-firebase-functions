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
                    doc=>res.push(doc.data())
                );
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
const QUOTATIONS_LIMIT =4;
const CHAPTER = 'chapter';
const QUOTATION = 'quotation';
const POEM = 'poem';

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