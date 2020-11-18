const mainContainer = document.getElementsByClassName("main-container")[0];
const container2 = document.getElementsByClassName("container-2")[0];
const container3 = document.getElementsByClassName("container-3")[0];

function showContainer2(){
    container2.style.display = "block";
}

function hideContainer2(){
    container2.style.display = "none";
}

function saveFlashcard(){
    const question = document.getElementById("question").value;
    const answer = document.getElementById("answer").value;

    var node0 = document.createElement("div");
    var node1 = document.createElement("h2");
    var node2 = document.createElement("h2");

    node1.innerHTML = question;
    node2.innerHTML = answer;

    node2.style.display = "none";
    node2.style.color = "black";

    node0.appendChild(node1);
    node0.appendChild(node2);

    node0.addEventListener("click", function(){
    
    if(node2.style.display == "none"){
        node2.style.display = "block";
    }
    else{
        node2.style.display = "none";
    }
    })

    node0.addEventListener("dblclick", function(){
    node0.remove();
    })

    node0.setAttribute("style", "background:white; width:30%; padding:15px; border:1px solid black; border-radius:5px; margin:2em 0.5em; word-wrap: break-word;");

    container3.insertAdjacentElement("beforeend", node0);

    document.getElementById("question").value = '';
    document.getElementById("answer").value = '';
}