'use strict'
/**
 * Locales array, indexed by ISO 2-digit language code (without country)
 * @type {object[]}
 * @constant
 */
const LOCALES = window.DT_LOCALES;

/**
 * Choosen selector. All elements matching it, will be considered as DataTables
 * @type {string}
 * @constant
 */
const TRIGGER = "[data-component='datatable']";

/**
 * Pure JavaScript (VanillaJS) component that transforms simple html tables, into
 * fully-interactive and accessible datatables with sorting, searching and paging features.
 *
 * @class
 * @constructor
 * @public
 * @author Luigi Verolla <luverolla@outlook.com>
 * @version 1.0.0
 */

class DataTable {
    /**
 * @param {HTMLTableElement} el - The table element
 */
    constructor(el) {
        /**
         * The table element
         * @type {HTMLTableElement}
         */
        this.el = el;

        /**
         * Array containing table's data
         * @type {object[]}
         */
        this.data = [];

        /**
         * Current page number
         * @type {number}
         */
        this.currPage = 1;

        /**
         * Number of rows per page
         * @type {number}
         */
        this.perPage = 5;

        /**
         * Locale object
         * @type {object}
         */
        this.locale = {};

        /**
         * Number of table columns
         * @type {number}
         */
        this.colCount = {};

        /**
         * Array containing table's column names
         * @type {object[]}
         */
        this.colNames = [];

        /**
         * Array containing table's columns hide statues bool
         * @type {object[]}
         */
        this.colHidden = [];

        /**
         * Number of total records of data
         * @type {number}
         */
        this.recordCount = 0;

        /**
         * Control for class first run
         * @type {boolean}
         */
        this.scriptinit = false;

        /**
         * Page select element 
         * @type {object}
         */
        this.selectPage = {};

        /**
         * Select element for records per page
         * @type {object}
         */
        this.optCount = {};

        /**
         * Style element for hiding table columns
         * @type {object}
         */
        this.colhideStyle = {};

        /**
         * Response from urls as json object
         * @type {object}
         */
        this.json_obj = {};

        /**
         * web page HTML inner tables
         * @type {object}
         */
        this.st_obj = { };

        /**
         * web adress
         * @type {object}
         */
        this.hosturl;

        /**
         * Stores datatabe working mode
         * 0=Data from HTML, 1=Data from json, 2=Data from database
         * @type {number}
         */
        this.optMode = 0;

    }
    //var base;
    //var table;
    //var json_obj;
    //var st_obj; // = { "co": [{ "COUNT(*)": 15 }], "data": [{ "id": 1, "quote": "There are only two kinds of languages: the ones people complain about and the ones nobody uses.", "author": "Bjarne Stroustrup" }, { "id": 3, "quote": "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", "author": "Martin Fowler" }, { "id": 4, "quote": "First, solve the problem. Then, write the code.", "author": "John Johnson" }, { "id": 5, "quote": "Java is to JavaScript what car is to Carpet.", "author": "Chris Heilmann" }, { "id": 6, "quote": "Always code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live.", "author": "John Woods" }, { "id": 7, "quote": "I'm not a great programmer; I'm just a good programmer with great habits.", "author": "Kent Beck" }, { "id": 8, "quote": "Truth can only be found in one place: the code.", "author": "Robert C. Martin" }, { "id": 9, "quote": "If you have to spend effort looking at a fragment of code and figuring out what it's doing, then you should extract it into a function and name the function after the 'what'.", "author": "Martin Fowler" }, { "id": 10, "quote": "The real problem is that programmers have spent far too much time worrying about efficiency in the wrong places and at the wrong times; premature optimization is the root of all evil (or at least most of it) in programming.", "author": "Donald Knuth" }, { "id": 11, "quote": "SQL, Lisp, and Haskell are the only programming languages that I’ve seen where one spends more time thinking than typing.", "author": "Philip Greenspun" }, { "id": 12, "quote": "Deleted code is debugged code.", "author": "Jeff Sickel" }, { "id": 13, "quote": "There are two ways of constructing a software design: One way is to make it so simple that there are obviously no deficiencies and the other way is to make it so complicated that there are no obvious deficiencies.", "author": "C.A.R. Hoare" }, { "id": 14, "quote": "Simplicity is prerequisite for reliability.", "author": "Edsger W. Dijkstra" }, { "id": 15, "quote": "There are only two hard things in Computer Science: cache invalidation and naming things.", "author": "Phil Karlton" }, { "id": 16, "quote": "Measuring programming progress by lines of code is like measuring aircraft building progress by weight.", "author": "Bill Gates" }], "meta": { "page": "1" } }
    //var hosturl; // = 'http://localhost:3000/quotes?page=1&lpp=5';

	/**
	 * Builds all the component's logical and DOM structure
	 */
    init() {
        const url = window.location.origin;

        if (this.el.dataset.loadjson) {
            this.optMode = 1;
            let file = this.el.dataset.loadjson;
            let rem = 'https://thingproxy.freeboard.io/fetch/'; //reverse proxy 
            // let rem = 'https://ramproxy.vercel.app/fetch?remurl='; // my proxy
            if (this.el.dataset.proxy) rem = this.el.dataset.proxy;
            let remote = (file.indexOf(':') < 0) ? false : true;
            if (!remote && !file.startsWith('/')) file = '/' + file;
            //if (!file.endsWith('.json', file)) file += '.json';
            remote ? this.hosturl = rem + file : this.hosturl = file;
            //this.hosturl = 'https://periyodiktablo.net/prox.php?csurl=https://blazor50.netbes.xyz/db/data.txt';
            //this.hosturl = 'http://localhost:3000/fetch?remurl=https://periyodiktablo.net/data.json';
            //this.hosturl = 'https://periyodiktablo.net/data.txt';
            this.loaderurl();
            return;
        }

        if (this.el.dataset.loadfromdb) {
            this.optMode = 2;
            let php = this.el.dataset.loadfromdb;
            this.hosturl = url + '/' +php+'?page=' + this.currPage + '&lpp=' + this.perPage;
            this.loaderurl();
            return;
        }

        this.json_obj = { "data": this.getData() };
        if (this.json_obj.data.length > 0) {
            this.optMode = 0;
            this.recordCount = this.json_obj.data.length;
            this.el.innerHTML = "";
            //this.data = this.json_obj.data.slice(0, this.perPage);
            this.createTable(/*this.json_obj.data.slice((this.currPage - 1) * this.perPage, this.currPage * this.perPage)*/);
            this.createElements();
            this.scriptinit = true;

            return;
        }
        //var hosturl = url + '/quotes?page=' + currPage + '&lpp=' + perPage;
        //this.hosturl = url + '/fromurl.json';
        //this.loader();
        //this.createTable(this.json_obj.data.slice((currPage - 1) * perPage, currPage * perPage));
        //this.createElements();

    }

/**
 * Loads json data or database from url
 */
    loader() {
        if (this.optMode < 2) {this.createTable()}
    }

/**
 * Create Table From HTML data or Json response
 */
    loaderurl() {
        const getJSON = async url => {
            try {
                const response = await fetch(url/* , {mode: 'no-cors'}*/);
                if (!response.ok) // check if response worked (no 404 errors etc...)
                    throw new Error(response.statusText);

                this.json_obj = await response.json(); // get JSON from the response
                return;// json_obj; // returns a promise, which resolves to this data value
            } catch (error) {
                return error;
            }
        }

        console.log("Fetching data...");
        getJSON(this.hosturl).then(json_obj => {
            console.time("table süre");
            this.recordCount = this.json_obj.count;
            this.createTable();
            console.timeEnd("table süre");
            if (!this.scriptinit) {
                this.createElements();
                this.scriptinit = true;
            }
            //loader();
        }).catch(error => {
            console.error(error);
        });

    }
    //Create Table From Json response
/**
 * Create Table From HTML data or Json response
 */

    createTable() {

        let tbdy = document.createElement('tbody');
        this.el.id = 'dtable';

        for (var i = (this.currPage - 1) * this.perPage; i < this.currPage * this.perPage; i++) {
            var child = this.json_obj.data[i];
            if (i === 0 && !this.scriptinit) {
                this.addHeaders(Object.keys(child));
            }
            let tr = document.createElement('tr'); //      var row = table.insertRow();
            Object.keys(child).forEach(function (k) {
                var cell = tr.insertCell();
                cell.appendChild(document.createTextNode(child[k]));
            })
            tbdy.appendChild(tr);
        }
        this.el.appendChild(tbdy);
        //table.rows[3].cells[1].innerHTML = "Salla";
        //recordCount = Object.values(st_obj ? st_obj.co[0]:json_obj.co[0])[0];//json_obj.co[0]['COUNT(*)'] //Object.values(foo)[0];
        //document.getElementById('dt').innerHTML = '&nbsp; Record per page &nbsp;&nbsp;&nbsp;Total records count : ' + recordCount;
    }

/**
 * Creates table header region and columns in start
 */
    addHeaders(keys) {

        let thead = document.createElement('thead');
        let thr = document.createElement('tr');
        this.colCount = keys.length;

        for (var i = 0; i < keys.length; i++) {
            var cell = document.createElement("th"); //row.insertCell();
            cell.appendChild(document.createTextNode(keys[i]));
            cell.setAttribute("class", "sortable");
            cell.setAttribute('onclick', 'alert(this.textContent)');
            thr.appendChild(cell);
            this.colNames[i + 1] = keys[i];
            this.colHidden[i + 1] = false;
        }
        thead.appendChild(thr);
        thr = document.createElement('tr');
        let tstr = '';
        for (var i = 0; i < keys.length; i++) {
            tstr += '<th contenteditable="true" spellcheck="false" data-ms-editor="false"></th>\n'
        }
        thr.innerHTML = tstr;
        thead.appendChild(thr);
        this.el.appendChild(thead);
    }

/**
 * Creates table helper elements
 */
    createElements() {
        this.createPageSelect();
        this.pageSelectOptions();
        this.createRecperPage();
        this.createHideStyleElement();
        this.createHideColChkboxes();
        this.createStatusDiv();
    }

    createPageSelect() {
        let cre = document.createElement('div');
        cre.id = 'container';
        this.el.parentElement.insertBefore(cre, this.el);
        cre.appendChild(this.el);
        cre = document.createElement('div');
        cre.style.display = 'inline-block';
        this.el.insertAdjacentElement("beforebegin", cre);
        let lab = document.createElement('label');
        lab.appendChild(document.createTextNode('Page: '));
        cre.appendChild(lab, cre);
        this.selectPage = document.createElement('select');
        this.selectPage.id = 'selpage';
        this.selectPage.title = 'Select a Page';
        this.selectPage.addEventListener('change', () => this.getPage());
        this.selectPage.innerHTML = '<option value=""> Choose a Page</option>';
        cre.appendChild(this.selectPage, cre);

        for (var i = 0; i < 2; i++) {
            let but = document.createElement('input');
            but.type = 'button';
            if (i == 1) {
                but.value = 'Next';
                //but.setAttribute('onclick', 'this.changePage(1)');
                but.addEventListener("click", () => this.changePage(1));
            } else {
                but.value = 'Previous';
                but.addEventListener('click', () => this.changePage(0));
            }
            but.className = 'dume';
            cre.appendChild(but, cre);
        }
    }

    createStatusDiv() {
        let di = document.createElement('div');
        document.getElementById('container').insertAdjacentElement("beforebegin", di);
        di.innerHTML = 'Showing Page: ' + this.currPage + ' Total pages : ' + Math.ceil(this.recordCount / this.perPage) + " Total Records: " + this.recordCount;
    }

    createHideStyleElement() {
        this.colhideStyle = document.createElement('style');
        this.colhideStyle.type = 'text/css';
        this.colhideStyle.innerHTML = ' ';
        document.getElementsByTagName('head')[0].appendChild(this.colhideStyle);
    }

    // Dynamically creates check boxes with data column names
    createHideColChkboxes() {
        let ele = document.createElement('div');
        let elef = document.createElement('span');
        elef.appendChild(document.createTextNode('Choose the columns to hide...'));
        ele.appendChild(elef);
        for (var i = 1; i < this.colCount + 1; i++) {
            let checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'co' + i;
            checkbox.name = 'na' + i;
            checkbox.className = 'hide';
            checkbox.addEventListener('change', () => this.setHideColumns(checkbox.id));
            let label = document.createElement('label')
            label.htmlFor = 'co' + i;
            label.appendChild(document.createTextNode(this.colNames[i]));
            ele.appendChild(checkbox);
            ele.appendChild(label);
        }
        this.el.insertAdjacentElement("beforebegin", ele);
    }

    loadHelper() {
        if(this.optMode==2) hosturl = this.url + '/quotes?page=' + this.currPage + '&lpp=' + this.perPage;
        //document.getElementById("dtable").remove();
        this.el.removeChild(this.el.getElementsByTagName("tbody")[0]);
        this.loader();
    }
    // For Changing Page with next prev buttons
    changePage(ast) {
        if (this.currPage == 1 && ast == 0 || this.currPage >= this.recordCount / this.perPage && ast == 1) return;
        (ast == 1) ? this.currPage++ : this.currPage--;
        this.selectPage.selectedIndex = this.currPage;
        this.loadHelper();
    }
    //Create select page element options
    pageSelectOptions(oph = false) {
        let tpage = Math.ceil(this.recordCount / this.perPage);
        let sds = this.selectPage.options.length - 1;
        let cont = 0;
        if (tpage == sds) return;
        if (oph) {
            if (tpage < sds) {
                for (let k = tpage; k < sds; k++) {
                    this.selectPage.remove(tpage + 1);

                }
                return;
            } else {
                cont = sds;
            }
        }
        for (let i = cont; i < tpage; i++) {
            let optionPage = document.createElement('option');
            optionPage.appendChild(document.createTextNode(i + 1));
            this.selectPage.appendChild(optionPage);
        }
    }
    // For Changing Page with Select Element
    getPage() {
        this.currPage = this.selectPage.selectedIndex;
        if (this.currPage < 1) this.currPage = 1;
        this.loadHelper();
    }
    // Create select element for record per page setting
    createRecperPage() {
        this.optCount = document.createElement('select');
        this.optCount.addEventListener("change", () => this.setReclenght());

        for (let i = 0; i < 26; i++) {
            let option = document.createElement('option');
            option.appendChild(document.createTextNode(i + 1));
            this.optCount.appendChild(option);
        }
        this.optCount.selectedIndex = this.perPage - 1;
        let di = document.createElement('div');
        di.style.display = 'inline-block';
        let lab = document.createElement('label');
        lab.style.marginLeft = '12px';
        lab.appendChild(document.createTextNode('Records Per Page: '));
        di.appendChild(lab);
        di.appendChild(this.optCount);
        this.el.insertAdjacentElement("beforebegin", di);
    }

    setReclenght() {
        this.perPage = this.optCount.selectedIndex + 1;
        this.currPage = 1;
        this.pageSelectOptions(true);
        this.selectPage.selectedIndex = 1;
        this.loadHelper();
    }

    setHideColumns(chk) {
        let tehtml = '';
        let unhide = '{}';
        let hide = "{display: none;}";
        let colno = parseInt(chk.slice(2));
        this.colHidden[colno] = document.getElementById(chk).checked;
        if (colno == 0) {
            colhideStyle.innerHTML = '';
            return 'okey';
        }
        for (var i = 1; i < this.colCount + 1; i++) {
            if (this.colHidden[i]) tehtml += '#dtable tr td:nth-child(' + i + '), #dtable tr th:nth-child(' + i + ') {display: none;}\n';
        }
        this.colhideStyle.innerHTML = tehtml;
    }

    getData() {
        let res = [], props = [];
        let el = document.getElementsByTagName('table')[0];
        if (!el) return;
        el.querySelectorAll("thead th").forEach(col =>
            props.push(col.innerText)
        );

        el.querySelectorAll("tbody > tr").forEach(row => {
            let item = {};
            row.querySelectorAll("td").forEach((col, i) =>
                item[props[i]] = col.innerText
            );
            res.push(item);
        });

        return res;
    }

}

document.querySelectorAll(TRIGGER)
    .forEach(el => new DataTable(el).init());

