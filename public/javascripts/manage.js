'use strict'
var hosturl; // = 'http://localhost:3000/quotes?page=1&lpp=5';
var pg = 1;
var lp = 5;
var recordCount = 0;
var selectPage = document.getElementById("selpage");
var colCount = 0;
var colNames = [];
var colHidden = [];
var selectinit = false;
var optCount;
var hideStyle;
const url = window.location.origin;

hosturl = url + '/quotes?page=1&lpp=5';

function loader() {
    console.time("getting guery");
    const getJSON = async url => {
        try {
            const response = await fetch(url);
            if (!response.ok) // check if response worked (no 404 errors etc...)
                throw new Error(response.statusText);

            const json_obj = await response.json(); // get JSON from the response
            return json_obj; // returns a promise, which resolves to this data value
        } catch (error) {
            return error;
        }
    }

    console.log("Fetching data...");
    getJSON(hosturl).then(json_obj => {
        console.timeEnd("getting guery");
        console.time("table süre");
        createTable(json_obj);
        console.timeEnd("table süre");
        if (!selectinit) {
            createElements();
            selectinit = true;
        }

    }).catch(error => {
        console.error(error);
    });
}
//Create Table From Json response
function createTable(json_obj) {
    function addHeaders(table, keys) {
        var row = table.insertRow();
        colCount = keys.length;

        for (var i = 0; i < keys.length; i++) {
            var cell = document.createElement("TH"); //row.insertCell();
            cell.appendChild(document.createTextNode(keys[i]));
            row.appendChild(cell);
            colNames[i + 1] = keys[i];
            colHidden[i + 1] = false;
        }
    }

    var table = document.createElement('table');
    table.id = 'dtable';

    for (var i = 0; i < json_obj.data.length; i++) {

        var child = json_obj.data[i];
        if (i === 0) {
            addHeaders(table, Object.keys(child));
        }
        var row = table.insertRow();
        Object.keys(child).forEach(function (k) {
            var cell = row.insertCell();
            cell.appendChild(document.createTextNode(child[k]));
        })
    }
    document.getElementById('container').appendChild(table);
    recordCount =  Object.values(json_obj.co[0])[0];//json_obj.co[0]['COUNT(*)'] //Object.values(foo)[0];
    document.getElementById('dt').innerHTML = '&nbsp; Record per page &nbsp;&nbsp;&nbsp;Total records count : ' + recordCount;
}

function createElements() {
    createHideStyleElement();
    createHideColChkboxes();
    createReccountSelect();
    pageSelect();

}

function createHideStyleElement() {
    hideStyle = document.createElement('style');
    hideStyle.type = 'text/css';
    hideStyle.innerHTML = ' ';
    document.getElementsByTagName('head')[0].appendChild(hideStyle);
}
// Dynamically creates check boxes with data column names 
function createHideColChkboxes() {
    let ss = document.getElementById("container");
    let ele = document.createElement('div');
    let elef = document.createElement('span');
    elef.appendChild(document.createTextNode('Choose the columns to hide...'));
    ele.appendChild(elef);
    for (var i = 1; i < colCount + 1; i++) {
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'co' + i;
        checkbox.name = 'na' + i;
        checkbox.className = 'hide';
        //checkbox.value = 'co' + i;
        // NOT WORKING   checkbox.onchange = 'setHideColumns( '+i+', this.checked)';
        //checkbox.onchange = 'setHideColumns( ' + i + ', this.checked)';
        checkbox.setAttribute('onchange', 'setHideColumns( '+i+', checked)');

        let label = document.createElement('label')
        label.htmlFor = 'co' + i;
        label.appendChild(document.createTextNode(colNames[i]));
        ele.appendChild(checkbox);
        ele.appendChild(label);
    }
    ss.insertAdjacentElement("beforebegin", ele); 



}
function loadHelper() {
    hosturl = url + '/quotes?page=' + pg + '&lpp=' + lp;
    document.getElementById("dtable").remove();
    loader();
}
// For Changing Page with next prev buttons
function changePage(ast) {
    if ((pg == 1 && ast == '-') || (pg + 1 > (recordCount / lp) && ast == '+')) return;
    (ast == '+') ? pg++ : pg--;
    loadHelper();
}
//Create select page element options
function pageSelect(oph = false) {
    let tpage = Math.ceil(recordCount / lp);
    let sds = document.getElementById("selpage").options.length -1;
    let cont = 0;
    if (tpage == sds) return;
    if (oph) {
        if (tpage < sds) {
            for (let k = tpage; k < sds; k++) {
                selectPage.remove(tpage+1);
            }
            return;
        } else {
            cont = sds;
        }
    }
    for (let i = cont; i < tpage; i++) {
        let optionPage = document.createElement('option');
        optionPage.appendChild(document.createTextNode(i+1));
        selectPage.appendChild(optionPage);
    }
}
// For Changing Page with Select Element
function getPage() {
    pg = document.getElementById("selpage").selectedIndex;
    if (pg < 1) pg = 1;
    loadHelper();
}
// Create select element for record per page setting
function createReccountSelect() {
    let ss = document.getElementById("dt");
    optCount = document.createElement('select');
    optCount.setAttribute("onchange", "setReclenght()");
    ss.insertAdjacentElement("beforebegin", optCount);

    for (let i = 0; i < 21; i++) {
        let option = document.createElement('option');
        option.appendChild(document.createTextNode(i + 1));
        optCount.appendChild(option);
    }
    optCount.selectedIndex = lp - 1;
}

function setReclenght() {
    let sellp = optCount.selectedIndex;
    lp = sellp + 1;
    pg = 1;
    pageSelect(true);
    loadHelper();

}

function setHideColumns(colno, chk) {
    let tehtml = '';
    let unhide = '{}';
    let hide = "{display: none;}";
    colHidden[colno] = chk;
    if (colno == 0) {
        hideStyle.innerHTML = '';
        return 'okey';
    }
    for (var i = 1; i < colCount + 1; i++) {
        if (colHidden[i]) tehtml += '#dtable tr td:nth-child(' + i + '), #dtable tr th:nth-child(' + i + ') {display: none;}\n';
    }
    hideStyle.innerHTML = tehtml;
    //style.innerHTML = '#dtable tr td:nth-child(1), #dtable tr th:nth-child(1) {display: none;}\n';
}

loader();
