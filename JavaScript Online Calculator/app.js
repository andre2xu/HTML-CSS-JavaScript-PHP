function userinput(inp) {
    var display = document.querySelector('#calc-display');

    if (inp == 'c') {
        display.innerHTML = "";
    } else if (inp == '^') {
        display.innerHTML += '**';
    } else if (inp == 'del') {
        display.innerHTML = display.innerHTML.substr(0, display.innerHTML.length - 1);
    } else if (inp == 'ans') {
        let result = display.innerHTML = eval(display.innerHTML);

        if (result == undefined) {
            display.innerHTML = "";
        } else {
            display.innerHTML = result
        }
    } else {
        display.innerHTML += inp
    }
}