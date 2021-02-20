import { promises as fs } from 'fs';

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
  private flag: ProcessParamsFlag = {};
  private argsString: ProcessParamsArgsString = {};
  private argsBool: ProcessParamsArgsBool = {};
  private argsDate: ProcessParamsArgsDate = {};

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
    const regArgs = /^--[a-zA-Z]+=(?!true$|false$)[\s+a-zA-Z./0-9_]+[a-zA-Z0-9_]?$/m;
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
    const regHours = /^-?[0-9]\d?\d?h$/m;
    const regDate = /^\d\d\.\d\d\.\d\d\d\d$/m;
    if (regHours.test(arrKeyDate[1])) {
      const hours = arrKeyDate[1].slice(0, arrKeyDate[1].length - 1);
      let timeNowPlusHours = new Date(
        new Date().getTime() -
          new Date().getTimezoneOffset() * 60000 + // - new Date().getTimezoneOffset() * 60000 - Moscow Time
          parseInt(hours) * 60 * 60 * 1000,
      );

      this.argsDate[arrKeyDate[0]] = timeNowPlusHours;
    } else if (regDate.test(arrKeyDate[1])) {
      const day = +arrKeyDate[1].split('.')[0];
      const month = +arrKeyDate[1].split('.')[1];
      const year = +arrKeyDate[1].split('.')[2];

      this.argsDate[arrKeyDate[0]] = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    }
  };
  getArgsDate = (): ProcessParamsArgsDate => {
    const regArgsDate = /^--[a-zA-Z]+=(?!true$|false$)(\d\d\.\d\d\.\d\d\d\d|-?[0-9]\d?\d?h$)?$/m;
    this.params.forEach(key => {
      if (regArgsDate.test(key)) {
        const arrKeyDate = key.split('=');
        this.checkOnDate(arrKeyDate);
      }
    });

    return this.argsDate;
  };
}

let DATE_NOW = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000); // our time zone - new Date().getTimezoneOffset() * 60000
const params = new ConsoleParams();

const flag = Object.keys(params.getFlag())[0];
const argsString = params.getArgsString();
const argsBool = params.getArgsBool();
const argsDate = params.getArgsDate();

interface IStorage {
  insert: (todo: Readonly<ITodo>) => void;
  delete: (index: number) => void;
  update: (index: number, title: string, status: boolean) => void;
  select: () => Promise<Array<ITodo>>;
  clear: () => void;
  checkDateStatus: () => void;
}
interface IStorageFS extends IStorage {
  // FS storage interface
  readFileFS: () => Promise<string>;
  writeFileFS: (data: string) => Promise<void>;
}
interface IStorageBD extends IStorage {
  // BD storage interface
  getTable: () => void;
}
class StorageFs implements IStorageFS {
  // FS storage class
  private pathFile: string;

  constructor(pathFile: string) {
    this.pathFile = pathFile;
  }

  checkDateStatus = async () => {
    let data = JSON.parse(await this.readFileFS()) as Array<ITodo>;

    for (let i = 0; i < data.length; i++) {
      if (new Date(data[i].timeStamp) <= DATE_NOW) {
        data.splice(i, 1);
        i--;
      }
    }

    await this.writeFileFS(JSON.stringify(data, null, 2));
  };

  insert = async (todo: ITodo) => {
    try {
      if (!(await this.readFileFS()).length) {
        todo['id'] = 1; 
        await fs.appendFile(this.pathFile, JSON.stringify([todo], null, 2)).then(() => {
          console.log(
            '\x1b[35m',
            `The file along the path ${this.pathFile} was successfully created`,
            '\x1b[0m',
          );
        });
      } else {
        let data = JSON.parse(await this.readFileFS()) as Array<ITodo>;

        data.length ? (todo['id'] = data[data.length - 1].id + 1) : (todo['id'] = 1);

        this.writeFileFS(JSON.stringify([...data, todo], null, 2));
      }
    } catch (e) {
      console.error('\x1b[31m', e.message, '\x1b[0m');
    }
  };

  delete = async (index: number) => {
    let data = JSON.parse(await this.readFileFS()) as Array<ITodo>;
    data = data.filter(key => key.id !== index);
    this.writeFileFS(JSON.stringify(data, null, 2));
  };

  update = async (index: number, title: string, status: boolean) => {
    let data = JSON.parse(await this.readFileFS()) as Array<ITodo>;
    data.forEach(key => {
      if (key.id === index) {
        key.title = title;
        key.status = status;
      }
    });

    this.writeFileFS(JSON.stringify(data, null, 2));
  };

  select = async (): Promise<Array<ITodo>> => {
    await this.checkDateStatus();
    return JSON.parse(await this.readFileFS());
  };

  clear = async () => {
    await this.writeFileFS(JSON.stringify(''));
  };

  readFileFS = async () => {
    try {
      return await fs.readFile(this.pathFile, 'utf-8');
    } catch (e) {
      console.error('\x1b[31m', `Cannot FIND file ${this.pathFile}`, '\x1b[0m');
      return '';
    }
  };

  writeFileFS = async (data: string) => {
    try {
      await fs.writeFile(this.pathFile, data);
    } catch (e) {
      console.error('\x1b[31m', `Cannot WRITE file ${this.pathFile}`, '\x1b[0m');
      throw 'Err';
    }
  };
}

interface TodosMananger {
  addTodo: () => void;
  deleteTodo: () => void;
  editTodo: () => void;
  getTodos: () => Promise<Array<ITodo>>;
  getExpiringTodos: () => Promise<void>;
}
class TodosMananger implements TodosMananger {
  private storage: IStorage;
  private todo: ITodo;

  constructor(todo: ITodo, storage: IStorage) {
    this.storage = storage;
    this.todo = todo;
  }

  addTodo = () => {
    this.storage.insert(this.todo);
  };

  deleteTodo = () => {
    if (!this.todo.id) {
      throw console.error('\x1b[31m', `To DELETE record, enter --id`, '\x1b[0m');
    }

    this.storage.delete(parseInt(argsString['--id']));
  };

  deleteAllTodos = () => {
    this.storage.clear();
  };

  editTodo = () => {
    if (!this.todo.id) {
      console.error('\x1b[31m', `To UPDATE record, enter --id`, '\x1b[0m');
    }

    this.storage.update(parseInt(argsString['--id']), this.todo.title, this.todo.status);
  };

  getTodos = async () => {
    let data = await this.storage.select();
    console.log(data);
    return data;
  };

  getExpiringTodos = async () => {
    await this.storage
      .select()
      .then(key => {
        return key.filter(key => key.timeStamp);
      })
      .then(key => {
        key.sort((a, b) => {
          let aD = new Date(a.timeStamp);
          let bD = new Date(b.timeStamp);
          return bD.getTime() - aD.getTime();
        });
        return key;
      })
      .then(key => {
        for (let i = 0; i < key.length; i++) {
          let timeStamp = new Date(key[i].timeStamp);
          let timeMS = Math.abs(timeStamp.getTime() - DATE_NOW.getTime());
          let minutes = Math.floor(timeMS / 60 / 1000);
          let hours = Math.floor(minutes / 60);
          let seconds = Math.floor(timeMS / 1000);
          seconds = seconds - (hours * 3600 + (minutes - hours * 60) * 60);

          console.log({
            id: key[i].id,
            hours: `${hours}`,
            minutes: `${minutes - hours * 60}`,
            seconds: `${seconds}`,
          });
        }
      });
  };
}

interface ITodo {
  id: number;
  title: string;
  status: boolean;
  createdTime: Date;
  timeStamp: Date;
}

let todo: ITodo = {
  id: parseInt(argsString['--id']),
  title: argsString['--title'],
  status: argsBool['--status'],
  createdTime: DATE_NOW,
  timeStamp: argsDate['--time'],
};

todo = new Proxy(todo, {
  set: (target: any, key: keyof ITodo, val: any): boolean => {
    if (target[key] === undefined) {
      throw console.error('\x1b[31m', `Can not add this < ${key} > property`, '\x1b[0m');
    }
    if (typeof val !== typeof target[key]) {
      throw console.error(
        '\x1b[31m',
        `${val} should be a type ${typeof target[key]}, but you entered the type ${typeof val}`,
        '\x1b[0m',
      );
    }
    if (val.toString().trim().length === 0) {
      throw console.error('\x1b[31m', `Cant write ''`, '\x1b[0m');
    }
    target[key] = val;
    return true;
  },
});

const storageFs = new StorageFs(argsString['--path']);
const todoMananger = new TodosMananger(todo, storageFs);

switch (flag) {
  case '-add':
    todoMananger.addTodo();
    break;

  case '-delete':
    todoMananger.deleteTodo();
    break;

  case '-edit':
    todoMananger.editTodo();
    break;

  case '-deleteAll':
    todoMananger.deleteAllTodos();
    break;

  case '-show':
    todoMananger.getTodos();
    break;

  case '-showExpiring':
    todoMananger.getExpiringTodos();
    break;
}
