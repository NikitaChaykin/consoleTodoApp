import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';

interface ProcessParamsFlag {
    [key: string]: boolean;
}
interface ProcessParamsArgsString {
    [key: string]: string;
}
interface ProcessParamsArgsBool {
    [key: string]: boolean;
}
interface ProcessParamsArgsDate {
    [key: string]: Date;
}

interface IConsoleParams {
    getFlag: () => ProcessParamsFlag;

    getArgsString: () => ProcessParamsArgsString;
    getArgsBool: () => ProcessParamsArgsBool;
    getArgsDate: () => ProcessParamsArgsDate;
}

class ConsoleParams implements IConsoleParams {
    private flag: { [key: string]: boolean } = {};
    private argsString: { [key: string]: string } = {};
    private argsBool: { [key: string]: boolean } = {};
    private argsDate: { [key: string]: Date } = {};

    private params = process.argv.slice(2, process.argv.length);

    getFlag = (): ProcessParamsFlag => {
        const regFlag = /^-[a-zA-Z]+[a-zA-Z]?$/m;
        this.params.forEach(key => {
            if (regFlag.test(key)) {
                this.flag[key] = true;
            }
        });

        if (Object.keys(this.flag).length > 1) {
            throw 'You can only use one flag !';
        }

        return this.flag;
    };

    getArgsString = (): ProcessParamsArgsString => {
        const regArgs = /^--[a-zA-Z]+=(?!true$|false$)[\s+a-zA-Z0-9_]+[a-zA-Z0-9_]?$/m;
        this.params.forEach(key => {
            if (regArgs.test(key)) {
                const arrKey = key.split('=');
                this.argsString[arrKey[0]] = arrKey[1];
            }
        });

        return this.argsString;
    };

    getArgsBool = (): ProcessParamsArgsBool => {
        const regArgsBool = /^--[a-zA-Z]+=(true|false)$/m;
        this.params.forEach(key => {
            if (regArgsBool.test(key)) {
                const arrKeyBool = key.split('=');
                this.argsBool[arrKeyBool[0]] = JSON.parse(arrKeyBool[1]);
            }
        });

        return this.argsBool;
    };

    checkOnDate = (arrKeyDate: Array<string>) => {
        const regHours = /^[1-9]\d?\d?h$/m;
        const regDate = /^\d\d\.\d\d\.\d\d\d\d$/m;
        if (regHours.test(arrKeyDate[1])) {
            const hours = arrKeyDate[1].slice(0, arrKeyDate[1].length - 1);
            let timeNowPlusHours = new Date( // - new Date().getTimezoneOffset() * 60000 - Moscow Time
                new Date().getTime() -
                    new Date().getTimezoneOffset() * 60000 +
                    parseInt(hours) * 60 * 60 * 1000,
            );

            this.argsDate[arrKeyDate[0]] = timeNowPlusHours;
        } else if (regDate.test(arrKeyDate[1])) {
            const day = +arrKeyDate[1].split('.')[0];
            const month = +arrKeyDate[1].split('.')[1];
            const year = +arrKeyDate[1].split('.')[2];

            this.argsDate[arrKeyDate[0]] = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        }
    };
    getArgsDate = (): ProcessParamsArgsDate => {
        const regArgsDate = /^--[a-zA-Z]+=(?!true$|false$)(\d\d\.\d\d\.\d\d\d\d|[1-9]\d?\d?h$)?$/m;
        this.params.forEach(key => {
            if (regArgsDate.test(key)) {
                const arrKeyDate = key.split('=');
                this.checkOnDate(arrKeyDate);
            }
        });

        return this.argsDate;
    };
}

const params = new ConsoleParams();

const flag = Object.keys(params.getFlag())[0];
const argsString = params.getArgsString();
const argsBool = params.getArgsBool();
const argsDate = params.getArgsDate();

/* console.log('flag - ', flag)
console.log('String - ', argsString)
console.log('Bool - ', argsBool)
console.log('Date - ', argsDate)
 */

let DATE_NOW = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000);
//console.log(DATE_NOW)

interface IStorage {
    insert: (todo: Readonly<ITodo>) => void;
    delete: () => void;
    update: () => void;
}
class StorageFs implements IStorage {
    insert = async () => {};

    delete = async () => {};

    update = async () => {};
}

interface TodosMananger {
    addTodo: () => void;
    deleteTodo: () => void;
    editTodo: () => void;
}
class TodosMananger implements TodosMananger {
    private storage: IStorage;
    private todo: Readonly<ITodo>;

    constructor(todo: ITodo, storage: IStorage) {
        this.storage = storage;
        this.todo = todo;
    }

    addTodo = () => {
        this.storage.insert(this.todo);
    };

    deleteTodo = () => {
        this.storage.delete();
    };

    editTodo = () => {
        this.storage.update();
    };
}

interface ITodo {
    id: string;
    title: string;
    status: boolean;
    createdTime: Date;
    timeStamp: Date;
}

let todo: Readonly<ITodo> = {
    id: uuidv4(),
    title: argsString['--title'],
    status: argsBool['--status'],
    createdTime: DATE_NOW,
    timeStamp: argsDate['--time'],
};

todo = new Proxy(todo, {
    get: (todo, key: keyof ITodo): ITodo[keyof ITodo] => {
        if (!todo[key]) {
            throw console.log('\x1b[31m', `< ${key} > is not found`, '\x1b[0m');
        } else {
            return todo[key];
        }
    },

    set: (target, key: keyof ITodo, val: ITodo[keyof ITodo]): boolean => {
        if (!target[key]) {
            throw console.log('\x1b[31m', `Can not add this < ${key} > property`, '\x1b[0m');
        }

        console.log('val - ', val);
        if (val.toString().trim().length >= 0) {
            throw console.log('\x1b[31m', `Readonly property, can't change !`, '\x1b[0m');
        }
        return true;
    },
});

const storageFs = new StorageFs();
const todoMananger = new TodosMananger(todo, storageFs);

switch (flag) {
    case '-add':
        todoMananger.addTodo();
        break;

    case '-delete':
        todoMananger.deleteTodo();
        break;

    case 'edit':
        todoMananger.editTodo();
        break;
}
